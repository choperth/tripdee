'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { Vehicle } from '@/data/mockData';
import {
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
  const [showOtp, setShowOtp] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpCountdown, setOtpCountdown] = useState(59);
  const [otpMessage, setOtpMessage] = useState('');
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
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
  const [cityRate, setCityRate] = useState<number | ''>('');
  const [highHillRate, setHighHillRate] = useState<number | ''>('');
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
      setCityRate(v.zoneRates?.city ?? '');
      setHighHillRate(v.zoneRates?.highHill ?? '');
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

  const normalizePhone = (p: string) => p.replace(/[^0-9]/g, '');

  // OTP resend countdown — interval only ticks while the dialog is open.
  // The initial reset lives in openOtpDialog to avoid a setState in the effect body.
  useEffect(() => {
    if (!showOtp) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [showOtp]);

  const openOtpDialog = useCallback(() => {
    setOtpDigits(['', '', '', '', '', '']);
    setOtpMessage('');
    setOtpCountdown(59);
    setShowOtp(true);
    window.setTimeout(() => otpRefs.current[0]?.focus(), 50);
  }, []);

  const closeOtpDialog = useCallback(() => {
    setShowOtp(false);
  }, []);

  const handleOtpChange = (index: number, raw: string) => {
    const digit = raw.replace(/[^0-9]/g, '').slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!digits) return;
    e.preventDefault();
    setOtpDigits(Array.from({ length: 6 }, (_, i) => digits[i] || ''));
    otpRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  // There is no SMS provider wired up yet, so the code is accepted without a real
  // server-side challenge. The dialog stays as the intended entry gate and the demo
  // notice is shown so nobody mistakes this for verified authentication.
  const completeOtp = useCallback(() => {
    setShowOtp(false);
    if (matchedVehicles.length === 1) {
      selectVehicle(matchedVehicles[0]);
    } else {
      selectVehicle(null);
    }
  }, [matchedVehicles]);

  const handleOtpSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otpDigits.join('').length < 6) {
      setOtpMessage(t('pself.otpIncomplete'));
      return;
    }
    setOtpMessage('');
    completeOtp();
  };

  const handleOtpResend = () => {
    setOtpMessage(t('pself.otpResent'));
    setOtpDigits(['', '', '', '', '', '']);
    setOtpCountdown(59);
    otpRefs.current[0]?.focus();
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = normalizePhone(phoneNumber);
    if (cleanQuery.length < 9) {
      setErrorMessage(t('pself.phoneError'));
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
                rating: 0,
                reviewCount: 0,
                isVerified: false,
                images: [],
                zoneRates: undefined,
                location: lead.routes || t('dss.locationFallback'),
                popularRoutes: [],
                amenities: [],
                description: t('dss.leadDescription', {
                  name: lead.driverName,
                  status: lead.status === 'verified' ? t('dss.statusVerified') : t('dss.statusPending'),
                }),
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
      setHasSearched(true);
      if (matches.length > 0) {
        openOtpDialog();
      } else {
        selectVehicle(null);
      }
    } catch {
      setErrorMessage(t('dss.errSearchFailed'));
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
          ...(selectedVehicle.zoneRates || {}),
          ...(cityRate !== '' ? { city: Number(cityRate) } : {}),
          ...(highHillRate !== '' ? { highHill: Number(highHillRate) } : {}),
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
        if (!res.ok) throw new Error(t('dss.errSaveFailed'));
      } else {
        const res = await fetch('/api/vehicles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedVehicle.id, ...updatedData }),
        });
        if (!res.ok) throw new Error(t('dss.errSaveFailed'));
      }

      setSaveSuccess(true);
      window.dispatchEvent(new CustomEvent('tripdee-vehicles-updated'));
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setErrorMessage((err as Error).message || t('dss.errSaveUnknown'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

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
        className="relative flex flex-col w-full max-w-4xl max-h-[92vh] sm:max-h-[92vh] overflow-y-auto rounded-3xl bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-800 shadow-2xl text-ink-primary dark:text-slate-100"
      >
        {/* Header Bar */}
        <div className="sticky top-0 z-30 bg-paper-elevated/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-border-subtle dark:border-slate-800">
          <div className="px-space-lg py-space-md flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-md min-w-0">
              <span className="w-10 h-10 bg-navy-deep flex items-center justify-center text-amber-accent flex-shrink-0">
                <span className="material-symbols-outlined text-[24px]">airport_shuttle</span>
              </span>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-space-xs flex-wrap">
                  <h2 className="font-headline-md text-headline-md text-ink-primary dark:text-white font-bold tracking-tight">
                    {t('pself.title')}{' '}
                    <span className="font-body-base text-body-base text-ink-secondary dark:text-slate-400 font-normal">
                      {t('pself.titleSuffix')}
                    </span>
                  </h2>
                </div>
                <p className="font-body-subtext text-body-subtext text-ink-secondary dark:text-slate-400 truncate">
                  {t('pself.subtitle')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={t('auth.close')}
              className="w-9 h-9 flex items-center justify-center text-ink-secondary dark:text-slate-400 hover:text-ink-primary dark:hover:text-white hover:bg-paper-surface-muted dark:hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Tri-colour brand accent rule */}
          <div className="h-0.5 w-full flex" aria-hidden="true">
            <div className="w-1/3 bg-navy-deep" />
            <div className="w-1/3 bg-amber-accent" />
            <div className="w-1/3 bg-line-green" />
          </div>
        </div>

        <div className="p-space-sm sm:p-space-md lg:p-space-lg space-y-space-md sm:space-y-space-lg">
          {/* STEP 1: Phone Search Lookup if no vehicle selected */}
          {!selectedVehicle && (
            <div className="max-w-lg mx-auto">
              {/* Layered hero mark: soft ring + navy disc + live bolt badge */}
              <div className="flex flex-col items-center text-center space-y-space-md">
                <div className="relative flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-blue-subtle dark:bg-blue-950 flex items-center justify-center shadow-inner">
                    <div className="w-14 h-14 rounded-full bg-navy-deep flex items-center justify-center">
                      <span className="material-symbols-outlined text-[28px] text-blue-subtle">
                        phone_in_talk
                      </span>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-line-green flex items-center justify-center text-on-primary shadow-sm">
                    <span className="material-symbols-outlined text-[14px]">bolt</span>
                  </div>
                </div>

                <div className="space-y-space-xs">
                  <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-ink-primary dark:text-white leading-tight tracking-tight">
                    {t('pself.searchTitle')}
                  </h3>
                  <p className="font-body-base text-body-base text-ink-secondary dark:text-slate-400 leading-relaxed">
                    {t('pself.searchDesc')}
                    <br className="hidden sm:inline" />{' '}
                    {t('pself.searchDescAlt')}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSearch} className="mt-space-xl space-y-space-lg">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label
                      htmlFor="dss-phone-lookup"
                      className="font-label-badge text-label-badge text-ink-secondary dark:text-slate-300 uppercase tracking-wider"
                    >
                      {t('pself.phoneLabel')}
                    </label>
                    <span className="flex items-center gap-1 font-body-subtext text-body-subtext text-sun font-semibold">
                      <span className="material-symbols-outlined text-[14px]">lock</span>
                      {t('pself.noPassword')}
                    </span>
                  </div>

                  <div className="relative flex items-center bg-paper-surface-muted dark:bg-slate-800 focus-within:bg-paper-elevated dark:focus-within:bg-slate-700 focus-within:shadow-md transition-all">
                    <div className="flex items-center pl-space-md pr-space-sm gap-space-xs text-ink-secondary dark:text-slate-300 select-none">
                      <span className="material-symbols-outlined text-[20px] text-ink-muted dark:text-slate-400">
                        call
                      </span>
                      <span className="font-body-base text-body-base font-bold text-ink-primary dark:text-white">
                        +66
                      </span>
                      <div className="h-4 w-px bg-border-strong dark:bg-slate-600 ml-space-xs" />
                    </div>
                    <input
                      id="dss-phone-lookup"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={10}
                      required
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 10));
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder={t('pself.phonePh')}
                      className="w-full h-12 bg-transparent pr-space-md py-space-sm font-headline-md text-headline-md text-ink-primary dark:text-white placeholder:text-ink-muted dark:placeholder:text-slate-500 focus:outline-none tracking-wide"
                    />
                    {phoneNumber.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneNumber('');
                          setErrorMessage('');
                          document.getElementById('dss-phone-lookup')?.focus();
                        }}
                        aria-label={t('pself.clearInput')}
                        className="pr-space-md text-ink-muted dark:text-slate-400 hover:text-ink-primary dark:hover:text-white shrink-0 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">cancel</span>
                      </button>
                    )}
                  </div>
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="flex items-center gap-1 pt-1 font-body-subtext text-body-subtext text-berry-deep dark:text-berry font-semibold"
                  >
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full h-12 bg-navy-deep hover:bg-navy-surface active:bg-black disabled:opacity-60 disabled:cursor-not-allowed text-on-primary font-body-base text-body-base flex items-center justify-center gap-space-sm transition-all duration-150 shadow-md group"
                >
                  {isSearching ? (
                    <>
                      <span className="material-symbols-outlined text-[20px] animate-spin">
                        progress_activity
                      </span>
                      <span>{t('pself.checkingDb')}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                        search
                      </span>
                      <span className="tracking-wide">{t('pself.searchBtn')}</span>
                      <span className="material-symbols-outlined text-[18px] opacity-70 group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Register + support callouts */}
              <div className="pt-space-xs flex flex-col items-center gap-space-sm text-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenRegisterModal) onOpenRegisterModal();
                  }}
                  className="group inline-flex items-center gap-1.5 font-body-base text-body-base text-ink-primary dark:text-white hover:text-amber-accent transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-amber-accent">
                    person_add
                  </span>
                  <span>
                    {t('pself.registerPrompt')}{' '}
                    <strong className="underline decoration-amber-accent underline-offset-4">
                      {t('pself.registerCtaShort')}
                    </strong>
                  </span>
                </button>

                <div className="flex flex-wrap items-center justify-center gap-space-md text-ink-muted dark:text-slate-400 font-body-subtext text-body-subtext">
                  <span>{t('pself.helpPrompt')}</span>
                  <button
                    type="button"
                    onClick={() => window.open('https://line.me/R/ti/p/@tripdee', '_blank', 'noopener,noreferrer')}
                    className="inline-flex items-center gap-1 font-label-badge text-label-badge text-line-green hover:underline cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                    <span>{t('pself.helpLine')}</span>
                  </button>
                </div>
              </div>

              {hasSearched && matchedVehicles.length === 0 && (
                <div
                  role="status"
                  className="mt-space-md p-space-sm bg-sun-soft dark:bg-amber-950/30 text-on-tertiary-fixed-variant dark:text-amber-300 text-body-subtext font-bold text-center"
                >
                  {t('pself.notFound')}
                </div>
              )}

              {matchedVehicles.length > 1 && (
                <div className="mt-space-md space-y-space-xs">
                  <h4 className="font-body-base text-body-base font-semibold text-ink-primary dark:text-white text-center">
                    {t('pself.pickTitle', { n: matchedVehicles.length })}
                  </h4>
                  <div className="space-y-2">
                    {matchedVehicles.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => selectVehicle(v)}
                        className="w-full p-3 bg-paper-elevated dark:bg-slate-800 hover:bg-blue-subtle dark:hover:bg-slate-700 transition-all text-left flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-ink-primary dark:text-white truncate">
                            {v.title}
                          </div>
                          <div className="text-xs text-ink-muted dark:text-slate-400 truncate">
                            {v.location}
                          </div>
                        </div>
                        <span className="text-blue-action font-bold text-xs shrink-0">
                          {t('pself.pickBtn')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trust bar */}
              <div className="mt-space-lg bg-paper-surface-muted dark:bg-slate-800/60 p-space-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                  {[
                    { icon: 'security', tone: 'text-ink-primary dark:text-white', title: t('pself.trust1Title'), desc: t('pself.trust1Desc') },
                    { icon: 'schedule', tone: 'text-sun', title: t('pself.trust2Title'), desc: t('pself.trust2Desc') },
                    { icon: 'payments', tone: 'text-line-green', title: t('pself.trust3Title'), desc: t('pself.trust3Desc') },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-space-sm">
                      <div
                        className={`w-7 h-7 bg-paper-elevated dark:bg-slate-700 flex items-center justify-center flex-shrink-0 shadow-sm ${item.tone}`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <span className="font-label-badge text-label-badge text-ink-primary dark:text-white block">
                          {item.title}
                        </span>
                        <span className="font-body-subtext text-body-subtext text-ink-secondary dark:text-slate-400 block">
                          {item.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance footer strip */}
              <div className="mt-space-sm bg-blue-subtle dark:bg-slate-800 px-space-lg py-space-sm flex flex-col sm:flex-row items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-xs text-ink-muted dark:text-slate-400 font-body-subtext text-body-subtext">
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  <span>{t('pself.footerCompliance')}</span>
                </div>
                <div className="flex items-center gap-space-sm font-body-subtext text-body-subtext text-ink-secondary dark:text-slate-300">
                  <span className="inline-block w-2 h-2 rounded-full bg-line-green animate-pulse" />
                  <span>{t('pself.gatewayOnline')}</span>
                </div>
              </div>
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
              <div className="w-full bg-navy-deep text-on-primary p-space-md sm:p-space-lg rounded-2xl relative overflow-hidden shadow-md space-y-space-md">
                <div className="absolute -right-16 -top-16 w-96 h-96 rounded-full bg-blue-action/10 blur-3xl pointer-events-none" />
                <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-amber-accent/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md lg:gap-space-lg">
                  <div className="flex items-center gap-space-sm sm:gap-space-md min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-blue-subtle text-blue-action font-bold flex items-center justify-center text-2xl sm:text-3xl shadow-md border-2 border-white/20">
                        {selectedVehicle.driverNickname.charAt(0) || t('dss.avatarFallback')}
                      </div>
                      <span className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-verified-emerald flex items-center justify-center text-on-primary shadow-sm ring-2 ring-navy-deep">
                        <span className="material-symbols-outlined text-[13px] sm:text-[16px]">verified</span>
                      </span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-space-2xs">
                        <h3 className="font-headline-xl text-headline-lg sm:text-headline-xl text-surface font-bold tracking-tight">
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
                      className="px-space-md py-space-sm rounded-2xl bg-gradient-to-r from-gold via-sun to-gold hover:brightness-105 text-surface font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
                      <span>{t('ecard.myBtn')}</span>
                    </button>

                    {/* Real-time Status Switcher */}
                    <div className="flex flex-col sm:flex-row sm:items-center bg-paper-elevated dark:bg-slate-800 text-ink-primary dark:text-white p-space-sm rounded-2xl shadow-lg justify-between gap-space-sm sm:gap-space-md border border-border-subtle dark:border-slate-700 w-full sm:w-auto">
                      <div className="flex items-center gap-space-sm">
                        <span
                          className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                            isAvailable ? 'bg-verified-emerald animate-pulse' : 'bg-berry'
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

                      <div className="flex items-center gap-space-2xs bg-paper-surface-muted dark:bg-slate-900 p-1 rounded-xl w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setIsAvailable(true)}
                          className={`flex-1 sm:flex-none px-space-sm sm:px-space-md py-space-xs rounded-lg font-body-medium text-body-medium transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            isAvailable
                              ? 'bg-line-green text-surface shadow-sm font-bold'
                              : 'text-ink-secondary dark:text-slate-400 hover:text-navy-deep dark:hover:text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px] shrink-0">
                            radio_button_checked
                          </span>
                          <span className="truncate">{t('pself.availOn')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAvailable(false)}
                          className={`flex-1 sm:flex-none px-space-sm sm:px-space-md py-space-xs rounded-lg font-body-medium text-body-medium transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            !isAvailable
                              ? 'bg-berry-deep text-surface shadow-sm font-bold'
                              : 'text-ink-secondary dark:text-slate-400 hover:text-navy-deep dark:hover:text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px] shrink-0">block</span>
                          <span className="truncate">{t('pself.availOff')}</span>
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
                      {t('dss.deltaWeek', { n: 3 })}
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
                      {selectedVehicle.rating > 0 ? selectedVehicle.rating : '—'} <span className="text-amber-accent font-bold">★</span>
                    </span>
                    <span className="font-label-badge text-label-badge text-ink-muted dark:text-slate-400">
                      {selectedVehicle.reviewCount > 0
                        ? t('dss.reviewsFrom', { n: selectedVehicle.reviewCount })
                        : t('detail.noReviews')}
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
                      {t('dss.deltaWeek', { n: 18 })}
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
              <div className="bg-paper-canvas dark:bg-slate-800/60 p-space-sm sm:p-space-lg rounded-2xl border border-border-subtle dark:border-slate-700">
                <DriverAvailabilityCalendar
                  busyDates={busyDates}
                  onChange={handleBusyDatesChange}
                />
              </div>

              {/* Vehicle Fleet Settings & Pricing Form */}
              <form onSubmit={handleSave} className="bg-paper-canvas dark:bg-slate-800/60 p-space-sm sm:p-space-lg rounded-2xl border border-border-subtle dark:border-slate-700 space-y-space-md">
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
                            ? 'bg-taxi-yellow-soft border-amber-accent text-on-tertiary-fixed-variant font-bold shadow-xs'
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
                      onChange={(e) => setCityRate(e.target.value === '' ? '' : Number(e.target.value))}
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
                      onChange={(e) => setHighHillRate(e.target.value === '' ? '' : Number(e.target.value))}
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
                <div className="p-space-sm rounded-xl bg-paper-elevated dark:bg-slate-800 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
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
                    className="w-5 h-5 shrink-0 self-start sm:self-auto text-blue-action rounded focus:ring-blue-action cursor-pointer"
                  />
                </div>

                {saveSuccess && (
                  <div className="p-3 bg-verified-emerald-soft text-verified-emerald rounded-xl font-body-medium flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>{t('pself.saved')}</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3 bg-berry-soft text-berry-deep dark:text-berry rounded-xl font-body-medium flex items-center gap-2">
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
                    throw new Error(t('dss.errDeleteVehicle'));
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

        {/* ============================================================== */}
        {/* OTP VERIFICATION GATE                                         */}
        {/* Demo pass-through: no SMS provider is connected yet, so any    */}
        {/* complete 6-digit entry is accepted. Replace completeOtp with a */}
        {/* real server verification call before enabling this in production. */}
        {/* ============================================================== */}
        {showOtp && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dss-otp-title"
            className="fixed inset-0 z-500 flex items-center justify-center bg-navy-deep/70 dark:bg-black/80 backdrop-blur-sm p-space-md animate-fade-in"
            onClick={closeOtpDialog}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-paper-elevated dark:bg-slate-900 shadow-2xl p-space-xl space-y-space-lg"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-space-sm min-w-0">
                  <div className="w-8 h-8 bg-verified-emerald-soft text-line-green flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">sms</span>
                  </div>
                  <div className="min-w-0">
                    <h3
                      id="dss-otp-title"
                      className="font-headline-md text-headline-md text-ink-primary dark:text-white font-bold"
                    >
                      {t('pself.otpTitle')}
                    </h3>
                    <span className="font-body-subtext text-body-subtext text-ink-secondary dark:text-slate-400">
                      {t('pself.otpSent')}{' '}
                      <span className="font-bold text-ink-primary dark:text-white">
                        {normalizePhone(phoneNumber).replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}
                      </span>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeOtpDialog}
                  aria-label={t('pself.otpClose')}
                  className="text-ink-muted dark:text-slate-400 hover:text-ink-primary dark:hover:text-white shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-space-md">
                <div className="flex justify-between gap-2">
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      aria-label={`${t('pself.otpTitle')} ${i + 1}`}
                      className="w-12 h-14 text-center font-display text-2xl font-extrabold bg-paper-surface-muted dark:bg-slate-800 focus:bg-paper-elevated dark:focus:bg-slate-700 focus:shadow-md focus:outline-none"
                    />
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 font-body-subtext text-body-subtext text-ink-secondary dark:text-slate-400">
                  <span>
                    {t('pself.otpResendIn')}{' '}
                    <strong className="text-sun font-mono">
                      00:{String(otpCountdown).padStart(2, '0')}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleOtpResend}
                    className="text-ink-primary dark:text-white hover:underline font-semibold cursor-pointer"
                  >
                    {t('pself.otpResend')}
                  </button>
                </div>

                <p className="flex items-start gap-1.5 text-[11px] leading-snug text-ink-muted dark:text-slate-400">
                  <span className="material-symbols-outlined text-[14px] shrink-0 mt-px">
                    info
                  </span>
                  <span>{t('pself.otpDemoNotice')}</span>
                </p>

                {otpMessage && (
                  <div
                    role="alert"
                    className="flex items-center gap-1 font-body-subtext text-body-subtext font-semibold text-berry-deep dark:text-berry"
                  >
                    <span className="material-symbols-outlined text-[14px] shrink-0">error</span>
                    <span>{otpMessage}</span>
                  </div>
                )}

                <div className="flex items-center gap-space-sm">
                  <button
                    type="button"
                    onClick={completeOtp}
                    className="text-body-subtext text-body-subtext text-ink-secondary dark:text-slate-400 hover:underline cursor-pointer"
                  >
                    {t('pself.otpSkip')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-12 bg-navy-deep hover:bg-navy-surface text-on-primary font-body-base text-body-base flex items-center justify-center gap-space-sm shadow-md transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>{t('pself.otpSubmit')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
