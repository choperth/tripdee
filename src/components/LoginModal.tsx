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
  const { loginAsDemo, loginWithCredentials } = useAuth();
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);

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
          match.driverNickname || match.driverName || 'คนขับพาร์ตเนอร์',
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
            leadMatch.nickname || leadMatch.driverName || 'คนขับพาร์ตเนอร์',
            leadMatch.phone || driverPhone,
            {
              id: leadMatch.id,
              driverNickname: leadMatch.nickname || leadMatch.driverName,
              vehicleTitle: leadMatch.vehicleModel || 'รถพาร์ตเนอร์ TripDee',
              vehiclePlate: leadMatch.plateNumber || 'รอตรวจสอบข้อมูลป้าย',
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
      setDriverError('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล กรุณาลองใหม่อีกครั้ง');
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
      loginWithCredentials('admin', 'ผู้ดูแลระบบ TripDee', 'admin@tripdee.co', {
        id: 'adm-real',
      });
      onClose();
    } else {
      setAdminError(t('auth.adminPassWrong'));
    }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="td-elev-lift relative w-full max-w-lg rounded-modal bg-card p-6 sm:p-8 text-ink">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label={t('auth.close')}
          className="absolute top-5 right-5 grid h-9 w-9 place-items-center rounded-full bg-paper-2 text-ink hover:bg-paper transition-transform"
        >
          <X className="h-4.5 w-4.5" strokeWidth={2.5} />
        </button>

        {/* Modal Header */}
        <div className="mb-6 pr-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-sun-soft px-3 py-1 text-xs font-extrabold text-ink">
              <ShieldCheck className="h-4 w-4 text-leaf" strokeWidth={2.5} />
              {t('auth.badge')}
            </span>
            {!isDemo && (
              <span className="inline-flex items-center gap-1 rounded-pill bg-leaf-soft px-2.5 py-0.5 text-[11px] font-extrabold text-leaf-deep">
                <Lock className="h-3 w-3" />
                {t('auth.realModeNote')}
              </span>
            )}
          </div>
          <h2 id="login-modal-title" className="font-display mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {t('auth.title')}
          </h2>
          <p className="mt-1 text-sm font-medium text-ink-2">
            {t('auth.desc')}
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl bg-paper p-1.5">
          <button
            type="button"
            onClick={() => setSelectedRole('driver')}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 px-1 text-xs font-extrabold transition-colors ${
              selectedRole === 'driver'
                ? 'bg-accent text-accent-ink shadow-xs'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <CarFront className="h-4 w-4" strokeWidth={2.5} />
            <span>{t('auth.roleDriver')}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('customer')}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 px-1 text-xs font-extrabold transition-colors ${
              selectedRole === 'customer'
                ? 'bg-grape text-white shadow-xs'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <Briefcase className="h-4 w-4" strokeWidth={2.5} />
            <span>{t('auth.roleCustomer')}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('admin')}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 px-1 text-xs font-extrabold transition-colors ${
              selectedRole === 'admin'
                ? 'bg-sun text-sun-ink shadow-xs'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <Crown className="h-4 w-4" strokeWidth={2.5} />
            <span>{t('auth.roleAdmin')}</span>
          </button>
        </div>

        {/* =========================================================================
            BRANCH A: DEMO SHOWCASE MODE (?demo=1 or default mock enabled)
           ========================================================================= */}
        {isDemo ? (
          <div>
            {/* Fast 1-Click Demo Section */}
            <div className="mb-5 rounded-2xl border-2 border-dashed border-rule bg-paper-2/60 p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-ink-2">
                  {t('auth.demoTitle')}
                </span>
                <span className="rounded-pill bg-leaf-soft px-2 py-0.5 text-[11px] font-extrabold text-leaf-deep">
                  {t('auth.demoNote')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleDemoLogin(selectedRole)}
                className="td-btn td-pop flex w-full items-center justify-between rounded-input bg-card p-3 text-left font-extrabold text-ink transition-transform shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sun text-sun-ink">
                    {selectedRole === 'driver' && <CarFront className="h-5 w-5" strokeWidth={2.5} />}
                    {selectedRole === 'customer' && <Briefcase className="h-5 w-5" strokeWidth={2.5} />}
                    {selectedRole === 'admin' && <Crown className="h-5 w-5" strokeWidth={2.5} />}
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-ink">
                      {selectedRole === 'driver' && t('auth.demoDriverName')}
                      {selectedRole === 'customer' && t('auth.demoCustName')}
                      {selectedRole === 'admin' && t('auth.demoAdminName')}
                    </p>
                    <p className="text-xs font-medium text-ink-2">
                      {selectedRole === 'driver' && t('auth.demoDriverDesc')}
                      {selectedRole === 'customer' && t('auth.demoCustDesc')}
                      {selectedRole === 'admin' && t('auth.demoAdminDesc')}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-accent-deep" strokeWidth={2.5} />
              </button>
            </div>

            {/* Social / Direct Login Options in Demo */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleDemoLogin('driver')}
                className="flex w-full items-center justify-center gap-2 rounded-input bg-[#06C755] py-2.5 px-4 font-extrabold text-white transition-colors hover:bg-[#05b34c]"
              >
                <MessageCircle className="h-5 w-5 fill-white" />
                <span>{t('auth.lineLogin')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('customer')}
                className="flex w-full items-center justify-center gap-2 rounded-input bg-card py-2.5 px-4 font-extrabold text-ink transition-colors hover:bg-paper-2 border border-rule"
              >
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
              </button>
            </div>

            {/* Direct Phone/Email Toggle */}
            <div className="mt-4 pt-3 border-t-2 border-dashed border-rule text-center">
              {demoLoginMethod === 'demo' ? (
                <button
                  type="button"
                  onClick={() => setDemoLoginMethod('direct')}
                  className="text-xs font-extrabold text-ink-2 hover:text-accent-deep underline decoration-2"
                >
                  {t('auth.orPhone')}
                </button>
              ) : (
                <form onSubmit={handleDemoDirectSubmit} className="space-y-3 pt-2 text-left">
                  <div>
                    <label htmlFor="demo-login-name" className="block text-xs font-extrabold uppercase text-ink-2 mb-1">
                      {t('auth.fName')}
                    </label>
                    <input
                      id="demo-login-name"
                      type="text"
                      required
                      placeholder={t('auth.fNamePh')}
                      value={directName}
                      onChange={(e) => setDirectName(e.target.value)}
                      className="w-full rounded-input bg-paper px-3 py-2 text-sm font-bold text-ink focus:border-accent"
                    />
                  </div>

                  <div>
                    <label htmlFor="demo-login-phone" className="block text-xs font-extrabold uppercase text-ink-2 mb-1">
                      {t('auth.fPhone')}
                    </label>
                    <input
                      id="demo-login-phone"
                      type="text"
                      required
                      placeholder={t('auth.fPhonePh')}
                      value={directPhone}
                      onChange={(e) => setDirectPhone(e.target.value)}
                      className="w-full rounded-input bg-paper px-3 py-2 text-sm font-bold text-ink focus:border-accent"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="td-btn flex-1 rounded-pill bg-accent py-2 px-4 text-xs font-extrabold text-accent-ink"
                    >
                      {t('auth.submit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoLoginMethod('demo')}
                      className="rounded-pill border border-rule py-2 px-3 text-xs font-bold text-ink-2 hover:border-ink-2/50"
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
              <form onSubmit={handleDriverLogin} className="space-y-4">
                <div>
                  <label htmlFor="driver-phone-input" className="block text-xs font-extrabold uppercase text-ink-2 mb-1.5">
                    {t('auth.driverPhoneLabel')}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-2" />
                    <input
                      id="driver-phone-input"
                      type="tel"
                      required
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder={t('auth.driverPhonePh')}
                      className="w-full rounded-input bg-paper pl-9 pr-3 py-2.5 text-sm font-bold text-ink focus:border-accent border border-rule"
                    />
                  </div>
                </div>

                {driverError && (
                  <div className="rounded-xl bg-flame-soft p-3 text-xs font-semibold text-flame flex flex-col gap-2">
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
                        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-navy-deep underline hover:text-accent-deep pt-1"
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
                  className="td-btn w-full rounded-input bg-accent py-3 px-4 text-sm font-extrabold text-accent-ink flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors disabled:opacity-50"
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
                      className="text-xs font-bold text-ink-2 hover:text-accent-deep transition-colors"
                    >
                      {t('auth.driverRegisterLink')}
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* 2. Customer Login Form */}
            {selectedRole === 'customer' && (
              <form onSubmit={handleCustomerLogin} className="space-y-3.5">
                <div>
                  <label htmlFor="customer-name-input" className="block text-xs font-extrabold uppercase text-ink-2 mb-1">
                    {t('auth.customerCompanyLabel')}
                  </label>
                  <input
                    id="customer-name-input"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t('auth.customerCompanyPh')}
                    className="w-full rounded-input bg-paper px-3 py-2.5 text-sm font-bold text-ink focus:border-accent border border-rule"
                  />
                </div>

                <div>
                  <label htmlFor="customer-contact-input" className="block text-xs font-extrabold uppercase text-ink-2 mb-1">
                    {t('auth.fPhone')}
                  </label>
                  <input
                    id="customer-contact-input"
                    type="text"
                    required
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                    placeholder={t('auth.fPhonePh')}
                    className="w-full rounded-input bg-paper px-3 py-2.5 text-sm font-bold text-ink focus:border-accent border border-rule"
                  />
                </div>

                <div>
                  <label htmlFor="customer-tax-input" className="block text-xs font-extrabold uppercase text-ink-2 mb-1">
                    {t('auth.customerTaxLabel')}
                  </label>
                  <input
                    id="customer-tax-input"
                    type="text"
                    value={customerTaxId}
                    onChange={(e) => setCustomerTaxId(e.target.value)}
                    placeholder={t('auth.customerTaxPh')}
                    className="w-full rounded-input bg-paper px-3 py-2 text-sm font-bold text-ink focus:border-accent border border-rule"
                  />
                </div>

                <button
                  type="submit"
                  className="td-btn w-full rounded-input bg-grape py-3 px-4 text-sm font-extrabold text-white flex items-center justify-center gap-2 hover:bg-grape/90 transition-colors mt-2"
                >
                  <Briefcase className="h-4 w-4" />
                  <span>{t('auth.submit')}</span>
                </button>
              </form>
            )}

            {/* 3. Admin Login Form (Password Protected) */}
            {selectedRole === 'admin' && (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label htmlFor="admin-password-input" className="block text-xs font-extrabold uppercase text-ink-2 mb-1.5">
                    {t('auth.adminPassLabel')}
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-2" />
                    <input
                      id="admin-password-input"
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder={t('auth.adminPassPh')}
                      className="w-full rounded-input bg-paper pl-9 pr-3 py-2.5 text-sm font-bold text-ink focus:border-accent border border-rule"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {adminError && (
                  <div className="rounded-xl bg-flame-soft p-3 text-xs font-semibold text-flame flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{adminError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="td-btn w-full rounded-input bg-sun py-3 px-4 text-sm font-extrabold text-sun-ink flex items-center justify-center gap-2 hover:bg-sun/90 transition-colors shadow-xs"
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
