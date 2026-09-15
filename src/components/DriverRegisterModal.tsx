'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import type { DictKey } from '@/i18n/dictionaries';
import { X, Check, ShieldCheck, Send, PartyPopper, CarFront, Loader2 } from 'lucide-react';
import { VEHICLE_CATEGORY_GROUPS } from '@/data/vehicleModels';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    driverName: '',
    nickname: '',
    phone: '',
    lineId: '',
    vehicleModel: 'Toyota Commuter',
    seats: '9',
    zone: 'ตัวเมืองเชียงใหม่',
    amenities: '',
    plateType: 'yellow' as 'yellow' | 'blue',
    plateNumber: '',
    canIssueTaxInvoice: false,
    businessType: 'individual' as 'company' | 'individual',
  });
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelText, setCustomModelText] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const finalModel = isCustomModel && customModelText.trim() ? customModelText.trim() : formData.vehicleModel;
    try {
      await fetch('/api/leads/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          vehicleModel: finalModel,
        }),
      });
    } catch (err) {
      console.error('Submit driver error:', err);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
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
                    {t('reg.fModel')} (เลือกรุ่นรถ)
                  </label>
                  <select
                    id="td-dmodel"
                    value={isCustomModel ? 'custom' : formData.vehicleModel}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomModel(true);
                      } else {
                        setIsCustomModel(false);
                        setFormData({ ...formData, vehicleModel: e.target.value });
                      }
                    }}
                    className={inputCls}
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
                    <option value="custom">⚡ อื่นๆ (พิมพ์ระบุรุ่นรถเอง)</option>
                  </select>

                  {isCustomModel && (
                    <input
                      type="text"
                      required
                      placeholder="พิมพ์ระบุยี่ห้อและรุ่นรถของคุณ เช่น Ford Transit VIP"
                      value={customModelText}
                      onChange={(e) => setCustomModelText(e.target.value)}
                      className={`${inputCls} mt-2 text-accent focus:border-accent`}
                    />
                  )}
                </div>

                <div>
                  <label htmlFor="td-dseats" className={labelCls}>
                    {t('reg.fSeats')} (จำนวนที่นั่งผู้โดยสาร)
                  </label>
                  <select
                    id="td-dseats"
                    value={formData.seats}
                    onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                    className={inputCls}
                  >
                    <option value="4">4 ที่นั่ง (Sedan / รถเก๋ง / Eco Car)</option>
                    <option value="5">5 ที่นั่ง (Sedan ผู้บริหาร / Compact SUV)</option>
                    <option value="7">7 ที่นั่ง (VIP MPV / SUV 7 ที่นั่ง)</option>
                    <option value="8">8 ที่นั่ง (Van / MPV เบาะกว้าง)</option>
                    <option value="9">9 ที่นั่ง (VIP Van เบาะ 3 แถวยอดนิยม)</option>
                    <option value="10">10 ที่นั่ง (VIP Commuter / Staria)</option>
                    <option value="11">11 ที่นั่ง (H-1 / Majesty / Commuter)</option>
                    <option value="13">13 ที่นั่ง (Commuter เบาะ 4 แถวมาตรฐาน)</option>
                    <option value="14">14 ที่นั่ง (Commuter / HiAce จุคนเยอะ)</option>
                    <option value="20">20 ที่นั่ง (มินิบัส Coaster / Hino ท่องเที่ยว)</option>
                    <option value="24">24 ที่นั่ง (มินิบัสขนาดใหญ่ / กรุ๊ปสัมมนา)</option>
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

              {/* License Plate Type & Tax Capability */}
              <div className="rounded-input border border-rule bg-card/60 p-3.5 space-y-3">
                <div>
                  <label className={labelCls}>ประเภทป้ายทะเบียน / การรับงาน</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, plateType: 'yellow' })}
                      className={`p-2.5 rounded-input border text-left text-xs font-bold transition-all ${
                        formData.plateType === 'yellow'
                          ? 'border-amber-400 bg-amber-50 text-amber-950 ring-1 ring-amber-400'
                          : 'border-rule bg-paper text-ink-2 hover:text-ink'
                      }`}
                    >
                      <span className="block text-amber-900 font-extrabold">🟡 ป้ายเหลือง 30</span>
                      <span className="block text-[10px] text-amber-800/80 font-normal mt-0.5">
                        รับงานองค์กร / ราชการ / บริษัท
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, plateType: 'blue' })}
                      className={`p-2.5 rounded-input border text-left text-xs font-bold transition-all ${
                        formData.plateType === 'blue'
                          ? 'border-blue-400 bg-blue-50 text-blue-950 ring-1 ring-blue-400'
                          : 'border-rule bg-paper text-ink-2 hover:text-ink'
                      }`}
                    >
                      <span className="block text-blue-900 font-extrabold">🔵 ป้ายฟ้า (ส่วนบุคคล)</span>
                      <span className="block text-[10px] text-blue-800/80 font-normal mt-0.5">
                        รับงานบุคคล / ครอบครัว / ท่องเที่ยว
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="td-dplate" className={labelCls}>
                    หมายเลขทะเบียนรถ
                  </label>
                  <input
                    id="td-dplate"
                    type="text"
                    placeholder="เช่น 30-1234 เชียงใหม่ หรือ นข-5678"
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                    className={inputCls}
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={formData.canIssueTaxInvoice}
                    onChange={(e) => setFormData({ ...formData, canIssueTaxInvoice: e.target.checked })}
                    className="rounded border-rule text-accent focus:ring-accent h-4 w-4"
                  />
                  <span className="text-xs font-bold text-ink">
                    🏢 สามารถออกใบเสร็จรับเงิน / ใบกำกับภาษีได้
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="td-btn td-pop inline-flex w-full items-center justify-center gap-2 rounded-pill bg-accent disabled:opacity-60 px-4 py-3.5 text-sm font-extrabold text-accent-ink"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>กำลังบันทึกข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
                    {t('reg.submit')}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
