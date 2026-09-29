'use client';

import React, { useRef, useState } from 'react';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { useAuth, UserRole } from '@/context/AuthContext';
import {
  X,
  ShieldCheck,
  CarFront,
  Briefcase,
  Crown,
  MessageCircle,
  ArrowRight,
  Lock,
  KeyRound,
  Phone,
  AlertCircle,
  Loader2,
  UserPlus,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { isMockDataEnabled } from '@/lib/mockConfig';
import { Vehicle } from '@/data/mockData';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
  onOpenRegisterModal?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'driver',
  onOpenRegisterModal,
}) => {
  const { loginAsDemo, loginWithCredentials, loginWithOAuth } = useAuth();
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);

  // OAuth State
  const [oauthLoading, setOauthLoading] = useState<'line' | 'google' | null>(null);
  const [oauthError, setOauthError] = useState('');

  // Real Mode Driver Form State
  const [driverPhone, setDriverPhone] = useState('');
  const [isCheckingDriver, setIsCheckingDriver] = useState(false);
  const [driverError, setDriverError] = useState('');

  // Real Mode Customer Form State
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [customerTaxId, setCustomerTaxId] = useState('');

  // Real Mode Admin Form State
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // Demo direct login fallback form
  const [directName, setDirectName] = useState('');
  const [directPhone, setDirectPhone] = useState('');
  const [demoLoginMethod, setDemoLoginMethod] = useState<'demo' | 'direct'>('demo');

  const isDemo = isMockDataEnabled();

  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, { onClose, enabled: isOpen });

  if (!isOpen) return null;

  const normalizePhone = (p: string) => p.replace(/[^0-9]/g, '');

  const handleDemoLogin = (role: UserRole) => {
    loginAsDemo(role);
    onClose();
  };

  const handleOAuthLogin = async (provider: 'line' | 'google') => {
    try {
      setOauthLoading(provider);
      setOauthError('');
      const res = await loginWithOAuth(provider, selectedRole);
      if (!res.success && res.error) {
        setOauthError(res.error);
      } else if (res.success && isDemo) {
        onClose();
      }
    } catch (err: unknown) {
      setOauthError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setOauthLoading(null);
    }
  };

  const renderOAuthButtons = () => (
    <div className="space-y-2.5">
      {oauthError && (
        <div className="border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{oauthError}</span>
        </div>
      )}
      <button
        type="button"
        disabled={!!oauthLoading}
        onClick={() => handleOAuthLogin('line')}
        className="flex w-full h-12 items-center justify-center gap-2 bg-[#06C755] px-4 text-sm font-black text-white transition-all hover:bg-[#05B04B] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
      >
        {oauthLoading === 'line' ? (
          <>
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
            <span>{t('auth.connecting')}</span>
          </>
        ) : (
          <>
            <MessageCircle className="h-5 w-5 fill-white" />
            <span>{t('auth.lineLogin')}</span>
          </>
        )}
      </button>

      <button
        type="button"
        disabled={!!oauthLoading}
        onClick={() => handleOAuthLogin('google')}
        className="flex w-full h-12 items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 text-sm font-bold text-slate-800 dark:text-slate-200 transition-all hover:border-slate-950 dark:hover:border-white active:scale-[0.99] disabled:opacity-60 cursor-pointer"
      >
        {oauthLoading === 'google' ? (
          <>
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
            <span>{t('auth.connecting')}</span>
          </>
        ) : (
          <>
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{t('auth.googleLogin')}</span>
          </>
        )}
      </button>
    </div>
  );

  const handleDemoDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginWithCredentials(selectedRole, directName, directPhone);
    onClose();
  };

  // Real Driver Login (Phone number lookup in /api/vehicles and /api/leads/driver)
  const handleDriverLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = normalizePhone(driverPhone);
    if (cleanPhone.length < 9) {
      setDriverError(t('auth.driverPhonePh'));
      return;
    }

    setDriverError('');
    setIsCheckingDriver(true);

    try {
      // 1. First, search active verified vehicles catalog
      const res = await fetch('/api/vehicles?demo=0');
      const data = await res.json();
      const allVehicles: Vehicle[] = data.vehicles || [];

      const match = allVehicles.find((v) => {
        const p = normalizePhone(v.driverPhone || '');
        return p.includes(cleanPhone) || cleanPhone.includes(p);
      });

      if (match) {
        loginWithCredentials(
          'driver',
          match.driverNickname || match.driverName || t('auth.partnerName'),
          match.driverPhone || driverPhone,
          {
            id: match.id,
            driverNickname: match.driverNickname || match.driverName,
            vehicleTitle: match.title,
            vehiclePlate: match.plateNumber,
            seats: match.seats,
            isAvailable: match.isAvailable !== false,
            verificationStatus: match.isVerified ? 'verified' : 'pending',
          }
        );
        onClose();
        return;
      }

      // 2. Fallback: Search registered partner leads (including pending review)
      const leadRes = await fetch('/api/leads/driver');
      if (leadRes.ok) {
        const leadData = await leadRes.json();
        const allLeads = leadData.drivers || [];
        const leadMatch = allLeads.find((d: { phone?: string }) => {
          const p = normalizePhone(d.phone || '');
          return p.includes(cleanPhone) || cleanPhone.includes(p);
        });

        if (leadMatch) {
          loginWithCredentials(
            'driver',
            leadMatch.nickname || leadMatch.driverName || t('auth.partnerName'),
            leadMatch.phone || driverPhone,
            {
              id: leadMatch.id,
              driverNickname: leadMatch.nickname || leadMatch.driverName,
              vehicleTitle: leadMatch.vehicleModel || t('auth.partnerVehicle'),
              vehiclePlate: leadMatch.plateNumber || t('auth.platePending'),
              seats: Number(leadMatch.seats) || 9,
              isAvailable: true,
              verificationStatus: leadMatch.status === 'verified' ? 'verified' : 'pending',
            }
          );
          onClose();
          return;
        }
      }

      // 3. Neither found
      setDriverError(t('auth.driverNotFound'));
    } catch {
      setDriverError(t('auth.driverVerifyError'));
    } finally {
      setIsCheckingDriver(false);
    }
  };

  // Real Customer Login
  const handleCustomerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginWithCredentials('customer', customerName, customerContact, {
      companyName: customerName,
      taxId: customerTaxId || undefined,
    });
    onClose();
  };

  // Real Admin Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPin = process.env.NEXT_PUBLIC_ADMIN_PIN || 'tripdee2026';
    if (adminPassword.trim() === targetPin) {
      setAdminError('');
      loginWithCredentials('admin', t('auth.demoAdminName'), 'admin@tripdee.co', {
        id: 'adm-real',
      });
      onClose();
    } else {
      setAdminError(t('auth.adminPassWrong'));
    }
  };

  const roleTabClass = (role: UserRole) =>
    `flex flex-1 flex-col items-center gap-1 px-2 py-3 text-xs transition-all cursor-pointer border-r border-slate-200 dark:border-slate-800 last:border-r-0 ${
      selectedRole === role
        ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white border-t-2 border-t-slate-950 dark:border-t-white font-bold'
        : 'font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
    }`;

  const inputClass =
    'w-full h-12 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-sm font-semibold text-slate-950 dark:text-white placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-slate-950 dark:focus:border-white focus:ring-2 focus:ring-amber-500/40';

  const labelClass =
    'block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5';

  const primaryCtaClass =
    'w-full h-12 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black flex items-center justify-center gap-2 border border-amber-600 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer';

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      className="fixed inset-0 z-400 flex items-center justify-center overflow-y-auto bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-xl text-slate-950 dark:text-white p-5 sm:p-6 td-modal-enter"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label={t('auth.close')}
          className="absolute top-4 right-4 w-9 h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 grid place-items-center transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>

        {/* Modal Header */}
        <div className="mb-5 pr-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              {t('auth.badge')}
            </span>
            {!isDemo && (
              <span className="inline-flex items-center gap-1 border border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 text-[11px] font-bold text-sky-800 dark:text-sky-300">
                <Lock className="h-3 w-3" />
                {t('auth.realModeNote')}
              </span>
            )}
          </div>
          <h2 id="login-modal-title" className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {t('auth.title')}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('auth.desc')}
          </p>
        </div>

        {/* Role Switcher Tabs (Sharp stretched tabs matching Hero search tabs) */}
        <div className="mb-5 flex items-stretch border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('driver');
              setOauthError('');
            }}
            className={roleTabClass('driver')}
          >
            <CarFront className={`h-4 w-4 ${selectedRole === 'driver' ? 'text-amber-500' : ''}`} strokeWidth={2.5} />
            <span>{t('auth.roleDriver')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('customer');
              setOauthError('');
            }}
            className={roleTabClass('customer')}
          >
            <Briefcase className={`h-4 w-4 ${selectedRole === 'customer' ? 'text-amber-500' : ''}`} strokeWidth={2.5} />
            <span>{t('auth.roleCustomer')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('admin');
              setOauthError('');
            }}
            className={roleTabClass('admin')}
          >
            <Crown className={`h-4 w-4 ${selectedRole === 'admin' ? 'text-amber-500' : ''}`} strokeWidth={2.5} />
            <span>{t('auth.roleAdmin')}</span>
          </button>
        </div>

        {/* =========================================================================
            BRANCH A: DEMO SHOWCASE MODE (?demo=1 or default mock enabled)
           ========================================================================= */}
        {isDemo ? (
          <div>
            {/* Fast 1-Click Demo Section */}
            <div className="mb-5 border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/40 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('auth.demoTitle')}
                </span>
                <span className="border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                  {t('auth.demoNote')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleDemoLogin(selectedRole)}
                className="flex w-full items-center justify-between bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-3.5 text-left font-bold shadow-sm hover:border-slate-950 dark:hover:border-white transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center bg-slate-900 text-white dark:bg-white dark:text-slate-950">
                    {selectedRole === 'driver' && <CarFront className="h-5 w-5" strokeWidth={2.5} />}
                    {selectedRole === 'customer' && <Briefcase className="h-5 w-5" strokeWidth={2.5} />}
                    {selectedRole === 'admin' && <Crown className="h-5 w-5" strokeWidth={2.5} />}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-950 dark:text-white">
                      {selectedRole === 'driver' && t('auth.demoDriverName')}
                      {selectedRole === 'customer' && t('auth.demoCustName')}
                      {selectedRole === 'admin' && t('auth.demoAdminName')}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedRole === 'driver' && t('auth.demoDriverDesc')}
                      {selectedRole === 'customer' && t('auth.demoCustDesc')}
                      {selectedRole === 'admin' && t('auth.demoAdminDesc')}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-amber-500 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
              </button>
            </div>

            {/* Social / Direct Login Options in Demo */}
            {renderOAuthButtons()}

            {/* Direct Phone/Email Toggle */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
              {demoLoginMethod === 'demo' ? (
                <button
                  type="button"
                  onClick={() => setDemoLoginMethod('direct')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white underline cursor-pointer"
                >
                  {t('auth.orPhone')}
                </button>
              ) : (
                <form onSubmit={handleDemoDirectSubmit} className="space-y-3 pt-2 text-left">
                  <div>
                    <label htmlFor="demo-login-name" className={labelClass}>
                      {t('auth.fName')}
                    </label>
                    <input
                      id="demo-login-name"
                      type="text"
                      required
                      placeholder={t('auth.fNamePh')}
                      value={directName}
                      onChange={(e) => setDirectName(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="demo-login-phone" className={labelClass}>
                      {t('auth.fPhone')}
                    </label>
                    <input
                      id="demo-login-phone"
                      type="text"
                      required
                      placeholder={t('auth.fPhonePh')}
                      value={directPhone}
                      onChange={(e) => setDirectPhone(e.target.value)}
                      className={`${inputClass} tabular-nums`}
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 h-12 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black border border-amber-600 transition-all active:scale-[0.99] cursor-pointer"
                    >
                      {t('auth.submit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoLoginMethod('demo')}
                      className="h-12 px-4 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-slate-950 dark:hover:border-white transition-all cursor-pointer"
                    >
                      {t('auth.cancel')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* =========================================================================
              BRANCH B: REAL DATA AUTHENTIC MODE (?demo=0 or production)
             ========================================================================= */
          <div className="space-y-4">
            {/* 1. Driver Login Form */}
            {selectedRole === 'driver' && (
              <div className="space-y-4">
                {renderOAuthButtons()}

                <div className="relative my-3 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <span className="relative bg-white dark:bg-slate-900 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t('auth.orDivider')}
                  </span>
                </div>

                <form onSubmit={handleDriverLogin} className="space-y-4">
                  <div>
                    <label htmlFor="driver-phone-input" className={labelClass}>
                      {t('auth.driverPhoneLabel')}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        id="driver-phone-input"
                        type="tel"
                        required
                        value={driverPhone}
                        onChange={(e) => setDriverPhone(e.target.value)}
                        placeholder={t('auth.driverPhonePh')}
                        className={`${inputClass} tabular-nums pl-10 pr-3.5`}
                      />
                    </div>
                  </div>

                  {driverError && (
                    <div className="border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300 flex flex-col gap-2">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{driverError}</span>
                      </div>
                      {onOpenRegisterModal && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenRegisterModal();
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 dark:text-white underline pt-1 cursor-pointer"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>{t('auth.driverRegisterLink')}</span>
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isCheckingDriver}
                    className={primaryCtaClass}
                  >
                    {isCheckingDriver ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{t('auth.driverSearching')}</span>
                      </>
                    ) : (
                      <>
                        <CarFront className="h-4 w-4" />
                        <span>{t('auth.submit')}</span>
                      </>
                    )}
                  </button>

                  {onOpenRegisterModal && (
                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenRegisterModal();
                        }}
                        className="text-xs font-bold text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white underline transition-colors cursor-pointer"
                      >
                        {t('auth.driverRegisterLink')}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* 2. Customer Login Form */}
            {selectedRole === 'customer' && (
              <div className="space-y-4">
                {renderOAuthButtons()}

                <div className="relative my-3 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <span className="relative bg-white dark:bg-slate-900 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t('auth.orDivider')}
                  </span>
                </div>

                <form onSubmit={handleCustomerLogin} className="space-y-3.5">
                  <div>
                    <label htmlFor="customer-name-input" className={labelClass}>
                      {t('auth.customerCompanyLabel')}
                    </label>
                    <input
                      id="customer-name-input"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={t('auth.customerCompanyPh')}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="customer-contact-input" className={labelClass}>
                      {t('auth.fPhone')}
                    </label>
                    <input
                      id="customer-contact-input"
                      type="text"
                      required
                      value={customerContact}
                      onChange={(e) => setCustomerContact(e.target.value)}
                      placeholder={t('auth.fPhonePh')}
                      className={`${inputClass} tabular-nums`}
                    />
                  </div>

                  <div>
                    <label htmlFor="customer-tax-input" className={labelClass}>
                      {t('auth.customerTaxLabel')}
                    </label>
                    <input
                      id="customer-tax-input"
                      type="text"
                      value={customerTaxId}
                      onChange={(e) => setCustomerTaxId(e.target.value)}
                      placeholder={t('auth.customerTaxPh')}
                      className={`${inputClass} tabular-nums`}
                    />
                  </div>

                  <button
                    type="submit"
                    className={`${primaryCtaClass} mt-2`}
                  >
                    <Briefcase className="h-4 w-4" />
                    <span>{t('auth.submit')}</span>
                  </button>
                </form>
              </div>
            )}

            {/* 3. Admin Login Form (Password Protected) */}
            {selectedRole === 'admin' && (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label htmlFor="admin-password-input" className={labelClass}>
                    {t('auth.adminPassLabel')}
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="admin-password-input"
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder={t('auth.adminPassPh')}
                      className={`${inputClass} pl-10 pr-3.5`}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {adminError && (
                  <div className="border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{adminError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-950 text-white text-sm font-bold flex items-center justify-center gap-2 border border-slate-900 dark:border-white transition-all active:scale-[0.99] cursor-pointer"
                >
                  <Lock className="h-4 w-4" />
                  <span>{t('auth.submit')}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
