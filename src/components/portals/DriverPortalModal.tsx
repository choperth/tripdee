'use client';

import React, { useState, useRef } from 'react';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import { X, CarFront, LogOut, Check, Star } from 'lucide-react';
import { VehiclePhotoManager } from '@/components/portals/VehiclePhotoManager';
import { DangerZone } from '@/components/portals/DangerZone';
import { DriverAvailabilityCalendar } from '@/components/portals/DriverAvailabilityCalendar';

interface DriverPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DriverPortalModal: React.FC<DriverPortalModalProps> = ({ isOpen, onClose }) => {
  const { user, toggleDriverAvailability, updateDriverProfile, logout, deleteAccount } = useAuth();
  const { t } = useLanguage();
  const { trackCall } = useAnalytics();
  const [activeTab, setActiveTab] = useState<'profile' | 'verification' | 'jobs'>('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [nickname, setNickname] = useState(user?.driverNickname || '');
  const [phone, setPhone] = useState(user?.emailOrPhone || '');
  const [lineId, setLineId] = useState(user?.lineId || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [wechat, setWechat] = useState(user?.wechat || '');
  const [kakao, setKakao] = useState(user?.kakao || '');
  const [vehicleTitle, setVehicleTitle] = useState(user?.vehicleTitle || '');
  const [vehiclePlate, setVehiclePlate] = useState(user?.vehiclePlate || '');
  const [seats, setSeats] = useState(user?.seats || 9);
  const [images, setImages] = useState<string[]>(
    Array.isArray(user?.images) && user.images.length > 0
      ? user.images
      : ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80']
  );
  const [busyDates, setBusyDates] = useState<string[]>(
    Array.isArray(user?.busyDates) ? user.busyDates : []
  );

  const [featuredRequested, setFeaturedRequested] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, { onClose, enabled: isOpen });

  if (!isOpen || !user) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateDriverProfile({
      driverNickname: nickname,
      emailOrPhone: phone,
      lineId,
      whatsapp: whatsapp.trim() || undefined,
      wechat: wechat.trim() || undefined,
      kakao: kakao.trim() || undefined,
      vehicleTitle,
      vehiclePlate,
      seats: Number(seats),
      images,
      busyDates,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleRequestFeatured = (e: React.FormEvent) => {
    e.preventDefault();
    setFeaturedRequested(true);
    setTimeout(() => {
      setSaveSuccess(true);
    }, 400);
  };

  const isVerified = user.verificationStatus === 'verified';

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="driver-portal-title"
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="td-elev-lift relative w-full max-w-2xl rounded-modal bg-card p-6 sm:p-8 text-ink my-6 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label={t('pdrv.close')}
          className="absolute top-5 right-5 grid h-9 w-9 place-items-center rounded-full bg-paper-2 text-ink transition-transform"
        >
          <X className="h-4.5 w-4.5" strokeWidth={2.5} />
        </button>

        {/* Portal Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pr-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-accent-ink font-extrabold">
                <CarFront className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <div>
                <h2 id="driver-portal-title" className="font-display text-2xl font-extrabold text-ink">
                  {t('pdrv.title')}
                </h2>
                <p className="text-xs font-bold text-ink-2">
                  {user.name} ({user.driverNickname || t('pdrv.noNick')})
                </p>
              </div>
            </div>
          </div>

          {/* Availability Toggle Button */}
          <button
            type="button"
            onClick={toggleDriverAvailability}
            className={`td-btn td-pop inline-flex items-center gap-2 rounded-pill px-4 py-2 text-xs font-extrabold transition-colors ${
              user.isAvailable
                ? 'bg-leaf text-white'
                : 'bg-paper-2 text-ink-2'
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${user.isAvailable ? 'bg-white animate-pulse' : 'bg-ink-2'}`} />
            <span>{user.isAvailable ? t('pdrv.availOn') : t('pdrv.availOff')}</span>
          </button>
        </div>

        {/* Verification Status Banner */}
        <div
          className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 ${
            isVerified
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-300/60'
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border border-blue-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-card text-ink">
              {isVerified ? (
                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
              ) : (
                <CarFront className="h-5 w-5 text-blue-600" strokeWidth={2.5} />
              )}
            </span>
            <div>
              <p className="text-sm font-extrabold">
                {isVerified ? t('pdrv.verTitleOk') : t('pdrv.verTitleNone')}
              </p>
              <p className="text-xs font-medium text-ink-2">
                {isVerified ? t('pdrv.verDescOk') : t('pdrv.verDescNone')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('verification')}
            className="td-btn rounded-pill bg-card px-3.5 py-1.5 text-xs font-extrabold text-ink hover:bg-paper-2 shadow-xs"
          >
            {isVerified ? t('pdrv.viewDocs') : t('pdrv.uploadDocs')}
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="mb-6 flex gap-2 border-b-2 border-rule pb-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`rounded-pill px-4 py-1.5 text-xs font-extrabold transition-colors ${
              activeTab === 'profile' ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'
            }`}
          >
            {t('pdrv.tabProfile')}
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`rounded-pill px-4 py-1.5 text-xs font-extrabold transition-colors ${
              activeTab === 'verification' ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'
            }`}
          >
            {t('pdrv.tabVerif')}
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`rounded-pill px-4 py-1.5 text-xs font-extrabold transition-colors ${
              activeTab === 'jobs' ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'
            }`}
          >
            {t('pdrv.tabJobs')}
          </button>
        </div>

        {/* Tab 1: Profile & Vehicle Details */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* 1.1 Driver Photo Manager */}
            <VehiclePhotoManager
              images={images}
              onChange={setImages}
              maxPhotos={8}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="drv-nick" className="mb-1 block text-xs font-extrabold uppercase text-ink-2">
                  {t('pdrv.fNick')}
                </label>
                <input
                  id="drv-nick"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={t('pdrv.fNickPh')}
                  className="w-full rounded-input bg-paper px-3 py-2.5 text-sm font-bold text-ink focus:border-accent"
                />
              </div>

              <div>
                <label htmlFor="drv-phone" className="mb-1 block text-xs font-extrabold uppercase text-ink-2">
                  {t('pdrv.fPhone')}
                </label>
                <input
                  id="drv-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08x-xxx-xxxx"
                  className="w-full rounded-input bg-paper px-3 py-2.5 text-sm font-bold text-ink focus:border-accent"
                />
              </div>

              <div>
                <label htmlFor="drv-line" className="mb-1 block text-xs font-extrabold uppercase text-ink-2">
                  {t('pdrv.fLine')}
                </label>
                <input
                  id="drv-line"
                  type="text"
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                  placeholder={t('pdrv.fLinePh')}
                  className="w-full rounded-input bg-paper px-3 py-2.5 text-sm font-bold text-ink focus:border-accent"
                />
              </div>

              <div>
                <label htmlFor="drv-whatsapp" className="mb-1 block text-xs font-extrabold uppercase text-ink-2">
                  {t('pdrv.fWhatsapp')}
                </label>
                <input
                  id="drv-whatsapp"
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder={t('pdrv.fWhatsappPh')}
                  className="w-full rounded-input bg-paper px-3 py-2.5 text-sm font-bold text-ink focus:border-accent"
                />
              </div>

              <div>
                <label htmlFor="drv-wechat" className="mb-1 block text-xs font-extrabold uppercase text-ink-2">
                  {t('pdrv.fWechat')}
                </label>
                <input
                  id="drv-wechat"
                  type="text"
                  value={wechat}
                  onChange={(e) => setWechat(e.target.value)}
                  placeholder={t('pdrv.fWechatPh')}
                  className="w-full rounded-input bg-paper px-3 py-2.5 text-sm font-bold text-ink focus:border-accent"
                />
              </div>

              <div>
                <label htmlFor="drv-kakao" className="mb-1 block text-xs font-extrabold uppercase text-ink-2">
                  {t('pdrv.fKakao')}
                </label>
                <input
                  id="drv-kakao"
                  type="text"
                  value={kakao}
                  onChange={(e) => setKakao(e.target.value)}
                  placeholder={t('pdrv.fKakaoPh')}
                  className="w-full rounded-input bg-paper px-3 py-2.5 text-sm font-bold text-ink focus:border-accent"
                />
              </div>

              <div>
                <label htmlFor="drv-plate" className="mb-1 block text-xs font-extrabold uppercase text-ink-2">
                  {t('pdrv.fPlate')}
                </label>
                <input
                  id="drv-plate"
                  type="text"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder={t('pdrv.fPlatePh')}
                  className="w-full rounded-input bg-paper px-3 py-2.5 text-sm font-bold text-ink focus:border-accent"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="drv-vehicle" className="mb-1 block text-xs font-extrabold uppercase text-ink-2">
                  {t('pdrv.fVehicle')}
                </label>
                <input
                  id="drv-vehicle"
                  type="text"
                  value={vehicleTitle}
                  onChange={(e) => setVehicleTitle(e.target.value)}
                  placeholder={t('pdrv.fVehiclePh')}
                  className="w-full rounded-input bg-paper px-3 py-2.5 text-sm font-bold text-ink focus:border-accent"
                />
              </div>

              <div>
                <label htmlFor="drv-seats" className="mb-1 block text-xs font-extrabold uppercase text-ink-2">
                  {t('pdrv.fSeats')}
                </label>
                <select
                  id="drv-seats"
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  className="w-full rounded-input bg-paper px-3 py-2.5 text-sm font-bold text-ink focus:border-accent"
                >
                  <option value={7}>{t('pdrv.seats7')}</option>
                  <option value={9}>{t('pdrv.seats9')}</option>
                  <option value={10}>{t('pdrv.seats10')}</option>
                  <option value={13}>{t('pdrv.seats13')}</option>
                </select>
              </div>
            </div>

            {/* 1.3 Driver Availability & Schedule Calendar */}
            <div className="pt-2">
              <DriverAvailabilityCalendar
                busyDates={busyDates}
                onChange={setBusyDates}
              />
            </div>

            {saveSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-leaf-soft p-3 text-xs font-extrabold text-leaf">
                <Check className="h-4 w-4" strokeWidth={3} />
                <span>{t('pdrv.saved')}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                className="td-btn td-pop rounded-pill bg-sun px-6 py-2.5 text-sm font-extrabold text-sun-ink"
              >
                {t('pdrv.saveBtn')}
              </button>

              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-berry hover:underline"
              >
                <LogOut className="h-4 w-4" />
                <span>{t('pdrv.logout')}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Featured Perks & Promotion */}
        {activeTab === 'verification' && (
          <form onSubmit={handleRequestFeatured} className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-transparent border border-amber-400/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-extrabold text-sm">
                <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                <span>{t('pdrv.verIntroB')}</span>
              </div>
              <p className="text-xs text-ink-2 font-medium leading-relaxed">
                {t('pdrv.verIntroA')} {t('pdrv.verIntroB')} {t('pdrv.verIntroC')}
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-rule bg-paper p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-navy-deep dark:text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-500">arrow_upward</span>
                    <span>{t('pdrv.doc1')}</span>
                  </span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{t('pdrv.hasData')}</span>
                </div>
                <p className="text-xs text-ink-2">{t('pdrv.doc1Ph')}</p>
              </div>

              <div className="rounded-2xl border border-rule bg-paper p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-navy-deep dark:text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-500">hotel_class</span>
                    <span>{t('pdrv.doc2')}</span>
                  </span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{t('pdrv.hasData')}</span>
                </div>
                <p className="text-xs text-ink-2">{t('pdrv.doc2Ph')}</p>
              </div>
            </div>

            {featuredRequested ? (
              <div className="rounded-xl bg-amber-100 dark:bg-amber-950/60 p-4 text-center font-extrabold text-amber-900 dark:text-amber-200 text-xs border border-amber-300">
                {t('pdrv.docsSent')}
              </div>
            ) : (
              <button
                type="submit"
                className="td-btn td-pop flex w-full items-center justify-center gap-2 rounded-pill bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 py-3 px-4 text-sm font-extrabold text-white shadow-md transition-all cursor-pointer"
              >
                <Star className="h-4 w-4 fill-white text-white" />
                <span>{t('pdrv.docsSubmit')}</span>
              </button>
            )}
          </form>
        )}

        {/* Tab 3: Incoming Leads Feed */}
        {activeTab === 'jobs' && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-ink-2">
              {t('pdrv.jobsIntro')}
            </p>

            <div className="rounded-2xl bg-paper p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="rounded-pill bg-sky-soft px-2.5 py-0.5 text-xs font-extrabold text-sky">
                  {t('pdrv.jobCorp')}
                </span>
                <span className="text-xs font-bold text-ink-2">{t('pdrv.jobDate1')}</span>
              </div>
              <h4 className="font-bold text-sm text-ink mb-1">
                {t('pdrv.jobTitle1')}
              </h4>
              <p className="text-xs text-ink-2 mb-3">
                {t('pdrv.jobDesc1')}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-rule">
                <span className="font-extrabold text-sm text-accent-deep">{t('pdrv.jobBudget1')}</span>
                <a
                  href="tel:0812345678"
                  onClick={() => {
                    trackCall({
                      targetType: 'driver_job',
                      targetId: 'job-sem-01',
                      targetTitle: 'งานสัมมนาบริษัท เชียงใหม่-เชียงราย',
                      phoneNumber: '0812345678',
                    });
                  }}
                  className="td-btn rounded-pill bg-sun px-3.5 py-1 text-xs font-extrabold text-sun-ink"
                >
                  {t('pdrv.jobAccept')}
                </a>
              </div>
            </div>

            <div className="rounded-2xl bg-paper p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="rounded-pill bg-leaf-soft px-2.5 py-0.5 text-xs font-extrabold text-leaf">
                  {t('pdrv.jobFamily')}
                </span>
                <span className="text-xs font-bold text-ink-2">{t('pdrv.jobDate2')}</span>
              </div>
              <h4 className="font-bold text-sm text-ink mb-1">
                {t('pdrv.jobTitle2')}
              </h4>
              <p className="text-xs text-ink-2 mb-3">
                {t('pdrv.jobDesc2')}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-rule">
                <span className="font-extrabold text-sm text-accent-deep">{t('pdrv.jobBudget2')}</span>
                <a
                  href="tel:0812345678"
                  onClick={() => {
                    trackCall({
                      targetType: 'driver_job',
                      targetId: 'job-fam-02',
                      targetTitle: 'ทริปครอบครัว ม่อนแจ่ม-แม่ริม',
                      phoneNumber: '0812345678',
                    });
                  }}
                  className="td-btn rounded-pill bg-sun px-3.5 py-1 text-xs font-extrabold text-sun-ink"
                >
                  {t('pdrv.jobAccept')}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* 1.2 Danger Zone: Self-Service Account & Vehicle Deletion (PDPA) */}
        <div className="mt-6 pt-5 border-t border-rule/60">
          <DangerZone
            targetName={user.vehicleTitle ? `${user.vehicleTitle} (${user.name})` : user.name}
            title={t('danger.title')}
            description={t('danger.driverDesc')}
            buttonLabel={t('danger.deleteBtn')}
            onDelete={async () => {
              await deleteAccount();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};
