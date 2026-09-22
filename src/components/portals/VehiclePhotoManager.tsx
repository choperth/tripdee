'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, X, Plus, Loader2, Sparkles, Star, AlertCircle } from 'lucide-react';
import { compressImage, formatFileSize } from '@/lib/imageCompression';
import { useLanguage } from '@/context/LanguageContext';

export interface VehiclePhotoManagerProps {
  images: string[];
  onChange: (newImages: string[]) => void;
  maxPhotos?: number;
  className?: string;
}

export const VehiclePhotoManager: React.FC<VehiclePhotoManagerProps> = ({
  images,
  onChange,
  maxPhotos = 8,
  className = '',
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    savingsPercent: number;
    count: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg('');
    setIsProcessing(true);

    try {
      const remainingSlots = maxPhotos - images.length;
      if (remainingSlots <= 0) {
        setErrorMsg(`สามารถอัปโหลดรูปภาพได้สูงสุด ${maxPhotos} รูป`);
        setIsProcessing(false);
        return;
      }

      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      let totalOriginal = 0;
      let totalCompressed = 0;
      const compressedUrls: string[] = [];

      for (const file of filesToProcess) {
        try {
          const res = await compressImage(file, {
            maxWidth: 1280,
            maxHeight: 1280,
            quality: 0.82,
            preferredMimeType: 'image/webp',
          });
          compressedUrls.push(res.dataUrl);
          totalOriginal += res.originalSize;
          totalCompressed += res.compressedSize;
        } catch (err) {
          console.warn('Failed to compress file:', file.name, err);
        }
      }

      if (compressedUrls.length > 0) {
        const updatedImages = [...images, ...compressedUrls];
        onChange(updatedImages);

        const savings = totalOriginal > 0
          ? Math.max(0, Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100))
          : 0;

        setCompressionStats({
          originalSize: totalOriginal,
          compressedSize: totalCompressed,
          savingsPercent: savings,
          count: compressedUrls.length,
        });

        // Clear stats notice after 5 seconds
        setTimeout(() => setCompressionStats(null), 5000);
      }
    } catch (err) {
      setErrorMsg((err as Error).message || 'เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (indexToRemove: number) => {
    if (images.length <= 1) {
      const ok = confirm('หากลบรูปนี้ รถของคุณจะไม่มีรูปแสดงผล แนะนำให้มีอย่างน้อย 1 รูป คุณต้องการลบจริงหรือไม่?');
      if (!ok) return;
    }
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const handleSetPrimary = (indexToPrimary: number) => {
    if (indexToPrimary === 0) return;
    const target = images[indexToPrimary];
    const rest = images.filter((_, idx) => idx !== indexToPrimary);
    onChange([target, ...rest]);
  };

  return (
    <div className={`space-y-space-sm text-left ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-title-card text-title-card text-navy-deep dark:text-white flex items-center gap-1.5 font-bold">
            <Camera className="w-4 h-4 text-amber-accent" />
            <span>{t('pself.photoTitle')}</span>
          </span>
          <span className="text-[11px] font-bold text-ink-muted dark:text-slate-400 bg-paper-surface-muted dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {images.length}/{maxPhotos} {t('pself.unitPhotos')}
          </span>
        </div>
        <span className="text-xs text-ink-muted dark:text-slate-400 hidden sm:inline">
          {t('pself.photoTip')}
        </span>
      </div>

      {/* Compression Benefit Notification */}
      {compressionStats && (
        <div className="p-3 rounded-xl bg-verified-emerald-soft text-verified-emerald text-xs font-bold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>
              {t('pself.photoOptimized', {
                orig: formatFileSize(compressionStats.originalSize),
                comp: formatFileSize(compressionStats.compressedSize),
                pct: compressionStats.savingsPercent,
              })}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCompressionStats(null)}
            className="p-1 hover:bg-emerald-200/50 dark:hover:bg-emerald-900/50 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((imgUrl, index) => {
          const isPrimary = index === 0;
          return (
            <div
              key={`${imgUrl}-${index}`}
              className={`group relative rounded-2xl overflow-hidden aspect-video bg-paper-surface-muted dark:bg-slate-800 border-2 transition-all shadow-xs ${
                isPrimary
                  ? 'border-amber-500 shadow-amber-500/10 ring-2 ring-amber-400/30'
                  : 'border-border-subtle dark:border-slate-700 hover:border-blue-action'
              }`}
            >
              <Image
                src={imgUrl}
                alt={`รูปรถคันที่ ${index + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                unoptimized={imgUrl.startsWith('data:')}
              />

              {/* Badges / Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 opacity-90 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                {/* Top Row: Primary badge or Set primary, and Delete button */}
                <div className="flex items-center justify-between">
                  {isPrimary ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-amber-950 text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{t('pself.photoPrimary')}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(index)}
                      className="px-2 py-0.5 rounded-full bg-navy-deep/80 hover:bg-amber-500 hover:text-amber-950 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 shadow-sm backdrop-blur-sm"
                      title={t('pself.photoSetPrimary')}
                    >
                      <Star className="w-3 h-3" />
                      <span>{t('pself.photoSetPrimary')}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    aria-label={t('pself.photoDelete')}
                    className="w-6 h-6 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-md"
                    title={t('pself.photoDelete')}
                  >
                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>

                {/* Bottom Row: Image order indicator */}
                <div className="text-[10px] text-white/90 font-medium font-mono">
                  #{index + 1}
                </div>
              </div>
            </div>
          );
        })}

        {/* Upload Trigger Card */}
        {images.length < maxPhotos && (
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-900/60 hover:border-blue-action bg-paper-canvas dark:bg-slate-800/60 hover:bg-blue-subtle/20 dark:hover:bg-blue-950/20 aspect-video flex flex-col items-center justify-center text-center p-3 cursor-pointer transition-all group shadow-2xs disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-6 h-6 text-blue-action animate-spin mb-1" />
                <span className="text-xs font-bold text-ink-primary dark:text-white">
                  {t('pself.photoCompressing')}
                </span>
                <span className="text-[10px] text-ink-muted">WebP Compression</span>
              </>
            ) : (
              <>
                <div className="w-9 h-9 rounded-full bg-blue-subtle dark:bg-blue-950 text-blue-action group-hover:scale-110 transition-transform flex items-center justify-center mb-1">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="text-xs font-bold text-navy-deep dark:text-white">
                  {t('pself.photoAdd')}
                </span>
                <span className="text-[10px] text-ink-muted dark:text-slate-400">
                  {t('pself.photoTypes')}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
};
