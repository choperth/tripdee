'use client';

import React, { useState, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { Vehicle, STANDARD_TERMS } from '@/data/mockData';
import { vehicleTitle, vehiclePopularRoutes } from '@/data/vehicleI18n';
import {
  Printer,
  Copy,
  Check,
  Edit3,
  Calendar,
  Clock,
  CarFront,
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
  const { t, locale } = useLanguage();
  const [defaultBookingId] = useState(
    () => `TD-BK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [issuedDate] = useState(() =>
    new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : locale === 'zh' ? 'zh-CN' : 'en-GB', {
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

  const [data, setData] = useState<BookingSheetData>(() => ({
    bookingId: initialData?.bookingId || defaultBookingId,
    bookingDate: initialData?.bookingDate || issuedDate,
    status: initialData?.status || 'confirmed',
    customerName: initialData?.customerName || t('sheet.dCustName'),
    customerPhone: initialData?.customerPhone || '08x-xxx-xxxx',
    customerLine: initialData?.customerLine || '',
    passengers: initialData?.passengers || (vehicle ? t('sheet.dPassengersN', { n: String(vehicle.seats) }) : t('sheet.dPassengers')),
    travelDates: initialData?.travelDates || t('sheet.dTravelDates'),
    totalDays: daysDefault,
    pickupLocation: initialData?.pickupLocation || t('sheet.dPickupLoc'),
    pickupTime: initialData?.pickupTime || t('sheet.dPickupTime'),
    routeDetails:
      initialData?.routeDetails ||
      (vehicle ? vehiclePopularRoutes(vehicle, locale).join(' - ') || t('sheet.dRoute') : t('sheet.dRoute')),
    driverName: vehicle?.driverName || initialData?.driverName || t('sheet.dDriverName'),
    driverNickname: vehicle?.driverNickname || initialData?.driverNickname || t('sheet.dDriverNick'),
    driverPhone: vehicle?.driverPhone || initialData?.driverPhone || '081-234-5678',
    driverLine: vehicle?.driverLine || initialData?.driverLine || 'https://line.me',
    vehicleTitle:
      (vehicle ? vehicleTitle(vehicle, locale) : '') || initialData?.vehicleTitle || t('sheet.dVehicle'),
    plateNumber: vehicle?.plateNumber || initialData?.plateNumber || t('sheet.dPlate'),
    plateType: vehicle?.plateType || initialData?.plateType || 'yellow',
    isVerified: vehicle ? Boolean(vehicle.isVerified) : true,
    canIssueTaxInvoice: vehicle?.canIssueTaxInvoice ?? initialData?.canIssueTaxInvoice ?? true,
    dailyRate: dailyRateDefault,
    totalPrice: initialData?.totalPrice || totalCalculated,
    depositAmount: depositDefault,
    remainingAmount: (initialData?.totalPrice || totalCalculated) - depositDefault,
    fuelTerms: initialData?.fuelTerms || t('sheet.dFuel'),
    overtimeRate: initialData?.overtimeRate || STANDARD_TERMS.overtimeRatePerHour || 200,
    overnightRate: initialData?.overnightRate || STANDARD_TERMS.overnightStayRate || 500,
    bankAccountNote: initialData?.bankAccountNote || t('sheet.dBank'),
    specialNotes: initialData?.specialNotes || t('sheet.dSpecial'),
  }));

  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

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
    const plateTypeText =
      data.plateType === 'yellow' ? t('sheet.plateYellowLong') : t('sheet.plateBlueLong');
    const lines = [
      t('sheet.cpHead'),
      t('sheet.cpRef', { id: data.bookingId }),
      t('sheet.cpStatus', { amount: data.depositAmount.toLocaleString() }),
      '',
      t('sheet.cpDates', { dates: data.travelDates, days: String(data.totalDays) }),
      t('sheet.cpPickup', { loc: data.pickupLocation, time: data.pickupTime }),
      t('sheet.cpRoute', { route: data.routeDetails }),
      t('sheet.cpPax', { pax: data.passengers }),
      '',
      t('sheet.cpVehicleHead'),
      t('sheet.cpDriver', { name: data.driverName, nick: data.driverNickname }),
      t('sheet.cpPhone', { phone: data.driverPhone }),
      t('sheet.cpModel', { title: data.vehicleTitle }),
      t('sheet.cpPlate', { plate: data.plateNumber, plateType: plateTypeText }),
      '',
      t('sheet.cpMoneyHead'),
      t('sheet.cpRate', {
        rate: data.dailyRate.toLocaleString(),
        days: String(data.totalDays),
        total: data.totalPrice.toLocaleString(),
      }),
      t('sheet.cpDeposit', { amount: data.depositAmount.toLocaleString() }),
      t('sheet.cpRemaining', { amount: data.remainingAmount.toLocaleString() }),
      t('sheet.cpFuel', { fuel: data.fuelTerms }),
      t('sheet.cpOt', { ot: String(data.overtimeRate), overnight: String(data.overnightRate) }),
      '',
      t('sheet.cpSafe', { name: data.driverName }),
    ];

    navigator.clipboard.writeText(lines.join('\n'));
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
            {t('sheet.toolbarTitle')}
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
            <span>{isEditing ? t('sheet.preview') : t('sheet.edit')}</span>
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? t('sheet.copied') : t('sheet.copyLine')}</span>
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
            <span>{t('sheet.editHint')}</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="sheet-cust-name" className="block font-bold text-slate-700 mb-1">{t('sheet.fCustName')}</label>
              <input
                id="sheet-cust-name"
                type="text"
                value={data.customerName}
                onChange={(e) => setData({ ...data, customerName: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium"
              />
            </div>
            <div>
              <label htmlFor="sheet-cust-phone" className="block font-bold text-slate-700 mb-1">{t('sheet.fCustPhone')}</label>
              <input
                id="sheet-cust-phone"
                type="text"
                value={data.customerPhone}
                onChange={(e) => setData({ ...data, customerPhone: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium"
              />
            </div>
            <div>
              <label htmlFor="sheet-passengers" className="block font-bold text-slate-700 mb-1">{t('sheet.fPassengers')}</label>
              <input
                id="sheet-passengers"
                type="text"
                value={data.passengers}
                onChange={(e) => setData({ ...data, passengers: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium"
              />
            </div>
            <div>
              <label htmlFor="sheet-travel-dates" className="block font-bold text-slate-700 mb-1">{t('sheet.fTravelDates')}</label>
              <input
                id="sheet-travel-dates"
                type="text"
                value={data.travelDates}
                onChange={(e) => setData({ ...data, travelDates: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium"
              />
            </div>
            <div>
              <label htmlFor="sheet-total-days" className="block font-bold text-slate-700 mb-1">{t('sheet.fTotalDays')}</label>
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
              <label htmlFor="sheet-daily-rate" className="block font-bold text-slate-700 mb-1">{t('sheet.fDailyRate')}</label>
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
              <label htmlFor="sheet-pickup-loc" className="block font-bold text-slate-700 mb-1">{t('sheet.fPickupLoc')}</label>
              <input
                id="sheet-pickup-loc"
                type="text"
                value={data.pickupLocation}
                onChange={(e) => setData({ ...data, pickupLocation: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium"
              />
            </div>
            <div>
              <label htmlFor="sheet-pickup-time" className="block font-bold text-slate-700 mb-1">{t('sheet.fPickupTime')}</label>
              <input
                id="sheet-pickup-time"
                type="text"
                value={data.pickupTime}
                onChange={(e) => setData({ ...data, pickupTime: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium"
              />
            </div>
            <div>
              <label htmlFor="sheet-deposit" className="block font-bold text-slate-700 mb-1">{t('sheet.fDeposit')}</label>
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
              <label htmlFor="sheet-route-details" className="block font-bold text-slate-700 mb-1">{t('sheet.fRouteDetails')}</label>
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
                  TripDee <span className="text-blue-600 font-extrabold text-lg">{t('brand.logoAlt')}</span>
                </h1>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t('sheet.brandTagline')}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <h2 className="text-lg font-extrabold text-slate-900">
                {t('sheet.docTitle')}
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                {t('sheet.docSubtitle')}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-black mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{t('sheet.statusBadge')}</span>
            </div>
            <p className="text-xs font-bold text-slate-500">
              {t('sheet.refNo')} <span className="font-mono font-black text-slate-900">{data.bookingId}</span>
            </p>
            <p className="text-xs text-slate-500">
              {t('sheet.issueDate')} <span className="font-semibold text-slate-800">{data.bookingDate}</span>
            </p>
          </div>
        </div>

        {/* Section 1 & 2: Grid for Customer and Driver Info */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-600" />
              <span>{t('sheet.secCustomer')}</span>
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">{t('sheet.labelCust')}</span>
                <span className="font-bold text-slate-900">{data.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">{t('sheet.labelPhone')}</span>
                <span className="font-bold text-slate-900">{data.customerPhone}</span>
              </div>
              {data.customerLine && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">LINE ID:</span>
                  <span className="font-bold text-slate-900">{data.customerLine}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">{t('sheet.fPassengers')}:</span>
                <span className="font-bold text-slate-900">{data.passengers}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CarFront className="h-4 w-4 text-blue-600" />
                <span>{t('sheet.secVehicle')}</span>
              </h3>
              {data.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 text-[10px] font-black border border-amber-300">
                  <span className="text-amber-600 font-bold">★</span>
                  {t('sheet.featured')}
                </span>
              )}
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">{t('sheet.labelDriver')}</span>
                <span className="font-bold text-slate-900">
                  {data.driverName} ({data.driverNickname})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">{t('sheet.labelDriverPhone')}</span>
                <span className="font-bold text-blue-600">{data.driverPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">{t('sheet.labelVehicle')}</span>
                <span className="font-bold text-slate-900">{data.vehicleTitle}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{t('sheet.labelPlate')}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                    {data.plateNumber}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600">
                    {data.plateType === 'yellow' ? t('sheet.plateYellow') : t('sheet.plateBlue')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="mt-5 rounded-xl border border-slate-200 p-4 bg-white">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span>{t('sheet.secTrip')}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[11px]">{t('sheet.labelTravel')}</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {data.travelDates}
                  </span>
                  <span className="ml-1 text-slate-500">{t('sheet.daysUnit', { n: String(data.totalDays) })}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[11px]">{t('sheet.labelPickup')}</span>
                  <span className="font-bold text-slate-900">{data.pickupLocation}</span>
                  <span className="ml-1.5 font-extrabold text-blue-600">{t('sheet.atTime', { time: data.pickupTime })}</span>
                </div>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px] mb-1">{t('sheet.fRouteDetails')}:</span>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 font-medium text-slate-800 text-xs leading-relaxed">
                {data.routeDetails}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4 */}
        <div className="mt-5 rounded-xl border-2 border-slate-800 overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-amber-400" />
              <span>{t('sheet.secFinancial')}</span>
            </h3>
            <span className="text-[11px] text-amber-300 font-bold">
              {t('sheet.zeroCommission')}
            </span>
          </div>

          <div className="p-4 bg-slate-50/50 space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-600">
                {t('sheet.rateLine', {
                  days: String(data.totalDays),
                  rate: data.dailyRate.toLocaleString(),
                })}
              </span>
              <span className="font-extrabold text-slate-900 text-sm">
                ฿{data.totalPrice.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                <span className="text-slate-700 font-bold">{t('sheet.depositPaid')}</span>
              </div>
              <span className="font-extrabold text-emerald-700 text-sm">
                ฿{data.depositAmount.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 bg-white p-2 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-900 font-black">{t('sheet.remaining')}</span>
                <p className="text-[10px] text-slate-500">{t('sheet.remainingNote')}</p>
              </div>
              <span className="font-black text-blue-700 text-base">
                ฿{data.remainingAmount.toLocaleString()}
              </span>
            </div>

            <div className="pt-2 text-[11px] text-slate-600 space-y-1">
              <p>
                <strong>{t('sheet.fuelLabel')}</strong> {data.fuelTerms}
              </p>
              <p>
                <strong>{t('sheet.otLabel')}</strong> {data.overtimeRate} {t('sheet.otNote')}
              </p>
              <p>
                <strong>{t('sheet.overnightLabel')}</strong> {data.overnightRate} {t('sheet.overnightNote')}
              </p>
              {data.canIssueTaxInvoice && (
                <p className="text-emerald-700 font-semibold">
                  {t('sheet.taxNote')}
                </p>
              )}
            </div>

            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-300 p-2.5 flex items-start gap-2 text-[11px] text-amber-900 font-semibold">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-black">{t('sheet.safetyTitle')}</p>
                <p className="text-amber-800 font-medium">
                  {t('sheet.safetyBody', { note: data.bankAccountNote || '', name: data.driverName })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5 */}
        <div className="mt-4 rounded-xl border border-slate-200 p-3.5 bg-slate-50/50 text-[11px] text-slate-600 space-y-1">
          <p className="font-black text-slate-800">{t('sheet.standardsTitle')}</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>{t('sheet.std1')}</li>
            <li>{t('sheet.std2')}</li>
            <li>{t('sheet.std3')}</li>
            <li>{t('sheet.std4')}</li>
          </ul>
        </div>

        {/* Section 6 */}
        <div className="mt-8 pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-center">
          <div>
            <div className="h-14 border-b border-dashed border-slate-400 mx-auto max-w-[200px]" />
            <p className="font-bold text-slate-800 mt-2">({data.customerName})</p>
            <p className="text-[11px] text-slate-500">{t('sheet.sigCustomer')}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{t('sheet.sigDate')}</p>
          </div>

          <div>
            <div className="h-14 border-b border-dashed border-slate-400 mx-auto max-w-[200px]" />
            <p className="font-bold text-slate-800 mt-2">({data.driverName})</p>
            <p className="text-[11px] text-slate-500">{t('sheet.sigDriver')}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{t('sheet.sigDate')}</p>
          </div>
        </div>

        {/* Document Footer */}
        <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
          <span>{t('sheet.footer')}</span>
          <span>{t('sheet.pageNote')}</span>
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
          aria-label={t('sheet.aria')}
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
