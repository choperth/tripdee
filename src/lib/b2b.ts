/**
 * TripDee B2B Fleet Matching & Lead Generation helpers
 * ใช้ร่วมกันระหว่างหน้าฟอร์มองค์กร (CorporateSection) และหลังบ้านแอดมิน (AdminQuoteTab)
 * ค่าคงที่ทั้งหมดต้องตรงกับ supabase/04_b2b_corporate_upgrade.sql
 */

export type VehicleTier = 'standard_vip' | 'strict_compliance_30';
export type OrgType = 'corporate' | 'government' | 'state_enterprise' | 'sme';
export type LeadFeeStatus = 'pending' | 'collected' | 'waived';

/** ค่าจัดหาพาร์ตเนอร์ (Flat Lead Fee) หน่วย: บาท/คัน */
export const LEAD_FEE_PER_CAR = 500;

/** ประมาณการน้ำมัน + ทางด่วน หน่วย: บาท/คัน/วัน */
export const FUEL_PER_CAR_PER_DAY = 1200;

/** อัตราภาษีหัก ณ ที่จ่าย */
export const WITHHOLDING_TAX_RATE = 0.03;

export const MIN_CAR_COUNT = 1;
export const MAX_CAR_COUNT = 20;

export interface VehicleTierMeta {
  key: VehicleTier;
  /** ชื่อแสดงบน Badge */
  label: string;
  /** ชื่อสั้นสำหรับพิมพ์ในข้อความ LINE */
  shortLabel: string;
  /** บรรยายใต้ชื่อ tier ในฟอร์ม */
  tagline: string;
  /** บรรทัดสเปครถสำหรับ preview / LINE */
  specLine: string;
  /** ป้ายกำกับทะเบียน */
  plateLabel: string;
  rateMin: number;
  rateMax: number;
  highlights: string[];
}

export const VEHICLE_TIER_META: Record<VehicleTier, VehicleTierMeta> = {
  standard_vip: {
    key: 'standard_vip',
    label: 'Standard VIP',
    shortLabel: 'Standard VIP',
    tagline: 'เกรดมาตรฐานองค์กร',
    specLine: 'Standard VIP (รถตู้โฉมใหม่)',
    plateLabel: 'ป้ายฟ้า',
    rateMin: 2200,
    rateMax: 2500,
    highlights: [
      'รถตู้โฉมใหม่ (New Commuter / Majesty) เบาะ VIP',
      'ประหยัดงบ เหมาะกับสัมมนา ดูงาน ทัศนศึกษา',
      'ออกบิล เบิกจ่ายบริษัทได้เต็มรูปแบบ',
      'เรทเริ่มต้น 2,200 - 2,500 บาท/วัน/คัน',
    ],
  },
  strict_compliance_30: {
    key: 'strict_compliance_30',
    label: 'Strict Compliance',
    shortLabel: 'Strict 30',
    tagline: 'เกรดราชการ & สตง.',
    specLine: 'Strict Compliance 30 (รถป้ายเหลือง 30)',
    plateLabel: 'ป้ายเหลือง 30',
    rateMin: 3200,
    rateMax: 3500,
    highlights: [
      'รถป้ายเหลือง 30 ติด GPS กรมการขนส่งทางบก',
      'ถูกระเบียบ TOR / พัสดุ 100% ตรวจสอบได้',
      'เอกสาร ป.ค.5 ใบกำกับภาษี พร้อมหัก ณ ที่จ่าย 3%',
      'เรทเริ่มต้น 3,200 - 3,500 บาท/วัน/คัน',
    ],
  },
};

export const VEHICLE_TIER_OPTIONS: VehicleTier[] = ['standard_vip', 'strict_compliance_30'];

export const ORG_TYPE_META: Record<OrgType, string> = {
  corporate: 'บริษัทเอกชน',
  government: 'หน่วยงานราชการ',
  state_enterprise: 'รัฐวิสาหกิจ',
  sme: 'องค์กรทั่วไป / SME',
};

export const ORG_TYPE_OPTIONS: OrgType[] = ['corporate', 'government', 'state_enterprise', 'sme'];

export const LEAD_FEE_STATUS_META: Record<LeadFeeStatus, string> = {
  pending: 'รอเก็บเงิน',
  collected: 'เก็บแล้ว',
  waived: 'ยกเว้น',
};

export const LEAD_FEE_STATUS_OPTIONS: LeadFeeStatus[] = ['pending', 'collected', 'waived'];

export function clampCarCount(value: number | string | null | undefined): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < MIN_CAR_COUNT) return MIN_CAR_COUNT;
  if (n > MAX_CAR_COUNT) return MAX_CAR_COUNT;
  return n;
}

export function normalizeVehicleTier(value: unknown): VehicleTier {
  return value === 'strict_compliance_30' ? 'strict_compliance_30' : 'standard_vip';
}

export function normalizeOrgType(value: unknown): OrgType {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(ORG_TYPE_META, value)
    ? (value as OrgType)
    : 'corporate';
}

export function normalizeLeadFeeStatus(value: unknown): LeadFeeStatus {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(LEAD_FEE_STATUS_META, value)
    ? (value as LeadFeeStatus)
    : 'pending';
}

/** ค่าจัดหาพาร์ตเนอร์ = จำนวนคัน x 500 บาท */
export function calcLeadFee(carCount: number | string | null | undefined): number {
  return clampCarCount(carCount) * LEAD_FEE_PER_CAR;
}

export interface BudgetEstimate {
  carCount: number;
  days: number;
  tier: VehicleTierMeta;
  rentalLow: number;
  rentalHigh: number;
  rentalTotal: number;
  fuelTotal: number;
  subtotal: number;
  withholdingTax: number;
  netAfterWithholding: number;
}

/**
 * ประมาณการงบประมาณสำหรับเอกสารประเมินเบื้องต้น
 * ค่าเช่าใช้เรทสูงสุดของช่วงราคา (เผื่อเหลือเผื่อขาดในการขออนุมัติงบ)
 */
export function estimateBudget(input: {
  tier: VehicleTier;
  carCount: number;
  days: number;
}): BudgetEstimate {
  const tier = VEHICLE_TIER_META[input.tier] ?? VEHICLE_TIER_META.standard_vip;
  const carCount = clampCarCount(input.carCount);
  const days = Math.max(1, Math.floor(Number(input.days) || 1));

  const rentalLow = tier.rateMin * carCount * days;
  const rentalHigh = tier.rateMax * carCount * days;
  const fuelTotal = FUEL_PER_CAR_PER_DAY * carCount * days;
  const subtotal = rentalHigh + fuelTotal;
  const withholdingTax = Math.round(subtotal * WITHHOLDING_TAX_RATE);

  return {
    carCount,
    days,
    tier,
    rentalLow,
    rentalHigh,
    rentalTotal: rentalHigh,
    fuelTotal,
    subtotal,
    withholdingTax,
    netAfterWithholding: subtotal - withholdingTax,
  };
}

export function formatBaht(amount: number): string {
  return Math.round(amount).toLocaleString('th-TH');
}

const THAI_MONTH_INDEX: Record<string, number> = {
  'ม.ค.': 0,
  'ก.พ.': 1,
  'มี.ค.': 2,
  'เม.ย.': 3,
  'พ.ค.': 4,
  'มิ.ย.': 5,
  'ก.ค.': 6,
  'ส.ค.': 7,
  'ก.ย.': 8,
  'ต.ค.': 9,
  'พ.ย.': 10,
  'ธ.ค.': 11,
};

const MONTH_PATTERN = 'ม\\.ค\\.|ก\\.พ\\.|มี\\.ค\\.|เม\\.ย\\.|พ\\.ค\\.|มิ\\.ย\\.|ก\\.ค\\.|ส\\.ค\\.|ก\\.ย\\.|ต\\.ค\\.|พ\\.ย\\.|ธ\\.ค\\.';

interface DateToken {
  startDay: number;
  endDay?: number;
  month?: number;
  year?: number;
}

function normalizeYear(year: number): number {
  if (year < 100) return 2500 + year;
  return year;
}

/**
 * แปลงข้อความวันเดินทางเป็นจำนวนวัน
 * เช่น "15-17 ธ.ค. 2569" -> 3, "30 พ.ย. 2568 - 2 ธ.ค. 2568" -> 3, "25 พ.ค. 2569" -> 1
 */
export function getTravelDayCount(travelDate?: string | null): number | null {
  const text = (travelDate || '').trim();
  if (!text) return null;

  const re = new RegExp(
    `(\\d{1,2})(?:\\s*[-–]\\s*(\\d{1,2}))?\\s*(${MONTH_PATTERN})?\\s*(\\d{2,5})?`,
    'g'
  );

  const tokens: DateToken[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const startDay = Number(match[1]);
    if (!Number.isFinite(startDay)) continue;
    const token: DateToken = { startDay };
    if (match[2]) token.endDay = Number(match[2]);
    if (match[3]) token.month = THAI_MONTH_INDEX[match[3]];
    if (match[4]) token.year = normalizeYear(Number(match[4]));
    tokens.push(token);
  }

  if (tokens.length === 0) return null;

  // ช่วงวันในเดือนเดียวกัน: "15-17 ธ.ค. 2569"
  const range = tokens.find((t) => t.endDay !== undefined);
  if (range && range.endDay !== undefined) {
    const days = range.endDay - range.startDay + 1;
    if (days >= 1) return days;
  }

  // หลายวันที่มีเดือน/ปีกำกับ: "30 พ.ย. 2568 - 2 ธ.ค. 2568"
  const dated = tokens.filter((t) => t.month !== undefined && t.year !== undefined);
  if (dated.length >= 2) {
    const first = dated[0];
    const last = dated[dated.length - 1];
    const d1 = new Date(first.year as number, first.month as number, first.startDay);
    const d2 = new Date(last.year as number, last.month as number, last.startDay);
    const diff = Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1;
    if (diff >= 1) return diff;
  }

  return 1;
}

export interface LineSummaryInput {
  companyName?: string;
  contactName?: string;
  phone?: string;
  travelDate?: string;
  route?: string;
  carCount?: number;
  vehicleTier?: VehicleTier;
  orgType?: OrgType;
  needsTaxInvoice?: boolean;
  includeInsurance?: boolean;
  assignedPartner?: string | null;
  leadFeeStatus?: LeadFeeStatus;
  estimatedPrice?: number;
}

/**
 * สรุปงานรูปแบบข้อความสำหรับส่งต่อพาร์ตเนอร์ผ่าน LINE (ปุ่ม Copy)
 */
export function buildPartnerLineSummary(quote: LineSummaryInput): string {
  const tier = VEHICLE_TIER_META[quote.vehicleTier ?? 'standard_vip'] ?? VEHICLE_TIER_META.standard_vip;
  const carCount = clampCarCount(quote.carCount);
  const days = getTravelDayCount(quote.travelDate);
  const leadFee = calcLeadFee(carCount);
  const leadFeeState = LEAD_FEE_STATUS_META[quote.leadFeeStatus ?? 'pending'];

  const lines: string[] = [
    '🚐 [งานคาราวานใหม่จาก TripDee]',
    `• องค์กร: ${quote.companyName || '-'}`,
    `• วันเดินทาง: ${quote.travelDate || 'ยังไม่ระบุ'}${days ? ` (${days} วัน)` : ''}`,
    `• เส้นทาง: ${quote.route || '-'}`,
    `• สเปกรถ: ${tier.specLine} จำนวน ${carCount} คัน`,
    `• ประเภทองค์กร: ${ORG_TYPE_META[quote.orgType ?? 'corporate']}`,
    `• ต้องการบิล: ${quote.needsTaxInvoice ? 'ใช่ (หัก 3%)' : 'ไม่ต้องการ'}`,
    `• ประกันกลุ่ม: ${quote.includeInsurance === false ? 'ไม่เพิ่ม' : 'คุ้มครอง 1,000,000 บาท/ท่าน'}`,
    `• ค่าแนะนำระบบ: ${formatBaht(leadFee)} บาท (${carCount} คัน x ${LEAD_FEE_PER_CAR} บ.) [${leadFeeState}]`,
  ];

  if (quote.assignedPartner) {
    lines.push(`• กองรถที่รับงาน: ${quote.assignedPartner}`);
  }

  lines.push(
    `ติดต่อลูกค้า: ${quote.contactName || '-'} โทร ${quote.phone || '-'}`,
    'ขอบคุณครับ/ค่ะ — TripDee B2B Fleet Matching'
  );

  return lines.join('\n');
}

/** คัดลอกข้อความลงคลิปบอร์ด พร้อม fallback สำหรับ browser รุ่นเก่า */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy method
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
