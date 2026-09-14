'use client';

import React, { useState } from 'react';
import { useAuth, UserRole } from '@/context/AuthContext';
import { X, ShieldCheck, CarFront, Briefcase, Crown, MessageCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, defaultRole = 'driver' }) => {
  const { loginAsDemo, loginWithCredentials } = useAuth();
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [name, setName] = useState('');
  const [loginMethod, setLoginMethod] = useState<'demo' | 'direct'>('demo');

  if (!isOpen) return null;

  const handleDemoLogin = (role: UserRole) => {
    loginAsDemo(role);
    onClose();
  };

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginWithCredentials(selectedRole, name, phoneOrEmail);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="td-elev-lift relative w-full max-w-lg rounded-modal bg-card p-6 sm:p-8 text-ink">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label={t('auth.close')}
          className="absolute top-5 right-5 grid h-9 w-9 place-items-center rounded-full bg-paper-2 text-ink transition-transform"
        >
          <X className="h-4.5 w-4.5" strokeWidth={2.5} />
        </button>

        {/* Modal Header */}
        <div className="mb-6 pr-8">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-sun-soft px-3 py-1 text-xs font-extrabold text-ink">
            <ShieldCheck className="h-4 w-4 text-leaf" strokeWidth={2.5} />
            {t('auth.badge')}
          </span>
          <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
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
                ? 'bg-accent text-accent-ink'
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
                ? 'bg-grape text-white'
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
                ? 'bg-sun text-sun-ink'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <Crown className="h-4 w-4" strokeWidth={2.5} />
            <span>{t('auth.roleAdmin')}</span>
          </button>
        </div>

        {/* Fast 1-Click Demo Section */}
        <div className="mb-5 rounded-2xl border-2 border-dashed border-rule bg-paper-2/60 p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-ink-2">
              {t('auth.demoTitle')}
            </span>
            <span className="rounded-pill bg-leaf-soft px-2 py-0.5 text-[11px] font-extrabold text-leaf">
              {t('auth.demoNote')}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleDemoLogin(selectedRole)}
            className="td-btn td-pop flex w-full items-center justify-between rounded-input bg-card p-3 text-left font-extrabold text-ink transition-transform"
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

        {/* Social / Direct Login Options */}
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
            className="flex w-full items-center justify-center gap-2 rounded-input bg-card py-2.5 px-4 font-extrabold text-ink transition-colors hover:bg-paper-2"
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
          {loginMethod === 'demo' ? (
            <button
              type="button"
              onClick={() => setLoginMethod('direct')}
              className="text-xs font-extrabold text-ink-2 hover:text-accent-deep underline decoration-2"
            >
              {t('auth.orPhone')}
            </button>
          ) : (
            <form onSubmit={handleDirectSubmit} className="space-y-3 pt-2 text-left">
              <div>
                <label className="block text-xs font-extrabold uppercase text-ink-2 mb-1">
                  {t('auth.fName')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('auth.fNamePh')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-input bg-paper px-3 py-2 text-sm font-bold text-ink focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-ink-2 mb-1">
                  {t('auth.fPhone')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('auth.fPhonePh')}
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
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
                  onClick={() => setLoginMethod('demo')}
                  className="rounded-pill border border-rule py-2 px-3 text-xs font-bold text-ink-2 hover:border-ink-2/50"
                >
                  {t('auth.cancel')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
