'use client';

import React, { useState, useEffect } from 'react';
import { Vehicle } from '@/data/mockData';
import {
  X,
  Phone,
  Search,
  CheckCircle,
  AlertCircle,
  CarFront,
  ShieldCheck,
  Save,
  MessageCircle,
  ArrowLeft,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { DriverPushBell } from '@/components/notifications/DriverPushBell';

interface DriverSelfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegisterModal?: () => void;
}

export const DriverSelfServiceModal: React.FC<DriverSelfServiceModalProps> = ({
  isOpen,
  onClose,
  onOpenRegisterModal,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matchedVehicles, setMatchedVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Editable fields for the selected vehicle
  const [isAvailable, setIsAvailable] = useState(true);
  const [plateType, setPlateType] = useState<'yellow' | 'blue'>('blue');
  const [plateNumber, setPlateNumber] = useState('');
  const [canIssueTaxInvoice, setCanIssueTaxInvoice] = useState(false);
  const [driverPhone, setDriverPhone] = useState('');
  const [driverLine, setDriverLine] = useState('');
  const [cityRate, setCityRate] = useState(1900);
  const [highHillRate, setHighHillRate] = useState(2300);

  // Sync state when selectedVehicle changes
  useEffect(() => {
    if (selectedVehicle) {
      setIsAvailable(selectedVehicle.isAvailable !== false);
      setPlateType(selectedVehicle.plateType || 'blue');
      setPlateNumber(selectedVehicle.plateNumber || '');
      setCanIssueTaxInvoice(Boolean(selectedVehicle.canIssueTaxInvoice));
      setDriverPhone(selectedVehicle.driverPhone || '');
      setDriverLine(selectedVehicle.driverLine || '');
      setCityRate(selectedVehicle.zoneRates?.city || 1900);
      setHighHillRate(selectedVehicle.zoneRates?.highHill || 2300);
    }
  }, [selectedVehicle]);

  if (!isOpen) return null;

  const normalizePhone = (p: string) => p.replace(/[^0-9]/g, '');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = normalizePhone(phoneNumber);
    if (cleanQuery.length < 9) {
      setErrorMessage('กรุณาระบุเบอร์โทรศัพท์อย่างน้อย 9-10 หลัก');
      return;
    }

    setErrorMessage('');
    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await fetch('/api/vehicles');
      const data = await res.json();
      const allVehicles: Vehicle[] = data.vehicles || [];

      const matches = allVehicles.filter((v) => {
        const p1 = normalizePhone(v.driverPhone || '');
        return p1.includes(cleanQuery) || cleanQuery.includes(p1);
      });

      setMatchedVehicles(matches);
      if (matches.length === 1) {
        setSelectedVehicle(matches[0]);
      } else {
        setSelectedVehicle(null);
      }
    } catch (err) {
      setErrorMessage('เกิดข้อผิดพลาดในการค้นหาข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const updatedData: Partial<Vehicle> = {
        isAvailable,
        plateType,
        plateNumber: plateNumber.trim() || undefined,
        canIssueTaxInvoice,
        driverPhone: driverPhone.trim(),
        driverLine: driverLine.trim() || undefined,
        zoneRates: {
          ...(selectedVehicle.zoneRates || {}),
          city: Number(cityRate) || 1900,
          highHill: Number(highHillRate) || 2300,
        },
      };

      const res = await fetch('/api/vehicles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedVehicle.id,
          ...updatedData,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to update vehicle');
      }

      // Update local vehicle reference
      setSelectedVehicle((prev) => (prev ? { ...prev, ...updatedData } : null));
      setSaveSuccess(true);
      window.dispatchEvent(new CustomEvent('tripdee-vehicles-updated'));

      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  const resetSearch = () => {
    setSelectedVehicle(null);
    setMatchedVehicles([]);
    setHasSearched(false);
    setErrorMessage('');
    setSaveSuccess(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-card p-5 sm:p-7 shadow-2xl border border-rule my-6 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 text-ink">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิดหน้าต่าง"
          className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full bg-paper text-ink-2 hover:text-ink border border-rule transition-all"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 pb-4 border-b border-rule pr-8">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-white shadow-xs">
            <CarFront className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-ink">
              ระบบคนขับจัดการตนเอง (Driver Self-Service)
            </h2>
            <p className="text-xs text-ink-2 font-medium">
              อัปเดตสถานะคิวงาน ปรับราคา หรือแก้ไขข้อมูลติดต่อได้ด้วยตัวเองทันที
            </p>
          </div>
        </div>

        {/* Step 1: Phone Search (if no vehicle selected) */}
        {!selectedVehicle && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-accent-soft/40 border border-accent/20 p-3.5 text-xs text-ink leading-relaxed">
              <span className="font-bold text-accent">💡 ไม่ต้องจำรหัสผ่าน:</span>{' '}
              เพียงระบุเบอร์โทรศัพท์ที่ใช้ลงทะเบียนไว้กับ TripDee ระบบจะค้นหารถตู้ของคุณเพื่อให้คุณปรับสถานะว่าง/คิวเต็มได้ทันที
            </div>

            <form onSubmit={handleSearch} className="space-y-3">
              <div>
                <label htmlFor="driver-search-phone" className="block text-xs font-bold uppercase tracking-wider text-ink-2 mb-1">
                  เบอร์โทรศัพท์ที่ลงทะเบียน
                </label>
                <div className="relative">
                  <input
                    id="driver-search-phone"
                    type="tel"
                    required
                    placeholder="เช่น 081-234-5678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full rounded-input border border-rule bg-card px-3.5 py-2.5 pl-10 text-sm font-semibold text-ink placeholder:text-ink-2/60 focus:border-accent focus:outline-none"
                  />
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-ink-2/60" />
                </div>
              </div>

              {errorMessage && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSearching}
                className="w-full inline-flex items-center justify-center gap-2 rounded-input bg-accent hover:bg-accent-deep py-2.5 text-sm font-bold text-white shadow-xs transition-all disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                <span>{isSearching ? 'กำลังค้นหา...' : 'ค้นหารถของฉัน'}</span>
              </button>
            </form>

            {/* If searched and multiple found */}
            {hasSearched && matchedVehicles.length > 1 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-bold text-ink-2">พบรถตู้ที่ตรงกับเบอร์นี้ {matchedVehicles.length} คัน:</p>
                <div className="space-y-2">
                  {matchedVehicles.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVehicle(v)}
                      className="p-3 rounded-xl border border-rule bg-paper hover:border-accent cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-ink">{v.title}</p>
                        <p className="text-[11px] text-ink-2">คนขับ: {v.driverName} ({v.driverNickname})</p>
                      </div>
                      <span className="text-xs font-bold text-accent">เลือกจัดการ &rarr;</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* If searched and none found */}
            {hasSearched && matchedVehicles.length === 0 && !isSearching && (
              <div className="mt-4 rounded-xl border border-dashed border-rule p-5 text-center bg-paper">
                <CarFront className="mx-auto h-8 w-8 text-ink-2/40 mb-2" />
                <p className="text-xs font-bold text-ink">ไม่พบข้อมูลรถที่ตรงกับเบอร์ {phoneNumber}</p>
                <p className="text-[11px] text-ink-2 mt-1">คุณอาจยังไม่ได้ลงทะเบียน หรือระบุเบอร์โทรผิด</p>
                {onOpenRegisterModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRegisterModal();
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-pill bg-sun px-4 py-1.5 text-xs font-extrabold text-sun-ink hover:brightness-95 transition-all"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>ลงทะเบียนรถฟรี (0% คอมมิชชั่น)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Vehicle Self-Service Editor */}
        {selectedVehicle && (
          <form onSubmit={handleSave} className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={resetSearch}
                className="inline-flex items-center gap-1 text-xs font-bold text-ink-2 hover:text-ink transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>เปลี่ยนเบอร์ / ค้นหาใหม่</span>
              </button>
              <span className="text-xs text-ink-2 font-medium">รหัสรถ: {selectedVehicle.id}</span>
            </div>

            {/* Vehicle Summary Card */}
            <div className="flex items-center gap-3 rounded-xl bg-paper p-3 border border-rule">
              <img
                src={selectedVehicle.images[0] || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=300&q=80'}
                alt={selectedVehicle.title}
                className="h-14 w-20 rounded-lg object-cover border border-rule/60"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-ink line-clamp-1">{selectedVehicle.title}</p>
                <p className="text-[11px] text-ink-2 mt-0.5">
                  คนขับ: <span className="text-ink font-semibold">{selectedVehicle.driverName}</span> ({selectedVehicle.driverNickname})
                </p>
                <span className="text-[11px] text-ink-2">{selectedVehicle.location}</span>
              </div>
            </div>

            {/* Web Push Notification Setting for Driver */}
            <DriverPushBell compact={true} />

            {/* 1. Quick Availability Toggle */}
            <div className="rounded-xl border border-rule bg-card p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-ink flex items-center gap-1.5">
                    {isAvailable ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-leaf ring-2 ring-leaf/20" />
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200" />
                    )}
                    สถานะการรับงานปัจจุบัน
                  </h3>
                  <p className="text-[11px] text-ink-2 mt-0.5">
                    {isAvailable ? '🟢 ว่าง พร้อมรับงาน' : '⏸️ คิวเต็มชั่วคราว (ไม่รับงาน)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvailable(!isAvailable)}
                  className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-extrabold transition-all ${
                    isAvailable
                      ? 'bg-leaf-soft text-leaf border border-leaf/30 hover:bg-leaf hover:text-white'
                      : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white'
                  }`}
                >
                  {isAvailable ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  <span>{isAvailable ? 'เปลี่ยนเป็น "คิวเต็ม"' : 'เปลี่ยนเป็น "ว่างรับงาน"'}</span>
                </button>
              </div>
              <p className="text-[11px] text-ink-2/80 mt-2">
                * หากติดคิวงาน ลูกค้าจะไม่โทรติดต่อซ้ำซ้อน ช่วยให้คุณทำงานได้โดยไม่ถูกรบกวน
              </p>
            </div>

            {/* 2. Plate Type & Corporate Invoicing */}
            <div className="space-y-3 rounded-xl border border-rule bg-card p-3.5 shadow-2xs">
              <h3 className="text-xs font-bold text-ink">ประเภทป้ายทะเบียน & การออกเอกสารภาษี</h3>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPlateType('yellow')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                    plateType === 'yellow'
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
                  onClick={() => setPlateType('blue')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                    plateType === 'blue'
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

              <div>
                <label htmlFor="driver-plate-num" className="block text-[11px] font-bold text-ink-2 mb-1">
                  หมายเลขทะเบียนรถ
                </label>
                <input
                  id="driver-plate-num"
                  type="text"
                  placeholder="เช่น 30-1234 เชียงใหม่ หรือ นข-5678"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="w-full rounded-input border border-rule bg-paper px-3 py-2 text-xs font-semibold text-ink focus:border-accent focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={canIssueTaxInvoice}
                  onChange={(e) => setCanIssueTaxInvoice(e.target.checked)}
                  className="rounded border-rule text-accent focus:ring-accent h-4 w-4"
                />
                <span className="text-xs font-semibold text-ink">
                  🏢 สามารถออกใบเสร็จรับเงิน / ใบกำกับภาษีได้ (สำหรับบริษัทและองค์กร)
                </span>
              </label>
            </div>

            {/* 3. Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="driver-edit-phone" className="block text-[11px] font-bold text-ink-2 mb-1">
                  เบอร์โทรติดต่อลูกค้า
                </label>
                <input
                  id="driver-edit-phone"
                  type="tel"
                  required
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full rounded-input border border-rule bg-card px-3 py-2 text-xs font-semibold text-ink focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="driver-edit-line" className="block text-[11px] font-bold text-ink-2 mb-1">
                  LINE ID หรือ ลิงก์ LINE
                </label>
                <input
                  id="driver-edit-line"
                  type="text"
                  placeholder="https://line.me/ti/p/... หรือ @lineid"
                  value={driverLine}
                  onChange={(e) => setDriverLine(e.target.value)}
                  className="w-full rounded-input border border-rule bg-card px-3 py-2 text-xs font-semibold text-ink focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {/* 4. Pricing (Zone Rates) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="driver-city-rate" className="block text-[11px] font-bold text-ink-2 mb-1">
                  ราคาเหมาในเมือง (บาท/วัน)
                </label>
                <input
                  id="driver-city-rate"
                  type="number"
                  min={500}
                  step={100}
                  value={cityRate}
                  onChange={(e) => setCityRate(Number(e.target.value))}
                  className="w-full rounded-input border border-rule bg-card px-3 py-2 text-xs font-semibold text-ink focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="driver-hill-rate" className="block text-[11px] font-bold text-ink-2 mb-1">
                  ราคาดอยสูง / ข้ามจังหวัด (บาท/วัน)
                </label>
                <input
                  id="driver-hill-rate"
                  type="number"
                  min={500}
                  step={100}
                  value={highHillRate}
                  onChange={(e) => setHighHillRate(Number(e.target.value))}
                  className="w-full rounded-input border border-rule bg-card px-3 py-2 text-xs font-semibold text-ink focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-bold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>✓ บันทึกข้อมูลสำเร็จ ข้อมูลหน้าเว็บอัปเดตทันทีเรียบร้อยแล้ว</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-rule">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-input border border-rule bg-card py-2.5 text-xs font-bold text-ink-2 hover:bg-paper"
              >
                ปิดหน้าต่าง
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-input bg-accent hover:bg-accent-deep py-2.5 text-xs font-bold text-white shadow-xs transition-all disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
