'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import type { DictKey } from '@/i18n/dictionaries';
import { X, Check, ShieldCheck, Send, PartyPopper, CarFront } from 'lucide-react';

interface DriverRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const inputCls =
  'w-full rounded-input border border-rule bg-paper px-4 py-3 text-sm font-bold text-ink transition duration-220 ease-out placeholder:font-medium placeholder:text-ink-2/70 hover:border-ink-2/50 focus:border-accent';
const labelCls = 'mb-1.5 block text-xs font-extrabold uppercase tracking-[0.06em] text-ink-2';

const PITCH: { key: DictKey; tint: string }[] = [
  { key: 'reg.pitch1', tint: 'bg-sky-soft' },
  { key: 'reg.pitch2', tint: 'bg-leaf-soft' },
  { key: 'reg.pitch3', tint: 'bg-berry-soft' },
];

export const DriverRegisterModal: React.FC<DriverRegisterModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    driverName: '',
    nickname: '',
    phone: '',
    lineId: '',
    vehicleModel: 'Toyota Commuter',
    seats: '9',
    zone: 'ตัวเมืองเชียงใหม่',
    amenities: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div
      className="td-scrim-enter fixed inset-0 z-400 flex items-center justify-center overflow-y-auto bg-ink/60 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('reg.aria')}
        onClick={(e) => e.stopPropagation()}
        className="td-modal-enter relative my-8 grid w-full max-w-3xl grid-cols-1 overflow-hidden rounded-modal bg-card md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
      >
        <button
          onClick={onClose}
          aria-label={t('reg.close')}
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-card text-ink transition-transform duration-220 ease-spring"
        >
          <X className="h-5 w-5" aria-hidden="true" strokeWidth={2.5} />
        </button>

        <div className="td-dots min-w-0 bg-sun-soft p-5 sm:p-7">
          <p className="inline-flex items-center gap-1.5 rounded-pill bg-card px-3 py-1.5 text-xs font-extrabold text-ink">
            <CarFront className="h-3.5 w-3.5 text-accent-deep" aria-hidden="true" strokeWidth={2.5} />
            {t('reg.partner')}
          </p>
          <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight text-ink">
            {t('reg.title')}
          </h2>
          <p className="mt-1 text-sm font-bold text-ink-2">{t('reg.subtitle')}</p>
          <ul className="mt-5 flex flex-col gap-2.5">
            {PITCH.map((point) => (
              <li key={point.key} className="flex items-center gap-2.5 rounded-input border border-rule bg-card px-3 py-2.5 text-[13px] font-bold leading-snug text-ink">
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${point.tint}`}>
                  <Check className="h-3.5 w-3.5 text-ink" aria-hidden="true" strokeWidth={3} />
                </span>
                {t(point.key)}
              </li>
            ))}
          </ul>
          <p className="mt-5 flex items-start gap-2 rounded-input bg-card/70 p-3 text-xs font-medium leading-relaxed text-ink-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-leaf" aria-hidden="true" />
            {t('reg.verifyNote')}
          </p>
        </div>

        <div className="max-h-[85vh] min-w-0 overflow-y-auto p-5 sm:p-7">
          {submitted ? (
            <div className="py-10 text-center">
              <span className="td-wiggle-hover mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-leaf text-white">
                <PartyPopper className="h-8 w-8" aria-hidden="true" />
              </span>
              <h3 className="font-display text-2xl font-extrabold text-ink">
                {t('reg.doneTitle')}
              </h3>
              <p className="mx-auto mt-2 max-w-[45ch] text-sm font-medium leading-relaxed text-ink-2">
                {t('reg.doneDesc')}
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="td-btn mt-5 rounded-pill bg-paper px-4 py-2 text-[13px] font-extrabold text-ink transition-transform duration-220 ease-spring hover:-translate-y-0.5"
              >
                {t('reg.doneMore')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <h3 className="font-display text-xl font-extrabold tracking-tight text-ink">
                {t('reg.formTitle')}
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="td-dname" className={labelCls}>
                    {t('reg.fName')}
                  </label>
                  <input
                    id="td-dname"
                    type="text"
                    required
                    placeholder={t('reg.fNamePh')}
                    value={formData.driverName}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="td-dnick" className={labelCls}>
                    {t('reg.fNick')}
                  </label>
                  <input
                    id="td-dnick"
                    type="text"
                    required
                    placeholder={t('reg.fNickPh')}
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="td-dphone" className={labelCls}>
                    {t('reg.fPhone')}
                  </label>
                  <input
                    id="td-dphone"
                    type="tel"
                    required
                    placeholder="08x-xxx-xxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="td-dline" className={labelCls}>
                    {t('reg.fLine')}
                  </label>
                  <input
                    id="td-dline"
                    type="text"
                    required
                    placeholder={t('reg.fLinePh')}
                    value={formData.lineId}
                    onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="td-dmodel" className={labelCls}>
                    {t('reg.fModel')}
                  </label>
                  <select
                    id="td-dmodel"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                    className={inputCls}
                  >
                    <option value="Toyota Commuter D4D">Toyota Commuter D4D</option>
                    <option value="All New Commuter">{t('reg.modelLong')}</option>
                    <option value="Toyota Majesty">Toyota Majesty</option>
                    <option value="Hyundai H1 / Staria">Hyundai H1 / Staria</option>
                    <option value="Alphard / Vellfire">Toyota Alphard / Vellfire</option>
                    <option value="SUV / รถเช่าขับเอง">{t('reg.modelSuv')}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="td-dseats" className={labelCls}>
                    {t('reg.fSeats')}
                  </label>
                  <select
                    id="td-dseats"
                    value={formData.seats}
                    onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                    className={inputCls}
                  >
                    <option value="7">{t('reg.seats7')}</option>
                    <option value="9">{t('reg.seats9')}</option>
                    <option value="10">{t('reg.seats10')}</option>
                    <option value="13">{t('reg.seats13')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="td-damen" className={labelCls}>
                  {t('reg.fAmen')}
                </label>
                <input
                  id="td-damen"
                  type="text"
                  placeholder={t('reg.fAmenPh')}
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  className={inputCls}
                />
              </div>

              <button
                type="submit"
                data-burst
                className="td-btn td-pop inline-flex w-full items-center justify-center gap-2 rounded-pill bg-accent px-4 py-3.5 text-sm font-extrabold text-accent-ink"
              >
                <Send className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
                {t('reg.submit')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
