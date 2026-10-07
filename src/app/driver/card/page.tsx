'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { VEHICLES, Vehicle } from '@/data/mockData';
import { isMockDataEnabled } from '@/lib/mockConfig';
import { DriverBusinessCardView } from '@/components/cards/DriverBusinessCardView';

export default function DriverBusinessCardPage() {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const qId = params.get('id') || params.get('vehicleId');

    if (!qId) {
      queueMicrotask(() => {
        if (active) setStatus('missing');
      });
      return () => {
        active = false;
      };
    }

    const demoMatch = () => (isMockDataEnabled() ? VEHICLES.find((v) => v.id === qId) || null : null);

    fetch('/api/vehicles' + window.location.search)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load vehicles');
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        const list: Vehicle[] = Array.isArray(data.vehicles) ? data.vehicles : [];
        const match = list.find((v) => v.id === qId) || demoMatch();
        setVehicle(match);
        setStatus(match ? 'ready' : 'missing');
      })
      .catch(() => {
        if (!active) return;
        const match = demoMatch();
        setVehicle(match);
        setStatus(match ? 'ready' : 'missing');
      });

    return () => {
      active = false;
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-slate-950 text-slate-600 dark:text-slate-300 text-sm font-bold">
        กำลังโหลดนามบัตรคนขับ...
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f8fafc] dark:bg-slate-950 px-4 text-center">
        <h1 className="text-lg font-bold text-slate-950 dark:text-white">ไม่พบข้อมูลนามบัตรคนขับ</h1>
        <p className="text-sm text-slate-500 max-w-md">
          ไม่พบข้อมูลรถหรือคนขับที่ตรงกับลิงก์นี้ หรือคนขับอาจยังไม่ได้รับการอนุมัติ กรุณาตรวจสอบลิงก์อีกครั้ง
        </p>
        <Link href="/" className="inline-flex items-center px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-colors">
          กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-2 sm:p-4 lg:p-6 flex justify-center">
      <DriverBusinessCardView vehicle={vehicle} isModal={false} />
    </main>
  );
}
