'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import type { DictKey } from '@/i18n/dictionaries';
import {
  ShieldCheck,
  PartyPopper,
  CarFront,
  Loader2,
  ArrowLeft,
  Receipt,
  Upload,
  Sparkles,
  Lock,
  MessageCircle,
} from 'lucide-react';
import { VEHICLE_CATEGORY_GROUPS } from '@/data/vehicleModels';
import type { Vehicle } from '@/data/mockData';

interface DriverRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles?: Vehicle[];
}

const AMENITY_KEYS = [
  'reg.amMassageSeat',
  'reg.amWifi',
  'reg.amInsurance',
  'reg.amWater',
  'reg.amKaraoke',
  'reg.amCharge',
] as const;

export const DriverRegisterModal: React.FC<DriverRegisterModalProps> = ({
  isOpen,
  onClose,
  vehicles,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, { onClose, enabled: isOpen });
  const { t } = useLanguage();
  const { user, loginWithCredentials, loginWithOAuth, updateDriverProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fetchedVehicles, setFetchedVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    if (vehicles && vehicles.length > 0) return;
    if (!isOpen) return;

    let cancelled = false;
    fetch('/api/vehicles')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (Array.isArray(data.vehicles)) {
          setFetchedVehicles(data.vehicles);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isOpen, vehicles]);

  const activeVehicles = vehicles && vehicles.length > 0 ? vehicles : fetchedVehicles;

  const fleetStats = useMemo(() => {
    if (!activeVehicles || activeVehicles.length === 0) return null;

    const driverSet = new Set<string>();
    activeVehicles.forEach((v) => {
      const key = (v.driverPhone || '').replace(/\D/g, '') || v.driverName || v.id;
      if (key) driverSet.add(key);
    });

    const count = driverSet.size || activeVehicles.length;

    const regionSet = new Set(activeVehicles.map((v) => v.region).filter(Boolean));
    const hubs: { code: string; label: string }[] = [];
    if (regionSet.has('north')) hubs.push({ code: 'CNX', label: 'เชียงใหม่' });
    if (regionSet.has('central')) hubs.push({ code: 'BKK', label: 'กรุงเทพฯ' });
    if (regionSet.has('south')) hubs.push({ code: 'HKT', label: 'ภูเก็ต' });
    if (regionSet.has('east')) hubs.push({ code: 'PTY', label: 'พัทยา' });
    if (regionSet.has('isan')) hubs.push({ code: 'KOR', label: 'อีสาน' });

    return {
      driverCount: count,
      vehicleCount: activeVehicles.length,
      hubs: hubs.length > 0 ? hubs : [
        { code: 'CNX', label: 'เชียงใหม่' },
        { code: 'BKK', label: 'กรุงเทพฯ' },
        { code: 'HKT', label: 'ภูเก็ต' },
      ],
    };
  }, [activeVehicles]);

  const [formData, setFormData] = useState({
    serviceType: 'with_driver' as 'with_driver' | 'self_drive',
    driverName: '',
    nickname: '',
    phone: '',
    lineId: '',
    whatsapp: '',
    wechat: '',
    kakao: '',
    serviceHub: 'CHIANG_MAI',
    vehicleModel: 'Toyota Commuter D4D (หลังคาสูง 9-13 ที่นั่ง)',
    seats: '10',
    plateType: 'yellow' as 'yellow' | 'blue',
    plateNumber: '',
    canIssueTaxInvoice: true,
    amenities: ['reg.amWifi', 'reg.amInsurance'] as string[],
    pickupLocation: '',
    depositTerms: '',
  });

  // 3 Mandatory verification files for direct drivers
  const [driverLicenseFile, setDriverLicenseFile] = useState<File | null>(null);
  const [vehicleRegistrationFile, setVehicleRegistrationFile] = useState<File | null>(null);
  const [driverWithCarFile, setDriverWithCarFile] = useState<File | null>(null);
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelText, setCustomModelText] = useState('');
  const [showSpecRef, setShowSpecRef] = useState(false);

  // Shared step-1 field + required-label styling (matches reference)
  const fieldCls =
    'h-11 px-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-950 dark:text-white text-sm placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none rounded-none transition-colors w-full font-medium';
  const reqLabel = (text: string) => (
    <>
      {text.replace(/\s*\*$/, '')} <span className="text-[#ba1a1a]">*</span>
    </>
  );

  // Honeypot anti-spam fields
  const [hpWebsite, setHpWebsite] = useState('');
  const [formMountedAt, setFormMountedAt] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      setFormMountedAt(Date.now());
      setHpWebsite('');
      setCurrentStep(1);
      setSubmitted(false);
    });
  }, [isOpen]);

  // Autofill from active logged-in driver session
  useEffect(() => {
    if (!isOpen || !user || user.role !== 'driver') return;
    setFormData((prev) => ({
      ...prev,
      driverName: prev.driverName || user.name || '',
      nickname: prev.nickname || user.driverNickname || user.name || '',
      phone: prev.phone || (user.emailOrPhone && !user.emailOrPhone.includes('@') ? user.emailOrPhone : ''),
      lineId: prev.lineId || user.lineId || '',
      whatsapp: prev.whatsapp || user.whatsapp || '',
      wechat: prev.wechat || user.wechat || '',
      kakao: prev.kakao || user.kakao || '',
      vehicleModel:
        prev.vehicleModel === 'Toyota Commuter' && user.vehicleTitle
          ? user.vehicleTitle
          : prev.vehicleModel,
      plateNumber: prev.plateNumber || user.vehiclePlate || '',
      seats: user.seats ? String(user.seats) : prev.seats,
    }));
  }, [isOpen, user]);

  if (!isOpen) return null;

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.driverName.trim() || !formData.phone.trim() || !formData.lineId.trim()) {
        alert(t('reg.errContact'));
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!driverLicenseFile || !vehicleRegistrationFile || !driverWithCarFile) {
        alert('กรุณาอัปโหลดเอกสารยืนยันตัวตนให้ครบทั้ง 3 รายการ (ใบขับขี่, เล่มทะเบียนรถ, และภาพถ่ายคู่กับตัวรถ/ป้ายทะเบียน) เพื่อป้องกันคนกลาง');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrev = () => {
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalModel = isCustomModel && customModelText.trim() ? customModelText.trim() : formData.vehicleModel;
    const finalNickname = formData.nickname.trim() || formData.driverName.trim();

    try {
      const res = await fetch('/api/leads/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: user?.id || undefined,
          driverName: formData.driverName.trim(),
          nickname: finalNickname,
          phone: formData.phone.trim(),
          lineId: formData.lineId.trim(),
          whatsapp: formData.whatsapp.trim() || undefined,
          wechat: formData.wechat.trim() || undefined,
          kakao: formData.kakao.trim() || undefined,
          vehicleModel: finalModel,
          seats: formData.seats,
          plateType: formData.plateType,
          plateNumber: formData.plateNumber.trim(),
          canIssueTaxInvoice: formData.canIssueTaxInvoice,
          businessType: formData.canIssueTaxInvoice ? 'company' : 'individual',
          routes: formData.serviceHub,
          amenities: formData.amenities.map((key) => t(key as DictKey)).join(', '),
          pickupLocation: formData.pickupLocation,
          depositTerms: formData.depositTerms,
          hp_website: hpWebsite,
          _hp_timestamp: formMountedAt,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || t('reg.errRegister'));
        return;
      }

      const resData = await res.json().catch(() => ({}));
      const leadId = resData.lead?.id || `drv-${Date.now()}`;

      // If user is already logged in as driver, update their profile; otherwise log them in
      if (user && user.role === 'driver') {
        updateDriverProfile({
          driverNickname: finalNickname,
          vehicleTitle: finalModel,
          vehiclePlate: formData.plateNumber.trim() || undefined,
          seats: Number(formData.seats) || 9,
          lineId: formData.lineId.trim() || undefined,
          whatsapp: formData.whatsapp.trim() || undefined,
          wechat: formData.wechat.trim() || undefined,
          kakao: formData.kakao.trim() || undefined,
          verificationStatus: 'pending',
        });
      } else {
        loginWithCredentials(
          'driver',
          finalNickname,
          formData.phone.trim(),
          {
            id: leadId,
            driverNickname: finalNickname,
            vehicleTitle: finalModel,
            vehiclePlate: formData.plateNumber.trim() || undefined,
            seats: Number(formData.seats) || 9,
            isAvailable: true,
            verificationStatus: 'pending',
          }
        );
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Submit driver error:', err);
      alert(t('reg.errNetwork'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 lg:p-10 animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('reg.aria')}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-none shadow-2xl overflow-hidden flex flex-col my-auto transition-all border border-slate-300 dark:border-slate-700"
      >
        {/* Top Bar / Live Status */}
        <div className="bg-slate-900 px-5 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs text-slate-200 truncate">
              เปิดรับสมัครพันธมิตรคนขับทั่วประเทศ: เชียงใหม่ ภูเก็ต กทม. พัทยา สมุย
            </span>
            <span className="hidden md:inline-flex bg-amber-500 text-slate-950 text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider shrink-0">
              ดีลตรงคนขับ ไม่ผ่านคนกลาง
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('auth.close')}
            className="text-slate-400 hover:text-white transition-colors p-1 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Main Modal Shell: Asymmetric Grid with Left Perks Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 w-full">
          {/* Left Side: Trust & Operator Perks Briefing */}
          <div className="lg:col-span-5 bg-[#F8FAFC] dark:bg-slate-900 p-6 sm:p-8 flex flex-col justify-between space-y-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
            <div className="space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-1 bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-[10px] tracking-wider font-bold">
                    TripDee Partner Club
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-bold">
                    {t('show.badgeZero')}
                  </span>
                </div>
                <h2 className="font-display text-[30px] leading-[1.2] font-bold tracking-tight text-slate-950 dark:text-white mt-3">
                  {t('reg.heroTitleA')}
                  <br />
                  <span className="text-[#fea619] bg-slate-900 dark:bg-amber-500 dark:text-slate-950 px-2 py-0.5 inline-block mt-1">
                    {t('reg.heroTitleB')}
                  </span>
                </h2>
                <p className="text-sm font-normal text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                  {t('reg.heroDesc')}
                </p>
              </div>

              {/* Perk List */}
              <div className="space-y-3">
                <div className="flex items-start gap-3.5 p-3.5 rounded-none bg-white dark:bg-slate-900 shadow-2xs border border-slate-200 dark:border-slate-800 hover:border-slate-400 transition-colors">
                  <div className="h-9 w-9 bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900">
                    <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-950 dark:text-white">{t('reg.perk1Title')}</p>
                    <p className="text-xs font-normal text-slate-600 dark:text-slate-400 mt-0.5">{t('reg.perk1Desc')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-none bg-white dark:bg-slate-900 shadow-2xs border border-slate-200 dark:border-slate-800 hover:border-slate-400 transition-colors">
                  <div className="h-9 w-9 bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-[#D97706] dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900">
                    <span className="material-symbols-outlined text-[20px]">tune</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-950 dark:text-white">{t('reg.perk2Title')}</p>
                    <p className="text-xs font-normal text-slate-600 dark:text-slate-400 mt-0.5">{t('reg.perk2Desc')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-none bg-white dark:bg-slate-900 shadow-2xs border border-slate-200 dark:border-slate-800 hover:border-slate-400 transition-colors">
                  <div className="h-9 w-9 bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900">
                    <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-950 dark:text-white">{t('reg.perk3Title')}</p>
                    <p className="text-xs font-normal text-slate-600 dark:text-slate-400 mt-0.5">{t('reg.perk3Desc')}</p>
                  </div>
                </div>
              </div>

              {/* Guarantee Notice */}
              <div className="bg-[#FEF3C7] dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 p-3 flex items-center gap-2.5 rounded-none">
                <span className="material-symbols-outlined text-[#D97706] dark:text-amber-400 text-[20px] shrink-0">verified_user</span>
                <span className="text-xs text-slate-800 dark:text-amber-200 font-medium">
                  {t('reg.noLockNote')}
                </span>
              </div>
            </div>

            {/* Bottom Trust Metric Box */}
            <div className="mt-6 bg-slate-900 text-white p-4 border border-slate-950 rounded-none">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">พันธมิตรคนขับ</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[11px] px-2 py-0.5 border border-emerald-500/30 font-bold">
                  {fleetStats && fleetStats.driverCount > 0
                    ? t('reg.proofCount', { count: fleetStats.driverCount })
                    : t('reg.proofFallback')}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                {(
                  fleetStats?.hubs || [
                    { code: 'CNX', label: 'เชียงใหม่' },
                    { code: 'BKK', label: 'กรุงเทพฯ' },
                    { code: 'HKT', label: 'ภูเก็ต' },
                  ]
                ).map((hub: { code: string; label: string }, idx: number) => (
                  <React.Fragment key={hub.code}>
                    {idx > 0 && <span>•</span>}
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#06C755]" />
                      {hub.code} {hub.label}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Progressive 3-Step Wizard Form */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6 overflow-y-auto max-h-[85vh]">
            {/* Header & Step Tabs */}
            <div>
              <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h1 className="text-[22px] font-bold tracking-tight text-slate-950 dark:text-white">
                    {t('reg.title')}
                  </h1>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {t('reg.stepCount', { n: submitted ? 3 : currentStep })}
                  </span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>{t('reg.subtitle')} • {t('reg.twoMin')}</span>
                </p>
                {/* Step Progress Indicators */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className={`px-3 py-2 text-center border text-xs transition-all ${
                      currentStep === 1
                        ? 'bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-slate-950 dark:border-white font-bold'
                        : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 font-medium hover:border-slate-400'
                    }`}
                  >
                    <span className="block truncate">{t('reg.step1Title')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (formData.driverName && formData.phone) setCurrentStep(2);
                    }}
                    className={`px-3 py-2 text-center border text-xs transition-all ${
                      currentStep === 2
                        ? 'bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-slate-950 dark:border-white font-bold'
                        : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 font-medium hover:border-slate-400'
                    }`}
                  >
                    <span className="block truncate">{t('reg.step2Title')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (formData.driverName && formData.phone) setCurrentStep(3);
                    }}
                    className={`px-3 py-2 text-center border text-xs transition-all ${
                      currentStep === 3
                        ? 'bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-slate-950 dark:border-white font-bold'
                        : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 font-medium hover:border-slate-400'
                    }`}
                  >
                    <span className="block truncate">{t('reg.step3Title')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Submitted Success Screen */}
            {submitted ? (
              <div className="py-10 text-center space-y-4">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-none bg-emerald-500 text-white shadow-md border border-emerald-600">
                  <PartyPopper className="h-8 w-8" />
                </div>
                <h3 className="font-display text-2xl font-extrabold text-ink">
                  {t('reg.successTitle')}
                </h3>
                <p className="mx-auto max-w-[45ch] text-xs sm:text-sm font-medium leading-relaxed text-ink-2">
                  {t('reg.successDesc')}
                </p>
                <div className="pt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setCurrentStep(1);
                    }}
                    className="py-2.5 px-5 rounded-none bg-paper-2 hover:bg-card border border-rule text-xs font-bold text-ink transition-all cursor-pointer"
                  >
                    {t('reg.successAddMore')}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2.5 px-5 rounded-none bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
                  >
                    {t('reg.successDone')}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 relative">
                {/* Honeypot Spam Trap */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: '-9999px',
                    top: '-9999px',
                    opacity: 0,
                    height: 0,
                    width: 0,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                  }}
                  tabIndex={-1}
                >
                  <label htmlFor="driver-hp-website">Website (leave blank)</label>
                  <input
                    type="text"
                    id="driver-hp-website"
                    name="hp_website"
                    value={hpWebsite}
                    onChange={(e) => setHpWebsite(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {/* STEP 1: Personal & Service Hub Info */}
                {currentStep === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    {/* 1-Click Social Connect Bar (Bauhaus Unified Account Binding) */}
                    {user && user.role === 'driver' ? (
                      <div className="border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                            ✓
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                                เชื่อมต่อบัญชีคนขับแล้ว
                              </span>
                              <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 px-1.5 py-0.5 font-bold">
                                {user.id.startsWith('line_') ? 'LINE' : user.id.startsWith('google_') ? 'Google' : 'TripDee'}
                              </span>
                            </div>
                            <p className="text-sm font-black text-slate-950 dark:text-white">
                              {user.name} {user.emailOrPhone ? `(${user.emailOrPhone})` : ''}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              ข้อมูลรถจะถูกผูกกับบัญชีนี้โดยอัตโนมัติ เพื่อให้ท่านเข้าสู่ระบบและจัดการงานได้ทันที
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-center shrink-0">
                          พร้อมผูกข้อมูลรถ
                        </span>
                      </div>
                    ) : (
                      <div className="border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                            เข้าสู่ระบบหรือเชื่อมต่อด่วนด้วย LINE / Google (แนะนำ)
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/40">
                            1-Click
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                          เชื่อมต่อ LINE เพื่อรับแจ้งเตือนงานหรือ Google เพื่อซิงค์ข้อมูล — ระบบจะช่วยดึงชื่อและรูปโปรไฟล์ให้อัตโนมัติ ไม่ต้องจำรหัสผ่าน
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => loginWithOAuth('line', 'driver')}
                            className="h-10 px-3 bg-[#06C755] hover:bg-[#05B04B] text-white text-xs font-black flex items-center justify-center gap-2 transition-colors cursor-pointer"
                          >
                            <MessageCircle className="h-4 w-4 fill-white" />
                            <span>เชื่อมต่อด้วย LINE</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => loginWithOAuth('google', 'driver')}
                            className="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:border-slate-950 dark:hover:border-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                            </svg>
                            <span>เชื่อมต่อด้วย Google</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          {reqLabel(t('reg.fContactName'))}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={t('reg.fContactNamePh')}
                          value={formData.driverName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              driverName: e.target.value,
                              nickname: e.target.value,
                            })
                          }
                          className={fieldCls}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          {reqLabel(t('reg.fMobile'))}
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder={t('reg.fMobilePh')}
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className={`${fieldCls} font-mono`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          {reqLabel(t('reg.fLineId'))}
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-emerald-600 font-bold text-xs flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-[16px]">chat</span>
                          </span>
                          <input
                            type="text"
                            required
                            placeholder={t('reg.fLineIdPh')}
                            value={formData.lineId}
                            onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                            className={`${fieldCls} pl-9 font-mono`}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          {reqLabel(t('reg.fHub'))}
                        </label>
                        <div className="relative">
                          <select
                            value={formData.serviceHub}
                            onChange={(e) => setFormData({ ...formData, serviceHub: e.target.value })}
                            className={`${fieldCls} appearance-none pr-9 cursor-pointer`}
                            required
                          >
                            <option value="CHIANG_MAI">{t('reg.hubCnx')}</option>
                            <option value="BKK_SUVARNABHUMI">{t('reg.hubBkk')}</option>
                            <option value="PHUKET">{t('reg.hubHkt')}</option>
                            <option value="PATTAYA">{t('reg.hubUty')}</option>
                            <option value="SAMUI">{t('reg.hubUsd')}</option>
                            <option value="KRABI">{t('reg.hubKbi')}</option>
                            <option value="OTHER">{t('reg.hubOther')}</option>
                          </select>
                          <span className="material-symbols-outlined text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[20px]">
                            expand_more
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* International Messaging Channels (Optional) */}
                    <div className="mt-2 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-950 dark:text-white">
                            {t('reg.intlTitle')}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 whitespace-nowrap">
                            {t('reg.intlRecommended')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {t('reg.intlDesc')}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {/* WhatsApp */}
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-[#06C755]" />
                            <span>WhatsApp (เบอร์โทร)</span>
                          </label>
                          <input
                            type="tel"
                            placeholder={t('reg.intlWhatsappPh')}
                            value={formData.whatsapp}
                            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                            className="h-9 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-950 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 outline-none rounded-none placeholder:text-slate-400 font-mono w-full"
                          />
                        </div>

                        {/* WeChat */}
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-600" />
                            <span>{t('reg.intlWechat')}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({t('reg.intlWechatHint')})</span>
                          </label>
                          <input
                            type="text"
                            placeholder={t('reg.intlIdPh')}
                            value={formData.wechat}
                            onChange={(e) => setFormData({ ...formData, wechat: e.target.value })}
                            className="h-9 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-950 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 outline-none rounded-none placeholder:text-slate-400 font-mono w-full"
                          />
                        </div>

                        {/* KakaoTalk */}
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-amber-500" />
                            <span>KakaoTalk ID</span>
                            <span className="text-[10px] text-slate-400 font-normal">({t('reg.intlKakaoHint')})</span>
                          </label>
                          <input
                            type="text"
                            placeholder={t('reg.intlIdPh')}
                            value={formData.kakao}
                            onChange={(e) => setFormData({ ...formData, kakao: e.target.value })}
                            className="h-9 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-950 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 outline-none rounded-none placeholder:text-slate-400 font-mono w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Real-time Availability System Notice */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3 mt-1 flex items-start gap-2.5 rounded-none">
                      <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-[20px] mt-0.5 shrink-0">schedule</span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                        {t('reg.availNote')}
                      </p>
                    </div>
                  </div>
                )}

                {/* STEP 2: Vehicle Specs, Photos & License Status */}
                {currentStep === 2 && (
                  <div className="space-y-5 animate-fade-in">
                    {/* Vehicle Category Selection */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-ink">{t('reg.fServiceType')}</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label
                          className={`flex items-center gap-3.5 p-3.5 rounded-none border shadow-2xs cursor-pointer transition-all ${
                            formData.serviceType === 'with_driver'
                              ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500'
                              : 'bg-card border-rule hover:bg-paper-2'
                          }`}
                        >
                          <input
                            type="radio"
                            name="vehicle_type"
                            checked={formData.serviceType === 'with_driver'}
                            onChange={() =>
                              setFormData({
                                ...formData,
                                serviceType: 'with_driver',
                                vehicleModel: 'Toyota Commuter D4D (หลังคาสูง 9-13 ที่นั่ง)',
                                plateType: 'yellow',
                              })
                            }
                            className="text-amber-500 focus:ring-amber-500 h-4 w-4"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-ink">
                              <CarFront className="h-4 w-4 text-amber-500" />
                              {t('reg.serviceWithDriver')}
                            </div>
                            <p className="text-[11px] font-medium text-ink-2">Toyota Majesty, Commuter VIP, Alphard</p>
                          </div>
                        </label>

                        <label
                          className={`flex items-center gap-3.5 p-3.5 rounded-none border shadow-2xs cursor-pointer transition-all ${
                            formData.serviceType === 'self_drive'
                              ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500'
                              : 'bg-card border-rule hover:bg-paper-2'
                          }`}
                        >
                          <input
                            type="radio"
                            name="vehicle_type"
                            checked={formData.serviceType === 'self_drive'}
                            onChange={() =>
                              setFormData({
                                ...formData,
                                serviceType: 'self_drive',
                                vehicleModel: 'Toyota Yaris Ativ / Honda City (Sedan Eco Car)',
                                plateType: 'blue',
                              })
                            }
                            className="text-amber-500 focus:ring-amber-500 h-4 w-4"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-ink">
                              <CarFront className="h-4 w-4 text-amber-500" />
                              {t('reg.serviceSelfDrive')}
                            </div>
                            <p className="text-[11px] font-medium text-ink-2">{t('reg.sedanNote')}</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Model & Seats Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-ink">{t('reg.fChooseModel')}</label>
                        <select
                          value={isCustomModel ? 'custom' : formData.vehicleModel}
                          onChange={(e) => {
                            if (e.target.value === 'custom') {
                              setIsCustomModel(true);
                            } else {
                              setIsCustomModel(false);
                              setFormData({ ...formData, vehicleModel: e.target.value });
                            }
                          }}
                          className="w-full px-3.5 py-2.5 rounded-none bg-card border border-rule text-ink text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-2xs"
                        >
                          {VEHICLE_CATEGORY_GROUPS.map((group) => (
                            <optgroup key={group.category} label={group.label}>
                              {group.models.map((model) => (
                                <option key={model} value={model}>
                                  {model}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                          <option value="custom">{t('reg.modelCustom')}</option>
                        </select>

                        {isCustomModel && (
                          <input
                            type="text"
                            required
                            placeholder={t('reg.modelCustomPh')}
                            value={customModelText}
                            onChange={(e) => setCustomModelText(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-none bg-card border border-rule text-ink text-xs mt-1"
                          />
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-ink">รูปแบบและขนาดที่นั่ง</label>
                        <select
                          value={formData.seats}
                          onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-none bg-card border border-rule text-ink text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-2xs"
                        >
                          <option value="10–13">10–13 ที่นั่ง (มาตรฐานเดิมโรงงาน เน้นจุคนครบทั้งแก๊ง)</option>
                          <option value="8–9">8–9 ที่นั่ง (VIP เบาะใหญ่ นั่งสบาย)</option>
                          <option value="7">SUV 7 ที่นั่ง (Fortuner / Everest)</option>
                          <option value="luxury">รถตู้หรูพรีเมียม (Majesty / Staria / Alphard)</option>
                          <option value="sedan">รถเก๋งพร้อมคนขับ (Sedan / City Car)</option>
                        </select>
                      </div>
                    </div>

                    {/* License Plate Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-ink">{t('reg.fPlateType')}</label>
                        <div className="grid grid-cols-2 gap-2">
                          <label
                            className={`flex items-center gap-2 p-2.5 rounded-none border cursor-pointer text-xs font-bold transition-all ${
                              formData.plateType === 'yellow'
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-300 ring-1 ring-amber-500/50'
                                : 'bg-card border-rule text-ink-2'
                            }`}
                          >
                            <input
                              type="radio"
                              name="license_plate"
                              checked={formData.plateType === 'yellow'}
                              onChange={() => setFormData({ ...formData, plateType: 'yellow' })}
                              className="text-amber-500"
                            />
                            <span>{t('reg.plateYellow')}</span>
                          </label>

                          <label
                            className={`flex items-center gap-2 p-2.5 rounded-none border cursor-pointer text-xs font-bold transition-all ${
                              formData.plateType === 'blue'
                                ? 'bg-blue-500/15 border-blue-500/40 text-blue-900 dark:text-blue-300 ring-1 ring-blue-500/50'
                                : 'bg-card border-rule text-ink-2'
                            }`}
                          >
                            <input
                              type="radio"
                              name="license_plate"
                              checked={formData.plateType === 'blue'}
                              onChange={() => setFormData({ ...formData, plateType: 'blue' })}
                              className="text-blue-500"
                            />
                            <span>{t('reg.plateBlue')}</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-ink">{t('reg.fPlateNumber')}</label>
                          <span className="text-[10px] font-bold text-accent">{t('reg.platePrivacy')}</span>
                        </div>
                        <input
                          type="text"
                          placeholder={t('reg.fPlateNumberPh')}
                          value={formData.plateNumber}
                          onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-none bg-card border border-rule text-ink placeholder:text-ink-3 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* 3 Mandatory Verification Proofs */}
                    <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>เอกสารยืนยันตัวตนคนขับ (3 Mandatory Proofs เพื่อป้องกันคนกลาง)</span>
                            <span className="text-red-500">*</span>
                          </label>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            อัปโหลดหลักฐาน 3 รายการเพื่อรับเครื่องหมายยืนยันตัวตน และเริ่มรับงานตรงกับผู้โดยสาร
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* 1. Driver License */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">1. รูปถ่ายใบขับขี่</span>
                            <span className="text-[10px] text-red-500 font-bold">*จำเป็น</span>
                          </div>
                          <input
                            type="file"
                            id="upload-license"
                            accept="image/*,.pdf"
                            className="sr-only"
                            onChange={(e) => {
                              if (e.target.files?.[0]) setDriverLicenseFile(e.target.files[0]);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('upload-license')?.click()}
                            className={`w-full py-2.5 px-3 border border-dashed text-xs font-bold flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                              driverLicenseFile
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-amber-500 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <Upload className="w-4 h-4" />
                            <span className="line-clamp-1">{driverLicenseFile ? driverLicenseFile.name : 'เลือกรูปใบขับขี่'}</span>
                          </button>
                        </div>

                        {/* 2. Vehicle Registration */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">2. เล่มทะเบียนรถ</span>
                            <span className="text-[10px] text-red-500 font-bold">*จำเป็น</span>
                          </div>
                          <input
                            type="file"
                            id="upload-registration"
                            accept="image/*,.pdf"
                            className="sr-only"
                            onChange={(e) => {
                              if (e.target.files?.[0]) setVehicleRegistrationFile(e.target.files[0]);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('upload-registration')?.click()}
                            className={`w-full py-2.5 px-3 border border-dashed text-xs font-bold flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                              vehicleRegistrationFile
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-amber-500 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <Upload className="w-4 h-4" />
                            <span className="line-clamp-1">{vehicleRegistrationFile ? vehicleRegistrationFile.name : 'เลือกรูปเล่มทะเบียน'}</span>
                          </button>
                        </div>

                        {/* 3. Driver with Car & Plate */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">3. ถ่ายคู่กับตัวรถและป้าย</span>
                            <span className="text-[10px] text-red-500 font-bold">*จำเป็น</span>
                          </div>
                          <input
                            type="file"
                            id="upload-driver-car"
                            accept="image/*,.pdf"
                            className="sr-only"
                            onChange={(e) => {
                              if (e.target.files?.[0]) setDriverWithCarFile(e.target.files[0]);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('upload-driver-car')?.click()}
                            className={`w-full py-2.5 px-3 border border-dashed text-xs font-bold flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                              driverWithCarFile
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-amber-500 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <Upload className="w-4 h-4" />
                            <span className="line-clamp-1">{driverWithCarFile ? driverWithCarFile.name : 'เลือกรูปคู่กับรถ'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* STEP 3: Invoicing, Comfort Amenities & Sign-off */}
                {currentStep === 3 && (
                  <div className="space-y-5 animate-fade-in">
                    {/* Tax Compliance Checkbox */}
                    <div className="p-4 rounded-none bg-paper-2 border border-rule flex items-start gap-3.5">
                      <input
                        type="checkbox"
                        id="tax_capable"
                        checked={formData.canIssueTaxInvoice}
                        onChange={(e) => setFormData({ ...formData, canIssueTaxInvoice: e.target.checked })}
                        className="rounded-none border-rule text-amber-500 focus:ring-amber-500 h-5 w-5 mt-0.5 cursor-pointer"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="tax_capable"
                          className="text-xs sm:text-sm font-bold text-ink flex items-center gap-2 cursor-pointer"
                        >
                          <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          {t('reg.taxCompliance')}
                        </label>
                        <p className="text-xs font-medium text-ink-2 mt-0.5">
                          {t('reg.taxComplianceDesc')}
                        </p>
                      </div>
                    </div>

                    {/* Amenity Tag Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-ink">
                        {t('reg.amenitiesTitle')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {AMENITY_KEYS.map((amenity) => {
                          const isSelected = formData.amenities.includes(amenity);
                          return (
                            <button
                              key={amenity}
                              type="button"
                              onClick={() => toggleAmenity(amenity)}
                              className={`px-3 py-1.5 rounded-none text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                  : 'bg-paper-2 text-ink-2 border-rule hover:bg-card hover:text-ink'
                              }`}
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              {t(amenity)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Self-Drive Specific Details */}
                    {formData.serviceType === 'self_drive' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-ink">{t('reg.fPickup')}</label>
                          <input
                            type="text"
                            placeholder={t('reg.fPickupPh')}
                            value={formData.pickupLocation}
                            onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-none bg-card border border-rule text-ink text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-ink">{t('reg.fDeposit')}</label>
                          <input
                            type="text"
                            placeholder={t('reg.fDepositPh')}
                            value={formData.depositTerms}
                            onChange={(e) => setFormData({ ...formData, depositTerms: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-none bg-card border border-rule text-ink text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Highlight Notice Box */}
                    <div className="p-4 rounded-none bg-amber-500/10 border border-amber-500/20 text-ink space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                        <ShieldCheck className="h-4 w-4" />
                        {t('reg.termsNotice')}
                      </div>
                      <p className="text-xs font-medium text-ink-2 leading-relaxed">
                        {t('reg.termsNoticeDesc')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Bottom Wizard Navigation */}
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="flex items-center">
                    {currentStep > 1 ? (
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        {t('reg.prev')}
                      </button>
                    ) : (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 leading-tight max-w-md">
                        <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                        {t('reg.pdpa')}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {currentStep < 3 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="w-full sm:w-auto min-w-[140px] h-12 bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-950 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-slate-950"
                      >
                        <span>{t('reg.next')}</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto min-w-[140px] h-12 bg-amber-500 hover:bg-amber-600 text-amber-950 text-sm font-extrabold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{t('reg.saving')}</span>
                          </>
                        ) : (
                          <>
                            <span>{t('reg.submitJoin')}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Trust Footnote */}
                {currentStep > 1 && (
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Lock className="h-4 w-4 shrink-0" />
                    <span className="text-[11px] leading-tight">
                      {t('reg.pdpa')}
                    </span>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Vehicle spec & photo reference strip */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 text-xs">
          <button
            type="button"
            onClick={() => setShowSpecRef((v) => !v)}
            aria-expanded={showSpecRef}
            className="w-full px-6 py-2.5 cursor-pointer font-semibold flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-slate-500">visibility</span>
              <span>{t('reg.specRef')}</span>
            </span>
            <span className={`font-mono text-[11px] text-slate-400 transition-transform ${showSpecRef ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {showSpecRef && (
            <div className="px-5 sm:px-6 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {VEHICLE_CATEGORY_GROUPS.map((group) => (
                <div key={group.category} className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{group.label}</p>
                  <ul className="mt-1.5 space-y-1">
                    {group.models.map((model) => (
                      <li key={model} className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        • {model}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
