'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Vehicle } from '@/data/mockData';
import { vehicleTitle } from '@/data/vehicleI18n';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { generateQrMatrix, renderQrSvgPath } from '@/lib/qrCode';
import {
  X,
  QrCode,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Phone,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { BookingConfirmationSheet, BookingSheetData } from '@/components/BookingConfirmationSheet';
import { ENABLE_QR_PAYMENT } from '@/lib/constants';
export type ZoneKey = 'city' | 'midHill' | 'highHill' | 'crossProvince';

interface DepositPaymentModalProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  defaultRoute?: string;
  defaultTravelDate?: string;
  defaultTotalDays?: number;
  selectedZone?: ZoneKey;
}

export const DepositPaymentModal: React.FC<DepositPaymentModalProps> = (props) => {
  if (!props.isOpen || !ENABLE_QR_PAYMENT) return null;
  return <DepositPaymentModalContent {...props} />;
};

const DepositPaymentModalContent: React.FC<DepositPaymentModalProps> = ({
  vehicle,
  isOpen,
  onClose,
  defaultRoute = 'เชียงใหม่ - เชียงราย / แม่กำปอง',
  defaultTravelDate,
  defaultTotalDays = 1,
  selectedZone,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, { onClose, enabled: isOpen });
  const { locale } = useLanguage();
  const { user } = useAuth();

  // Zero-Friction User Autofill
  const [customerName, setCustomerName] = useState(() => user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(
    () => (user?.emailOrPhone && !user.emailOrPhone.includes('@') ? user.emailOrPhone : '')
  );
  const [customerLine, setCustomerLine] = useState(() => user?.lineId || '');
  const [route, setRoute] = useState(defaultRoute);
  const [travelDate, setTravelDate] = useState(
    () => defaultTravelDate || new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
  );
  const [totalDays, setTotalDays] = useState<number>(defaultTotalDays);

  // Pricing calculation with Dynamic Zone Pricing
  const dailyRate =
    (selectedZone && vehicle?.zoneRates?.[selectedZone]) ??
    vehicle?.zoneRates?.city ??
    null;
  const hasValidRate = typeof dailyRate === 'number' && dailyRate > 0;
  const daysCount = Math.max(1, Number(totalDays) || 1);
  const totalPrice = hasValidRate ? dailyRate * daysCount : 0;
  const depositAmount = 100 * daysCount;
  const remainingAmount = Math.max(0, totalPrice - depositAmount);

  // Payment flow step: 'form' | 'qr' | 'success'
  const [step, setStep] = useState<'form' | 'qr' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ChillPay generated info
  const [bookingId, setBookingId] = useState<string>('');
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrPayload, setQrPayload] = useState<string>('');
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  // Countdown timer: 15 minutes (900 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(900);
  const [copiedId, setCopiedId] = useState(false);

  // Post-payment unlocked modal trigger
  const [showConfirmationSheet, setShowConfirmationSheet] = useState(false);

  // Handle countdown
  useEffect(() => {
    if (step !== 'qr' || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timeLeft]);

  // Realtime Polling: Check status every 3 seconds when step === 'qr'
  const checkPaymentStatus = useCallback(async () => {
    if (!bookingId || step !== 'qr') return;
    try {
      const res = await fetch(`/api/payment/chillpay/status?bookingId=${encodeURIComponent(bookingId)}`);
      const data = await res.json();
      if (data.success && data.isPaid) {
        setStep('success');
      }
    } catch (err) {
      console.warn('[Deposit Modal Polling Exception]:', err);
    }
  }, [bookingId, step]);

  useEffect(() => {
    if (step !== 'qr' || !bookingId) return;
    const pollInterval = setInterval(() => {
      checkPaymentStatus();
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [step, bookingId, checkPaymentStatus]);

  // Submit form -> call /api/payment/chillpay/create
  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('กรุณากรอกชื่อและเบอร์โทรศัพท์ของผู้จองให้ครบถ้วน');
      return;
    }
    if (!hasValidRate) {
      setErrorMessage(
        'รถคันนี้ยังไม่ได้ระบุค่าบริการ กรุณาติดต่อคนขับโดยตรงเพื่อสอบถามราคา'
      );
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/payment/chillpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicle?.id,
          driverId: vehicle?.driverPhone,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerLine: customerLine.trim() || undefined,
          route: route.trim(),
          travelDate,
          totalDays: daysCount,
          totalPrice,
          depositAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'ไม่สามารถสร้างรายการชำระเงินมัดจำได้');
      }

      setBookingId(data.bookingId);
      setQrImage(data.qrImage || null);
      setQrPayload(data.qrPayload || '');
      setPaymentUrl(data.paymentUrl || null);
      setTimeLeft(15 * 60);
      setStep('qr');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBookingId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(bookingId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // SVG QR render fallback if base64/URL image isn't directly returned by ChillPay
  const qrSvgPath = React.useMemo(() => {
    if (!qrPayload) return '';
    try {
      const matrix = generateQrMatrix(qrPayload);
      return renderQrSvgPath(matrix);
    } catch {
      return '';
    }
  }, [qrPayload]);


  const vehicleName = vehicle ? vehicleTitle(vehicle, locale) : 'รถตู้ VIP TripDee';

  // BookingConfirmationSheet initialData payload
  const confirmationSheetData: Partial<BookingSheetData> = {
    bookingId: bookingId || 'TD-BK-CONFIRMED',
    status: 'deposit_paid',
    customerName,
    customerPhone,
    customerLine,
    travelDates: travelDate,
    totalDays: daysCount,
    routeDetails: route,
    driverName: vehicle?.driverName,
    driverNickname: vehicle?.driverNickname,
    driverPhone: vehicle?.driverPhone,
    driverLine: vehicle?.driverLine,
    vehicleTitle: vehicleName,
    plateNumber: vehicle?.plateNumber,
    plateType: vehicle?.plateType || 'yellow',
    insuranceType: vehicle?.insuranceType,
    isVerified: vehicle?.isVerified,
    canIssueTaxInvoice: vehicle?.canIssueTaxInvoice,
    dailyRate: dailyRate ?? undefined,
    totalPrice,
    depositAmount,
    remainingAmount,
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-fade-in">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="deposit-modal-title"
          className="bg-white dark:bg-slate-900 border-t sm:border border-slate-300 dark:border-slate-800 w-full max-w-lg shadow-2xl relative overflow-hidden rounded-t-2xl sm:rounded-none max-h-[92vh] sm:max-h-[88vh] flex flex-col"
        >
          {/* Mobile Bottom Sheet Pull Bar Handle */}
          <div className="w-12 h-1.5 bg-slate-400/50 dark:bg-slate-600 rounded-full mx-auto my-2.5 block sm:hidden shrink-0" aria-hidden="true" />
          {/* Header */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-amber-400 text-slate-950 font-black rounded-none">
                <QrCode className="w-5 h-5" />
              </span>
              <div>
                <h2 id="deposit-modal-title" className="text-base sm:text-lg font-black tracking-tight">
                  ยืนยันการจองและล็อกคิวรถ (ค่าบริการระบบ ฿100/วัน)
                </h2>
                <p className="text-[11px] text-slate-300">
                  ChillPay Dynamic PromptPay QR • ปลดล็อกเบอร์คนขับอัตโนมัติ 100%
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6">
            {/* STEP 1: Customer Form & Summary */}
            {step === 'form' && (
              <form onSubmit={handleInitiatePayment} className="space-y-4">
                {/* Vehicle & Trip Summary Bento */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">รถที่เลือก</span>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{vehicleName}</p>
                    </div>
                    <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 text-[10px] font-black px-2 py-0.5">
                      ค่าบริการระบบ ฿100/วัน ({daysCount} วัน = ฿{depositAmount.toLocaleString()})
                    </span>
                  </div>

                  {!hasValidRate ? (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                      คนขับยังไม่ได้ระบุค่าบริการสำหรับรถคันนี้
                      กรุณาติดต่อคนขับโดยตรงเพื่อสอบถามราคาและรายละเอียดก่อนชำระเงิน
                    </div>
                  ) : (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>
                        ค่าบริการรถ ({daysCount} วัน
                        {selectedZone ? (
                          <strong className="text-amber-600 dark:text-amber-400">
                            {' '}• โซน{selectedZone === 'midHill' ? 'ดอยใกล้/แม่ริม' : selectedZone === 'highHill' ? 'ดอยสูง/อ่างขาง' : selectedZone === 'crossProvince' ? 'ข้ามจังหวัด' : 'ในเมือง'}
                          </strong>
                        ) : ''}
                        ):
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">฿{totalPrice.toLocaleString()} {dailyRate ? `(฿${dailyRate.toLocaleString()}/วัน)` : ''}</span>
                    </div>
                    <div className="flex justify-between items-center text-amber-700 dark:text-amber-400 font-semibold">
                      <span>ค่าบริการระบบ TripDee (ชำระทันทีผ่าน PromptPay เพื่อยืนยันล็อกคิว):</span>
                      <span className="font-bold font-mono">฿{depositAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold">
                      <span className="text-emerald-700 dark:text-emerald-400">ยอดคงเหลือที่ต้องชำระ (ชำระตรงกับคนขับในวันเดินทางเมื่อขึ้นรถ):</span>
                      <span className="font-mono text-sm text-emerald-700 dark:text-emerald-400">฿{remainingAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  )}
                </div>

                {/* Form Inputs with Autofill Notification */}
                <div className="space-y-3 text-xs">
                  {user && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2 border border-emerald-200 dark:border-emerald-800">
                      <span className="material-symbols-outlined text-[15px] text-emerald-600">badge</span>
                      <span>ดึงข้อมูลผู้จองจากบัญชี <strong>{user.name}</strong> อัตโนมัติ</span>
                    </div>
                  )}
                  <div>
                    <label htmlFor="customer-name" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ชื่อ-นามสกุล ผู้จอง <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      required
                      placeholder="เช่น สมชาย ใจดี"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="customer-phone" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="customer-phone"
                        type="tel"
                        required
                        placeholder="081-xxx-xxxx"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="customer-line" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        LINE ID (ถ้ามี)
                      </label>
                      <input
                        id="customer-line"
                        type="text"
                        placeholder="สำหรับส่งใบยืนยัน"
                        value={customerLine}
                        onChange={(e) => setCustomerLine(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label htmlFor="total-days-input" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        จำนวนวันเดินทาง
                      </label>
                      <input
                        id="total-days-input"
                        type="number"
                        min="1"
                        max="30"
                        value={totalDays}
                        onChange={(e) => setTotalDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label htmlFor="travel-date" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        วันที่เริ่มเดินทาง
                      </label>
                      <input
                        id="travel-date"
                        type="date"
                        value={travelDate}
                        onChange={(e) => setTravelDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label htmlFor="route-input" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        เส้นทาง / จุดหมาย
                      </label>
                      <input
                        id="route-input"
                        type="text"
                        value={route}
                        onChange={(e) => setRoute(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-2.5 bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>กำลังสร้าง QR Code PromptPay...</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4" />
                        <span>ชำระค่าบริการระบบ ฿{depositAmount.toLocaleString()} ({daysCount} วัน) ด้วย PromptPay</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-slate-500 dark:text-slate-400 mt-2">
                    🔒 ปลอดภัยผ่าน ChillPay Payment Gateway • เงินมัดจำจะถูกนำไปหักลบกับค่ารถวันเดินทางจริง
                  </p>
                </div>
              </form>
            )}

            {/* STEP 2: ChillPay PromptPay QR Code & Countdown */}
            {step === 'qr' && (
              <div className="text-center space-y-4">
                {/* Timer Bar */}
                <div className="flex items-center justify-between p-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                    <span>เวลาสำหรับชำระเงิน</span>
                  </div>
                  <span className="font-mono font-black text-sm text-red-600 dark:text-red-400">
                    {formatCountdown(timeLeft)}
                  </span>
                </div>

                {/* Booking ID and Amount */}
                <div className="flex items-center justify-between text-xs border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-1 text-slate-500">
                    <span>รหัสจอง:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{bookingId}</span>
                    <button
                      type="button"
                      onClick={handleCopyBookingId}
                      className="p-1 hover:text-slate-900 dark:hover:text-white"
                      title="คัดลอกรหัสจอง"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">ยอดมัดจำ</span>
                    <span className="font-mono font-black text-base text-slate-950 dark:text-white">
                      ฿{depositAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Dynamic PromptPay QR Display */}
                <div className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 shadow-inner max-w-xs mx-auto">
                  <div className="text-[11px] font-black text-[#003d6d] flex items-center gap-1 mb-2">
                    <span className="bg-[#003d6d] text-white px-1 py-0.2 text-[9px] font-bold">THAI QR</span>
                    <span>PROMPTPAY</span>
                  </div>

                  {qrImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrImage.startsWith('data:') ? qrImage : `data:image/png;base64,${qrImage}`}
                      alt="ChillPay PromptPay QR"
                      className="w-48 h-48 object-contain"
                    />
                  ) : qrSvgPath ? (
                    <svg viewBox="0 0 29 29" className="w-48 h-48 fill-slate-950" shapeRendering="crispEdges">
                      <path d={qrSvgPath} />
                    </svg>
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-slate-100 text-slate-400">
                      <RefreshCw className="w-8 h-8 animate-spin" />
                    </div>
                  )}

                  <span className="text-[10px] text-slate-500 mt-2 font-mono">
                    สแกนผ่านแอปธนาคารทุกแห่งในไทย
                  </span>
                </div>

                {/* Policy Notice Box */}
                <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs rounded-none text-left leading-relaxed">
                  🌿 เพื่อความพร้อมในการเตรียมรถและการล็อกคิวงานของคนขับ ค่าบริการระบบไม่สามารถขอคืนเป็นเงินสดได้ แต่หากท่านมีความจำเป็นต้องปรับเปลี่ยนแผน สามารถแจ้งขอเลื่อนวันเดินทางได้ฟรี 1 ครั้ง (ภายในระยะเวลา 60 วัน)
                </div>

                {/* Polling Radar indicator */}
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span>ระบบกำลังรอรับการชำระเงินอัตโนมัติ (ตรวจจับทุก 3 วินาที)</span>
                </div>
                {/* Manual Check or External Link */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={checkPaymentStatus}
                    className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>เช็คสถานะอีกครั้ง</span>
                  </button>

                  {paymentUrl && (
                    <a
                      href={paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1"
                    >
                      <span>หน้าจ่าย ChillPay</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Sandbox helper: skips straight to the success screen, which
                    unlocks the driver's contact details. Never shipped. */}
                {process.env.NODE_ENV !== 'production' && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('success');
                      }}
                      className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      ⚡ [ทดสอบระบบ] จำลองว่าชำระเงินมัดจำสำเร็จทันที
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Payment Success & Unlock */}
            {step === 'success' && (
              <div className="text-center space-y-4 py-2">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-scale-in">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    ชำระเงินมัดจำสำเร็จ ฿{depositAmount.toLocaleString()}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    ระบบได้ล็อกคิวรถและปลดล็อกข้อมูลติดต่อคนขับให้คุณเรียบร้อยแล้ว
                  </p>
                </div>

                {/* Unlocked Driver Details Preview Bento */}
                <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-left text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">
                      🔓 ปลดล็อกข้อมูลคนขับ 100%
                    </span>
                    <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                      {bookingId}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-slate-800 dark:text-slate-200">
                    <p>
                      <span className="text-slate-500">คนขับ:</span>{' '}
                      <strong className="text-slate-950 dark:text-white">
                        {vehicle?.driverName} ({vehicle?.driverNickname || 'คนขับ'})
                      </strong>
                    </p>
                    {vehicle?.driverPhone && (
                      <p className="flex items-center gap-1.5">
                        <span className="text-slate-500">เบอร์โทรตรง:</span>{' '}
                        <a
                          href={`tel:${vehicle.driverPhone}`}
                          className="font-mono font-black text-emerald-700 dark:text-emerald-400 underline flex items-center gap-1 text-sm"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {vehicle.driverPhone}
                        </a>
                      </p>
                    )}
                    {vehicle?.driverLine && (
                      <p>
                        <span className="text-slate-500">LINE คนขับ:</span>{' '}
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{vehicle.driverLine}</span>
                      </p>
                    )}
                    <p>
                      <span className="text-slate-500">ทะเบียนรถ:</span>{' '}
                      <span className="font-mono font-bold">{vehicle?.plateNumber || '30-xxxx'}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmationSheet(true);
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                  >
                    <span>เปิดดูใบยืนยันการจอง & สัญญาเช่ารถ (TripDee Slip)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
                  >
                    เสร็จสิ้น / ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Confirmation Sheet Modal */}
      {showConfirmationSheet && (
        <BookingConfirmationSheet
          initialData={confirmationSheetData}
          vehicle={vehicle}
          isModal={true}
          onClose={() => setShowConfirmationSheet(false)}
        />
      )}
    </>
  );
};
