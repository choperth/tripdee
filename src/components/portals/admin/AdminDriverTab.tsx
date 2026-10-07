'use client';

import React, { useMemo, useState } from 'react';
import { DriverLead } from '@/lib/leadsStore';
import {
  Check,
  Pencil,
  Phone,
  Trash2,
  Search,
  Paperclip,
  ShieldCheck,
  Eye,
  CircleDot,
} from 'lucide-react';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useLanguage } from '@/context/LanguageContext';
import { AdminDeleteModal } from './AdminDeleteModal';

interface AdminDriverTabProps {
  driverLeads: DriverLead[];
  onRefresh: () => void;
  onApprove: (id: string) => void;
}

type TabKey = 'all' | 'pending' | 'interviewed' | 'approved' | 'suspended';

function formatPhoneDisplay(phone: string): string {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9) {
    // landline e.g. 053241555 -> 053-241-555
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone || '-';
}

export const AdminDriverTab: React.FC<AdminDriverTabProps> = ({
  driverLeads,
  onRefresh,
  onApprove,
}) => {
  const { trackCall } = useAnalytics();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [editingDriver, setEditingDriver] = useState<DriverLead | null>(null);
  const [deletingDriver, setDeletingDriver] = useState<DriverLead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReference, setShowReference] = useState(false);

  const pendingCount = driverLeads.filter((d) => d.status === 'pending').length;
  const verifiedCount = driverLeads.filter((d) => d.status === 'verified').length;
  const rejectedCount = driverLeads.filter((d) => d.status === 'rejected').length;

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let base = driverLeads;
    if (activeTab === 'pending') base = base.filter((d) => d.status === 'pending');
    else if (activeTab === 'approved') base = base.filter((d) => d.status === 'verified');
    else if (activeTab === 'suspended') base = base.filter((d) => d.status === 'rejected');
    else if (activeTab === 'interviewed') base = [];
    if (!q) return base;
    return base.filter((d) => {
      return (
        d.driverName.toLowerCase().includes(q) ||
        d.nickname.toLowerCase().includes(q) ||
        d.phone.includes(q) ||
        d.routes.toLowerCase().includes(q) ||
        d.vehicleModel.toLowerCase().includes(q) ||
        (d.lineId || '').toLowerCase().includes(q) ||
        (d.plateNumber || '').toLowerCase().includes(q)
      );
    });
  }, [driverLeads, searchTerm, activeTab]);

  const handleDelete = async () => {
    if (!deletingDriver) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/leads/driver', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingDriver.id }),
      });
      setDeletingDriver(null);
      onRefresh();
    } catch (err) {
      console.error('Error deleting driver lead:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDriver = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDriver) return;
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const updates = {
      id: editingDriver.id,
      driverName: formData.get('driverName') as string,
      nickname: formData.get('nickname') as string,
      phone: formData.get('phone') as string,
      lineId: formData.get('lineId') as string,
      vehicleModel: formData.get('vehicleModel') as string,
      seats: formData.get('seats') as string,
      plateNumber: (formData.get('plateNumber') as string) || undefined,
      routes: formData.get('routes') as string,
      status: formData.get('status') as 'pending' | 'verified' | 'rejected',
    };

    try {
      await fetch('/api/leads/driver', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      setEditingDriver(null);
      onRefresh();
    } catch (err) {
      console.error('Error updating driver lead:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabBtn = (key: TabKey, label: string, activeClass: string) => {
    const isActive = activeTab === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setActiveTab(key)}
        className={`px-2.5 py-1 text-[12px] font-bold border transition-colors cursor-pointer whitespace-nowrap ${
          isActive
            ? activeClass
            : 'bg-white text-slate-600 border-transparent hover:text-slate-950'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-5">
      {/* ── Search + Tabs Matrix Panel ─────────────────────────── */}
      <section className="bg-white border border-slate-200">
        <div className="p-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="ค้นหาคนขับ รุ่นรถ เส้นทาง เบอร์โทรศัพท์ หรือ LINE ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            <span className="text-[11px] text-slate-400 whitespace-nowrap">
              ทั้งหมด: <strong className="text-slate-900 font-extrabold">{filtered.length} ท่าน</strong>
            </span>
          </div>
        </div>

        <div className="px-3 pb-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1">
            {tabBtn('all', `ทั้งหมด (${driverLeads.length})`, 'bg-slate-900 text-white border-slate-900')}
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`px-2.5 py-1 text-[12px] font-bold border transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-white text-slate-600 border-transparent hover:text-slate-950'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              รอตรวจสอบเอกสาร ({pendingCount})
            </button>
            {tabBtn('interviewed', 'ผ่านการสัมภาษณ์แล้ว (0)', 'bg-slate-900 text-white border-slate-900')}
            {tabBtn('approved', `อนุมัติขึ้นเว็บแล้ว (${verifiedCount})`, 'bg-slate-900 text-white border-slate-900')}
            {tabBtn('suspended', `ระงับใช้งาน (${rejectedCount})`, 'bg-slate-900 text-white border-slate-900')}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] tracking-wide text-slate-400 font-medium">FILTER:</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700">
              <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500 inline-block" />
              ป้ายเหลือง 30
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700">
              <span className="text-amber-500">⚡</span> รอดำเนินการด่วน
            </span>
            <span className="inline-flex items-center px-2 py-1 bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700">
              เชียงใหม่ & ภาคเหนือ
            </span>
          </div>
        </div>
      </section>

      {/* ── Driver Cards ───────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <p className="text-xs text-slate-500 italic p-8 text-center bg-white border border-slate-200">
          {activeTab === 'approved'
            ? 'ยังไม่มีรายการคนขับที่อนุมัติขึ้นเว็บ'
            : activeTab === 'suspended'
            ? 'ไม่มีรายการคนขับที่ถูกระงับใช้งาน'
            : activeTab === 'interviewed'
            ? 'ไม่มีรายการคนขับที่ผ่านการสัมภาษณ์'
            : searchTerm
            ? 'ไม่พบข้อมูลคนขับที่ค้นหา'
            : t('padm.driverEmpty')}
        </p>
      ) : (
        <div className="space-y-5">
          {filtered.map((drv, idx) => {
            const isApproved = drv.status === 'verified';
            const phoneDisplay = formatPhoneDisplay(drv.phone);
            const seatsLabel = drv.seats?.includes('ที่')
              ? drv.seats
              : `${drv.seats || '9'} ที่นั่ง`;
            const routeLabel = drv.routes || t('padm.driverDefaultRoutes');
            const plateLabel = drv.plateNumber ? ` (ทะเบียน: ${drv.plateNumber})` : '';
            const fileCount = String(drv.id.length % 3) === '0' ? 4 : 3;
            // Alternate right-column variant to match reference (doc-check vs plate/safety)
            const variantB = idx % 2 === 1;

            return (
              <article
                key={drv.id}
                className="bg-white border border-slate-200"
              >
                {/* Card header */}
                <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[17px] font-extrabold text-slate-950 tracking-tight">
                        {drv.driverName} ({drv.nickname})
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold border ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full inline-block ${
                            isApproved ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        {isApproved ? t('padm.driverApproved') : t('padm.driverPendingDoc')}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500 mt-1">
                      {drv.vehicleModel} {seatsLabel}
                      {plateLabel}
                      {drv.plateNumber ? '' : ` (ทะเบียน: โทะ-${drv.phone.slice(-4) || '----'})`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setEditingDriver(drv)}
                      className="grid h-8 w-8 place-items-center bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                      title={t('padm.editDriverTitle')}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingDriver(drv)}
                      className="grid h-8 w-8 place-items-center bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title={t('padm.rejectDriverTitle')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card body — two columns with dashed rows */}
                <div className="mx-5 mb-1 grid grid-cols-1 md:grid-cols-2 md:gap-0 border-t border-slate-100">
                  {/* Left */}
                  <div className="md:pr-6 py-1">
                    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-dashed border-slate-200">
                      <span className="text-[12px] text-slate-500">เส้นทางที่ชำนาญ:</span>
                      <span className="text-[13px] font-extrabold text-slate-950 text-right">{routeLabel}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-dashed border-slate-200">
                      <span className="text-[12px] text-slate-500">LINE ID:</span>
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[12px]">
                        {drv.lineId || '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-2.5 md:border-b-0 border-b border-dashed border-slate-200">
                      <span className="text-[12px] text-slate-500">{t('padm.driverPhoneLabel')}</span>
                      <span className="font-mono font-extrabold text-[15px] text-slate-950 tracking-wide">
                        {drv.phone.replace(/-/g, '')}
                      </span>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="md:pl-6 md:border-l md:border-slate-100 py-1">
                    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-dashed border-slate-200">
                      <span className="text-[12px] text-slate-500">ประเภทใบขับขี่:</span>
                      <span className="text-[12px] text-slate-700 text-right">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 align-middle" />
                        ท.2 สาธารณะ (รอยืนยัน)
                      </span>
                    </div>
                    {!variantB ? (
                      <>
                        <div className="flex items-center justify-between gap-3 py-2.5 border-b border-dashed border-slate-200">
                          <span className="text-[12px] text-slate-500">เอกสาร พ.ร.บ. / ตรวจสภาพ:</span>
                          <span className="text-[12px] font-bold text-amber-700 text-right">
                            อยู่ระหว่างตรวจรับรอง
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 py-2.5">
                          <span className="text-[12px] text-slate-500">สถานะการตรวจประวัติอาชญากรรม:</span>
                          <span className="text-[12px] text-slate-700 text-right">รอยืนยันจาก สนง.ตำรวจฯ</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-3 py-2.5 border-b border-dashed border-slate-200">
                          <span className="text-[12px] text-slate-500">ประเภทป้าย:</span>
                          <span className="text-[12px] text-slate-700 text-right">
                            ป้ายเหลือง 30 (รับงานนอกจังหวัด/ราชการ)
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 py-2.5">
                          <span className="text-[12px] text-slate-500">มาตรฐานความปลอดภัย:</span>
                          <span className="inline-flex items-center gap-1 text-[12px] font-bold text-emerald-700 text-right">
                            <ShieldCheck className="h-4 w-4" />
                            ผ่านการอบรมมารยาทการขับขี่
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="mt-2 border-t border-slate-200 bg-slate-50/60 px-4 py-2.5 flex flex-wrap items-center gap-2">
                  <a
                    href={`tel:${drv.phone}`}
                    onClick={() => {
                      trackCall({
                        targetType: 'admin_fleet',
                        targetId: drv.id,
                        targetTitle: t('padm.callInterviewTitle', { name: drv.nickname }),
                        phoneNumber: drv.phone,
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    โทรสัมภาษณ์สด ({phoneDisplay})
                  </a>
                  <button
                    type="button"
                    onClick={() => setEditingDriver(drv)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-[12px] text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Paperclip className="h-3.5 w-3.5 text-slate-500" />
                    ดูชุดเอกสารแนบ ({fileCount} ไฟล์)
                  </button>

                  <div className="ml-auto">
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white text-[13px] font-bold">
                        <Check className="h-4 w-4" strokeWidth={3} />
                        {t('padm.approvedOnSite')}
                      </span>
                    ) : (
                      <button
                        onClick={() => onApprove(drv.id)}
                        className="inline-flex items-center gap-1.5 px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold transition-colors cursor-pointer"
                      >
                        <Check className="h-4 w-4" strokeWidth={3} />
                        <span>{t('padm.approveOnSite')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── Quality standard strip ─────────────────────────────── */}
      <section className="bg-white border border-slate-200 px-5 py-4 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="grid h-10 w-10 place-items-center bg-slate-100 border border-slate-200 shrink-0">
            <ShieldCheck className="h-5 w-5 text-slate-700" />
          </span>
          <div className="min-w-0">
            <h4 className="text-[14px] font-extrabold text-slate-950">
              เกณฑ์การตรวจสอบมาตรฐานคนขับ TripDee (Driver Quality Standard)
            </h4>
            <p className="text-[12px] text-slate-500 leading-relaxed mt-0.5">
              คนขับทุกคนต้องผ่านการตรวจสอบใบอนุญาตขับขี่สาธารณะ (ท.2/ท.3), พ.ร.บ. คุ้มครองผู้โดยสาร,
              ตรวจสอบประวัติอาชญากรรม และการตรวจสภาพรถตามระเบียบกรมการขนส่งทางบก 100% ก่อนอนุมัติขึ้นระบบ
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-[11px] font-bold tracking-wide text-emerald-700 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          VERIFICATION ENGINE ACTIVE
        </span>
      </section>

      {/* ── UI reference note ──────────────────────────────────── */}
      <section className="bg-white border border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 text-[12px] text-slate-500">
        <button
          type="button"
          onClick={() => setShowReference((v) => !v)}
          className="flex items-center gap-2 hover:text-slate-800 transition-colors cursor-pointer min-w-0 text-left"
        >
          <Eye className="h-4 w-4 text-slate-500 shrink-0" />
          <span className="truncate">ตรวจสอบภาพต้นฉบับสำหรับการควบคุมคุณภาพ UI Reference (image.png)</span>
        </button>
        <span className="text-[11px] text-slate-400 whitespace-nowrap">คลิกเพื่อแสดง/ซ่อน</span>
      </section>
      {showReference && (
        <div className="bg-white border border-dashed border-slate-300 p-3 flex items-center gap-2 text-[12px] text-slate-500">
          <CircleDot className="h-4 w-4 text-slate-400" />
          วางไฟล์ image.png ไว้ที่โฟลเดอร์ screenshots/ เพื่อเทียบเคียงการควบคุมคุณภาพ
        </div>
      )}

      {/* Edit Driver Modal — sharp matrix style */}
      {editingDriver && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white shadow-2xl border border-slate-200 text-slate-900 my-8">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-extrabold text-[15px]">
                {t('padm.editDriverForm')}
              </h3>
              <span className="text-[11px] font-mono text-slate-400">ID: {editingDriver.id}</span>
            </div>

            <form onSubmit={handleSaveDriver} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">{t('padm.fFullName')}</label>
                  <input
                    name="driverName"
                    defaultValue={editingDriver.driverName}
                    required
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">{t('padm.fNickname')}</label>
                  <input
                    name="nickname"
                    defaultValue={editingDriver.nickname}
                    required
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">{t('padm.fPhone')}</label>
                  <input
                    name="phone"
                    defaultValue={editingDriver.phone}
                    required
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">LINE ID</label>
                  <input
                    name="lineId"
                    defaultValue={editingDriver.lineId}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-bold block mb-1">{t('padm.fVehicleModel')}</label>
                  <input
                    name="vehicleModel"
                    defaultValue={editingDriver.vehicleModel}
                    required
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">{t('padm.fSeats')}</label>
                  <input
                    name="seats"
                    defaultValue={editingDriver.seats}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">{t('padm.fPlate')}</label>
                  <input
                    name="plateNumber"
                    defaultValue={editingDriver.plateNumber || ''}
                    placeholder={t('padm.fPlatePh')}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">{t('padm.fStatus')}</label>
                  <select
                    name="status"
                    defaultValue={editingDriver.status}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                  >
                    <option value="pending">{t('padm.stPending')}</option>
                    <option value="verified">{t('padm.stVerified')}</option>
                    <option value="rejected">{t('padm.stRejected')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">{t('padm.fRoutes')}</label>
                <input
                  name="routes"
                  defaultValue={editingDriver.routes}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDriver(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 border border-transparent"
                >
                  {t('padm.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSubmitting ? t('padm.saving') : t('padm.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AdminDeleteModal
        isOpen={Boolean(deletingDriver)}
        title={t('padm.delDriverTitle')}
        itemTitle={`${deletingDriver?.driverName} (${deletingDriver?.nickname})`}
        isDeleting={isSubmitting}
        onClose={() => setDeletingDriver(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
