import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TripDee ทริปดี - เช่ารถตู้ VIP รถเช่า & ท่องเที่ยวทั่วไทย',
    short_name: 'TripDee',
    description: 'ศูนย์รวมรถตู้ VIP รถเช่า และสิทธิพิเศษการเดินทางทั่วไทย ติดต่อคนขับตรง 0% ค่านายหน้า ตรวจสอบประวัติแล้ว',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF8F5',
    theme_color: '#0D5C3A',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
