'use client';

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { X, Check, AlertCircle, RefreshCw, Loader2, MessageCircle, Plus, Pencil } from 'lucide-react';
import { compressImage } from '@/lib/imageCompression';
import { fetchVehicleReviews, calculateReviewStats, Review } from '@/lib/reviewsStore';
import { Vehicle } from '@/data/mockData';
import { DEFAULT_VEHICLE_TERMS, encodeRateNoteWithTerms, parseVehicleTerms } from '@/lib/vehicleTerms';
import { toISODateString, generateDateRange } from '@/lib/availabilityUtils';
import { DriverSmartECardModal } from '@/components/cards/DriverSmartECardModal';

export interface DriverPortalContentProps {
  isModal?: boolean;
  onClose?: () => void;
  initialTab?: 'profile' | 'perks' | 'jobs' | 'reviews';
  /** Opens the free vehicle registration flow for drivers who have no account yet. */
  onOpenRegister?: () => void;
  /** When true, land directly in "add a new fleet vehicle" mode. */
  initialAddVehicle?: boolean;
}

type TabType = 'profile' | 'perks' | 'jobs' | 'reviews';

/** Amenities a driver can tick on their vehicle listing. */
const AMENITY_OPTIONS = [
  { id: 'massage_seat', label: 'เบาะนวดไฟฟ้า' },
  { id: 'wifi', label: 'Wi-Fi ฟรีบนรถ' },
  { id: 'air_purifier', label: 'เครื่องฟอกอากาศ' },
  { id: 'usbc', label: 'ที่ชาร์จ Type-C ทุกที่นั่ง' },
  { id: 'karaoke', label: 'คาราโอเกะ / Smart TV' },
  { id: 'insurance1', label: 'ประกันภัยชั้น 1' },
  { id: 'cooler', label: 'ตู้เย็นขนาดเล็ก' },
  { id: 'luggage', label: 'พื้นที่กระเป๋ากว้าง' },
  { id: 'gps', label: 'GPS ติดตามรถ' },
  { id: 'childseat', label: 'คาร์ซีทสำหรับเด็ก' },
] as const;

export const DriverPortalContent: React.FC<DriverPortalContentProps> = ({
  isModal = false,
  onClose = () => {},
  initialTab = 'profile',
  onOpenRegister,
  initialAddVehicle = false,
}) => {
  const {
    user,
    toggleDriverAvailability,
    updateDriverProfile,
    logout,
    deleteAccount,
    loginWithOAuth,
  } = useAuth();
  const { t, locale } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [showECardModal, setShowECardModal] = useState(false);

  // Driver sign-in gate state (only used while no driver is signed in)
  const [gateError, setGateError] = useState('');
  const [gateOauthLoading, setGateOauthLoading] = useState<'line' | 'google' | null>(null);

  // Form states initialized from user.
  // No demo fallbacks: a brand-new driver must start from a blank form, not
  // from another driver's plate number and phone number.
  const [nickname, setNickname] = useState(user?.driverNickname || user?.name || '');
  const [phone, setPhone] = useState(user?.emailOrPhone || '');
  const [lineId, setLineId] = useState(user?.lineId || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [wechat, setWechat] = useState(user?.wechat || '');
  const [kakao, setKakao] = useState(user?.kakao || '');
  const [vehicleTitle, setVehicleTitle] = useState(user?.vehicleTitle || '');
  const [vehiclePlate, setVehiclePlate] = useState(user?.vehiclePlate || '');
  const [seats, setSeats] = useState(user?.seats || 9);

  // Zone-based day rates the driver sets themselves (baht/day).
  const [rateCity, setRateCity] = useState('');
  const [rateMidHill, setRateMidHill] = useState('');
  const [rateHighHill, setRateHighHill] = useState('');
  const [rateCross, setRateCross] = useState('');
  // Fuel policy: whether the quoted day rate already includes fuel/tolls.
  const [fuelIncluded, setFuelIncluded] = useState(false);
  const [fuelNote, setFuelNote] = useState('');
  // Working hours / OT / overnight-stay terms the driver sets themselves.
  const [workHoursPerDay, setWorkHoursPerDay] = useState(String(DEFAULT_VEHICLE_TERMS.workHoursPerDay));
  const [workStart, setWorkStart] = useState(DEFAULT_VEHICLE_TERMS.workStart);
  const [workEnd, setWorkEnd] = useState(DEFAULT_VEHICLE_TERMS.workEnd);
  const [overtimeRate, setOvertimeRate] = useState(String(DEFAULT_VEHICLE_TERMS.overtimeRatePerHour));
  const [overnightRate, setOvernightRate] = useState(String(DEFAULT_VEHICLE_TERMS.overnightStayRate));

  // Free-form vehicle description and amenity checklist.
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);

  /** True while the driver is composing a brand-new fleet vehicle. */
  const [isAddingNewVehicle, setIsAddingNewVehicle] = useState(initialAddVehicle);

  // Images state
  const [images, setImages] = useState<string[]>(() =>
    Array.isArray(user?.images) ? user.images : []
  );

  const [photoMeta, setPhotoMeta] = useState<Record<number, { name: string; size: string }>>({});

  // Busy Dates state
  const [busyDates, setBusyDates] = useState<string[]>(() =>
    Array.isArray(user?.busyDates) ? user.busyDates : []
  );

  /** Id of the driver's own vehicle row, once we have loaded it. */
  const [vehicleId, setVehicleId] = useState<string>('');
  /** The driver's own vehicle record, the source of truth for the KPI rail. */
  const [ownVehicle, setOwnVehicle] = useState<Vehicle | null>(null);
  /** Every vehicle this driver owns, for the fleet switcher. */
  const [myVehicles, setMyVehicles] = useState<Vehicle[]>([]);
  /** pending = submitted, awaiting admin review; approved = live on the site. */
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | ''>('');
  const [loadError, setLoadError] = useState('');
  const isAvailable = ownVehicle?.isAvailable !== false;
  const isListed = approvalStatus === 'approved' && isAvailable;
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');

  /**
   * Availability has to reach the server: customers read `is_available` from
   * the vehicles table, so a localStorage-only toggle left paused drivers
   * visible in search results while the UI claimed they were hidden.
   */
  const handleToggleAvailability = async () => {
    const next = !isAvailable;
    setAvailabilityError('');
    setIsTogglingAvailability(true);
    try {
      if (vehicleId) {
        const res = await fetch('/api/vehicles', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: vehicleId, isAvailable: next }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.vehicle) {
          throw new Error(
            res.status === 401
              ? 'เซสชันการเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่ด้วย LINE หรือ Google'
              : data.error || 'บันทึกสถานะไม่สำเร็จ'
          );
        }
        setOwnVehicle(data.vehicle);
        setApprovalStatus(data.vehicle.approvalStatus || '');
      } else {
        // No vehicle submitted yet, so there is nothing to publish a state to.
        throw new Error('กรุณาบันทึกข้อมูลรถก่อนจึงจะเปลี่ยนสถานะการรับงานได้');
      }
      toggleDriverAvailability();
      window.dispatchEvent(new CustomEvent('tripdee-vehicles-updated'));
    } catch (err) {
      setAvailabilityError((err as Error).message);
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  // Calendar Interval Form states
  const [intervalStart, setIntervalStart] = useState('');
  const [intervalEnd, setIntervalEnd] = useState('');
  const [intervalNote, setIntervalNote] = useState('');

  // Calendar month view
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));

  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  const userId = user?.id;

  /** Populate every editable form field from a vehicle record. */
  const applyVehicleToForm = useCallback((v: Vehicle) => {
    setNickname(v.driverNickname || v.driverName || '');
    setPhone(v.driverPhone || '');
    setLineId(v.driverLine || '');
    setWhatsapp(v.driverWhatsapp || '');
    setWechat(v.driverWechat || '');
    setKakao(v.driverKakao || '');
    setVehicleTitle(v.title || '');
    setVehiclePlate(v.plateNumber || '');
    setSeats(v.seats || 9);
    setImages(Array.isArray(v.images) ? v.images : []);
    setBusyDates(Array.isArray(v.busyDates) ? v.busyDates : []);
    setRateCity(v.zoneRates?.city ? String(v.zoneRates.city) : '');
    setRateMidHill(v.zoneRates?.midHill ? String(v.zoneRates.midHill) : '');
    setRateHighHill(v.zoneRates?.highHill ? String(v.zoneRates.highHill) : '');
    setRateCross(v.zoneRates?.crossProvince ? String(v.zoneRates.crossProvince) : '');
    const terms = parseVehicleTerms(v);
    setFuelIncluded(terms.fuelIncluded);
    setFuelNote(terms.fuelNote);
    setWorkHoursPerDay(String(terms.workHoursPerDay));
    setWorkStart(terms.workStart);
    setWorkEnd(terms.workEnd);
    setOvertimeRate(String(terms.overtimeRatePerHour));
    setOvernightRate(String(terms.overnightStayRate));
    setDescription(v.description || '');
    setAmenities(Array.isArray(v.amenities) ? v.amenities : []);
  }, []);

  /** Switch the dashboard to one of the driver's existing vehicles. */
  const selectVehicle = (v: Vehicle) => {
    setIsAddingNewVehicle(false);
    setSaveSuccess(false);
    setSaveError('');
    setVehicleId(v.id);
    setOwnVehicle(v);
    setApprovalStatus(v.approvalStatus || '');
    applyVehicleToForm(v);
  };

  /** Reset the form so the driver can add another vehicle to the same account. */
  const startAddNewVehicle = () => {
    setIsAddingNewVehicle(true);
    setActiveTab('profile');
    setSaveSuccess(false);
    setSaveError('');
    setVehicleId('');
    setOwnVehicle(null);
    setApprovalStatus('');
    setNickname(user?.driverNickname || user?.name || '');
    setPhone(user?.emailOrPhone && !user.emailOrPhone.includes('@') ? user.emailOrPhone : phone);
    setLineId(user?.lineId || '');
    setWhatsapp(user?.whatsapp || '');
    setWechat(user?.wechat || '');
    setKakao(user?.kakao || '');
    setVehicleTitle('');
    setVehiclePlate('');
    setSeats(9);
    setImages([]);
    setBusyDates([]);
    setRateCity('');
    setRateMidHill('');
    setRateHighHill('');
    setRateCross('');
    setFuelIncluded(DEFAULT_VEHICLE_TERMS.fuelIncluded);
    setFuelNote(DEFAULT_VEHICLE_TERMS.fuelNote);
    setWorkHoursPerDay(String(DEFAULT_VEHICLE_TERMS.workHoursPerDay));
    setWorkStart(DEFAULT_VEHICLE_TERMS.workStart);
    setWorkEnd(DEFAULT_VEHICLE_TERMS.workEnd);
    setOvertimeRate(String(DEFAULT_VEHICLE_TERMS.overtimeRatePerHour));
    setOvernightRate(String(DEFAULT_VEHICLE_TERMS.overnightStayRate));
    setDescription('');
    setAmenities([]);
  };

  // Keep the latest add-vehicle routine reachable from the navbar CTA without
  // re-subscribing on every keystroke.
  const startAddNewVehicleRef = useRef(startAddNewVehicle);
  useEffect(() => {
    startAddNewVehicleRef.current = startAddNewVehicle;
  });
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ add?: boolean }>).detail;
      if (detail?.add) startAddNewVehicleRef.current();
    };
    window.addEventListener('tripdee-open-driver-portal', handler);
    return () => window.removeEventListener('tripdee-open-driver-portal', handler);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    const loadOwnVehicle = async () => {
      try {
        const res = await fetch('/api/vehicles?scope=mine', { signal: controller.signal });
        if (!res.ok) {
          throw new Error(
            res.status === 401
              ? 'เซสชันการเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่ด้วย LINE หรือ Google'
              : 'โหลดข้อมูลรถจากเซิร์ฟเวอร์ไม่สำเร็จ'
          );
        }
        const data = await res.json();
        if (controller.signal.aborted) return;
        setLoadError('');
        const mine: Vehicle[] = Array.isArray(data.vehicles) ? data.vehicles : [];
        setMyVehicles(mine);

        if (initialAddVehicle) {
          // Arrived via "add fleet vehicle" — keep the form blank for a new car.
          setVehicleId('');
          setOwnVehicle(null);
          setApprovalStatus('');
          return;
        }

        const first = mine[0];
        setVehicleId(first?.id || '');
        setOwnVehicle(first || null);
        setApprovalStatus(first?.approvalStatus || '');
        if (!first) return;
        applyVehicleToForm(first);
      } catch (err) {
        if (controller.signal.aborted) return;
        setVehicleId('');
        setOwnVehicle(null);
        setApprovalStatus('');
        setLoadError(
          (err as Error).message ||
            'โหลดข้อมูลรถจากเซิร์ฟเวอร์ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อหรือเข้าสู่ระบบใหม่'
        );
        console.warn('[TripDee] Failed to load own vehicle:', err);
      }
    };
    void loadOwnVehicle();
    return () => controller.abort();
  }, [userId, initialAddVehicle, applyVehicleToForm]);

  // Reviews for this vehicle, so the KPI rail shows a real score or nothing.
  const [ownReviews, setOwnReviews] = useState<Review[]>([]);
  useEffect(() => {
    if (!vehicleId) return;
    let cancelled = false;
    fetchVehicleReviews(vehicleId).then((loaded) => {
      if (cancelled) return;
      setOwnReviews(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [vehicleId]);
  const reviewsForVehicle = useMemo(
    () => ownReviews.filter((review) => review.vehicleId === vehicleId),
    [ownReviews, vehicleId]
  );
  const reviewStats = useMemo(() => calculateReviewStats(reviewsForVehicle), [reviewsForVehicle]);

  const handleGateOAuth = async (provider: 'line' | 'google') => {
    try {
      setGateOauthLoading(provider);
      setGateError('');
      const res = await loginWithOAuth(provider, 'driver');
      if (!res.success && res.error) setGateError(res.error);
    } catch (err: unknown) {
      setGateError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setGateOauthLoading(null);
    }
  };

  // Drivers sign in through LINE/Google only. The signed session that the
  // vehicles API requires for writes is minted by those OAuth callbacks; a
  // phone number cannot establish it and is shown publicly anyway.
  if (!user || user.role !== 'driver') {
    return (
      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none max-w-lg mx-auto my-12 shadow-sm">
        <div className="text-center mb-6">
          <span className="material-symbols-outlined text-[44px] text-amber-500">badge</span>
          <h2 className="text-lg font-black text-slate-950 dark:text-white mt-1">
            {t('drvGate.title')}
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t('drvGate.desc')}</p>
        </div>

        <div className="space-y-2.5">
          {gateError && (
            <div className="border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{gateError}</span>
            </div>
          )}

          <button
            type="button"
            disabled={!!gateOauthLoading}
            onClick={() => handleGateOAuth('line')}
            className="flex w-full h-12 items-center justify-center gap-2 bg-[#06C755] px-4 text-sm font-black text-white transition-all hover:bg-[#05B04B] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {gateOauthLoading === 'line' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
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
            disabled={!!gateOauthLoading}
            onClick={() => handleGateOAuth('google')}
            className="flex w-full h-12 items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 text-sm font-bold text-slate-800 dark:text-slate-200 transition-all hover:border-slate-950 dark:hover:border-white active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {gateOauthLoading === 'google' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
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

        <p className="mt-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 text-[11px] font-medium leading-relaxed text-slate-600 dark:text-slate-300">
          {t('drvGate.oauthNote')}
        </p>

        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center gap-3">
          {onOpenRegister && (
            <button
              type="button"
              onClick={onOpenRegister}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 underline hover:no-underline transition-colors cursor-pointer"
            >
              {t('auth.driverRegisterLink')}
            </button>
          )}
          {isModal ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-none cursor-pointer transition-colors"
            >
              ปิดหน้าต่าง
            </button>
          ) : (
            <Link
              href="/"
              className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white underline transition-colors"
            >
              กลับหน้าหลัก
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Driver Meta. The code is derived from the vehicle id so it is stable; there
  // is no separately issued driver code in the database yet.
  const driverCode = `TD-VN-${(ownVehicle?.id || user.id || '').replace(/[^0-9]/g, '').slice(-5) || 'NEW'}`;
  const driverDisplayName = user.name || '';
  const driverNick = nickname || user.driverNickname || '';


  // Profile Save — persists to the vehicles table, then mirrors into localStorage.
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanPhone = phone.trim();
    if (cleanPhone.replace(/\D/g, '').length < 9) {
      setSaveError('กรุณากรอกเบอร์โทรศัพท์ที่ติดต่อได้ (อย่างน้อย 9 หลัก)');
      return;
    }
    if (!vehicleTitle.trim()) {
      setSaveError('กรุณากรอกหัวข้อรุ่นรถสำหรับแสดงผลหน้าเว็บ');
      return;
    }
    if (!(driverDisplayName || nickname.trim())) {
      setSaveError('กรุณากรอกชื่อคนขับ');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      const zoneRates: NonNullable<Vehicle['zoneRates']> = {};
      const addRate = (key: keyof NonNullable<Vehicle['zoneRates']>, raw: string) => {
        const n = Number(raw.replace(/[^0-9]/g, ''));
        if (n > 0) zoneRates[key] = n;
      };
      addRate('city', rateCity);
      addRate('midHill', rateMidHill);
      addRate('highHill', rateHighHill);
      addRate('crossProvince', rateCross);

      const payload = {
        id: vehicleId || undefined,
        title: vehicleTitle.trim(),
        type: 'van',
        seats: Number(seats) || 9,
        driverName: driverDisplayName || nickname.trim(),
        driverNickname: nickname.trim(),
        driverPhone: cleanPhone,
        driverLine: lineId.trim() || undefined,
        driverWhatsapp: whatsapp.trim() || undefined,
        driverWechat: wechat.trim() || undefined,
        driverKakao: kakao.trim() || undefined,
        plateNumber: vehiclePlate.trim() || undefined,
        images: images.length > 0 ? images : undefined,
        busyDates,
        description: description.trim() || undefined,
        amenities: amenities.length > 0 ? amenities : undefined,
        rateNote: encodeRateNoteWithTerms({
          workHoursPerDay: Number(workHoursPerDay) || DEFAULT_VEHICLE_TERMS.workHoursPerDay,
          workStart: workStart.trim() || DEFAULT_VEHICLE_TERMS.workStart,
          workEnd: workEnd.trim() || DEFAULT_VEHICLE_TERMS.workEnd,
          overtimeRatePerHour:
            overtimeRate === '' ? DEFAULT_VEHICLE_TERMS.overtimeRatePerHour : Number(overtimeRate),
          overnightStayRate:
            overnightRate === '' ? DEFAULT_VEHICLE_TERMS.overnightStayRate : Number(overnightRate),
          fuelIncluded,
          fuelNote,
        }),
        zoneRates: Object.keys(zoneRates).length > 0 ? zoneRates : undefined,
        // A save without an id is a brand-new vehicle — never recycle the first one.
        forceNew: vehicleId ? undefined : true,
      };

      const res = await fetch('/api/vehicles', {
        method: vehicleId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSaveError(
          res.status === 401
            ? 'เซสชันการเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่ด้วย LINE หรือ Google'
            : data.error || 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
        );
        return;
      }

      if (!data.vehicle?.id) {
        setSaveError('บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        return;
      }
      setVehicleId(data.vehicle.id);
      setOwnVehicle(data.vehicle);
      setApprovalStatus(data.vehicle.approvalStatus || '');
      setMyVehicles((prev) => {
        const idx = prev.findIndex((v) => v.id === data.vehicle.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = data.vehicle;
          return next;
        }
        return [data.vehicle, ...prev];
      });
      setIsAddingNewVehicle(false);

      // Mirror into the local profile so the navbar and portal header render
      // correctly without another round trip.
      updateDriverProfile({
        driverNickname: nickname.trim(),
        emailOrPhone: cleanPhone,
        lineId: lineId.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        wechat: wechat.trim() || undefined,
        kakao: kakao.trim() || undefined,
        vehicleTitle: vehicleTitle.trim(),
        vehiclePlate: vehiclePlate.trim() || undefined,
        seats: Number(seats) || 9,
        images,
        busyDates,
      });

      window.dispatchEvent(new CustomEvent('tripdee-vehicles-updated'));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError((err as Error).message || 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSaving(false);
    }
  };

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, slotIndex?: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const file = files[0];
      const result = await compressImage(file, { maxWidth: 1600, quality: 0.85 });
      const newImages = [...images];
      const targetIdx = slotIndex !== undefined && slotIndex < newImages.length ? slotIndex : newImages.length;
      newImages[targetIdx] = result.dataUrl;
      setImages(newImages);
      setPhotoMeta((prev) => ({
        ...prev,
        [targetIdx]: {
          name: file.name,
          size: `${(result.compressedSize / (1024 * 1024)).toFixed(1)} MB`,
        },
      }));
    } catch {
      // Fallback
    }
  };

  const handleRemoveImage = (index: number) => {
    if (images.length <= 1) {
      alert('จำเป็นต้องมีรูปถ่ายรถยนต์อย่างน้อย 1 รูปสำหรับแสดงผลหน้าเว็บ');
      return;
    }
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
  };

  // Calendar Helpers
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  const todayIso = toISODateString(today);


  const toggleDateBusy = (isoString: string) => {
    if (busyDates.includes(isoString)) {
      setBusyDates(busyDates.filter((d) => d !== isoString));
    } else {
      setBusyDates([...busyDates, isoString].sort());
    }
  };

  const handleAddInterval = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!intervalStart || !intervalEnd) {
      alert('กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด');
      return;
    }
    const dates = generateDateRange(intervalStart, intervalEnd);
    const merged = Array.from(new Set([...busyDates, ...dates])).sort();
    setBusyDates(merged);
    setIntervalStart('');
    setIntervalEnd('');
    setIntervalNote('');
  };

  const monthNamesTh = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const monthDisplayTitle =
    locale === 'en'
      ? `${monthNamesEn[currentMonth]} ${currentYear}`
      : `${monthNamesTh[currentMonth]} ${currentYear + 543} / ${monthNamesEn[currentMonth]} ${currentYear}`;

  return (
    <div
      className={`relative flex flex-col w-full text-slate-900 dark:text-slate-100 ${
        isModal
          ? 'max-h-[96vh] overflow-y-auto rounded-none bg-[#F8FAFC] dark:bg-slate-950 border border-slate-300 dark:border-slate-800 shadow-2xl'
          : ''
      }`}
    >
      {/* ============================================================== */}
      {/* Subtle Architectural Header Scrim / Live Status Strip */}
      {/* ============================================================== */}
      <div
        className={`w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs ${
          isModal ? 'sticky top-0 z-30' : 'mb-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs">
            {isModal ? (
              <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400">
                <span className="material-symbols-outlined text-[16px] text-slate-400">home</span>
                <span>หน้าหลักพาร์ทเนอร์</span>
              </span>
            ) : (
              <Link
                href="/"
                className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <span className="material-symbols-outlined text-[16px] text-slate-400">home</span>
                <span>หน้าแรก TripDee</span>
              </Link>
            )}
            <span className="text-slate-300 dark:text-slate-600 text-[10px]">/</span>
            <span className="font-bold text-slate-950 dark:text-white" id="driver-dashboard-title">
              จัดการข้อมูลคนขับและคิวงาน (เชียงใหม่ & ภาคเหนือ)
            </span>
          </nav>

          {/* Live Node & Close Action */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 text-slate-600 dark:text-slate-300 text-xs">
              <span>{loadError ? 'ไม่สามารถโหลดข้อมูลรถได้' : 'ข้อมูลรถอัปเดตเมื่อบันทึกสำเร็จ'}</span>
            </div>

            {isModal && (
              <button
                type="button"
                onClick={onClose}
                aria-label="ปิดหน้าต่างแดชบอร์ด"
                className="w-8 h-8 rounded-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 grid place-items-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>

        {/* Main Canvas Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
          {/* ============================================================== */}
          {/* 0. Multi-Vehicle Fleet Switcher */}
          {/* ============================================================== */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-slate-950 dark:text-white">garage</span>
                <h2 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white">
                  ฟลีตรถของฉัน ({myVehicles.length} คัน)
                </h2>
              </div>
              <button
                type="button"
                onClick={startAddNewVehicle}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black border border-amber-600 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" strokeWidth={3} />
                <span>เพิ่มรถคันใหม่เข้าฟลีต</span>
              </button>
            </div>

            {myVehicles.length === 0 && !isAddingNewVehicle ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ยังไม่มีรถในฟลีต กดปุ่ม “เพิ่มรถคันใหม่เข้าฟลีต” เพื่อเริ่มต้นลงทะเบียนรถคันแรก
              </p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {myVehicles.map((v) => {
                  const active = !isAddingNewVehicle && v.id === vehicleId;
                  const badge =
                    v.approvalStatus === 'approved'
                      ? { label: 'อนุมัติแล้ว', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
                      : v.approvalStatus === 'rejected'
                        ? { label: 'ไม่ผ่าน', cls: 'bg-rose-50 text-rose-700 border-rose-200' }
                        : v.approvalStatus === 'pending'
                          ? { label: 'รอตรวจ', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
                          : v.isAvailable === false
                            ? { label: 'พักงาน', cls: 'bg-slate-100 text-slate-600 border-slate-200' }
                            : { label: 'พร้อม', cls: 'bg-slate-100 text-slate-600 border-slate-200' };
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => selectVehicle(v)}
                      className={`shrink-0 w-56 text-left p-3 border transition-colors cursor-pointer ${
                        active
                          ? 'border-slate-950 dark:border-white bg-slate-50 dark:bg-slate-800'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-950 dark:text-white truncate">
                          {v.title || 'ไม่ระบุรุ่นรถ'}
                        </span>
                        <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-mono">{v.plateNumber || 'ยังไม่ระบุทะเบียน'}</span>
                        <span>·</span>
                        <span>{v.seats} ที่นั่ง</span>
                      </div>
                      {active && (
                        <span className="mt-1.5 inline-block text-[10px] font-bold text-slate-950 dark:text-white">
                          กำลังดูข้อมูลคันนี้
                        </span>
                      )}
                    </button>
                  );
                })}
                {isAddingNewVehicle && (
                  <div className="shrink-0 w-56 p-3 border border-dashed border-amber-500 bg-amber-50/60 dark:bg-amber-950/20">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">+ กำลังเพิ่มรถคันใหม่</span>
                    <p className="text-[11px] text-slate-500 mt-1">กรอกข้อมูลด้านล่างแล้วกดบันทึกการแก้ไขทั้งหมด</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* 1. Driver Profile Master Bento Module */}
          {/* ============================================================== */}
          <div className="bg-white dark:bg-slate-900 p-6 shadow-xs border border-slate-200 dark:border-slate-800 relative overflow-hidden">
            {/* Top Geometric Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0a192f] via-[#fea619] to-[#06C755]"></div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
              {/* Identity Block */}
              <div className="flex items-start md:items-center gap-4 min-w-0">
                {/* Geometric Avatar */}
                <div className="relative w-16 h-16 bg-[#0d1c32] text-white flex items-center justify-center shrink-0 shadow-xs border border-slate-300 dark:border-slate-700">
                  <span className="material-symbols-outlined text-[32px] text-[#d6e3ff]">
                    airport_shuttle
                  </span>
                  {approvalStatus === 'approved' && (
                    <div className="absolute -bottom-1 -right-1 bg-[#06C755] text-white w-5 h-5 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                    </div>
                  )}
                </div>

                {/* Driver Meta */}
                <div className="flex flex-col min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white truncate">
                      {driverDisplayName} ({driverNick})
                    </h1>
                    {approvalStatus === 'approved' && (
                      <span className="inline-flex items-center gap-1 bg-[#E8F9EE] text-[#06C755] px-2 py-0.5 text-[11px] font-bold tracking-wider border border-emerald-200 dark:border-emerald-800">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        รถผ่านการอนุมัติ
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-slate-900 dark:text-slate-200 font-semibold">
                      รหัส: {driverCode}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
                    <span className="flex items-center gap-1 text-xs">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">
                        location_on
                      </span>
                      พื้นที่ให้บริการ: {ownVehicle?.location || 'ยังไม่มีข้อมูลพื้นที่'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {ownVehicle && (
                  <button
                    type="button"
                    onClick={() => setShowECardModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    title="เปิดดูนามบัตรดิจิทัลและ QR Code ของคุณ (Digital Business Card)"
                  >
                    <span className="material-symbols-outlined text-[18px]">contact_phone</span>
                    <span>นามบัตรดิจิทัลของฉัน</span>
                  </button>
                )}

                {/* Master Availability Toggle Switch */}
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      สถานะการรับงาน
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        isAvailable ? 'text-[#06C755]' : 'text-slate-500'
                      }`}
                    >
                      {isTogglingAvailability
                        ? 'กำลังบันทึก...'
                        : !ownVehicle
                          ? 'ยังไม่มีข้อมูลรถที่บันทึกไว้'
                          : !isAvailable
                            ? 'พักงานชั่วคราว'
                            : isListed
                              ? 'พร้อมรับงาน (แสดงในผลค้นหา)'
                              : 'พร้อมรับงาน (รออนุมัติรถก่อนแสดงผล)'}
                    </span>
                    {availabilityError && (
                      <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                        {availabilityError}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-pressed={isAvailable}
                    onClick={handleToggleAvailability}
                    disabled={isTogglingAvailability || !ownVehicle}
                    className={`relative inline-flex h-8 w-16 items-center transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer disabled:opacity-60 ${
                      isAvailable ? 'bg-[#06C755]' : 'bg-slate-400 dark:bg-slate-600'
                    }`}
                    title="คลิกเพื่อสลับสถานะ ว่าง/พักงาน"
                  >
                    <span
                      className={`inline-block h-6 w-6 transform bg-white transition-transform shadow-xs ${
                        isAvailable ? 'translate-x-9' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* KPI rail — every figure is derived from real records */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-6">
              {/* Rating, from the reviews table */}
              <div className="bg-[#F8FAFC] dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-semibold">
                  <span>คะแนนรีวิวคนขับ</span>
                  <span className="material-symbols-outlined text-[18px] text-[#D97706]">
                    star
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  {reviewStats && reviewStats.totalReviews > 0 ? (
                    <>
                      <span className="text-2xl font-bold font-mono text-slate-950 dark:text-white">
                        {reviewStats.averageRating?.toFixed(1)}
                      </span>
                      <span className="text-[#D97706] text-xs font-bold">
                        {'★'.repeat(Math.round(reviewStats.averageRating ?? 0))}
                      </span>
                    </>
                  ) : (
                    <span className="text-xl font-bold font-mono text-slate-400 dark:text-slate-500">
                      —
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {reviewStats && reviewStats.totalReviews > 0
                    ? `จากรีวิว ${reviewStats.totalReviews} รายการ`
                    : 'ยังไม่มีรีวิวจากผู้โดยสาร'}
                </span>
              </div>

              {/* Availability, from the vehicle record */}
              <div className="bg-[#F8FAFC] dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-semibold">
                  <span>สถานะรับงาน</span>
                  <span className="material-symbols-outlined text-[18px] text-[#06C755]">
                    bolt
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span
                    className={`text-2xl font-bold font-mono ${
                      isAvailable ? 'text-[#06C755]' : 'text-slate-500'
                    }`}
                  >
                    {ownVehicle ? (isAvailable ? 'พร้อม' : 'พัก') : '—'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">งาน</span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {isListed ? 'แสดงในผลการค้นหาของลูกค้า' : 'ยังไม่แสดงในผลการค้นหา'}
                </span>
              </div>

              {/* Day rates, from zone_rates — editable in place */}
              <div className="bg-[#F8FAFC] dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-semibold">
                  <span>ค่าบริการเริ่มต้น</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('profile');
                      requestAnimationFrame(() =>
                        document.getElementById('zone-rates-editor')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      );
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-950 dark:text-white hover:underline cursor-pointer"
                    title="แก้ไขอัตราค่าบริการตามโซน"
                  >
                    <Pencil className="h-3 w-3" />
                    <span>แก้ไข</span>
                  </button>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  {Number(rateCity.replace(/[^0-9]/g, '')) > 0 ? (
                    <>
                      <span className="text-2xl font-bold font-mono text-slate-950 dark:text-white">
                        ฿{Number(rateCity.replace(/[^0-9]/g, '')).toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">/วัน</span>
                    </>
                  ) : (
                    <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                      ยังไม่ระบุ
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  แตะ “แก้ไข” เพื่อตั้งราคาแยกตามโซนเส้นทาง
                </span>
              </div>

              <div className="bg-[#F8FAFC] dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-semibold">
                  <span>สถานะรถบนเว็บไซต์</span>
                  <span className="material-symbols-outlined text-[18px] text-slate-950 dark:text-slate-200">
                    savings
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span
                    className={`text-lg font-bold font-mono ${
                      approvalStatus === 'approved'
                        ? 'text-[#06C755]'
                        : approvalStatus === 'rejected'
                          ? 'text-rose-600'
                          : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {approvalStatus === 'approved'
                      ? 'อนุมัติแล้ว'
                      : approvalStatus === 'rejected'
                        ? 'ไม่ผ่าน'
                        : approvalStatus === 'pending'
                          ? 'รออนุมัติ'
                          : ownVehicle
                            ? 'ไม่ทราบสถานะ'
                            : 'ยังไม่ส่ง'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {approvalStatus === 'approved'
                    ? isAvailable
                      ? 'แสดงบนหน้าเว็บไซต์แล้ว'
                      : 'พักงาน ไม่แสดงในผลค้นหา'
                    : approvalStatus === 'pending'
                      ? 'รอผู้ดูแลระบบอนุมัติ'
                      : approvalStatus === 'rejected'
                        ? 'ไม่แสดงบนหน้าเว็บไซต์'
                        : 'ยังไม่มีสถานะการอนุมัติ'}
                </span>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 2. Featured Status Banner (Sharp Gold Architectural Accent) */}
          {/* ============================================================== */}
          <div className="bg-[#FEF3C7] dark:bg-amber-950/30 border border-[#D97706]/40 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs relative">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 bg-[#D97706] text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">grade</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg text-slate-950 dark:text-amber-100 font-bold">
                    {ownVehicle?.isVerified && approvalStatus === 'approved'
                      ? 'รถคันนี้ได้รับสถานะรถแนะนำ'
                      : 'สถานะรถแนะนำ: ยังไม่ปรากฏในข้อมูลรถ'}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-amber-200/90 mt-1 leading-relaxed">
                  {ownVehicle?.isVerified && approvalStatus === 'approved'
                    ? 'สถานะรถแนะนำได้รับการกำหนดโดยผู้ดูแลระบบ'
                    : 'การอนุมัติรถและสถานะรถแนะนำเป็นคนละขั้นตอน ผู้ดูแลระบบเป็นผู้กำหนดสถานะรถแนะนำ'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('perks')}
              className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 transition-colors shrink-0 self-stretch md:self-auto justify-center cursor-pointer"
            >
              <span>ดูรายละเอียดสถานะ</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          {/* New Driver Onboarding Guide Banner */}
          {!ownVehicle && !vehicleId && (
            <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs relative">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 bg-sky-600 text-white flex items-center justify-center shrink-0 font-black text-sm">
                  1
                </div>
                <div className="flex flex-col">
                  <h2 className="text-base sm:text-lg text-slate-950 dark:text-sky-100 font-bold">
                    เข้าสู่ระบบเรียบร้อยแล้ว! ขั้นตอนถัดไป: บันทึกข้อมูลรถของท่าน
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-sky-200/90 mt-1 leading-relaxed">
                    บัญชี {user.id.startsWith('line_') ? 'LINE' : user.id.startsWith('google_') ? 'Google' : 'คนขับ'} ของท่านเชื่อมต่อแล้ว กรุณากรอกรุ่นรถ เบอร์โทร และรูปถ่ายในแท็บด้านล่าง แล้วกด &quot;บันทึกข้อมูล&quot; เพื่อส่งให้ทีมงานตรวจสอบและเปิดรับงาน
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pending Approval Status Banner */}
          {approvalStatus === 'pending' && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[24px] text-amber-600 shrink-0">hourglass_top</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-950 dark:text-amber-100">
                    ข้อมูลรถอยู่ระหว่างการตรวจสอบโดยผู้ดูแลระบบ
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-amber-300/80 mt-0.5">
                    ทีมงานกำลังตรวจสอบเอกสารและข้อมูลรถ เมื่ออนุมัติแล้ว รถของท่านจะแสดงบนหน้าเว็บไซต์และระบบค้นหาทันที
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 3. Master Navigation Tab Switcher (Geometric Bauhaus Strict Line) */}
          {/* ============================================================== */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-5 sm:px-6 py-3.5 text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer ${
                activeTab === 'profile'
                  ? 'text-slate-950 dark:text-white border-b-2 border-slate-950 dark:border-white bg-[#F8FAFC] dark:bg-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 border-b-2 border-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">directions_car</span>
              <span>ข้อมูลรถและช่องทางติดต่อ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('perks')}
              className={`flex items-center gap-2 px-5 sm:px-6 py-3.5 text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer ${
                activeTab === 'perks'
                  ? 'text-slate-950 dark:text-white border-b-2 border-slate-950 dark:border-white bg-[#F8FAFC] dark:bg-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 border-b-2 border-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] text-[#D97706]">
                workspace_premium
              </span>
              <span>สถานะรถแนะนำ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('jobs')}
              className={`flex items-center gap-2 px-5 sm:px-6 py-3.5 text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer ${
                activeTab === 'jobs'
                  ? 'text-slate-950 dark:text-white border-b-2 border-slate-950 dark:border-white bg-[#F8FAFC] dark:bg-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 border-b-2 border-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">inbox</span>
              <span>กล่องงานลูกค้า</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`flex items-center gap-2 px-5 sm:px-6 py-3.5 text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer ${
                activeTab === 'reviews'
                  ? 'text-slate-950 dark:text-white border-b-2 border-slate-950 dark:border-white bg-[#F8FAFC] dark:bg-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 border-b-2 border-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] text-[#D97706]">star</span>
              <span>ประวัติรีวิวลูกค้า</span>
            </button>
          </div>

          {/* ============================================================== */}
          {/* TAB 1: ข้อมูลรถและช่องทางติดต่อ (Photos + Specs + Calendar) */}
          {/* ============================================================== */}
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-6">
              {/* 4. Real Vehicle Photos Gallery Module (X/8 Slots) */}
              <section className="bg-white dark:bg-slate-900 p-6 shadow-xs border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-950 dark:text-white text-[22px]">
                      photo_library
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
                      รูปถ่ายจริงสำหรับแสดงบนเว็บไซต์ ({images.length}/8 รูป)
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    แนะนำ 3-5 รูปภาพ (ภายนอก, ภายในเบาะ VIP, สิ่งอำนวยความสะดวก) รองรับ JPG, PNG,
                    WebP สูงสุด 15MB
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  {images.map((imgUrl, idx) => {
                    const meta = photoMeta[idx] || {
                      name: `vehicle-photo-${idx + 1}.jpg`,
                      size: '2.5 MB',
                    };
                    return (
                      <div
                        key={idx}
                        className="relative group bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col"
                      >
                        <div className="relative aspect-[16/10] overflow-hidden bg-slate-200 dark:bg-slate-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgUrl}
                            alt={`ภาพรถคันจริง #${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-2 left-2 bg-slate-950 text-white text-[10px] px-2 py-0.5 font-bold tracking-wider flex items-center gap-1 shadow-xs">
                            {idx === 0 ? (
                              <>
                                <span className="material-symbols-outlined text-[12px] text-[#D97706]">
                                  star
                                </span>
                                #1 รูปหน้าปกภายนอก
                              </>
                            ) : idx === 1 ? (
                              '#2 ห้องโดยสารเบาะ VIP'
                            ) : (
                              `#${idx + 1} รายละเอียดตัวรถ`
                            )}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            title="ลบรูปภาพนี้"
                            className="absolute top-2 right-2 w-7 h-7 bg-white/90 dark:bg-slate-900/90 hover:bg-rose-600 hover:text-white text-slate-800 dark:text-slate-200 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>

                        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400 truncate max-w-[140px]">
                            {meta.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">{meta.size}</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Upload Slot 1 */}
                  {images.length < 8 && (
                    <label className="cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-950 dark:hover:border-white bg-[#F8FAFC] dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 p-6 flex flex-col items-center justify-center text-center transition-colors min-h-[190px]">
                      <div className="w-10 h-10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-2 shadow-xs border border-slate-200 dark:border-slate-700">
                        <span className="material-symbols-outlined text-[22px]">add_a_photo</span>
                      </div>
                      <span className="text-xs font-bold text-slate-950 dark:text-white">
                        + เพิ่มรูปรถ (รูปที่ {images.length + 1})
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        เช่น ภาพคอนโซล สิ่งอำนวยความสะดวก
                      </span>
                      <input
                        ref={fileInputRef1}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e)}
                      />
                    </label>
                  )}

                  {/* Upload Slot 2 */}
                  {images.length < 7 && (
                    <label className="cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-950 dark:hover:border-white bg-[#F8FAFC]/60 dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-800 p-6 flex flex-col items-center justify-center text-center transition-colors min-h-[190px]">
                      <div className="w-10 h-10 bg-white dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-2 shadow-xs border border-slate-200 dark:border-slate-700">
                        <span className="material-symbols-outlined text-[22px]">cloud_upload</span>
                      </div>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        เพิ่มรูปกระเป๋า / ท้ายรถ
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1">
                        ลากวางไฟล์ที่นี่ หรือกดเลือกรูป
                      </span>
                      <input
                        ref={fileInputRef2}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e)}
                      />
                    </label>
                  )}
                </div>
              </section>

              {/* 5. Direct Contact & Specifications Form (Sharp Bauhaus Inputs) */}
              <section className="bg-white dark:bg-slate-900 p-6 shadow-xs border border-slate-200 dark:border-slate-800">
                {/* Header Banner with Trust Stamp */}
                <div className="p-4 bg-[#E8F9EE] dark:bg-emerald-950/30 border border-[#06C755]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[22px] text-[#06C755] font-bold">
                      shield_person
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-950 dark:text-emerald-100">
                        ข้อมูลติดต่อตรง & ข้อมูลจำเพาะรถยนต์
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-emerald-200/80 mt-0.5">
                        ผู้โดยสารและลูกค้าองค์กร B2B จะติดต่อคุณโดยตรงผ่านเบอร์โทรและ LINE
                        โดยไม่มีการหักค่าบริการ
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#06C755] bg-white dark:bg-slate-900 px-2.5 py-1 border border-[#06C755]/20 shrink-0">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    DIRECT CLIENT CONNECTION 100%
                  </div>
                </div>

                <form
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8"
                  onSubmit={handleSaveProfile}
                >
                  {/* Left Column: Primary Contact & Brand */}
                  <div className="flex flex-col gap-4 sm:gap-5">
                    {/* Team / Driver Title */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                        htmlFor="driver-title"
                      >
                        <span>ชื่อเล่น / ชื่อทีมรถสำหรับแสดงผลหน้าเว็บ</span>
                        <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="driver-title"
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                      />
                    </div>

                    {/* LINE ID with Green Badge */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between"
                        htmlFor="driver-line"
                      >
                        <span className="flex items-center gap-1">
                          <span>LINE ID หรือ ลิงก์ LINE Official</span>
                          <span className="text-rose-600">*</span>
                        </span>
                        <span className="font-mono text-[11px] text-[#06C755] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">chat</span>
                          ปุ่มแอดไลน์อัตโนมัติ
                        </span>
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#06C755] text-white flex items-center justify-center font-bold font-mono text-xs">
                          LINE
                        </div>
                        <input
                          id="driver-line"
                          type="text"
                          value={lineId}
                          onChange={(e) => setLineId(e.target.value)}
                          className="w-full h-12 pl-16 pr-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* WeChat ID */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                        htmlFor="driver-wechat"
                      >
                        <span>WECHAT ID (สำหรับรองรับนักท่องเที่ยวต่างชาติ)</span>
                      </label>
                      <input
                        id="driver-wechat"
                        type="text"
                        value={wechat}
                        onChange={(e) => setWechat(e.target.value)}
                        className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                      />
                    </div>

                    {/* License Plate Number */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between"
                        htmlFor="driver-plate"
                      >
                        <span className="flex items-center gap-1">
                          <span>ป้ายทะเบียนรถ (ตรวจสอบมาตรฐานกรมการขนส่ง)</span>
                          <span className="text-rose-600">*</span>
                        </span>
                      </label>
                      <input
                        id="driver-plate"
                        type="text"
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value)}
                        className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono font-semibold focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Vehicle Model Headline Description */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                        htmlFor="driver-headline"
                      >
                        <span>หัวข้อรุ่นรถ & จุดเด่นที่ดึงดูดลูกค้า</span>
                        <span className="text-rose-600">*</span>
                      </label>
                      <textarea
                        id="driver-headline"
                        rows={3}
                        maxLength={120}
                        value={vehicleTitle}
                        onChange={(e) => setVehicleTitle(e.target.value)}
                        className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                      />
                      <span className="text-[11px] text-slate-400 text-right">
                        {vehicleTitle.length}/120 ตัวอักษร
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Secondary Channels & Specs */}
                  <div className="flex flex-col gap-4 sm:gap-5">
                    {/* Primary Phone Number */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between"
                        htmlFor="driver-phone"
                      >
                        <span className="flex items-center gap-1">
                          <span>เบอร์โทรติดต่อตรง (ลูกค้ากดโทรออกทันที)</span>
                          <span className="text-rose-600">*</span>
                        </span>
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center border-r border-slate-300 dark:border-slate-700">
                          <span className="material-symbols-outlined text-[18px]">call</span>
                        </div>
                        <input
                          id="driver-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full h-12 pl-16 pr-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                        htmlFor="driver-whatsapp"
                      >
                        <span>WHATSAPP เบอร์ หรือ ลิงก์ (สำหรับลูกค้ายุโรป/สิงคโปร์)</span>
                      </label>
                      <input
                        id="driver-whatsapp"
                        type="text"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                      />
                    </div>

                    {/* KakaoTalk */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                        htmlFor="driver-kakao"
                      >
                        <span>KAKAOTALK ID (ตลาดเกาหลี)</span>
                      </label>
                      <input
                        id="driver-kakao"
                        type="text"
                        value={kakao}
                        onChange={(e) => setKakao(e.target.value)}
                        className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Capacity Dropdown */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                        htmlFor="driver-capacity"
                      >
                        <span>จำนวนที่นั่งผู้โดยสารตามโครงสร้างจริง</span>
                        <span className="text-rose-600">*</span>
                      </label>
                      <select
                        id="driver-capacity"
                        value={seats}
                        onChange={(e) => setSeats(Number(e.target.value))}
                        className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors cursor-pointer"
                      >
                        <option value={9}>
                          9 ที่นั่ง VIP เบาะใหญ่พิเศษ 3 แถว (นั่งสบายที่สุด ไม่แออัด)
                        </option>
                        <option value={10}>10 ที่นั่ง VIP เบาะหนังพรีเมียม</option>
                        <option value={12}>12 ที่นั่ง Standard สำหรับหมู่คณะ</option>
                        <option value={13}>13-14 ที่นั่ง Commuter มาตรฐานโรงงาน</option>
                        <option value={7}>7 ที่นั่ง SUV / Alphard พรีเมียม</option>
                      </select>
                    </div>

                    {/* Luggage Capacity Indicator Tag Strip */}
                    <div className="p-4 bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-500 text-[24px]">
                          luggage
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-950 dark:text-white">
                            ความจุกระเป๋าสัมภาระสูงสุด
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            กระเป๋าเดินทางขนาด 24-28 นิ้ว ได้ 5-7 ใบ (เมื่อพับเบาะหลังสุด)
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-950 dark:text-white bg-white dark:bg-slate-900 px-2.5 py-1 border border-slate-200 dark:border-slate-700 shrink-0">
                        7 ใบใหญ่
                      </span>
                    </div>
                  </div>

                  {/* Vehicle description & amenities — full width */}
                  <div className="lg:col-span-2 flex flex-col gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                        htmlFor="driver-description"
                      >
                        รายละเอียดตัวรถ / ประสบการณ์คนขับ / มาตรฐานการบริการ
                      </label>
                      <textarea
                        id="driver-description"
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="เช่น รถตู้ VIP 9 ที่นั่ง เบาะนวดไฟฟ้า คนขับชำนาญดอยอินทนนท์กว่า 10 ปี สื่อสารภาษาอังกฤษได้"
                        className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        สิ่งอำนวยความสะดวกบนรถ (เลือกได้หลายรายการ)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {AMENITY_OPTIONS.map((a) => {
                          const checked = amenities.includes(a.label);
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() =>
                                setAmenities((prev) =>
                                  prev.includes(a.label) ? prev.filter((x) => x !== a.label) : [...prev, a.label]
                                )
                              }
                              className={`px-3 py-1.5 text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                                checked
                                  ? 'bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-slate-950'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-500'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                {checked ? 'check_circle' : 'add'}
                              </span>
                              {a.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </form>
              </section>

              {/* 5b. Zone Rates & Fuel Policy Editor */}
              <section
                id="zone-rates-editor"
                className="bg-white dark:bg-slate-900 p-6 shadow-xs border border-slate-200 dark:border-slate-800 scroll-mt-24"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-950 dark:text-white text-[22px]">
                      payments
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
                      ตั้งราคาค่าบริการตามโซนและเส้นทาง
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    กำหนดราคาเองได้ 100% โดยไม่ต้องรอแอดมิน
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                  {[
                    { id: 'rate-city', label: 'ราคาเหมารายวันในเมือง (บาท/วัน)', value: rateCity, set: setRateCity, ph: 'เช่น 2000' },
                    { id: 'rate-midhill', label: 'เส้นทางดอยระดับกลาง (ม่อนแจ่ม, แม่กำปอง)', value: rateMidHill, set: setRateMidHill, ph: 'เช่น 2200' },
                    { id: 'rate-highhill', label: 'เส้นทางดอยสูง/ลาดชัน (ดอยอินทนนท์, อ่างขาง)', value: rateHighHill, set: setRateHighHill, ph: 'เช่น 2500' },
                    { id: 'rate-cross', label: 'เส้นทางข้ามจังหวัด (เชียงใหม่-เชียงราย/แม่ฮ่องสอน)', value: rateCross, set: setRateCross, ph: 'เช่น 2800' },
                  ].map((f) => (
                    <div key={f.id} className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor={f.id}>
                        {f.label}
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 text-xs font-bold text-slate-500">฿</span>
                        <input
                          id={f.id}
                          type="text"
                          inputMode="numeric"
                          value={f.value}
                          placeholder={f.ph}
                          onChange={(e) => f.set(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full h-12 pl-8 pr-16 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                        />
                        <span className="absolute right-3.5 text-[11px] font-semibold text-slate-400">บาท/วัน</span>
                      </div>
                      {Number(f.value) > 0 && (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          ฿{Number(f.value).toLocaleString()} / วัน
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Fuel policy + toll note */}
                <div className="mt-6 p-4 bg-[#F8FAFC] dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-950 dark:text-white">นโยบายค่าน้ำมัน</span>
                  <div className="flex flex-wrap items-center gap-4 mt-2.5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="fuel_policy"
                        checked={fuelIncluded}
                        onChange={() => setFuelIncluded(true)}
                        className="accent-slate-950"
                      />
                      <span>ราคารวมน้ำมัน</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="fuel_policy"
                        checked={!fuelIncluded}
                        onChange={() => setFuelIncluded(false)}
                        className="accent-slate-950"
                      />
                      <span>ไม่รวมน้ำมัน</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={fuelNote}
                    onChange={(e) => setFuelNote(e.target.value)}
                    placeholder="หมายเหตุค่าน้ำมัน/ทางด่วน เช่น ค่าน้ำมันคิดตามระยะทางจริง ทางด่วนลูกค้าจ่ายเพิ่ม"
                    className="mt-3 w-full h-11 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                  />
                </div>

                {/* Working hours / overtime / overnight stay terms */}
                <div className="mt-4 p-4 bg-[#F8FAFC] dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-950 dark:text-white">{t('driver.terms.title')}</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{t('driver.terms.hint')}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="terms-workhours">
                        {t('driver.terms.workHours')}
                      </label>
                      <input
                        id="terms-workhours"
                        type="text"
                        inputMode="numeric"
                        value={workHoursPerDay}
                        onChange={(e) => setWorkHoursPerDay(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="10"
                        className="w-full h-11 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="terms-ot">
                        {t('driver.terms.ot')}
                      </label>
                      <input
                        id="terms-ot"
                        type="text"
                        inputMode="numeric"
                        value={overtimeRate}
                        onChange={(e) => setOvertimeRate(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="200"
                        className="w-full h-11 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="terms-start">
                        {t('driver.terms.workStart')}
                      </label>
                      <input
                        id="terms-start"
                        type="time"
                        value={workStart}
                        onChange={(e) => setWorkStart(e.target.value)}
                        className="w-full h-11 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="terms-end">
                        {t('driver.terms.workEnd')}
                      </label>
                      <input
                        id="terms-end"
                        type="time"
                        value={workEnd}
                        onChange={(e) => setWorkEnd(e.target.value)}
                        className="w-full h-11 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="terms-stay">
                        {t('driver.terms.stay')}
                      </label>
                      <input
                        id="terms-stay"
                        type="text"
                        inputMode="numeric"
                        value={overnightRate}
                        onChange={(e) => setOvernightRate(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="500"
                        className="w-full h-11 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3">
                  ระบบบันทึกเฉพาะอัตราที่คุณกรอก ช่องที่เว้นว่างจะไม่ถูกบันทึกเป็น 0
                </p>
              </section>

              {/* 6. Real-time Live Availability Calendar Module */}
              <section className="bg-white dark:bg-slate-900 p-6 shadow-xs border border-slate-200 dark:border-slate-800">
                {/* Title & Live Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[22px] text-slate-950 dark:text-white">
                      calendar_month
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
                      ปฏิทินระบุสถานะ &quot;คิวว่าง / ติดงาน&quot; (อัปเดตสด 24 ชม.)
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-[#06C755]"></span>
                    <span>บันทึกลงฐานข้อมูลเมื่อกดบันทึกการแก้ไขทั้งหมด</span>
                  </div>
                </div>

                {/* Current Availability Banner */}
                <div className="mt-4 p-4 bg-[#E8F9EE] dark:bg-emerald-950/30 border border-[#06C755]/30 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[22px] text-[#06C755] font-bold shrink-0">
                    check_circle
                  </span>
                  <p className="text-xs sm:text-sm text-slate-900 dark:text-emerald-100">
                    {busyDates.length === 0 ? (
                      <>
                        <strong className="font-bold">ขณะนี้ไม่มีคิวติดงาน</strong> —
                         ยังไม่มีวันที่ระบุติดงานในปฏิทิน กดบันทึกเพื่ออัปเดตข้อมูลรถ
                      </>
                    ) : (
                      <>
                        <strong className="font-bold">
                          ขณะนี้มีคิวติดงาน {busyDates.length} วัน
                        </strong>{' '}
                         — กดบันทึกเพื่ออัปเดตวันที่ติดงานในข้อมูลรถ
                      </>
                    )}
                  </p>
                </div>

                {/* Quick Add Blocked Date Interval */}
                <form
                  onSubmit={handleAddInterval}
                  className="mt-6 p-4 bg-[#F8FAFC] dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-stretch md:items-end gap-3 sm:gap-4"
                >
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      วันที่เริ่มต้นติดคิวงาน
                    </label>
                    <input
                      type="date"
                      value={intervalStart}
                      onChange={(e) => setIntervalStart(e.target.value)}
                      className="w-full h-11 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-slate-950 dark:focus:border-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      ถึงวันที่สิ้นสุด (วันสุดท้าย)
                    </label>
                    <input
                      type="date"
                      value={intervalEnd}
                      onChange={(e) => setIntervalEnd(e.target.value)}
                      className="w-full h-11 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-slate-950 dark:focus:border-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      หมายเหตุงาน (เห็นเฉพาะคุณ)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น ทริปดอยอินทนนท์ 3 วัน"
                      value={intervalNote}
                      onChange={(e) => setIntervalNote(e.target.value)}
                      className="w-full h-11 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-slate-950 dark:focus:border-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-11 px-5 bg-[#D97706] hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    <span>+ เพิ่มวันติดคิว</span>
                  </button>
                </form>

                {/* Monthly Calendar Grid Visual */}
                <div className="mt-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  {/* Month Navigation Bar */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setViewDate(new Date(currentYear, currentMonth - 1, 1))}
                      className="p-1 hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base text-slate-950 dark:text-white font-bold">
                        {monthDisplayTitle}
                      </span>
                      <span className="font-mono text-xs bg-white dark:bg-slate-900 px-2 py-0.5 text-slate-500 border border-slate-200 dark:border-slate-700 hidden sm:inline">
                        โซนเวลา: Asia/Bangkok
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewDate(new Date(currentYear, currentMonth + 1, 1))}
                      className="p-1 hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </button>
                  </div>

                  {/* Days of Week Header */}
                  <div className="grid grid-cols-7 text-center text-[12px] font-bold py-2 bg-[#F8FAFC] dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-rose-600">อา (Sun)</span>
                    <span className="text-slate-600 dark:text-slate-400">จ (Mon)</span>
                    <span className="text-slate-600 dark:text-slate-400">อ (Tue)</span>
                    <span className="text-slate-600 dark:text-slate-400">พ (Wed)</span>
                    <span className="text-slate-600 dark:text-slate-400">พฤ (Thu)</span>
                    <span className="text-slate-600 dark:text-slate-400">ศ (Fri)</span>
                    <span className="text-slate-950 dark:text-slate-200">ส (Sat)</span>
                  </div>

                  {/* Calendar Cells Grid */}
                  <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-slate-800">
                    {/* Previous Month Padding */}
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => {
                      const dayNum = prevMonthDays - firstDayOfWeek + i + 1;
                      return (
                        <div
                          key={`prev-${i}`}
                          className="p-2 sm:p-3 min-h-[64px] bg-[#F8FAFC] dark:bg-slate-900/40 text-slate-300 dark:text-slate-700"
                        >
                          <span className="font-mono text-xs">{dayNum}</span>
                        </div>
                      );
                    })}

                    {/* Current Month Days */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1;
                      const monthStr = String(currentMonth + 1).padStart(2, '0');
                      const dayStr = String(dayNum).padStart(2, '0');
                      const dateIso = `${currentYear}-${monthStr}-${dayStr}`;

                      const isBusy = busyDates.includes(dateIso);
                      const isToday = dateIso === todayIso;
                      const dayOfWeek = (firstDayOfWeek + i) % 7;
                      const isSunday = dayOfWeek === 0;

                      if (isBusy) {
                        return (
                          <div
                            key={dateIso}
                            onClick={() => toggleDateBusy(dateIso)}
                            className="p-2 min-h-[64px] bg-[#ffdad6]/40 dark:bg-rose-950/30 border-l-2 border-l-[#ba1a1a] cursor-pointer hover:opacity-90 transition-opacity"
                            title="คลิกเพื่อปลดล็อคให้ว่าง"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-[#ba1a1a] dark:text-rose-400">
                                {dayNum}
                              </span>
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>
                            </div>
                            <span className="block mt-1 text-[10px] text-[#ba1a1a] dark:text-rose-300 font-semibold truncate">
                              ติดงาน
                            </span>
                          </div>
                        );
                      }

                      if (isToday) {
                        return (
                          <div
                            key={dateIso}
                            onClick={() => toggleDateBusy(dateIso)}
                            className="p-2 min-h-[64px] bg-white dark:bg-slate-800 border-2 border-slate-950 dark:border-white relative shadow-xs cursor-pointer"
                            title="คลิกเพื่อสลับเป็นติดคิว"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-extrabold text-slate-950 dark:text-white">
                                {dayNum}
                              </span>
                              <span className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-mono text-[9px] px-1 py-0.2 uppercase font-bold">
                                วันนี้
                              </span>
                            </div>
                            <span className="block mt-1 text-[10px] text-[#06C755] font-bold">
                               ● ยังไม่ระบุติดงาน
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={dateIso}
                          onClick={() => toggleDateBusy(dateIso)}
                          className="p-2 sm:p-3 min-h-[64px] bg-white dark:bg-slate-900 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="คลิกเพื่อสลับสถานะ"
                        >
                          <span
                            className={`font-mono text-xs font-bold ${
                              isSunday ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {dayNum}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend Ribbon */}
                  <div className="p-3 bg-[#F8FAFC] dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 inline-block"></span>
                        คิวว่างรับงานได้
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-[#ffdad6] border border-[#ba1a1a] inline-block"></span>
                        ติดงาน / คิวเต็ม
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-slate-950 dark:border-white inline-block"></span>
                        วันนี้ (ปัจจุบัน)
                      </span>
                    </div>
                    <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                      คลิกที่ช่องวันที่ในปฏิทินเพื่อสลับสถานะ ว่าง/ติดงาน ได้โดยตรง
                    </span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: สิทธิประโยชน์รถแนะนำ (Featured Perks & Verification) */}
          {/* ============================================================== */}
          {activeTab === 'perks' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#D97706] uppercase tracking-wider mb-1">
                    <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                     <span>สถานะข้อมูลรถ</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-950 dark:text-white">
                    ข้อมูลสถานะรถแนะนำ
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {ownVehicle?.isVerified && approvalStatus === 'approved'
                      ? 'รถคันนี้ได้รับสถานะรถแนะนำจากผู้ดูแลระบบ'
                      : 'ยังไม่ปรากฏสถานะรถแนะนำในข้อมูลรถที่โหลด'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    สถานะรถแนะนำไม่ได้รับประกันอันดับในผลการค้นหา จำนวนลูกค้าที่ติดต่อ หรือการได้รับงาน
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white mb-3">
                     ข้อมูลและสถานะที่บันทึกในระบบ
                  </h4>
                  <div className="space-y-2.5">
                    {[
                      ownVehicle?.plateType
                        ? {
                             title: 'ประเภทป้ายทะเบียนที่บันทึกไว้',
                             status: `ป้าย${ownVehicle.plateType === 'yellow' ? 'เหลือง' : 'ฟ้า'}`,
                            valid: ownVehicle.plateNumber
                              ? `ทะเบียน ${ownVehicle.plateNumber}`
                              : 'ยังไม่ได้กรอกหมายเลขทะเบียน',
                          }
                        : null,
                      ownVehicle?.canIssueTaxInvoice
                        ? {
                            title: 'ออกใบกำกับภาษี/ใบเสร็จรับเงินได้',
                            status: 'เปิดให้ออกเอกสาร',
                            valid: 'รองรับการเบิกจ่ายขององค์กร',
                          }
                        : null,
                      {
                        title: 'สถานะการอนุมัติโดยผู้ดูแลระบบ',
                        status:
                          approvalStatus === 'approved'
                            ? 'อนุมัติแล้ว'
                            : approvalStatus === 'rejected'
                              ? 'ยังไม่ผ่านการอนุมัติ'
                              : approvalStatus === 'pending'
                                ? 'รอการตรวจสอบ'
                                : 'ยังไม่ทราบสถานะ',
                        valid:
                          approvalStatus === 'approved' && isAvailable
                            ? 'รถของคุณแสดงบนหน้าเว็บไซต์'
                            : 'ข้อมูลจะยังไม่แสดงบนหน้าเว็บ',
                      },
                      reviewStats && reviewStats.totalReviews > 0
                        ? {
                            title: 'ความพึงพอใจจากผู้โดยสารจริง',
                            status: `${reviewStats.averageRating?.toFixed(1)} / 5.0`,
                            valid: `จากรีวิว ${reviewStats.totalReviews} รายการ`,
                          }
                        : null,
                      {
                        title: 'ประกันภัยชั้น 1 (พ.ร.บ.)',
                        status: 'ยังไม่ได้บันทึกข้อมูล',
                         valid: 'ยังไม่รองรับการแนบเอกสารในหน้านี้',
                      },
                    ]
                      .filter((item): item is { title: string; status: string; valid: string } =>
                        Boolean(item)
                      )
                      .map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#F8FAFC] dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                           <span className="material-symbols-outlined text-[18px] text-slate-500">
                             info
                           </span>
                           <span className="text-xs font-bold text-slate-900 dark:text-white">
                             {item.title}
                           </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                           <span className="font-semibold text-slate-700 dark:text-slate-200">{item.status}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500 font-mono text-[11px]">{item.valid}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ยังไม่สามารถส่งเอกสารหรือขอตรวจสอบสถานะรถแนะนำผ่านหน้านี้ได้
                </p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: กล่องงานลูกค้า (Incoming Leads & Jobs Feed) */}
          {/* ============================================================== */}
          {activeTab === 'jobs' && (
            <div className="p-10 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[36px]">
                inbox
              </span>
              <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                กล่องงานลูกค้ายังไม่พร้อมใช้งาน
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ขณะนี้ยังไม่มีระบบส่งคำขอจากลูกค้าเข้ากล่องงานคนขับโดยตรง
                ลูกค้าสามารถติดต่อคุณผ่านช่องทางที่ระบุในข้อมูลรถเมื่อรถได้รับการอนุมัติและแสดงบนเว็บไซต์
              </p>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: ประวัติรีวิวลูกค้า (Reviews History) */}
          {/* ============================================================== */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-xl font-bold text-slate-950 dark:text-white">
                      ผลคะแนนและความคิดเห็นจากผู้โดยสารจริง
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                       คะแนนคำนวณจากรีวิวที่บันทึกไว้สำหรับรถคันนี้ ผู้โดยสารที่ยืนยันการเดินทางจะแสดงป้ายกำกับแยกต่างหาก
                    </p>
                  </div>
                  {reviewStats && reviewStats.totalReviews > 0 ? (
                    <div className="flex items-baseline gap-2 bg-[#F8FAFC] dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 shrink-0">
                      <span className="text-3xl font-extrabold font-mono text-slate-950 dark:text-white">
                        {reviewStats.averageRating?.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        / 5.0 ({reviewStats.totalReviews} รีวิว)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2 bg-[#F8FAFC] dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 shrink-0">
                      <span className="text-xl font-extrabold font-mono text-slate-400">
                        —
                      </span>
                      <span className="text-xs text-slate-500 font-medium">ยังไม่มีรีวิว</span>
                    </div>
                  )}
                </div>

                {!reviewStats || reviewStats.totalReviews === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[36px]">
                      rate_review
                    </span>
                    <p className="text-sm font-bold text-slate-950 dark:text-white">
                      ยังไม่มีรีวิวสำหรับรถของคุณ
                    </p>
                    <p className="text-xs text-slate-500">
                      รีวิวจากผู้โดยสารจะปรากฏที่นี่เมื่อมีการเขียนรีวิวจริงบนเว็บไซต์
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviewsForVehicle.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 bg-[#F8FAFC] dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-bold text-slate-900 dark:text-white truncate">
                              {rev.authorName}
                            </span>
                            {rev.verifiedTrip && (
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold shrink-0">
                                ผู้โดยสารจริง
                              </span>
                            )}
                            {rev.tripRoute && (
                              <>
                                <span className="text-slate-400">·</span>
                                <span className="text-slate-500 truncate">{rev.tripRoute}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1 font-mono font-bold text-[#D97706] shrink-0">
                            <span>★</span>
                            <span>{rev.rating.toFixed(1)}</span>
                            {rev.travelDate && (
                              <span className="text-slate-400 font-normal ml-2">
                                {rev.travelDate}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          &quot;{rev.comment}&quot;
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 7. Primary Action Command Bar */}
          {/* ============================================================== */}
          <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-500 text-[22px]">
                  save
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-950 dark:text-white">
                    การแก้ไขข้อมูลรถจะถูกส่งเมื่อกดบันทึก
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    การแก้ไขรถที่อนุมัติแล้วจะต้องรอการตรวจสอบใหม่ก่อนแสดงบนเว็บไซต์
                  </span>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>ออกจากระบบ</span>
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className={`px-8 py-2.5 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer ${
                    saveSuccess
                      ? 'bg-[#06C755]'
                      : isSaving
                      ? 'bg-slate-700'
                      : 'bg-slate-950 hover:bg-slate-800'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="h-4 w-4" strokeWidth={3} />
                      <span>บันทึกเรียบร้อย!</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      <span>บันทึกการแก้ไขทั้งหมด</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Save feedback + approval state */}
            <div className="mt-3 space-y-2">
              {saveError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold px-3 py-2"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              {loadError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold px-3 py-2"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{loadError}</span>
                </div>
              )}

              {saveSuccess && approvalStatus === 'pending' && (
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs px-3 py-2.5">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-px">hourglass_top</span>
                  <div>
                    <p className="font-bold">บันทึกแล้ว รอผู้ดูแลระบบอนุมัติ</p>
                    <p className="mt-0.5 text-amber-800 dark:text-amber-300/90">
                      ข้อมูลรถของคุณจะยังไม่แสดงบนหน้าเว็บจนกว่าแอดมินจะตรวจสอบและอนุมัติ
                    </p>
                  </div>
                </div>
              )}

              {saveSuccess && approvalStatus === 'approved' && (
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold px-3 py-2">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>บันทึกแล้ว อัปเดตข้อมูลขึ้นหน้าเว็บทันที{isAvailable ? '' : ' (รถกำลังอยู่ในสถานะพักงาน)'}</span>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================== */}
          {/* 8. Danger Zone & Privacy PDPA Module (Architectural Alert Box) */}
          {/* ============================================================== */}
          <section className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/60 p-6 shadow-xs mb-6">
            <div className="flex flex-col md:flex-row items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[26px]">gavel</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg text-rose-600 font-bold">
                      โซนอันตรายและการจัดการข้อมูลส่วนบุคคล (PDPA)
                    </h3>
                    <span className="bg-rose-600 text-white font-mono text-[10px] px-2 py-0.2 font-bold uppercase">
                      DANGER ZONE
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                    หากคุณต้องการหยุดให้บริการถาวร คุณสามารถส่งคำขอลบข้อมูลรถ หมายเลขโทรศัพท์
                    และประวัติทั้งหมดของคุณออกจากฐานข้อมูล TripDee อย่างถาวร ข้อมูลจะไม่สามารถกู้คืนได้ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล
                    พ.ศ. 2562
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-xs shrink-0 self-stretch md:self-auto justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                <span>ขอลบบัญชีและทำลายข้อมูล</span>
              </button>
            </div>
          </section>

          {/* Confirmation Modal for Delete */}
          {deleteConfirmOpen && (
            <div className="fixed inset-0 z-500 flex items-center justify-center bg-black/70 p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-rose-400 p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center gap-3 text-rose-600">
                  <span className="material-symbols-outlined text-[28px]">warning</span>
                  <h4 className="font-bold text-base">ยืนยันการลบบัญชีคนขับอย่างถาวร</h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีและทำลายข้อมูลรถยนต์ทั้งหมดออกจากระบบ TripDee?
                  การดำเนินการนี้จะไม่สามารถกู้คืนได้
                </p>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(false)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setDeleteConfirmOpen(false);
                      await deleteAccount();
                      if (onClose) onClose();
                      if (!isModal && typeof window !== 'undefined') {
                        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                        window.location.href = '/';
                      }
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    ยืนยันลบข้อมูลถาวร
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Driver Smart E-Card Modal */}
          {showECardModal && ownVehicle && (
            <DriverSmartECardModal
              vehicle={ownVehicle}
              isOpen={showECardModal}
              onClose={() => setShowECardModal(false)}
            />
          )}
        </div>
      </div>
  );
};

export default DriverPortalContent;
