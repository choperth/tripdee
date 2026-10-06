import crypto from 'crypto';

export interface ChillPayConfig {
  merchantCode: string;
  apiKey: string;
  md5Secret: string;
  environment: 'sandbox' | 'production';
}

export interface ChillPayPaymentParams {
  orderNo: string;
  customerId: string;
  amountInBaht: number;
  phoneNumber: string;
  description: string;
  ipAddress?: string;
}

export interface ChillPayPaymentResponse {
  status: number;
  code: number;
  message: string;
  transactionId?: string;
  paymentUrl?: string;
  qrImage?: string;
  rawPayload?: Record<string, unknown>;
}

export interface ChillPayWebhookPayload {
  TransactionId?: string | number;
  OrderNo?: string;
  Amount?: string | number;
  OrderAmount?: string | number;
  Status?: string | number;
  Code?: string | number;
  PaymentStatus?: string | number;
  CheckSum?: string;
  MerchantCode?: string;
  PaymentDate?: string;
  [key: string]: unknown;
}

export function getChillPayConfig(): ChillPayConfig {
  const merchantCode = process.env.CHILLPAY_MERCHANT_CODE || '';
  const apiKey = process.env.CHILLPAY_API_KEY || '';
  const md5Secret = process.env.CHILLPAY_MD5_SECRET || process.env.CHILLPAY_MD5_KEY || '';
  const environment = (process.env.CHILLPAY_ENVIRONMENT === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production';

  return {
    merchantCode,
    apiKey,
    md5Secret,
    environment,
  };
}

/**
 * Calculates MD5 Checksum according to ChillPay Payment API v2 spec:
 * MD5(MerchantCode + OrderNo + CustomerId + Amount + PhoneNumber + Description + ChannelCode + Currency + LangCode + RouteNo + IPAddress + ApiKey + MD5Secret)
 *
 * NOTE: Amount is in satang (1 THB = 100 satangs, e.g. 300 THB -> 30000).
 */
export function calculateChillPayChecksum(params: {
  merchantCode: string;
  orderNo: string;
  customerId: string;
  amountSatang: number;
  phoneNumber: string;
  description: string;
  channelCode: string;
  currency: string;
  langCode: string;
  routeNo: number;
  ipAddress: string;
  apiKey: string;
  md5Secret: string;
}): string {
  const rawString = `${params.merchantCode}${params.orderNo}${params.customerId}${params.amountSatang}${params.phoneNumber}${params.description}${params.channelCode}${params.currency}${params.langCode}${params.routeNo}${params.ipAddress}${params.apiKey}${params.md5Secret}`;
  return crypto.createHash('md5').update(rawString, 'utf8').digest('hex').toLowerCase();
}

/**
 * Verifies Webhook (IPN / Result) Checksum from ChillPay callback.
 * ChillPay webhook typically sends CheckSum or MD5 signature across returned parameters.
 */
export function verifyChillPayWebhookChecksum(
  payload: ChillPayWebhookPayload,
  md5Secret: string
): boolean {
  if (!payload.CheckSum || !md5Secret) {
    return false;
  }

  const incomingChecksum = String(payload.CheckSum).toLowerCase();

  // Pattern A: ChillPay v2 response format MD5(MerchantCode + OrderNo + CustomerId + Amount + Status + Code + md5Secret)
  // or MD5(OrderNo + Amount + Status + md5Secret)
  // Check candidate hashes
  const merchant = String(payload.MerchantCode || process.env.CHILLPAY_MERCHANT_CODE || '');
  const orderNo = String(payload.OrderNo || '');
  const customerId = String(payload.CustomerId || '');
  const amount = String(payload.Amount ?? payload.OrderAmount ?? '');
  const status = String(payload.Status ?? payload.PaymentStatus ?? '');
  const code = String(payload.Code ?? '');

  const patternA = crypto
    .createHash('md5')
    .update(`${merchant}${orderNo}${customerId}${amount}${status}${code}${md5Secret}`, 'utf8')
    .digest('hex')
    .toLowerCase();

  const patternB = crypto
    .createHash('md5')
    .update(`${orderNo}${amount}${status}${code}${md5Secret}`, 'utf8')
    .digest('hex')
    .toLowerCase();

  const patternC = crypto
    .createHash('md5')
    .update(`${orderNo}${amount}${status}${md5Secret}`, 'utf8')
    .digest('hex')
    .toLowerCase();

  return (
    incomingChecksum === patternA ||
    incomingChecksum === patternB ||
    incomingChecksum === patternC
  );
}

/**
 * Calls ChillPay Payment API v2 to generate Dynamic PromptPay QR
 */
export async function createChillPayPayment(
  params: ChillPayPaymentParams,
  overrideConfig?: Partial<ChillPayConfig>
): Promise<ChillPayPaymentResponse> {
  const config = { ...getChillPayConfig(), ...overrideConfig };
  const endpoint =
    config.environment === 'production'
      ? 'https://appsrv.chillpay.co/api/v2/Payment/'
      : 'https://sandbox-appsrv2.chillpay.co/api/v2/Payment/';

  const amountSatang = Math.round(params.amountInBaht * 100);
  const channelCode = 'bank_qrcode';
  const currency = '764'; // THB
  const routeNo = 1;
  const langCode = 'TH';
  const ipAddress = params.ipAddress || '127.0.0.1';
  const sanitizedPhone = params.phoneNumber.replace(/\D/g, '');

  const checkSum = calculateChillPayChecksum({
    merchantCode: config.merchantCode,
    orderNo: params.orderNo,
    customerId: params.customerId,
    amountSatang,
    phoneNumber: sanitizedPhone,
    description: params.description,
    channelCode,
    currency,
    langCode,
    routeNo,
    ipAddress,
    apiKey: config.apiKey,
    md5Secret: config.md5Secret,
  });

  const requestBody = {
    MerchantCode: config.merchantCode,
    OrderNo: params.orderNo,
    CustomerId: params.customerId,
    Amount: amountSatang,
    PhoneNumber: sanitizedPhone,
    Description: params.description,
    ChannelCode: channelCode,
    Currency: currency,
    LangCode: langCode,
    RouteNo: routeNo,
    IPAddress: ipAddress,
    ApiKey: config.apiKey,
    CheckSum: checkSum,
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return {
        status: 1,
        code: res.status,
        message: `ChillPay API HTTP Error ${res.status}: ${errText.slice(0, 150)}`,
        rawPayload: { error: errText },
      };
    }

    const data = await res.json();
    // ChillPay standard response:
    // Code 200 / Status 0 indicates success
    const isSuccess = data.Code === 200 || data.Status === 0 || data.status === 0 || data.code === 200;
    const qrImage = data.Image || data.QrImage || data.QRCodeImage || data.qrImage || data.rawQr || null;
    const paymentUrl = data.PaymentUrl || data.paymentUrl || data.Url || null;
    const transactionId = String(data.TransactionId || data.transactionId || data.TransactionNo || '');

    return {
      status: isSuccess ? 0 : Number(data.Status ?? data.status ?? 1),
      code: Number(data.Code ?? data.code ?? (isSuccess ? 200 : 400)),
      message: data.Message || data.message || (isSuccess ? 'Success' : 'ChillPay payment creation failed'),
      transactionId: transactionId || undefined,
      paymentUrl: paymentUrl || undefined,
      qrImage: qrImage || undefined,
      rawPayload: data,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[ChillPay Payment API Exception]:', errMsg);
    return {
      status: 1,
      code: 500,
      message: `Failed to connect to ChillPay: ${errMsg}`,
    };
  }
}
