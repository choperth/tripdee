'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  Printer,
  Phone,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Star,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { Vehicle } from '@/data/mockData';
import { useLanguage } from '@/context/LanguageContext';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { getPublicDriverName, maskPlateNumber } from '@/lib/privacy';
import { generateQrMatrix, renderQrSvgPath } from '@/lib/qrCode';

interface DriverSmartECardModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
}

type QrMode = 'line' | 'tel' | 'web';
type CardTheme = 'navy' | 'gold' | 'light';

export const DriverSmartECardModal: React.FC<DriverSmartECardModalProps> = ({
  vehicle,
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, { onClose, enabled: isOpen });

  const [qrMode, setQrMode] = useState<QrMode>('line');
  const [theme, setTheme] = useState<CardTheme>('navy');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedIntro, setCopiedIntro] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const publicName = getPublicDriverName(vehicle.driverName, vehicle.driverNickname);
  const cleanPhone = vehicle.driverPhone.replace(/\D/g, '');
  const cleanPlate = vehicle.plateNumber ? maskPlateNumber(vehicle.plateNumber) : 'ป้ายถูกกฎหมาย';
  const locationShort = vehicle.location.split('/')[0].trim();

  // Dynamic QR Code target URL / Payload
  const qrTarget = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const baseUrl = window.location.origin;
    const vehicleUrl = `${baseUrl}/#vehicle-${vehicle.id}`;

    switch (qrMode) {
      case 'line':
        return vehicle.driverLine || `https://line.me/ti/p/~${cleanPhone}`;
      case 'tel':
        return `tel:${cleanPhone}`;
      case 'web':
      default:
        return vehicleUrl;
    }
  }, [qrMode, vehicle.id, vehicle.driverLine, cleanPhone]);

  // Generate QR Matrix
  const qrMatrix = useMemo(() => {
    if (!qrTarget) return [];
    try {
      return generateQrMatrix(qrTarget);
    } catch {
      return [];
    }
  }, [qrTarget]);

  const qrSvgPath = useMemo(() => {
    if (!qrMatrix.length) return '';
    return renderQrSvgPath(qrMatrix);
  }, [qrMatrix]);

  if (!isOpen) return null;

  const profileUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/#vehicle-${vehicle.id}`
      : `https://tripdee.com/#vehicle-${vehicle.id}`;

  const introText = `📇 นามบัตรคนขับรถตู้ VIP - ${publicName}
🚗 ${vehicle.title} (${vehicle.seats} ที่นั่ง)
📍 ประจำจุด: ${vehicle.location}
⭐ รีวิว: ${vehicle.rating} เต็ม 5.0 (${vehicle.reviewCount} รีวิว)
📞 โทรตรง: ${vehicle.driverPhone}
💬 LINE: ${vehicle.driverLine}
🌐 ดูรูปรถ ตารางคิวว่าง และจองตรง 0% คอมมิชชั่นได้ที่: ${profileUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyIntro = () => {
    navigator.clipboard.writeText(introText);
    setCopiedIntro(true);
    setTimeout(() => setCopiedIntro(false), 2500);
  };

  const handleShareLine = () => {
    const lineShareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
      profileUrl
    )}&text=${encodeURIComponent(introText)}`;
    window.open(lineShareUrl, '_blank', 'noopener,noreferrer');
  };

  const handlePrint = () => {
    window.print();
  };

  // Export card as high-res PNG image via HTML5 Canvas
  const handleDownloadImage = async () => {
    setIsExporting(true);
    try {
      const canvas = document.createElement('canvas');
      const width = 1000;
      const height = 600;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background
      if (theme === 'light') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        // Soft border
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, width - 20, height - 20);
      } else if (theme === 'gold') {
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#1c1917');
        bgGrad.addColorStop(1, '#292524');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 6;
        ctx.strokeRect(12, 12, width - 24, height - 24);
      } else {
        // Deep Navy (Default)
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#0b192c');
        bgGrad.addColorStop(1, '#1e3e62');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 4;
        ctx.strokeRect(12, 12, width - 24, height - 24);
      }

      // Brand Header
      ctx.fillStyle = theme === 'light' ? '#0b192c' : '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('TRIPDEE • รถตู้ VIP ท่องเที่ยวทั่วไทย', 50, 65);

      // Featured badge
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('⭐ TRIPDEE FEATURED VIP (0% คอมมิชชั่น)', 50, 100);

      // Driver Name
      ctx.fillStyle = theme === 'light' ? '#0f172a' : '#f8fafc';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText(publicName, 50, 175);

      // Rating & Plate
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`★ ${vehicle.rating} (${vehicle.reviewCount} รีวิว)`, 50, 220);

      ctx.fillStyle = theme === 'light' ? '#475569' : '#94a3b8';
      ctx.font = '18px sans-serif';
      ctx.fillText(`• ${cleanPlate} (${locationShort})`, 250, 220);

      // Vehicle Title
      ctx.fillStyle = theme === 'light' ? '#1e293b' : '#e2e8f0';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(vehicle.title.substring(0, 48), 50, 275);

      // Amenities line
      ctx.fillStyle = theme === 'light' ? '#64748b' : '#cbd5e1';
      ctx.font = '18px sans-serif';
      const amenitiesText = vehicle.amenities.slice(0, 4).join(' • ');
      ctx.fillText(`สิ่งอำนวยความสะดวก: ${amenitiesText}`, 50, 320);

      // Contact info boxes
      ctx.fillStyle = theme === 'light' ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(50, 360, 450, 70);
      ctx.fillStyle = theme === 'light' ? '#0b192c' : '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(`📞 โทร: ${vehicle.driverPhone}`, 70, 405);

      ctx.fillStyle = theme === 'light' ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(50, 445, 450, 70);
      ctx.fillStyle = '#06c755';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`💬 LINE: ${vehicle.driverLine}`, 70, 490);

      // Draw QR Code on the right
      const qrBoxX = 640;
      const qrBoxY = 120;
      const qrBoxSize = 310;

      // QR White Background Card
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(qrBoxX - 15, qrBoxY - 15, qrBoxSize + 30, qrBoxSize + 85, 20);
      ctx.fill();

      // Draw QR Matrix
      if (qrMatrix.length > 0) {
        const matrixSize = qrMatrix.length;
        const cellSize = qrBoxSize / matrixSize;
        ctx.fillStyle = '#0b192c';

        for (let r = 0; r < matrixSize; r++) {
          for (let c = 0; c < matrixSize; c++) {
            if (qrMatrix[r][c]) {
              ctx.fillRect(qrBoxX + c * cellSize, qrBoxY + r * cellSize, cellSize + 0.5, cellSize + 0.5);
            }
          }
        }
      }

      // QR label
      ctx.fillStyle = '#0b192c';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      const label = qrMode === 'line' ? 'สแกนเพิ่มเพื่อน LINE' : qrMode === 'tel' ? 'สแกนโทรออกทันที' : 'สแกนดูโปรไฟล์ TripDee';
      ctx.fillText(label, qrBoxX + qrBoxSize / 2, qrBoxY + qrBoxSize + 35);
      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.fillText('ติดต่อคนขับตรง • 0% ค่าคอมมิชชั่น', qrBoxX + qrBoxSize / 2, qrBoxY + qrBoxSize + 60);

      // Footer
      ctx.textAlign = 'left';
      ctx.fillStyle = theme === 'light' ? '#94a3b8' : '#64748b';
      ctx.font = '16px sans-serif';
      ctx.fillText('จองรถตู้ VIP ปลอดภัย ไร้นายหน้า • www.tripdee.com', 50, 565);

      // Trigger download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `TripDee-ECard-${publicName.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export e-card image', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-500 flex items-center justify-center overflow-y-auto bg-navy-deep/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="นามบัตรดิจิทัลคนขับ (Smart E-Card)"
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-2xl max-h-[94vh] overflow-y-auto rounded-3xl bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-800 shadow-2xl text-ink-primary dark:text-slate-100 p-space-md sm:p-space-lg"
      >
        {/* Top Header & Customizer Bar */}
        <div className="flex items-center justify-between gap-4 pb-space-sm border-b border-border-subtle dark:border-slate-800">
          <div>
            <div className="flex items-center gap-1.5 text-amber-500 font-label-badge text-label-badge font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart E-Card & QR</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-navy-deep dark:text-white">
              นามบัตรดิจิทัลของคนขับ
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="w-8 h-8 rounded-full bg-paper-surface-muted dark:bg-slate-800 flex items-center justify-center text-ink-secondary hover:text-ink-primary hover:bg-surface-variant transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme & QR Mode Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-space-xs text-xs">
          {/* Theme Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-ink-muted dark:text-slate-400">ธีมนามบัตร:</span>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-paper-canvas dark:bg-slate-800 border border-border-subtle dark:border-slate-700">
              <button
                type="button"
                onClick={() => setTheme('navy')}
                className={`px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                  theme === 'navy'
                    ? 'bg-navy-deep text-white shadow-xs font-bold'
                    : 'text-ink-secondary dark:text-slate-300'
                }`}
              >
                หรูหราน้ำเงินเข้ม
              </button>
              <button
                type="button"
                onClick={() => setTheme('gold')}
                className={`px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                  theme === 'gold'
                    ? 'bg-amber-600 text-white shadow-xs font-bold'
                    : 'text-ink-secondary dark:text-slate-300'
                }`}
              >
                แบล็คโกลด์
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-navy-deep shadow-xs font-bold border border-border-subtle'
                    : 'text-ink-secondary dark:text-slate-300'
                }`}
              >
                โมเดิร์นคลีน
              </button>
            </div>
          </div>

          {/* QR Mode Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-ink-muted dark:text-slate-400">QR เจาะจง:</span>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-paper-canvas dark:bg-slate-800 border border-border-subtle dark:border-slate-700">
              <button
                type="button"
                onClick={() => setQrMode('line')}
                className={`px-2 py-1 rounded-md transition-all font-medium cursor-pointer flex items-center gap-1 ${
                  qrMode === 'line'
                    ? 'bg-line-green text-white shadow-xs font-bold'
                    : 'text-ink-secondary dark:text-slate-300'
                }`}
              >
                <MessageCircle className="w-3 h-3" />
                <span>LINE</span>
              </button>
              <button
                type="button"
                onClick={() => setQrMode('tel')}
                className={`px-2 py-1 rounded-md transition-all font-medium cursor-pointer flex items-center gap-1 ${
                  qrMode === 'tel'
                    ? 'bg-blue-action text-white shadow-xs font-bold'
                    : 'text-ink-secondary dark:text-slate-300'
                }`}
              >
                <Phone className="w-3 h-3" />
                <span>โทรออก</span>
              </button>
              <button
                type="button"
                onClick={() => setQrMode('web')}
                className={`px-2 py-1 rounded-md transition-all font-medium cursor-pointer flex items-center gap-1 ${
                  qrMode === 'web'
                    ? 'bg-navy-deep text-white shadow-xs font-bold'
                    : 'text-ink-secondary dark:text-slate-300'
                }`}
              >
                <QrCode className="w-3 h-3" />
                <span>เว็บโปรไฟล์</span>
              </button>
            </div>
          </div>
        </div>

        {/* The Luxury E-Card Container */}
        <div className="my-space-sm">
          <div
            ref={cardRef}
            id="printable-ecard"
            className={`relative rounded-3xl p-5 sm:p-7 shadow-2xl transition-all duration-300 overflow-hidden border ${
              theme === 'navy'
                ? 'bg-gradient-to-br from-[#0b192c] via-[#11243d] to-[#1e3e62] text-white border-amber-400/40'
                : theme === 'gold'
                ? 'bg-gradient-to-br from-neutral-950 via-neutral-900 to-amber-950/80 text-amber-50 border-amber-500/60'
                : 'bg-white text-navy-deep border-slate-200 shadow-xl'
            }`}
          >
            {/* Background Decorative Accents */}
            <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

            {/* Top Bar of the Card */}
            <div className="relative z-10 flex items-center justify-between gap-3 pb-4 border-b border-white/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-navy-deep flex items-center justify-center font-black text-sm shadow-md">
                  TD
                </div>
                <div>
                  <span className="font-bold text-sm tracking-wide block leading-none">
                    TRIPDEE
                  </span>
                  <span className="text-[10px] opacity-75 uppercase tracking-wider block mt-0.5">
                    {vehicle.isVerified ? 'Featured VIP Driver' : 'VIP Driver Partner'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-500/30 shadow-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{vehicle.isVerified ? 'รถแนะนำประจำโซน' : 'ดีลตรง 0% คอมมิชชั่น'}</span>
                </span>
              </div>
            </div>

            {/* Main Card Body (2 Columns: Driver Info + QR Code) */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-5 pt-4 items-center">
              {/* Left Column: Driver Info (7 cols) */}
              <div className="sm:col-span-7 space-y-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                      {publicName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs mt-1">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{vehicle.rating}</span>
                      <span className="opacity-80 font-normal">({vehicle.reviewCount} รีวิว)</span>
                    </span>
                    <span>•</span>
                    <span className="opacity-80 truncate">{cleanPlate}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="font-bold text-sm opacity-95">
                    {vehicle.title}
                  </div>
                  <div className="opacity-75 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px]">location_on</span>
                    <span>ประจำ: {vehicle.location}</span>
                  </div>
                </div>

                {/* Amenities Pills */}
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {vehicle.amenities.slice(0, 4).map((item) => (
                    <span
                      key={item}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        theme === 'light'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-white/10 text-white/90 border border-white/10'
                      }`}
                    >
                      {item}
                    </span>
                  ))}
                </div>

                {/* Direct Action Contacts */}
                <div className="pt-2 flex flex-col gap-1.5">
                  <a
                    href={`tel:${cleanPhone}`}
                    className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl transition-all ${
                      theme === 'light'
                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        : 'bg-white/10 text-white hover:bg-white/15 border border-white/15'
                    }`}
                  >
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>โทรตรง: {vehicle.driverPhone}</span>
                  </a>

                  <a
                    href={vehicle.driverLine}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl transition-all ${
                      theme === 'light'
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">LINE: {vehicle.driverLine}</span>
                  </a>
                </div>
              </div>

              {/* Right Column: Scannable QR Code (5 cols) */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center">
                <div className="p-3 bg-white rounded-2xl shadow-xl border border-white/20 flex flex-col items-center">
                  {/* SVG Vector QR Code */}
                  <div className="w-36 h-36 relative flex items-center justify-center">
                    {qrMatrix.length > 0 ? (
                      <svg
                        viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                        className="w-full h-full text-navy-deep fill-current"
                        shapeRendering="crispEdges"
                      >
                        <path d={qrSvgPath} />
                      </svg>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                        กำลังสร้าง QR...
                      </div>
                    )}
                  </div>

                  <div className="text-center mt-2 space-y-0.5">
                    <span className="text-navy-deep font-bold text-xs block">
                      {qrMode === 'line'
                        ? 'สแกนแอด LINE คนขับ'
                        : qrMode === 'tel'
                        ? 'สแกนเพื่อโทรออก'
                        : 'สแกนดูโปรไฟล์รถ'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      ติดต่อตรง 0% คอมมิชชั่น
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Bottom Tagline */}
            <div className="relative z-10 mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] opacity-75">
              <span>จองรถตู้ VIP ปลอดภัย ไร้นายหน้า</span>
              <span className="font-mono">www.tripdee.com</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-space-xs border-t border-border-subtle dark:border-slate-800">
          {/* Share to LINE */}
          <button
            type="button"
            onClick={handleShareLine}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-line-green hover:bg-line-green-hover text-white font-medium text-xs shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>แชร์เข้า LINE</span>
          </button>

          {/* Copy Intro Text */}
          <button
            type="button"
            onClick={handleCopyIntro}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-paper-canvas dark:bg-slate-800 hover:bg-surface-variant border border-border-subtle dark:border-slate-700 text-ink-primary dark:text-slate-100 font-medium text-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            {copiedIntro ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>คัดลอกข้อความแล้ว!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-ink-muted" />
                <span>คัดลอกข้อความแนะนำ</span>
              </>
            )}
          </button>

          {/* Download Image */}
          <button
            type="button"
            disabled={isExporting}
            onClick={handleDownloadImage}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-navy-deep hover:bg-navy-surface text-white font-medium text-xs shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'กำลังสร้างรูป...' : 'บันทึกรูปภาพ'}</span>
          </button>

          {/* Copy Web Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-paper-canvas dark:bg-slate-800 hover:bg-surface-variant border border-border-subtle dark:border-slate-700 text-ink-primary dark:text-slate-100 font-medium text-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>คัดลอกลิงก์แล้ว!</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-3.5 h-3.5 text-ink-muted" />
                <span>คัดลอกลิงก์เว็บ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
