'use client';

import React, { useState, useRef } from 'react';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { Vehicle } from '@/data/mockData';
import {
  X,
  Phone,
  Search,
  CheckCircle,
  AlertCircle,
  Save,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { VehiclePhotoManager } from '@/components/portals/VehiclePhotoManager';
import { DangerZone } from '@/components/portals/DangerZone';
import { DriverAvailabilityCalendar } from '@/components/portals/DriverAvailabilityCalendar';
import { DriverSmartECardModal } from '@/components/cards/DriverSmartECardModal';

interface DriverSelfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegisterModal?: () => void;
}

export const DriverSelfServiceModal: React.FC<DriverSelfServiceModalProps> = ({
  isOpen,
  onClose,
  onOpenRegisterModal,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matchedVehicles, setMatchedVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showECardModal, setShowECardModal] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, { onClose, enabled: isOpen });
  const { t } = useLanguage();

  // Editable fields
  const [isAvailable, setIsAvailable] = useState(true);
  const [plateType, setPlateType] = useState<'yellow' | 'blue'>('blue');
  const [plateNumber, setPlateNumber] = useState('');
  const [canIssueTaxInvoice, setCanIssueTaxInvoice] = useState(false);
  const [driverPhone, setDriverPhone] = useState('');
  const [driverLine, setDriverLine] = useState('');
  const [cityRate, setCityRate] = useState(1900);
  const [highHillRate, setHighHillRate] = useState(2300);
  const [images, setImages] = useState<string[]>([]);
  const [busyDates, setBusyDates] = useState<string[]>([]);

  const selectVehicle = (v: Vehicle | null) => {
    setSelectedVehicle(v);
    if (v) {
      setIsAvailable(v.isAvailable !== false);
      setPlateType(v.plateType || 'blue');
      setPlateNumber(v.plateNumber || '');
      setCanIssueTaxInvoice(Boolean(v.canIssueTaxInvoice));
      setDriverPhone(v.driverPhone || '');
      setDriverLine(v.driverLine || '');
      setCityRate(v.zoneRates?.city || 1900);
      setHighHillRate(v.zoneRates?.highHill || 2300);
      setImages(Array.isArray(v.images) ? v.images : []);
      setBusyDates(Array.isArray(v.busyDates) ? v.busyDates : []);
    }
  };

  const handleBusyDatesChange = async (newBusyDates: string[]) => {
    setBusyDates(newBusyDates);
    if (selectedVehicle) {
      const vehicleId = selectedVehicle.id;
      setSelectedVehicle((prev) => (prev ? { ...prev, busyDates: newBusyDates } : null));
      try {
        await fetch('/api/vehicles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: vehicleId, busyDates: newBusyDates }),
        });
        window.dispatchEvent(new CustomEvent('tripdee-vehicles-updated'));
      } catch {
        /* will also persist on form submit */
      }
    }
  };

  if (!isOpen) return null;

  const normalizePhone = (p: string) => p.replace(/[^0-9]/g, '');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = normalizePhone(phoneNumber);
    if (cleanQuery.length < 9) {
      setErrorMessage('กรุณาระบุเบอร์โทรศัพท์อย่างน้อย 9-10 หลัก');
      return;
    }

    setErrorMessage('');
    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await fetch('/api/vehicles');
      const data = await res.json();
      const allVehicles: Vehicle[] = data.vehicles || [];

      const matches = allVehicles.filter((v) => {
        const p1 = normalizePhone(v.driverPhone || '');
        return p1.includes(cleanQuery) || cleanQuery.includes(p1);
      });

      // Fallback: check driver leads if no approved vehicle match
      if (matches.length === 0) {
        try {
          const leadRes = await fetch('/api/leads/driver');
          if (leadRes.ok) {
            const leadData = await leadRes.json();
            const allLeads = leadData.drivers || [];
            const leadMatches = allLeads.filter((d: { phone?: string }) => {
              const p = normalizePhone(d.phone || '');
              return p.includes(cleanQuery) || cleanQuery.includes(p);
            });

            if (leadMatches.length > 0) {
              const converted: Vehicle[] = leadMatches.map((lead: {
                id: string;
                driverName: string;
                nickname?: string;
                phone: string;
                lineId?: string;
                vehicleModel?: string;
                seats?: string;
                plateNumber?: string;
                plateType?: 'yellow' | 'blue';
                canIssueTaxInvoice?: boolean;
                routes?: string;
                status?: string;
              }) => ({
                id: lead.id,
                title: `${lead.vehicleModel || 'Toyota Commuter VIP'} (${lead.nickname || lead.driverName})`,
                type: 'van' as const,
                seats: Number(lead.seats) || 9,
                driverName: lead.driverName,
                driverNickname: lead.nickname || lead.driverName,
                driverPhone: lead.phone,
                driverLine: lead.lineId || '',
                languages: ['th' as const],
                rating: 5.0,
                reviewCount: 0,
                isVerified: lead.status === 'verified',
                images: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'],
                zoneRates: { city: 1900, midHill: 2100, highHill: 2300, crossProvince: 2700 },
                location: lead.routes || 'เชียงใหม่และใกล้เคียง',
                popularRoutes: ['ตัวเมือง', 'สนามบิน'],
                amenities: ['ตรวจสภาพรถและประวัติคนขับแล้ว 100%'],
                description: `บริการรถตู้โดย ${lead.driverName} (สถานะ: ${lead.status === 'verified' ? 'ยืนยันตัวตนแล้ว' : 'อยู่ระหว่างรอการตรวจสอบ'})`,
                plateType: lead.plateType || 'yellow',
                plateNumber: lead.plateNumber,
                canIssueTaxInvoice: Boolean(lead.canIssueTaxInvoice),
                isAvailable: true,
              }));
              matches.push(...converted);
            }
          }
        } catch (leadErr) {
          console.warn('Error checking driver leads in self-service:', leadErr);
        }
      }

      setMatchedVehicles(matches);
      if (matches.length === 1) {
        selectVehicle(matches[0]);
      } else {
        selectVehicle(null);
      }
    } catch {
      setErrorMessage('เกิดข้อผิดพลาดในการค้นหาข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const updatedData: Partial<Vehicle> = {
        isAvailable,
        plateType,
        plateNumber: plateNumber.trim() || undefined,
        canIssueTaxInvoice,
        driverPhone: driverPhone.trim(),
        driverLine: driverLine.trim() || undefined,
        images: images.length > 0 ? images : undefined,
        busyDates,
        zoneRates: {
          ...(selectedVehicle.zoneRates || { city: 1900, midHill: 2100, highHill: 2300, crossProvince: 2700 }),
          city: Number(cityRate) || 1900,
          highHill: Number(highHillRate) || 2300,
        },
      };

      if (selectedVehicle.id.startsWith('drv-')) {
        // Update driver lead
        const res = await fetch('/api/leads/driver', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedVehicle.id,
            plateType,
            plateNumber: plateNumber.trim() || undefined,
            canIssueTaxInvoice,
            phone: driverPhone.trim(),
            lineId: driverLine.trim() || undefined,
          }),
        });
        if (!res.ok) throw new Error('บันทึกข้อมูลไม่สำเร็จ');
      } else {
        const res = await fetch('/api/vehicles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedVehicle.id, ...updatedData }),
        });
        if (!res.ok) throw new Error('บันทึกข้อมูลไม่สำเร็จ');
      }

      setSaveSuccess(true);
      window.dispatchEvent(new CustomEvent('tripdee-vehicles-updated'));
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setErrorMessage((err as Error).message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-400 flex items-center justify-center overflow-y-auto bg-navy-deep/75 backdrop-blur-sm p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('pself.aria')}
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-800 shadow-2xl text-ink-primary dark:text-slate-100"
      >
        {/* Header Bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-space-md py-space-sm bg-paper-elevated/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-border-subtle dark:border-slate-800">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[24px] text-amber-accent">
              airport_shuttle
            </span>
            <div>
              <h2 className="font-headline-md text-headline-md text-navy-deep dark:text-white leading-tight">
                {t('pself.title')}
              </h2>
              <span className="font-label-badge text-label-badge text-ink-muted dark:text-slate-400">
                {t('pself.subtitle')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('auth.close')}
            className="w-8 h-8 rounded-full bg-paper-surface-muted dark:bg-slate-800 flex items-center justify-center text-ink-secondary hover:text-ink-primary transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-space-md lg:p-space-lg space-y-space-md">
          {/* STEP 1: Phone Search Lookup if no vehicle selected */}
          {!selectedVehicle && (
            <div className="max-w-xl mx-auto py-space-lg space-y-space-md text-center">
              <div className="w-16 h-16 rounded-full bg-blue-subtle dark:bg-blue-950 text-blue-action mx-auto flex items-center justify-center">
                <Phone className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-headline-md text-headline-md text-navy-deep dark:text-white">
                  {t('pself.searchTitle')}
                </h3>
                <p className="font-body-base text-body-base text-ink-secondary dark:text-slate-400">
                  {t('pself.searchDesc')}
                </p>
              </div>

              <form onSubmit={handleSearch} className="space-y-space-sm">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted text-[20px]">
                    call
                  </span>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={t('pself.phonePh')}
                    className="w-full h-12 pl-11 pr-4 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-headline-md font-bold focus:outline-none focus:ring-2 focus:ring-blue-action text-center"
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-xl text-body-subtext font-bold">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full h-12 bg-blue-action hover:bg-blue-action-hover text-on-primary font-title-card text-title-card rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t('pself.searching')}</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      <span>{t('pself.searchBtn')}</span>
                    </>
                  )}
                </button>
              </form>

              {hasSearched && matchedVehicles.length === 0 && (
                <div className="pt-space-md border-t border-border-subtle dark:border-slate-800 space-y-space-xs">
                  <p className="text-body-subtext text-ink-muted dark:text-slate-400">
                    {t('pself.notFound')}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenRegisterModal) onOpenRegisterModal();
                    }}
                    className="px-space-md py-space-xs bg-navy-deep text-surface rounded-xl font-body-medium text-body-medium hover:bg-navy-surface transition-colors"
                  >
                    {t('pself.registerCta')}
                  </button>
                </div>
              )}

              {matchedVehicles.length > 1 && (
                <div className="space-y-space-xs text-left pt-space-xs">
                  <h4 className="font-title-card text-title-card text-navy-deep dark:text-white">
                    {t('pself.pickTitle', { n: matchedVehicles.length })}
                  </h4>
                  <div className="space-y-2">
                    {matchedVehicles.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => selectVehicle(v)}
                        className="w-full p-3 rounded-xl border border-border-subtle bg-paper-canvas dark:bg-slate-800 hover:border-blue-action transition-all text-left flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-navy-deep dark:text-white">{v.title}</div>
                          <div className="text-xs text-ink-muted">{v.location}</div>
                        </div>
                        <span className="text-blue-action font-bold text-xs">{t('pself.pickBtn')}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Driver Dashboard View when vehicle selected (Stitch Redesign) */}
          {selectedVehicle && (
            <div className="space-y-space-lg animate-fade-in">
              {/* Back to search */}
              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
                className="inline-flex items-center gap-1 text-body-subtext font-body-medium text-ink-muted hover:text-navy-deep dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('pself.backToSearch')}</span>
              </button>

              {/* Driver Profile & Live Dispatch Bar (Stitch Redesign) */}
              <div className="w-full bg-navy-deep text-on-primary p-space-lg rounded-2xl relative overflow-hidden shadow-md space-y-space-md">
                <div className="absolute -right-16 -top-16 w-96 h-96 rounded-full bg-blue-action/10 blur-3xl pointer-events-none" />
                <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-amber-accent/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg">
                  <div className="flex items-center gap-space-md">
                    <div className="relative">
                      <div className="w-18 h-18 rounded-full bg-blue-subtle text-blue-action font-bold flex items-center justify-center text-3xl shadow-md border-2 border-white/20">
                        {selectedVehicle.driverNickname.charAt(0) || 'พ'}
                      </div>
                      <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-verified-emerald flex items-center justify-center text-on-primary shadow-sm ring-2 ring-navy-deep">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-space-2xs">
                        <h3 className="font-headline-xl text-headline-xl text-surface font-bold tracking-tight">
                          {selectedVehicle.driverNickname}
                        </h3>
                        {selectedVehicle.plateNumber && (
                          <span className="px-space-xs py-[2px] bg-taxi-yellow-soft text-on-tertiary-fixed-variant rounded font-label-badge text-label-badge font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-amber-accent">
                              shield
                            </span>
                            <span>{selectedVehicle.plateNumber}</span>
                          </span>
                        )}
                        <span className="px-space-xs py-[2px] bg-verified-emerald-soft text-verified-emerald rounded font-label-badge text-label-badge font-bold">
                          {t('pself.verifiedBadge')}
                        </span>
                      </div>
                      <p className="font-body-base text-body-base text-surface-container-high">
                        {selectedVehicle.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                    {/* 2. Driver Smart E-Card Button */}
                    <button
                      type="button"
                      onClick={() => setShowECardModal(true)}
                      className="px-space-md py-space-sm rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:brightness-105 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
                      <span>{t('ecard.myBtn')}</span>
                    </button>

                    {/* Real-time Status Switcher (Stitch Header Control) */}
                    <div className="flex items-center bg-paper-elevated dark:bg-slate-800 text-ink-primary dark:text-white p-space-sm rounded-2xl shadow-lg justify-between gap-space-md border border-border-subtle dark:border-slate-700">
                    <div className="flex items-center gap-space-sm">
                      <span
                        className={`w-3.5 h-3.5 rounded-full ${
                          isAvailable ? 'bg-verified-emerald animate-pulse' : 'bg-rose-500'
                        }`}
                      />
                      <div className="flex flex-col">
                        <span className="font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider">
                          {t('pself.statusLabel')}
                        </span>
                        <span className="font-title-card text-title-card text-navy-deep dark:text-white">
                          {isAvailable ? t('pself.statusOn') : t('pself.statusOff')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-space-2xs bg-paper-surface-muted dark:bg-slate-900 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setIsAvailable(true)}
                        className={`px-space-md py-space-xs rounded-lg font-body-medium text-body-medium transition-all flex items-center gap-1 ${
                          isAvailable
                            ? 'bg-line-green text-surface shadow-sm font-bold'
                            : 'text-ink-secondary dark:text-slate-400 hover:text-navy-deep'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          radio_button_checked
                        </span>
                        <span>{t('pself.availOn')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAvailable(false)}
                        className={`px-space-md py-space-xs rounded-lg font-body-medium text-body-medium transition-all flex items-center gap-1 ${
                          !isAvailable
                            ? 'bg-rose-600 text-surface shadow-sm font-bold'
                            : 'text-ink-secondary dark:text-slate-400 hover:text-navy-deep'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">block</span>
                        <span>{t('pself.availOff')}</span>
                      </button>
                    </div>
                  </div>
                  </div>
                </div>
              </div>

              {/* 4 Performance Metrics (Stitch Redesign Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
                <div className="bg-paper-canvas dark:bg-slate-800/80 p-space-md rounded-xl border border-border-subtle dark:border-slate-700 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-body-subtext text-body-subtext text-ink-muted dark:text-slate-400">
                      {t('pself.metricJobs')}
                    </span>
                    <span className="p-space-2xs bg-blue-subtle text-blue-action rounded-lg">
                      <span className="material-symbols-outlined text-[20px]">task_alt</span>
                    </span>
                  </div>
                  <div className="mt-space-sm flex items-baseline justify-between">
                    <span className="font-price-headline text-price-headline text-navy-deep dark:text-white">
                      14 <span className="font-body-base text-body-base font-normal text-ink-muted">{t('pself.unitTrips')}</span>
                    </span>
                    <span className="font-label-badge text-label-badge text-verified-emerald font-bold">
                      +3 สัปดาห์นี้
                    </span>
                  </div>
                </div>

                <div className="bg-paper-canvas dark:bg-slate-800/80 p-space-md rounded-xl border border-border-subtle dark:border-slate-700 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-body-subtext text-body-subtext text-ink-muted dark:text-slate-400">
                      {t('corp.statRating')}
                    </span>
                    <span className="p-space-2xs bg-taxi-yellow-soft text-amber-accent rounded-lg">
                      <span className="material-symbols-outlined text-[20px]">hotel_class</span>
                    </span>
                  </div>
                  <div className="mt-space-sm flex items-baseline justify-between">
                    <span className="font-price-headline text-price-headline text-navy-deep dark:text-white">
                      {selectedVehicle.rating || '4.96'} <span className="text-amber-accent font-bold">★</span>
                    </span>
                    <span className="font-label-badge text-label-badge text-ink-muted dark:text-slate-400">
                      จาก {selectedVehicle.reviewCount || 48} รีวิว
                    </span>
                  </div>
                </div>

                <div className="bg-paper-canvas dark:bg-slate-800/80 p-space-md rounded-xl border border-border-subtle dark:border-slate-700 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-body-subtext text-body-subtext text-ink-muted dark:text-slate-400">
                      {t('pself.metricCalls')}
                    </span>
                    <span className="p-space-2xs bg-verified-emerald-soft text-verified-emerald rounded-lg">
                      <span className="material-symbols-outlined text-[20px]">ring_volume</span>
                    </span>
                  </div>
                  <div className="mt-space-sm flex items-baseline justify-between">
                    <span className="font-price-headline text-price-headline text-navy-deep dark:text-white">
                      62 <span className="font-body-base text-body-base font-normal text-ink-muted">{t('pself.unitTimes')}</span>
                    </span>
                    <span className="font-label-badge text-label-badge text-verified-emerald font-bold">
                      +18 สัปดาห์นี้
                    </span>
                  </div>
                </div>

                <div className="bg-paper-canvas dark:bg-slate-800/80 p-space-md rounded-xl border border-border-subtle dark:border-slate-700 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-body-subtext text-body-subtext text-ink-muted dark:text-slate-400">
                      {t('pself.metricComm')}
                    </span>
                    <span className="p-space-2xs bg-primary-container text-surface rounded-lg">
                      <span className="material-symbols-outlined text-[20px]">savings</span>
                    </span>
                  </div>
                  <div className="mt-space-sm flex items-baseline justify-between">
                    <span className="font-price-headline text-price-headline text-navy-deep dark:text-white">
                      ฿0
                    </span>
                    <span className="font-label-badge text-label-badge text-verified-emerald font-bold">
                      {t('pself.commNote')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 1.3 Driver Availability Calendar: Booked & Busy Dates Management */}
              <div className="bg-paper-canvas dark:bg-slate-800/60 p-space-lg rounded-2xl border border-border-subtle dark:border-slate-700">
                <DriverAvailabilityCalendar
                  busyDates={busyDates}
                  onChange={handleBusyDatesChange}
                />
              </div>

              {/* Vehicle Fleet Settings & Pricing Form */}
              <form onSubmit={handleSave} className="bg-paper-canvas dark:bg-slate-800/60 p-space-lg rounded-2xl border border-border-subtle dark:border-slate-700 space-y-space-md">
                <h4 className="font-headline-md text-headline-md text-navy-deep dark:text-white">
                  {t('pself.formTitle')}
                </h4>

                {/* 1.1 Driver Photo Uploader & Manager */}
                <VehiclePhotoManager
                  images={images}
                  onChange={setImages}
                  maxPhotos={8}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div>
                    <label className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                      {t('pself.fPlateType')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPlateType('yellow')}
                        className={`h-11 rounded-xl font-body-medium text-body-medium border transition-all ${
                          plateType === 'yellow'
                            ? 'bg-taxi-yellow-soft border-amber-400 text-on-tertiary-fixed-variant font-bold shadow-xs'
                            : 'bg-paper-elevated dark:bg-slate-800 border-border-subtle text-ink-secondary'
                        }`}
                      >
                        {t('pself.plateYellow')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlateType('blue')}
                        className={`h-11 rounded-xl font-body-medium text-body-medium border transition-all ${
                          plateType === 'blue'
                            ? 'bg-blue-subtle border-blue-400 text-blue-action font-bold shadow-xs'
                            : 'bg-paper-elevated dark:bg-slate-800 border-border-subtle text-ink-secondary'
                        }`}
                      >
                        {t('pself.plateBlue')}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                      {t('pself.fPlateNo')}
                    </label>
                    <input
                      type="text"
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value)}
                      placeholder={t('pself.fPlateNoPh')}
                      className="w-full h-11 px-3 bg-paper-elevated dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base border border-border-subtle focus:outline-none focus:ring-2 focus:ring-blue-action"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div>
                    <label className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                      {t('pself.fRateCity')}
                    </label>
                    <input
                      type="number"
                      step={100}
                      value={cityRate}
                      onChange={(e) => setCityRate(Number(e.target.value))}
                      className="w-full h-11 px-3 bg-paper-elevated dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base border border-border-subtle focus:outline-none focus:ring-2 focus:ring-blue-action"
                    />
                  </div>

                  <div>
                    <label className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                      {t('pself.fRateHigh')}
                    </label>
                    <input
                      type="number"
                      step={100}
                      value={highHillRate}
                      onChange={(e) => setHighHillRate(Number(e.target.value))}
                      className="w-full h-11 px-3 bg-paper-elevated dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base border border-border-subtle focus:outline-none focus:ring-2 focus:ring-blue-action"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div>
                    <label className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                      {t('pself.fPhone')}
                    </label>
                    <input
                      type="tel"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      className="w-full h-11 px-3 bg-paper-elevated dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base border border-border-subtle focus:outline-none focus:ring-2 focus:ring-blue-action"
                    />
                  </div>

                  <div>
                    <label className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                      {t('pself.fLine')}
                    </label>
                    <input
                      type="text"
                      value={driverLine}
                      onChange={(e) => setDriverLine(e.target.value)}
                      className="w-full h-11 px-3 bg-paper-elevated dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base border border-border-subtle focus:outline-none focus:ring-2 focus:ring-blue-action"
                    />
                  </div>
                </div>

                {/* Tax invoice toggle */}
                <div className="p-space-sm rounded-xl bg-paper-elevated dark:bg-slate-800 border border-border-subtle flex items-center justify-between">
                  <div>
                    <span className="font-body-medium text-navy-deep dark:text-white font-bold block">
                      {t('pself.fTax')}
                    </span>
                    <span className="font-body-subtext text-ink-muted dark:text-slate-400">
                      {t('pself.taxDesc')}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={canIssueTaxInvoice}
                    onChange={(e) => setCanIssueTaxInvoice(e.target.checked)}
                    className="w-5 h-5 text-blue-action rounded focus:ring-blue-action cursor-pointer"
                  />
                </div>

                {saveSuccess && (
                  <div className="p-3 bg-verified-emerald-soft text-verified-emerald rounded-xl font-body-medium flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>{t('pself.saved')}</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl font-body-medium flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full h-12 bg-blue-action hover:bg-blue-action-hover text-on-primary font-title-card text-title-card rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t('pself.saving')}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>{t('pself.save')}</span>
                    </>
                  )}
                </button>
              </form>

              {/* 1.2 Danger Zone: Self-Service Account Deletion & Data Purge (PDPA) */}
              <DangerZone
                targetName={`${selectedVehicle.title} (${selectedVehicle.plateNumber || selectedVehicle.driverNickname})`}
                title={t('danger.title')}
                description={t('danger.driverDesc')}
                buttonLabel={t('danger.deleteBtn')}
                onDelete={async () => {
                  const res = await fetch(`/api/vehicles?id=${selectedVehicle.id}`, { method: 'DELETE' });
                  if (!res.ok) {
                    throw new Error('ไม่สามารถลบข้อมูลรถได้ กรุณาลองใหม่อีกครั้ง');
                  }
                  window.dispatchEvent(new CustomEvent('tripdee-vehicles-updated'));
                  setSelectedVehicle(null);
                  setPhoneNumber('');
                  setMatchedVehicles([]);
                  setHasSearched(false);
                }}
              />
              {/* Driver Smart E-Card Modal */}
              <DriverSmartECardModal
                vehicle={selectedVehicle}
                isOpen={showECardModal}
                onClose={() => setShowECardModal(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
