/**
 * Client-side image resize & compression utility for TripDee.
 * Downscales large camera photos (e.g. 5-10MB mobile uploads) to high-quality
 * WebP/JPEG under ~150KB to preserve bandwidth and eliminate server strain.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  savingsPercent: number;
}

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  preferredMimeType?: 'image/webp' | 'image/jpeg';
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<CompressionResult> {
  const maxWidth = options.maxWidth ?? 1280;
  const maxHeight = options.maxHeight ?? 1280;
  const quality = options.quality ?? 0.82;
  const preferredMime = options.preferredMimeType ?? 'image/webp';

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (JPG, PNG, WebP)'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('รูปภาพชำรุดหรือไม่สามารถแสดงผลได้'));
      img.onload = () => {
        let { width, height } = img;

        // Proportional resize preserving aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('ไม่สามารถสร้าง canvas context สำหรับย่อรูปภาพ'));
          return;
        }

        // Use high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = '';
        try {
          dataUrl = canvas.toDataURL(preferredMime, quality);
          // Fallback to JPEG if browser doesn't produce webp data URL
          if (!dataUrl.startsWith(`data:${preferredMime}`)) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Calculate approximate size in bytes from base64 string
        const base64Content = dataUrl.split(',')[1] || '';
        const compressedSize = Math.round((base64Content.length * 3) / 4);
        const originalSize = file.size;
        const savingsPercent = originalSize > 0
          ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
          : 0;

        resolve({
          dataUrl,
          originalSize,
          compressedSize,
          width,
          height,
          savingsPercent,
        });
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
