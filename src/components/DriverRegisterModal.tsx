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
    serviceType: 'with_driver' as 'with_driver' | 'self_drive',
    driverName: '',
    nickname: '',
    phone: '',
    lineId: '',
    vehicleModel: 'Toyota Commuter',
    seats: '9',
    zone: 'ตัวเมืองเชียงใหม่',
    pickupLocation: '',
    depositTerms: '',
    amenities: '',
    plateType: 'yellow' as 'yellow' | 'blue',
    plateNumber: '',
    canIssueTaxInvoice: false,
    businessType: 'individual' as 'company' | 'individual',
  });
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelText, setCustomModelText] = useState('');

  // Honeypot anti-spam fields
  const [hpWebsite, setHpWebsite] = useState('');
  const [formMountedAt, setFormMountedAt] = useState<number>(Date.now());

  useEffect(() => {
    if (!isOpen) return;
    setFormMountedAt(Date.now());
    setHpWebsite('');
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
          hp_website: hpWebsite,
          _hp_timestamp: formMountedAt,
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
        className="td-modal-enter relative my-6 grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-2xl bg-card border border-rule shadow-2xl md:grid-cols-[290px_1fr]"
      >
        <button
          onClick={onClose}
          aria-label={t('reg.close')}
          className="absolute right-3.5 top-3.5 z-10 grid h-9 w-9 place-items-center rounded-full bg-paper/90 text-ink-2 shadow-2xs hover:bg-paper hover:text-ink transition-transform duration-220 ease-spring"
        >
          <X className="h-5 w-5" aria-hidden="true" strokeWidth={2.5} />
        </button>

        {/* Left Column: Compact Benefits & Trust Info */}
        <div className="td-dots min-w-0 bg-sun-soft/50 p-6 sm:p-7 flex flex-col justify-between border-b md:border-b-0 md:border-r border-rule">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-pill bg-card px-3 py-1.5 text-xs font-extrabold text-ink shadow-2xs border border-rule/50">
              <CarFront className="h-3.5 w-3.5 text-accent-deep" aria-hidden="true" strokeWidth={2.5} />
              {t('reg.partner')}
            </p>
            <h2 className="mt-3.5 font-display text-2xl font-black leading-tight tracking-tight text-ink">
              {t('reg.title')}
            </h2>
            <p className="mt-1.5 text-xs font-bold leading-relaxed text-ink-2">
              {t('reg.subtitle')}
            </p>

            <ul className="mt-6 flex flex-col gap-2.5">
              {PITCH.map((point) => (
                <li
                  key={point.key}
                  className="flex items-center gap-2.5 rounded-xl border border-rule/70 bg-card/90 px-3 py-2.5 text-xs font-bold leading-snug text-ink shadow-2xs"
                >
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${point.tint}`}>
                    <Check className="h-3 w-3 text-ink" aria-hidden="true" strokeWidth={3} />
                  </span>
                  <span>{t(point.key)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 pt-5 border-t border-rule/70">
            <div className="rounded-xl bg-card/80 p-3 text-[11px] font-semibold leading-relaxed text-ink-2 border border-rule/50 flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-leaf" aria-hidden="true" />
              <span>{t('reg.verifyNote')}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-ink-2 px-1">
              <span>⚡ ไม่มีสัญญาผูกมัด</span>
              <span>🔒 ปลอดภัย 100%</span>
            </div>
          </div>
        </div>

        {/* Right Column: Form with Balanced Spacing */}
        <div className="max-h-[85vh] min-w-0 overflow-y-auto p-6 sm:p-8">
          {submitted ? (
            <div className="py-12 text-center">
              <span className="td-wiggle-hover mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-leaf text-white shadow-sm">
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
                className="td-btn mt-6 rounded-pill bg-accent px-5 py-2.5 text-xs font-extrabold text-white transition-transform duration-220 ease-spring hover:-translate-y-0.5 shadow-xs"
              >
                {t('reg.doneMore')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative">
              {/* Honeypot Spam Trap (Hidden from real users, filled by bots) */}
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

              <div>
                <h3 className="font-display text-xl font-black tracking-tight text-ink">
                  {t('reg.formTitle')}
                </h3>
                <p className="mt-0.5 text-xs font-semibold text-ink-2">
                  กรอกข้อมูลรถและช่องทางติดต่อเพื่อเริ่มรับงานตรง
                </p>
              </div>

              {/* Section 1: Service Type Switch */}
              <div className="rounded-xl border border-rule bg-card/60 p-3">
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-ink-2">
                  1. เลือกรูปแบบบริการของคุณ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        serviceType: 'with_driver',
                        vehicleModel: 'Toyota Commuter D4D (หลังคาสูง 9-13 ที่นั่ง)',
                        plateType: 'yellow',
                      })
                    }
                    className={`p-2.5 sm:p-3 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 text-center ${
                      formData.serviceType === 'with_driver'
                        ? 'bg-accent text-white shadow-xs ring-2 ring-accent/30'
                        : 'bg-paper text-ink-2 hover:text-ink border border-rule/60'
                    }`}
                  >
                    <span className="text-sm">🚐 รถพร้อมคนขับ / รถตู้</span>
                    <span className={`text-[10px] font-medium ${formData.serviceType === 'with_driver' ? 'text-white/80' : 'text-ink-2'}`}>
                      มีคนขับคอยให้บริการนำเที่ยว
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        serviceType: 'self_drive',
                        vehicleModel: 'Toyota Yaris Ativ / Honda City (Sedan Eco Car)',
                        plateType: 'blue',
                      })
                    }
                    className={`p-2.5 sm:p-3 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-1 text-center ${
                      formData.serviceType === 'self_drive'
                        ? 'bg-accent text-white shadow-xs ring-2 ring-accent/30'
                        : 'bg-paper text-ink-2 hover:text-ink border border-rule/60'
                    }`}
                  >
                    <span className="text-sm">🚗 รถเช่าขับเอง (Self-Drive)</span>
                    <span className={`text-[10px] font-medium ${formData.serviceType === 'self_drive' ? 'text-white/80' : 'text-ink-2'}`}>
                      ลูกค้าเช่ารถขับท่องเที่ยวเอง
                    </span>
                  </button>
                </div>
              </div>

              {/* Section 2: Contact Information */}
              <div className="rounded-xl border border-rule bg-card/60 p-3.5 sm:p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-ink-2">
                    2. ข้อมูลผู้ให้บริการ & ช่องทางติดต่อ
                  </label>
                  <span className="text-[10px] font-bold text-leaf">🔒 เซ็นเซอร์นามสกุลอัตโนมัติ</span>
                </div>

                {formData.serviceType === 'with_driver' ? (
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="td-dname" className={labelCls}>
                        {t('reg.fName')} (ชื่อจริงคนขับ)
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
                        {t('reg.fNick')} (ชื่อเรียกหน้าเว็บ)
                      </label>
                      <input
                        id="td-dnick"
                        type="text"
                        required
                        placeholder="เช่น พี่ชัย รถตู้เชียงใหม่"
                        value={formData.nickname}
                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="td-dname" className={labelCls}>
                      ชื่อร้าน / บริษัทรถเช่า หรือ ชื่อเจ้าของรถ
                    </label>
                    <input
                      id="td-dname"
                      type="text"
                      required
                      placeholder="เช่น เชียงใหม่ คาร์เร้นท์ หรือ คุณสมชาย รถเช่า"
                      value={formData.driverName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          driverName: e.target.value,
                          nickname: e.target.value,
                        })
                      }
                      className={inputCls}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="td-dphone" className={labelCls}>
                      {t('reg.fPhone')} (เบอร์โทรติดต่อตรง)
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
                      {t('reg.fLine')} (LINE ID สำหรับจอง)
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
              </div>

              {/* Section 3: Vehicle Information */}
              <div className="rounded-xl border border-rule bg-card/60 p-3.5 sm:p-4 space-y-3.5">
                <label className="block text-xs font-black uppercase tracking-wider text-ink-2">
                  3. ข้อมูลยานพาหนะ & สิ่งอำนวยความสะดวก
                </label>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
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
                        placeholder="พิมพ์ระบุยี่ห้อและรุ่นรถ เช่น Ford Transit VIP"
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
              </div>

              {/* Section 4: License Plate Type & Operations */}
              <div className="rounded-xl border border-rule bg-card/60 p-3.5 sm:p-4 space-y-3.5">
                <label className="block text-xs font-black uppercase tracking-wider text-ink-2">
                  4. ประเภทป้ายทะเบียน & เงื่อนไขการให้บริการ
                </label>

                <div>
                  <label className={labelCls}>ประเภทป้ายทะเบียน / รูปแบบรถ</label>
                  {formData.serviceType === 'with_driver' ? (
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, plateType: 'yellow' })}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
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
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
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
                  ) : (
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, plateType: 'yellow' })}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                          formData.plateType === 'yellow'
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-400'
                            : 'border-rule bg-paper text-ink-2 hover:text-ink'
                        }`}
                      >
                        <span className="block text-emerald-900 font-extrabold">🟢 ป้ายเขียว (รถบริการธุรกิจ)</span>
                        <span className="block text-[10px] text-emerald-800/80 font-normal mt-0.5">
                          รถเช่าเชิงพาณิชย์ถูกต้องตามกฎหมาย
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, plateType: 'blue' })}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                          formData.plateType === 'blue'
                            ? 'border-slate-400 bg-slate-100 text-slate-950 ring-1 ring-slate-400'
                            : 'border-rule bg-paper text-ink-2 hover:text-ink'
                        }`}
                      >
                        <span className="block text-slate-900 font-extrabold">⚪ ป้ายขาว (รถยนต์ส่วนบุคคล)</span>
                        <span className="block text-[10px] text-slate-800/80 font-normal mt-0.5">
                          รถบ้านปล่อยเช่า / บุคคลทั่วไป
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {formData.serviceType === 'self_drive' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label htmlFor="td-dpickup" className={labelCls}>
                        จุดรับ - ส่งรถ
                      </label>
                      <input
                        id="td-dpickup"
                        type="text"
                        placeholder="เช่น ส่งฟรีสนามบิน, สถานีรถไฟ, ในเมือง"
                        value={formData.pickupLocation}
                        onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="td-ddeposit" className={labelCls}>
                        เงินมัดจำประกันรถ & เงื่อนไข
                      </label>
                      <input
                        id="td-ddeposit"
                        type="text"
                        placeholder="เช่น มัดจำ 3,000 บ., ไม่ใช้บัตรเครดิต"
                        value={formData.depositTerms}
                        onChange={(e) => setFormData({ ...formData, depositTerms: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="td-dplate" className={labelCls + ' mb-0'}>
                      หมายเลขทะเบียนรถ
                    </label>
                    <span className="text-[10px] font-bold text-accent">🔒 เซ็นเซอร์เป็น 30-xxxx อัตโนมัติ</span>
                  </div>
                  <input
                    id="td-dplate"
                    type="text"
                    placeholder="เช่น 30-1234 เชียงใหม่ หรือ กข-5678"
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
                    🏢 สามารถออกใบเสร็จรับเงิน / ใบกำกับภาษีได้ (สำหรับงานบริษัท/ราชการ)
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="td-btn td-pop inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent disabled:opacity-60 px-4 py-3.5 text-sm font-black text-white shadow-md hover:bg-accent-deep transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>กำลังบันทึกข้อมูลเข้าระบบ...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
                      {t('reg.submit')}
                    </>
                  )}
                </button>
                <p className="mt-2 text-center text-[10px] font-bold text-ink-2">
                  🔒 ข้อมูลของคุณได้รับการปกป้องตามนโยบายความเป็นส่วนตัว TripDee ไม่มีค่าใช้จ่ายแอบแฝง
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
