'use client';

import React, { useState } from 'react';
import { Vehicle, ZoneId } from '@/data/mockData';
import { ALL_VEHICLE_MODELS } from '@/data/vehicleModels';
import { CarFront, Plus, Pencil, Trash2, Search, Star } from 'lucide-react';
import { AdminDeleteModal } from './AdminDeleteModal';

interface AdminVehicleTabProps {
  vehicles: Vehicle[];
  onRefresh: () => void;
}

export const AdminVehicleTab: React.FC<AdminVehicleTabProps> = ({ vehicles, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = vehicles.filter((v) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      v.title.toLowerCase().includes(q) ||
      v.driverName.toLowerCase().includes(q) ||
      v.driverPhone.includes(q) ||
      v.location.toLowerCase().includes(q)
    );
  });

  const handleToggleVerified = async (v: Vehicle) => {
    try {
      await fetch('/api/vehicles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: v.id, isVerified: !v.isVerified }),
      });
      onRefresh();
      window.dispatchEvent(new CustomEvent('tripdee-vehicles-updated'));
    } catch (err) {
      console.error('Error toggling verified:', err);
    }
  };

  const handleDelete = async () => {
    if (!deletingVehicle) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/vehicles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingVehicle.id }),
      });
      setDeletingVehicle(null);
      onRefresh();
      window.dispatchEvent(new CustomEvent('tripdee-vehicles-updated'));
    } catch (err) {
      console.error('Error deleting vehicle:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const vehicleData = {
      id: editingVehicle?.id,
      title: formData.get('title') as string,
      type: formData.get('type') as 'van' | 'suv' | 'car',
      seats: Number(formData.get('seats')) || 9,
      driverName: formData.get('driverName') as string,
      driverNickname: formData.get('driverNickname') as string,
      driverPhone: formData.get('driverPhone') as string,
      driverLine: formData.get('driverLine') as string,
      driverWhatsapp: (formData.get('driverWhatsapp') as string) || undefined,
      driverWechat: (formData.get('driverWechat') as string) || undefined,
      driverKakao: (formData.get('driverKakao') as string) || undefined,
      region: formData.get('region') as 'north' | 'central' | 'south' | 'east' | 'isan',
      location: formData.get('location') as string,
      plateType: (formData.get('plateType') as 'yellow' | 'blue') || 'yellow',
      plateNumber: (formData.get('plateNumber') as string) || undefined,
      canIssueTaxInvoice: formData.get('canIssueTaxInvoice') === 'true',
      isAvailable: formData.get('isAvailable') !== 'false',
      rentalType: (formData.get('rentalType') as 'with_driver' | 'self_drive') || (formData.get('type') === 'van' ? 'with_driver' : 'self_drive'),
      transmission: (formData.get('transmission') as 'auto' | 'manual') || 'auto',
      rating: Number(formData.get('rating')) || 5.0,
      isVerified: formData.get('isVerified') === 'true',
      zoneRates: {
        city: Number(formData.get('rate_city')) || 1900,
        midHill: Number(formData.get('rate_midHill')) || 2100,
        highHill: Number(formData.get('rate_highHill')) || 2300,
        crossProvince: Number(formData.get('rate_cross')) || 2700,
      } as Record<ZoneId, number>,
      description: formData.get('description') as string,
    };

    try {
      const method = editingVehicle ? 'PUT' : 'POST';
      await fetch('/api/vehicles', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleData),
      });

      setEditingVehicle(null);
      setIsNewModalOpen(false);
      onRefresh();
      window.dispatchEvent(new CustomEvent('tripdee-vehicles-updated'));
    } catch (err) {
      console.error('Error saving vehicle:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-paper p-3 rounded-2xl border border-rule">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-2" />
          <input
            type="text"
            placeholder="ค้นหารถ ชื่อคนขับ เบอร์โทร..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-card border border-rule text-xs focus:outline-accent"
          />
        </div>

        <button
          onClick={() => {
            setEditingVehicle(null);
            setIsNewModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-pill bg-accent px-4 py-1.5 text-xs font-extrabold text-white hover:bg-accent-deep transition-transform active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>เพิ่มรถใหม่</span>
        </button>
      </div>

      {/* Vehicle List */}
      {filtered.length === 0 ? (
        <p className="text-xs text-ink-2 italic p-6 text-center rounded-2xl bg-paper">
          ไม่พบข้อมูลรถในระบบ
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => (
            <div
              key={v.id}
              className="rounded-2xl bg-paper p-4 border border-rule/80 hover:border-accent/40 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-accent/10 text-accent font-bold text-xs shrink-0">
                      <CarFront className="h-3.5 w-3.5" />
                    </span>
                    <h4 className="font-extrabold text-sm text-ink truncate">{v.title}</h4>
                    {v.isVerified && (
                      <span className="flex items-center gap-0.5 rounded-pill bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 text-[10px] font-extrabold border border-amber-300 shrink-0">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-2 mt-1">
                    คนขับ: <span className="font-bold text-ink">{v.driverName} ({v.driverNickname})</span> • {v.seats} ที่นั่ง • โซน: {v.location}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleToggleVerified(v)}
                    title={v.isVerified ? 'คลิกเพื่อปิดสถานะรถแนะนำ' : 'คลิกเพื่อตั้งเป็นรถแนะนำ'}
                    className={`rounded-pill px-2.5 py-1 text-[11px] font-extrabold transition-colors ${
                      v.isVerified ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/50 hover:bg-amber-500/30' : 'bg-rule text-ink-2 hover:bg-rule-2'
                    }`}
                  >
                    {v.isVerified ? '⭐ รถแนะนำ' : '+ ดันแนะนำ'}
                  </button>
                  <button
                    onClick={() => setEditingVehicle(v)}
                    className="grid h-7 w-7 place-items-center rounded-lg bg-card hover:bg-paper-2 text-ink border border-rule transition-transform active:scale-95"
                    title="แก้ไขข้อมูลรถ"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingVehicle(v)}
                    className="grid h-7 w-7 place-items-center rounded-lg bg-berry-soft hover:bg-berry/20 text-berry transition-transform active:scale-95"
                    title="ลบรถออกจากระบบ"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-card p-2.5 border border-rule text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-ink-2 block">เบอร์โทร:</span>
                  <span className="font-mono font-bold text-ink">{v.driverPhone}</span>
                </div>
                <div>
                  <span className="text-ink-2 block">LINE:</span>
                  <span className="font-mono text-accent-deep truncate block">{v.driverLine || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-ink-2 block">อัตราค่าบริการเริ่มต้น:</span>
                  <span className="font-bold text-accent">{v.zoneRates?.city?.toLocaleString() || '-'} บ./วัน</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / New Vehicle Modal */}
      {(editingVehicle || isNewModalOpen) && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-card p-6 shadow-2xl border border-rule text-ink my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-extrabold text-lg mb-4 text-ink">
              {editingVehicle ? '✏️ แก้ไขข้อมูลยานพาหนะ' : '➕ เพิ่มรถใหม่เข้าสู่แคตตาล็อก'}
            </h3>

            <form onSubmit={handleSaveVehicle} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-ink block mb-1">ชื่อรถ / สเปกพาดหัว *</label>
                <input
                  name="title"
                  defaultValue={editingVehicle?.title || ''}
                  required
                  list="admin-vehicle-models"
                  placeholder="เช่น Toyota Commuter VIP 9 ที่นั่ง หรือเลือกจากรายการรุ่นรถยอดนิยม"
                  className="w-full p-2 rounded-xl bg-paper border border-rule text-ink focus:outline-accent"
                />
                <datalist id="admin-vehicle-models">
                  {ALL_VEHICLE_MODELS.map((model) => (
                    <option key={model} value={model} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">ประเภทรถ *</label>
                  <select
                    name="type"
                    defaultValue={editingVehicle?.type || 'van'}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  >
                    <option value="van">รถตู้ (Van)</option>
                    <option value="suv">SUV 7 ที่นั่ง</option>
                    <option value="car">รถเก๋ง / รถรับส่ง</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">จำนวนที่นั่ง *</label>
                  <input
                    name="seats"
                    type="number"
                    defaultValue={editingVehicle?.seats || 9}
                    required
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">รูปแบบบริการ *</label>
                  <select
                    name="rentalType"
                    defaultValue={editingVehicle?.rentalType || (editingVehicle?.type === 'van' ? 'with_driver' : 'self_drive')}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  >
                    <option value="with_driver">🚐 รถตู้พร้อมคนขับ</option>
                    <option value="self_drive">🚗 รถเช่าขับเอง</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">ระบบเกียร์ *</label>
                  <select
                    name="transmission"
                    defaultValue={editingVehicle?.transmission || 'auto'}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  >
                    <option value="auto">⚙️ เกียร์อัตโนมัติ (Auto)</option>
                    <option value="manual">🕹️ เกียร์ธรรมดา (Manual)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">ชื่อคนขับ *</label>
                  <input
                    name="driverName"
                    defaultValue={editingVehicle?.driverName || ''}
                    required
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">ชื่อเล่นคนขับ *</label>
                  <input
                    name="driverNickname"
                    defaultValue={editingVehicle?.driverNickname || ''}
                    required
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">เบอร์โทรศัพท์ *</label>
                  <input
                    name="driverPhone"
                    defaultValue={editingVehicle?.driverPhone || ''}
                    required
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">LINE ลิงก์ / ID</label>
                  <input
                    name="driverLine"
                    defaultValue={editingVehicle?.driverLine || ''}
                    placeholder="https://line.me/..."
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">WhatsApp ลิงก์</label>
                  <input
                    name="driverWhatsapp"
                    defaultValue={editingVehicle?.driverWhatsapp || ''}
                    placeholder="https://wa.me/..."
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">WeChat ID</label>
                  <input
                    name="driverWechat"
                    defaultValue={editingVehicle?.driverWechat || ''}
                    placeholder="เช่น chaicnx_van"
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">KakaoTalk ID</label>
                  <input
                    name="driverKakao"
                    defaultValue={editingVehicle?.driverKakao || ''}
                    placeholder="เช่น chaivan_cnx"
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">ภูมิภาคหลัก *</label>
                  <select
                    name="region"
                    defaultValue={editingVehicle?.region || 'north'}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  >
                    <option value="north">ภาคเหนือ</option>
                    <option value="central">ภาคกลาง / กทม.</option>
                    <option value="south">ภาคใต้</option>
                    <option value="east">ภาคตะวันออก</option>
                    <option value="isan">ภาคอีสาน</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">พื้นที่ให้บริการ / เส้นทาง</label>
                  <input
                    name="location"
                    defaultValue={editingVehicle?.location || 'เชียงใหม่ / ม่อนแจ่ม / ดอยอินทนนท์'}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
              </div>

              {/* License Plate & Corporate Tax Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-paper border border-rule">
                <div>
                  <label className="font-bold text-ink block mb-1">ประเภทป้ายทะเบียน</label>
                  <select
                    name="plateType"
                    defaultValue={editingVehicle?.plateType || 'yellow'}
                    className="w-full p-2 rounded-xl bg-card border border-rule text-ink text-xs font-bold"
                  >
                    <option value="yellow">🟡 ป้ายเหลือง 30 (ขนส่งสาธารณะ)</option>
                    <option value="blue">🔵 ป้ายฟ้า (รถตู้ส่วนบุคคล/VIP)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">เลขทะเบียนรถ</label>
                  <input
                    name="plateNumber"
                    defaultValue={editingVehicle?.plateNumber || ''}
                    placeholder="เช่น 30-1425 ชม."
                    className="w-full p-2 rounded-xl bg-card border border-rule text-ink font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">ออกใบกำกับภาษี</label>
                  <select
                    name="canIssueTaxInvoice"
                    defaultValue={editingVehicle?.canIssueTaxInvoice ? 'true' : 'false'}
                    className="w-full p-2 rounded-xl bg-card border border-rule text-ink text-xs font-bold"
                  >
                    <option value="true">✓ ออกใบกำกับภาษีได้ (หัก 3%)</option>
                    <option value="false">บุคคลธรรมดา (ไม่ออกภาษี)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">สถานะรับงาน</label>
                  <select
                    name="isAvailable"
                    defaultValue={editingVehicle?.isAvailable !== false ? 'true' : 'false'}
                    className="w-full p-2 rounded-xl bg-card border border-rule text-ink text-xs font-bold"
                  >
                    <option value="true">พร้อมรับงาน (Available)</option>
                    <option value="false">คิวเต็มชั่วคราว (Busy)</option>
                  </select>
                </div>
              </div>

              {/* Rates */}
              <div className="p-3 rounded-xl bg-paper border border-rule space-y-1">
                <label className="font-bold text-ink block">อัตราค่าบริการเริ่มต้นต่อวัน (บาท/วัน) *</label>
                <input
                  name="rate_city"
                  type="number"
                  min={500}
                  step={100}
                  defaultValue={editingVehicle?.zoneRates?.city || 1900}
                  required
                  className="w-full p-2 rounded-xl bg-card border border-rule text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">เรตติ้งคะแนน (1.0 - 5.0)</label>
                  <input
                    name="rating"
                    type="number"
                    step="0.1"
                    defaultValue={editingVehicle?.rating || 5.0}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">สถานะรถแนะนำ (Featured Listing)</label>
                  <select
                    name="isVerified"
                    defaultValue={editingVehicle?.isVerified ? 'true' : 'false'}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  >
                    <option value="true">⭐ เปิดสถานะรถแนะนำ (Featured)</option>
                    <option value="false">รถทั่วไป (Standard Listing)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">คำอธิบายรายละเอียด</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingVehicle?.description || ''}
                  className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-rule">
                <button
                  type="button"
                  onClick={() => {
                    setEditingVehicle(null);
                    setIsNewModalOpen(false);
                  }}
                  className="rounded-pill px-4 py-2 text-xs font-bold text-ink-2 hover:bg-paper"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-pill bg-accent px-5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-accent-deep transition-transform active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AdminDeleteModal
        isOpen={Boolean(deletingVehicle)}
        title="ยืนยันการลบรถออกจากระบบ"
        itemTitle={deletingVehicle?.title || ''}
        isDeleting={isSubmitting}
        onClose={() => setDeletingVehicle(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
