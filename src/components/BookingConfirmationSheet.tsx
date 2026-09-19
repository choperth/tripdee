'use client';

import React, { useState, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { Vehicle, STANDARD_TERMS, formatTHB } from '@/data/mockData';
import {
  Printer,
  Copy,
  Check,
  Edit3,
  ShieldCheck,
  Calendar,
  Clock,
  CarFront,
  Phone,
  MessageCircle,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  DollarSign,
  Users,
} from 'lucide-react';

export interface BookingSheetData {
  bookingId: string;
  bookingDate: string;
  status: 'confirmed' | 'pending' | 'deposit_paid';
  // Customer info
  customerName: string;
  customerPhone: string;
  customerLine?: string;
  passengers: string;
  // Trip info
  travelDates: string;
  totalDays: number;
  pickupLocation: string;
  pickupTime: string;
  routeDetails: string;
  // Driver & Vehicle info
  driverName: string;
  driverNickname: string;
  driverPhone: string;
  driverLine?: string;
  vehicleTitle: string;
  plateNumber: string;
  plateType: 'yellow' | 'blue';
  isVerified: boolean;
  canIssueTaxInvoice?: boolean;
  // Financial terms
  dailyRate: number;
  totalPrice: number;
  depositAmount: number;
  remainingAmount: number;
  fuelTerms: string;
  overtimeRate: number;
  overnightRate: number;
  bankAccountNote?: string;
  specialNotes?: string;
}

interface BookingConfirmationSheetProps {
  initialData?: Partial<BookingSheetData>;
  vehicle?: Vehicle | null;
  onClose?: () => void;
  isModal?: boolean;
}

export const BookingConfirmationSheet: React.FC<BookingConfirmationSheetProps> = ({
  initialData,
  vehicle,
  onClose,
  isModal = false,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, { onClose, enabled: isModal });
  const { t } = useLanguage();
  const [defaultBookingId] = useState(
    () => `TD-BK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [todayThai] = useState(() =>
    new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date())
  );

  const rateFromVehicle = vehicle?.zoneRates?.city || 1900;
  const daysDefault = initialData?.totalDays || 2;
  const dailyRateDefault = initialData?.dailyRate || rateFromVehicle;
  const totalCalculated = dailyRateDefault * daysDefault;
  const depositDefault = initialData?.depositAmount !== undefined ? initialData.depositAmount : Math.round(totalCalculated * 0.3);

  const [data, setData] = useState<BookingSheetData>({
    bookingId: initialData?.bookingId || defaultBookingId,
    bookingDate: initialData?.bookingDate || todayThai,
    status: initialData?.status || 'confirmed',
    customerName: initialData?.customerName || 'คุณผู้ว่าจ้าง (กรุณาระบุชื่อ)',
    customerPhone: initialData?.customerPhone || '08x-xxx-xxxx',
    customerLine: initialData?.customerLine || '',
    passengers: initialData?.passengers || (vehicle ? `${vehicle.seats} ท่าน` : '4-6 ท่าน'),
    travelDates: initialData?.travelDates || '20-21 ก.ย. 2569 (2 วัน 1 คืน)',
    totalDays: daysDefault,
    pickupLocation: initialData?.pickupLocation || 'สนามบินเชียงใหม่ / หรือโรงแรมในตัวเมือง',
    pickupTime: initialData?.pickupTime || '08:00 น.',
    routeDetails:
      initialData?.routeDetails ||
      (vehicle?.popularRoutes?.join(' - ') || 'ตัวเมืองเชียงใหม่ - ม่อนแจ่ม - แม่ริม - ดอยสุเทพ'),
    driverName: vehicle?.driverName || initialData?.driverName || 'นายสุรชัย ใจดี',
    driverNickname: vehicle?.driverNickname || initialData?.driverNickname || 'พี่ชัย รถตู้เชียงใหม่',
    driverPhone: vehicle?.driverPhone || initialData?.driverPhone || '081-234-5678',
    driverLine: vehicle?.driverLine || initialData?.driverLine || 'https://line.me',
    vehicleTitle: vehicle?.title || initialData?.vehicleTitle || 'Toyota Commuter VIP 9 ที่นั่ง',
    plateNumber: vehicle?.plateNumber || initialData?.plateNumber || 'นข-4521 ชม.',
    plateType: vehicle?.plateType || initialData?.plateType || 'yellow',
    isVerified: vehicle ? Boolean(vehicle.isVerified) : true,
    canIssueTaxInvoice: vehicle?.canIssueTaxInvoice ?? initialData?.canIssueTaxInvoice ?? true,
    dailyRate: dailyRateDefault,
    totalPrice: initialData?.totalPrice || totalCalculated,
    depositAmount: depositDefault,
    remainingAmount: (initialData?.totalPrice || totalCalculated) - depositDefault,
    fuelTerms: initialData?.fuelTerms || 'ผู้ว่าจ้างรับผิดชอบค่าน้ำมันตามจริง (รับรถน้ำมันเต็มถัง / คืนน้ำมันเต็มถัง)',
    overtimeRate: initialData?.overtimeRate || STANDARD_TERMS.overtimeRatePerHour || 200,
    overnightRate: initialData?.overnightRate || STANDARD_TERMS.overnightStayRate || 500,
    bankAccountNote: initialData?.bankAccountNote || 'โอนมัดจำเข้าบัญชีธนาคารชื่อตรงกับคนขับเท่านั้น',
    specialNotes: initialData?.specialNotes || 'คนขับตรงต่อเวลา รถทำความสะอาดฆ่าเชื้อก่อนรับงาน ไม่สูบบุหรี่บนรถ',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Update calculations when daily rate or days change
  const handleRateOrDaysChange = (days: number, rate: number) => {
    const total = days * rate;
    const deposit = Math.round(total * 0.3);
    setData((prev) => ({
      ...prev,
      totalDays: days,
      dailyRate: rate,
      totalPrice: total,
      depositAmount: deposit,
      remainingAmount: total - deposit,
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `📋 ใบสรุปยืนยันการจองรถ TripDee Verified
เลขที่การจอง: ${data.bookingId}
สถานะ: ยืนยันคิวรถแล้ว (มัดจำ ฿${data.depositAmount.toLocaleString()})

🗓️ วันเดินทาง: ${data.travelDates} (${data.totalDays} วัน)
📍 จุดนัดรับ: ${data.pickupLocation} เวลา ${data.pickupTime}
🗺️ เส้นทาง: ${data.routeDetails}
👥 จำนวนผู้โดยสาร: ${data.passengers}

🚐 ข้อมูลรถ & คนขับ:
- คนขับ: ${data.driverName} (${data.driverNickname})
- เบอร์โทร: ${data.driverPhone}
- รุ่นรถ: ${data.vehicleTitle}
- ทะเบียน: ${data.plateNumber} (${data.plateType === 'yellow' ? 'ป้ายเหลือง 30 ขนส่งสาธารณะ' : 'ป้ายฟ้า VIP'})

💰 สรุปค่าบริการ:
- อัตราค่าบริการ: ฿${data.dailyRate.toLocaleString()} x ${data.totalDays} วัน = ฿${data.totalPrice.toLocaleString()}
- มัดจำล็อคคิว: ฿${data.depositAmount.toLocaleString()}
- ยอดคงเหลือชำระวันเดินทาง: ฿${data.remainingAmount.toLocaleString()}
- เงื่อนไขน้ำมัน: ${data.fuelTerms}
- ค่า OT: ฿${data.overtimeRate}/ชม. | ค้างคืนนอกพื้นที่: ฿${data.overnightRate}/คืน

🔒 ปลอดภัย 100%: ตรวจสอบชื่อบัญชีโอนเงินให้ตรงกับชื่อคนขับ (${data.driverName})`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const content = (
    <div className="w-full max-w-4xl mx-auto bg-white text-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 print:shadow-none print:border-none print:rounded-none print:m-0 print:p-0">
      {/* Screen-only Action Toolbar */}
      <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-400" />
          <span className="font-extrabold text-sm tracking-tight">
            ใบสรุปการจองมาตรฐาน (TripDee Booking Sheet)
          </span>
          <span className="rounded-full bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 font-bold border border-emerald-500/30">
            A4 Print-Ready
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5 text-blue-400" />
            <span>{isEditing ? 'ดูตัวอย่างเอกสาร' : 'แก้ไขข้อมูล'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'คัดลอกข้อความแล้ว!' : t('sheet.copyLine')}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>{t('sheet.print')}</span>
          </button>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="ml-2 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
              aria-label={t('auth.close')}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Editing Drawer (Screen-only) */}
      {isEditing && (
        <div className="no-print bg-slate-50 dark:bg-slate-900 p-5 border-b border-slate-200 dark:border-slate-800 text-xs space-y-4">
          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-blue-500" />
            <span>ปรับแต่งข้อมูลในใบสรุปการจองก่อนพิมพ์</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="sheet-cust-name" className="block font-bold text-slate-700 mb-1">ชื่อผู้ว่าจ้าง/ผู้ติดต่อ</label>
              <input
                id="sheet-cust-name"
                type="text"
                value={data.customerName}
                onChange={(e) => setData({ ...data, customerName: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium"
              />
            </div>
            <div>
              <label htmlFor="sheet-cust-phone" className="block font-bold text-slate-700 mb-1">เบอร์โทรผู้ว่าจ้าง</label>
              <input
                id="sheet-cust-phone"
                type="text"
                value={data.customerPhone}
                onChange={(e) => setData({ ...data, customerPhone: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium"
              />
            </div>
            <div>
              <label htmlFor="sheet-passengers" className="block font-bold text-slate-700 mb-1">จำนวนผู้โดยสาร</label>
              <input
                id="sheet-passengers"
                type="text"
                value={data.passengers}
                onChange={(e) => setData({ ...data, passengers: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium"
              />
            </div>
            <div>
              <label htmlFor="sheet-travel-dates" className="block font-bold text-slate-700 mb-1">วันเดินทาง</label>
              <input
                id="sheet-travel-dates"
                type="text"
                value={data.travelDates}
                onChange={(e) => setData({ ...data, travelDates: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium"
              />
            </div>
            <div>
              <label htmlFor="sheet-total-days" className="block font-bold text-slate-700 mb-1">จำนวนวันเดินทาง</label>
              <input
                id="sheet-total-days"
                type="number"
                min="1"
                value={data.totalDays}
                onChange={(e) => handleRateOrDaysChange(Number(e.target.value) || 1, data.dailyRate)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium"
              />
            </div>
            <div>
              <label htmlFor="sheet-daily-rate" className="block font-bold text-slate-700 mb-1">ราคาต่อวัน (บาท)</label>
              <input
                id="sheet-daily-rate"
                type="number"
                min="0"
                value={data.dailyRate}
                onChange={(e) => handleRateOrDaysChange(data.totalDays, Number(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium"
              />
            </div>
            <div>
              <label htmlFor="sheet-pickup-loc" className="block font-bold text-slate-700 mb-1">จุดนัดรับ</label>
              <input
                id="sheet-pickup-loc"
                type="text"
                value={data.pickupLocation}
                onChange={(e) => setData({ ...data, pickupLocation: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium"
              />
            </div>
            <div>
              <label htmlFor="sheet-pickup-time" className="block font-bold text-slate-700 mb-1">เวลานัดหมาย</label>
              <input
                id="sheet-pickup-time"
                type="text"
                value={data.pickupTime}
                onChange={(e) => setData({ ...data, pickupTime: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium"
              />
            </div>
            <div>
              <label htmlFor="sheet-deposit" className="block font-bold text-slate-700 mb-1">ยอดเงินมัดจำ (บาท)</label>
              <input
                id="sheet-deposit"
                type="number"
                value={data.depositAmount}
                onChange={(e) => {
                  const dep = Number(e.target.value) || 0;
                  setData({
                    ...data,
                    depositAmount: dep,
                    remainingAmount: data.totalPrice - dep,
                  });
                }}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium"
              />
            </div>
            <div className="sm:col-span-3">
              <label htmlFor="sheet-route-details" className="block font-bold text-slate-700 mb-1">เส้นทางและสถานที่ท่องเที่ยว</label>
              <input
                id="sheet-route-details"
                type="text"
                value={data.routeDetails}
                onChange={(e) => setData({ ...data, routeDetails: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Printable Document (A4 format) */}
      <div className="print-page p-7 sm:p-10 font-sans text-slate-800 leading-normal">
        {/* Header Row */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b-2 border-slate-900">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-blue-600 grid place-items-center text-white font-black text-lg">
                TD
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  TripDee <span className="text-blue-600 font-extrabold text-lg">ทริปดี</span>
                </h1>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Platform for Verified Direct Van & Tourism Services
                </p>
              </div>
            </div>
            <div className="mt-3">
              <h2 className="text-lg font-extrabold text-slate-900">
                ใบสรุปการยืนยันการจองรถและมัดจำ
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                BOOKING CONFIRMATION & ITINERARY SUMMARY SHEET
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-black mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>ยืนยันคิวรถเรียบร้อย (CONFIRMED)</span>
            </div>
            <p className="text-xs font-bold text-slate-500">
              เลขที่อ้างอิง: <span className="font-mono font-black text-slate-900">{data.bookingId}</span>
            </p>
            <p className="text-xs text-slate-500">
              วันที่ออกเอกสาร: <span className="font-semibold text-slate-800">{data.bookingDate}</span>
            </p>
          </div>
        </div>

        {/* Section 1 & 2: Grid for Customer and Driver Info */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Box A: ข้อมูลผู้ว่าจ้าง / ผู้โดยสาร */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-600" />
              <span>1. ข้อมูลผู้ว่าจ้าง / ผู้เดินทาง</span>
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">ชื่อผู้ว่าจ้าง / คณะ:</span>
                <span className="font-bold text-slate-900">{data.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">เบอร์โทรศัพท์ติดต่อ:</span>
                <span className="font-bold text-slate-900">{data.customerPhone}</span>
              </div>
              {data.customerLine && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">LINE ID:</span>
                  <span className="font-bold text-slate-900">{data.customerLine}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">จำนวนผู้โดยสาร:</span>
                <span className="font-bold text-slate-900">{data.passengers}</span>
              </div>
            </div>
          </div>

          {/* Box B: ข้อมูลรถและคนขับที่ให้บริการ */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CarFront className="h-4 w-4 text-blue-600" />
                <span>2. ข้อมูลยานพาหนะและคนขับ</span>
              </h3>
              {data.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-black border border-emerald-300">
                  <ShieldCheck className="h-3 w-3 text-emerald-700" />
                  TripDee Verified
                </span>
              )}
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">คนขับผู้ให้บริการ:</span>
                <span className="font-bold text-slate-900">
                  {data.driverName} ({data.driverNickname})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">เบอร์โทรติดต่อตรง:</span>
                <span className="font-bold text-blue-600">{data.driverPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">ประเภทยานพาหนะ:</span>
                <span className="font-bold text-slate-900">{data.vehicleTitle}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">ทะเบียนรถ:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                    {data.plateNumber}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600">
                    {data.plateType === 'yellow' ? '(ป้ายเหลือง 30 สาธารณะ)' : '(ป้ายฟ้า VIP)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: แผนการเดินทางและจุดนัดรับ */}
        <div className="mt-5 rounded-xl border border-slate-200 p-4 bg-white">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span>3. แผนการเดินทางและกำหนดการนัดหมาย</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[11px]">วันเวลาเดินทาง:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {data.travelDates}
                  </span>
                  <span className="ml-1 text-slate-500">({data.totalDays} วัน)</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[11px]">จุดนัดรับและเวลาล้อหมุน:</span>
                  <span className="font-bold text-slate-900">{data.pickupLocation}</span>
                  <span className="ml-1.5 font-extrabold text-blue-600">เวลา {data.pickupTime}</span>
                </div>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px] mb-1">เส้นทางและสถานที่ท่องเที่ยว:</span>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 font-medium text-slate-800 text-xs leading-relaxed">
                {data.routeDetails}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: สรุปค่าบริการและการเงิน */}
        <div className="mt-5 rounded-xl border-2 border-slate-800 overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-amber-400" />
              <span>4. สรุปค่าบริการและการชำระเงิน (FINANCIAL BREAKDOWN)</span>
            </h3>
            <span className="text-[11px] text-amber-300 font-bold">
              0% ค่านายหน้า ดีลตรงกับคนขับ
            </span>
          </div>

          <div className="p-4 bg-slate-50/50 space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-600">
                ค่าบริการรถตู้พร้อมคนขับ ({data.totalDays} วัน @ ฿{data.dailyRate.toLocaleString()}/วัน):
              </span>
              <span className="font-extrabold text-slate-900 text-sm">
                ฿{data.totalPrice.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                <span className="text-slate-700 font-bold">ยอดเงินมัดจำล็อคคิวรถ (Deposit Paid):</span>
              </div>
              <span className="font-extrabold text-emerald-700 text-sm">
                ฿{data.depositAmount.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 bg-white p-2 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-900 font-black">ยอดคงเหลือชำระวันเดินทาง (Remaining Balance):</span>
                <p className="text-[10px] text-slate-500">ชำระให้คนขับโดยตรง ณ จุดนัดรับ หรือวันสิ้นสุดทริป</p>
              </div>
              <span className="font-black text-blue-700 text-base">
                ฿{data.remainingAmount.toLocaleString()}
              </span>
            </div>

            <div className="pt-2 text-[11px] text-slate-600 space-y-1">
              <p>
                <strong>เงื่อนไขค่าน้ำมัน & ทางด่วน:</strong> {data.fuelTerms}
              </p>
              <p>
                <strong>อัตราค่าล่วงเวลา (OT):</strong> {data.overtimeRate} บาท/ชั่วโมง (หลัง 18:00 น. หรือเกิน 10-12 ชม./วัน)
              </p>
              <p>
                <strong>เบี้ยเลี้ยงค้างคืนนอกพื้นที่:</strong> {data.overnightRate} บาท/คืน (หากไม่ได้จัดหาห้องพักให้คนขับ)
              </p>
              {data.canIssueTaxInvoice && (
                <p className="text-emerald-700 font-semibold">
                  ✓ รองรับการออกใบเสร็จรับเงิน / ใบกำกับภาษีเต็มรูปแบบ และหัก ณ ที่จ่าย 3%
                </p>
              )}
            </div>

            {/* Safety Payment Banner */}
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-300 p-2.5 flex items-start gap-2 text-[11px] text-amber-900 font-semibold">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-black">ข้อควรระวังเพื่อความปลอดภัยสูงสุดในการโอนมัดจำ:</p>
                <p className="text-amber-800 font-medium">
                  {data.bankAccountNote} กรุณาตรวจสอบชื่อบัญชีธนาคารปลายทางให้ตรงกับชื่อจริงของคนขับ (<strong>{data.driverName}</strong>) เท่านั้น ไม่โอนผ่านบุคคลที่สาม
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: เงื่อนไขและมาตรฐานบริการ */}
        <div className="mt-4 rounded-xl border border-slate-200 p-3.5 bg-slate-50/50 text-[11px] text-slate-600 space-y-1">
          <p className="font-black text-slate-800">เงื่อนไขและข้อตกลงมาตรฐาน (TripDee Standards):</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>คนขับต้องมีใบอนุญาตขับรถสาธารณะถูกต้อง ยานพาหนะผ่านการตรวจสภาพและมีประกันภัยคุ้มครองผู้โดยสาร</li>
            <li>ห้ามสูบบุหรี่และสารเสพติดทุกชนิดบนรถโดยเด็ดขาดตลอดการเดินทาง</li>
            <li>กรณีต้องการยกเลิกหรือเปลี่ยนแปลงวันเดินทาง กรุณาแจ้งคนขับล่วงหน้าอย่างน้อย 3-5 วันทำการ</li>
            <li>TripDee เป็นสื่อกลางประชาสัมพันธ์และตรวจสอบคนขับ ไม่คิดส่วนต่างหรือค่านายหน้าใดๆ ทั้งสิ้น</li>
          </ul>
        </div>

        {/* Section 6: ลายมือชื่อ (Signatures) */}
        <div className="mt-8 pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-center">
          <div>
            <div className="h-14 border-b border-dashed border-slate-400 mx-auto max-w-[200px]" />
            <p className="font-bold text-slate-800 mt-2">({data.customerName})</p>
            <p className="text-[11px] text-slate-500">ผู้ว่าจ้าง / ผู้โดยสาร</p>
            <p className="text-[10px] text-slate-500 mt-0.5">วันที่ _____/_____/_________</p>
          </div>

          <div>
            <div className="h-14 border-b border-dashed border-slate-400 mx-auto max-w-[200px]" />
            <p className="font-bold text-slate-800 mt-2">({data.driverName})</p>
            <p className="text-[11px] text-slate-500">คนขับผู้ให้บริการ / เจ้าของรถ</p>
            <p className="text-[10px] text-slate-500 mt-0.5">วันที่ _____/_____/_________</p>
          </div>
        </div>

        {/* Document Footer */}
        <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
          <span>TripDee Verified System · ระบบพิมพ์ใบสรุปการจองมาตรฐาน</span>
          <span>หน้า 1 จาก 1 · บันทึกเป็นหลักฐานได้ทั้งลูกค้าและคนขับ</span>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-[500] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto"
        onClick={onClose}
        role="presentation"
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="ใบสรุปการจองรถ TripDee"
          onClick={(e) => e.stopPropagation()}
          className="relative my-auto w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-2xl"
        >
          {content}
        </div>
      </div>
    );
  }

  return content;
};
