'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  ShieldCheck,
  CreditCard,
  SlidersHorizontal,
  Handshake,
  PartyPopper,
  CarFront,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Phone,
  User,
  MessageSquare,
  MapPin,
  Clock,
  Receipt,
  Upload,
  Sparkles,
  Lock,
} from 'lucide-react';
import { VEHICLE_CATEGORY_GROUPS } from '@/data/vehicleModels';

interface DriverRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AMENITY_OPTIONS = [
  'มีเบาะ VIP นวดไฟฟ้า',
  'มี Wi-Fi ความเร็วสูง / จอทีวี',
  'ประกันภัยชั้น 1 คุ้มครองผู้โดยสาร',
  'น้ำดื่มบริการฟรี / ตู้เย็นขนาดเล็ก',
  'คาราโอเกะ & ระบบเสียง VIP',
  'หัวชาร์จ USB / Type-C ทุกที่นั่ง',
];

export const DriverRegisterModal: React.FC<DriverRegisterModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, { onClose, enabled: isOpen });
  const { t } = useLanguage();
  const { loginWithCredentials } = useAuth();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    amenities: ['มี Wi-Fi ความเร็วสูง / จอทีวี', 'ประกันภัยชั้น 1 คุ้มครองผู้โดยสาร'] as string[],
    pickupLocation: '',
    depositTerms: '',
  });

  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelText, setCustomModelText] = useState('');

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
        alert('กรุณากรอกชื่อผู้ติดต่อ เบอร์โทรศัพท์ และ LINE ID ให้ครบถ้วน');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
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
          amenities: formData.amenities.join(', '),
          pickupLocation: formData.pickupLocation,
          depositTerms: formData.depositTerms,
          hp_website: hpWebsite,
          _hp_timestamp: formMountedAt,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง');
        return;
      }

      const resData = await res.json().catch(() => ({}));
      const leadId = resData.lead?.id || `drv-${Date.now()}`;

      // Automatically log the driver in so their portal is immediately ready
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

      setSubmitted(true);
    } catch (err) {
      console.error('Submit driver error:', err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
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
        className="w-full max-w-5xl bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto transition-all border border-rule/80"
      >
        {/* Top Bar / Live Status */}
        <div className="bg-slate-900 px-5 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              🟢 เปิดรับสมัครทั่วประเทศ: เชียงใหม่ ภูเก็ต กทม. พัทยา สมุย
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('auth.close')}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
          >
            <X className="h-5 w-5 block" />
          </button>
        </div>

        {/* Main Modal Shell: Asymmetric Grid with Left Perks Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 w-full">
          {/* Left Side: Trust & Operator Perks Briefing */}
          <div className="lg:col-span-4 bg-paper-2 p-6 sm:p-8 flex flex-col justify-between space-y-6 border-b lg:border-b-0 lg:border-r border-rule/70">
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold">
                    TripDee Partner Club
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-500/20">
                    {t('show.badgeZero')}
                  </span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-ink mt-1.5">
                  {t('reg.heroTitle')}
                </h2>
                <p className="text-xs font-medium text-ink-2 mt-2 leading-relaxed">
                  {t('reg.heroDesc')}
                </p>
              </div>

              {/* Perk List */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-card shadow-2xs border border-rule/60">
                  <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 mt-0.5">
                    <CreditCard className="h-5 w-5 block" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-[13px] font-bold text-ink">{t('reg.perk1Title')}</p>
                    <p className="text-[11px] font-medium text-ink-2">{t('reg.perk1Desc')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-card shadow-2xs border border-rule/60">
                  <div className="p-2 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 mt-0.5">
                    <SlidersHorizontal className="h-5 w-5 block" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-[13px] font-bold text-ink">{t('reg.perk2Title')}</p>
                    <p className="text-[11px] font-medium text-ink-2">{t('reg.perk2Desc')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-card shadow-2xs border border-rule/60">
                  <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <ShieldCheck className="h-5 w-5 block" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-[13px] font-bold text-ink">{t('reg.perk3Title')}</p>
                    <p className="text-[11px] font-medium text-ink-2">{t('reg.perk3Desc')}</p>
                  </div>
                </div>
              </div>

              {/* Social Proof Metric */}
              <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center gap-3.5 shadow-sm border border-slate-800">
                <div className="flex -space-x-2 overflow-hidden shrink-0">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-amber-950 flex items-center justify-center text-[11px] font-extrabold shadow">
                    CNX
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-extrabold shadow">
                    BKK
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-extrabold shadow">
                    HKT
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-[13px] font-bold text-white">{t('reg.proofCount')}</p>
                  <p className="text-[11px] text-slate-300 truncate">{t('reg.proofNetwork')}</p>
                </div>
              </div>
            </div>

            {/* Direct Deal Guarantee Note */}
            <div className="rounded-xl p-3 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex items-start gap-2.5 border border-amber-500/20 text-xs">
              <Handshake className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-[11px] font-medium leading-snug">
                {t('reg.noLockNote')}
              </p>
            </div>
          </div>

          {/* Right Side: Progressive 3-Step Wizard Form */}
          <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between space-y-6 overflow-y-auto max-h-[85vh]">
            {/* Header & Step Tabs */}
            <div>
              <div className="mb-4">
                <h1 className="font-display text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
                  {t('reg.title')}
                </h1>
                <p className="text-xs sm:text-sm font-medium text-ink-2 mt-1">
                  {t('reg.subtitle')}
                </p>
              </div>

              {/* Step Pill Tabs Indicator */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-paper-2 rounded-xl border border-rule/60">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                    currentStep === 1
                      ? 'bg-card text-ink shadow-2xs border border-rule/80'
                      : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
                      currentStep === 1
                        ? 'bg-slate-900 text-white'
                        : 'bg-paper text-ink-2'
                    }`}
                  >
                    1
                  </span>
                  <span className="hidden sm:inline">{t('reg.step1Title')}</span>
                  <span className="sm:hidden">ผู้ขับ/ร้าน</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (formData.driverName && formData.phone) setCurrentStep(2);
                  }}
                  className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                    currentStep === 2
                      ? 'bg-card text-ink shadow-2xs border border-rule/80'
                      : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
                      currentStep === 2
                        ? 'bg-slate-900 text-white'
                        : 'bg-paper text-ink-2'
                    }`}
                  >
                    2
                  </span>
                  <span className="hidden sm:inline">{t('reg.step2Title')}</span>
                  <span className="sm:hidden">ข้อมูลรถ</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (formData.driverName && formData.phone) setCurrentStep(3);
                  }}
                  className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                    currentStep === 3
                      ? 'bg-card text-ink shadow-2xs border border-rule/80'
                      : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
                      currentStep === 3
                        ? 'bg-slate-900 text-white'
                        : 'bg-paper text-ink-2'
                    }`}
                  >
                    3
                  </span>
                  <span className="hidden sm:inline">{t('reg.step3Title')}</span>
                  <span className="sm:hidden">สิทธิพิเศษ</span>
                </button>
              </div>
            </div>

            {/* Submitted Success Screen */}
            {submitted ? (
              <div className="py-10 text-center space-y-4">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500 text-white shadow-md">
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
                    className="py-2.5 px-5 rounded-xl bg-paper-2 hover:bg-card border border-rule text-xs font-bold text-ink transition-all"
                  >
                    {t('reg.successAddMore')}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition-all shadow-xs"
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-amber-500" />
                          {t('reg.fContactName')}
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
                          className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-rule text-ink placeholder:text-ink-3 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-2xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-amber-500" />
                          {t('reg.fMobile')}
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder={t('reg.fMobilePh')}
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-rule text-ink placeholder:text-ink-3 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                          {t('reg.fLineId')}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={t('reg.fLineIdPh')}
                          value={formData.lineId}
                          onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-rule text-ink placeholder:text-ink-3 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-2xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-amber-500" />
                          {t('reg.fHub')}
                        </label>
                        <select
                          value={formData.serviceHub}
                          onChange={(e) => setFormData({ ...formData, serviceHub: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-rule text-ink text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-2xs"
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
                      </div>
                    </div>

                    {/* International Messaging Channels (Optional) */}
                    <div className="pt-3 border-t border-rule/60 space-y-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold uppercase tracking-wide text-ink">
                            {t('reg.intlTitle')}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            {t('reg.intlRecommended')}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-2 mt-0.5">
                          {t('reg.intlDesc')}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* WhatsApp */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                            <span>WhatsApp</span>
                            <span className="text-[10px] text-ink-3 font-normal">({t('reg.intlWhatsappHint')})</span>
                          </label>
                          <input
                            type="tel"
                            placeholder={t('reg.intlWhatsappPh')}
                            value={formData.whatsapp}
                            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-card border border-rule text-ink placeholder:text-ink-3 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-2xs"
                          />
                        </div>

                        {/* WeChat */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#07C160]" />
                            <span>{t('reg.intlWechat')}</span>
                            <span className="text-[10px] text-ink-3 font-normal">({t('reg.intlWechatHint')})</span>
                          </label>
                          <input
                            type="text"
                            placeholder={t('reg.intlIdPh')}
                            value={formData.wechat}
                            onChange={(e) => setFormData({ ...formData, wechat: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-card border border-rule text-ink placeholder:text-ink-3 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-2xs"
                          />
                        </div>

                        {/* KakaoTalk */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#FEE500]" />
                            <span>KakaoTalk ID</span>
                            <span className="text-[10px] text-ink-3 font-normal">({t('reg.intlKakaoHint')})</span>
                          </label>
                          <input
                            type="text"
                            placeholder={t('reg.intlIdPh')}
                            value={formData.kakao}
                            onChange={(e) => setFormData({ ...formData, kakao: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-card border border-rule text-ink placeholder:text-ink-3 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Feature Tag */}
                    <div className="p-3.5 rounded-xl bg-paper-2 flex items-center gap-3 border border-rule/60">
                      <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                      <p className="text-xs font-medium text-ink-2 leading-relaxed">
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
                          className={`flex items-center gap-3.5 p-3.5 rounded-xl border shadow-2xs cursor-pointer transition-all ${
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
                          className={`flex items-center gap-3.5 p-3.5 rounded-xl border shadow-2xs cursor-pointer transition-all ${
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
                            <p className="text-[11px] font-medium text-ink-2">Sedan, SUV 7 ที่นั่ง หรือ Compact EV</p>
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
                          className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-rule text-ink text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-2xs"
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
                            className="w-full px-3.5 py-2 rounded-xl bg-card border border-rule text-ink text-xs mt-1"
                          />
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-ink">{t('reg.fSeatsCount')}</label>
                        <select
                          value={formData.seats}
                          onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-rule text-ink text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-2xs"
                        >
                          <option value="4">{t('reg.seats4')}</option>
                          <option value="5">{t('reg.seats5')}</option>
                          <option value="7">{t('reg.seats7Capt')}</option>
                          <option value="9">{t('reg.seats9High')}</option>
                          <option value="10">{t('reg.seats10Fam')}</option>
                          <option value="13">{t('reg.seats13Std')}</option>
                        </select>
                      </div>
                    </div>

                    {/* License Plate Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-ink">{t('reg.fPlateType')}</label>
                        <div className="grid grid-cols-2 gap-2">
                          <label
                            className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-bold transition-all ${
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
                            className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-bold transition-all ${
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
                          className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-rule text-ink placeholder:text-ink-3 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Photo Showcase & Upload Box */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-ink">{t('reg.fPhotos')}</label>
                        <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          {t('reg.photosTip')}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="relative group rounded-xl overflow-hidden bg-paper-2 aspect-video shadow-2xs border border-rule/60">
                          <Image
                            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80"
                            alt="ภาพถ่ายตัวรถภายนอก"
                            fill
                            sizes="(max-width: 640px) 100vw, 200px"
                            className="object-cover"
                          />
                          <div className="absolute bottom-1.5 left-1.5 bg-slate-900/85 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-bold z-10">
                            {t('reg.photoExterior')}
                          </div>
                        </div>

                        <div className="relative group rounded-xl overflow-hidden bg-paper-2 aspect-video shadow-2xs border border-rule/60">
                          <Image
                            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80"
                            alt="ห้องโดยสาร VIP"
                            fill
                            sizes="(max-width: 640px) 100vw, 200px"
                            className="object-cover"
                          />
                          <div className="absolute bottom-1.5 left-1.5 bg-slate-900/85 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-bold z-10">
                            {t('reg.photoInterior')}
                          </div>
                        </div>

                        <input
                          type="file"
                          id="driver-vehicle-photo-upload"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              alert('เลือกรูปภาพเรียบร้อยแล้ว: ' + e.target.files[0].name);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('driver-vehicle-photo-upload')?.click()}
                          aria-label="อัปโหลดรูปถ่ายจริงของตัวรถ"
                          className="rounded-xl border-2 border-dashed border-amber-500/40 bg-card p-2 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-amber-500/10 hover:border-amber-500 transition-all shadow-2xs aspect-video group"
                        >
                          <Upload className="h-6 w-6 text-amber-500 group-hover:scale-110 transition-transform" />
                          <span className="text-xs text-ink font-bold mt-1">{t('reg.photoAdd')}</span>
                          <span className="text-[10px] text-ink-2">JPG, PNG</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Invoicing, Comfort Amenities & Sign-off */}
                {currentStep === 3 && (
                  <div className="space-y-5 animate-fade-in">
                    {/* Tax Compliance Checkbox */}
                    <div className="p-4 rounded-xl bg-paper-2 border border-rule flex items-start gap-3.5">
                      <input
                        type="checkbox"
                        id="tax_capable"
                        checked={formData.canIssueTaxInvoice}
                        onChange={(e) => setFormData({ ...formData, canIssueTaxInvoice: e.target.checked })}
                        className="rounded border-rule text-amber-500 focus:ring-amber-500 h-5 w-5 mt-0.5 cursor-pointer"
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
                        {AMENITY_OPTIONS.map((amenity) => {
                          const isSelected = formData.amenities.includes(amenity);
                          return (
                            <button
                              key={amenity}
                              type="button"
                              onClick={() => toggleAmenity(amenity)}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                  : 'bg-paper-2 text-ink-2 border-rule hover:bg-card hover:text-ink'
                              }`}
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              {amenity}
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
                            className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-rule text-ink text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-ink">{t('reg.fDeposit')}</label>
                          <input
                            type="text"
                            placeholder={t('reg.fDepositPh')}
                            value={formData.depositTerms}
                            onChange={(e) => setFormData({ ...formData, depositTerms: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-rule text-ink text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Highlight Notice Box */}
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-ink space-y-1">
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
                <div className="pt-3 border-t border-rule/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-paper-2 hover:bg-card border border-rule text-ink text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        {t('reg.prev')}
                      </button>
                    )}
                  </div>

                  <div className="w-full sm:w-auto flex items-center gap-3">
                    {currentStep < 3 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        <span>{t('reg.next')}</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-7 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-60"
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
                <div className="text-center pt-1">
                  <p className="text-[11px] text-ink-3 flex items-center justify-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                    {t('reg.pdpa')}
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
