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
    const qId = (
      params.get('id') ||
      params.get('vehicleId') ||
      params.get('code') ||
      params.get('driverId') ||
      params.get('v') ||
      ''
    ).trim();
    const qPhone = (
      params.get('phone') ||
      params.get('driverPhone') ||
      params.get('tel') ||
      ''
    ).trim();

    const demoMatch = () => {
      if (!isMockDataEnabled()) return null;
      if (qId) {
        const found = VEHICLES.find((v) => v.id === qId);
        if (found) return found;
      }
      if (qPhone) {
        const cleanP = qPhone.replace(/\D/g, '');
        const found = VEHICLES.find((v) => (v.driverPhone || '').replace(/\D/g, '') === cleanP);
        if (found) return found;
      }
      return null;
    };

    const loadCard = async () => {
      try {
        const targetId = qId;

        // If no ID or phone query was provided, check if a logged-in driver is opening their own card
        if (!targetId && !qPhone) {
          try {
            const mineRes = await fetch('/api/vehicles?scope=mine');
            if (mineRes.ok) {
              const mineData = await mineRes.json();
              const myVehicle = Array.isArray(mineData.vehicles) ? mineData.vehicles[0] : null;
              if (myVehicle) {
                if (!active) return;
                setVehicle(myVehicle);
                setStatus('ready');
                return;
              }
            }
          } catch {
            // ignore session error and fall through
          }

          if (!active) return;
          const fallbackDemo = demoMatch();
          if (fallbackDemo) {
            setVehicle(fallbackDemo);
            setStatus('ready');
          } else {
            setStatus('missing');
          }
          return;
        }

        // Construct request URL: make sure id parameter is explicitly sent
        const query = new URLSearchParams(window.location.search);
        if (targetId && !query.has('id')) {
          query.set('id', targetId);
        }
        const apiUrl = `/api/vehicles?${query.toString()}`;

        const res = await fetch(apiUrl);
        if (!res.ok) {
          throw new Error('Vehicle lookup responded with ' + res.status);
        }

        const data = await res.json();
        if (!active) return;

        let match: Vehicle | null = null;
        // Priority 1: Single vehicle response ({ success: true, vehicle: { ... } })
        if (data.vehicle && typeof data.vehicle === 'object' && data.vehicle.id) {
          match = data.vehicle;
        }
        // Priority 2: Fleet list response ({ success: true, vehicles: [ ... ] })
        else if (Array.isArray(data.vehicles)) {
          if (targetId) {
            match = data.vehicles.find((v: Vehicle) => v.id === targetId) || null;
          }
          if (!match && qPhone) {
            const cleanP = qPhone.replace(/\D/g, '');
            match =
              data.vehicles.find(
                (v: Vehicle) => (v.driverPhone || '').replace(/\D/g, '') === cleanP
              ) || null;
          }
          if (!match && data.vehicles.length === 1 && targetId) {
            match = data.vehicles[0];
          }
        }

        // Priority 3: Demo match if mock data is enabled
        if (!match) {
          match = demoMatch();
        }

        setVehicle(match);
        setStatus(match ? 'ready' : 'missing');
      } catch (err) {
        console.warn('[TripDee Driver Card] Direct lookup error, trying fleet list fallback:', err);
        if (!active) return;

        // Try fleet list fallback
        try {
          const listRes = await fetch('/api/vehicles');
          if (listRes.ok) {
            const listData = await listRes.json();
            const list: Vehicle[] = Array.isArray(listData.vehicles) ? listData.vehicles : [];
            let fallbackMatch: Vehicle | null = null;
            if (qId) {
              fallbackMatch = list.find((v) => v.id === qId) || null;
            }
            if (!fallbackMatch && qPhone) {
              const cleanP = qPhone.replace(/\D/g, '');
              fallbackMatch =
                list.find(
                  (v) => (v.driverPhone || '').replace(/\D/g, '') === cleanP
                ) || null;
            }
            if (!fallbackMatch) {
              fallbackMatch = demoMatch();
            }
            if (!active) return;
            setVehicle(fallbackMatch);
            setStatus(fallbackMatch ? 'ready' : 'missing');
            return;
          }
        } catch {
          // ignore
        }

        if (!active) return;
        const match = demoMatch();
        setVehicle(match);
        setStatus(match ? 'ready' : 'missing');
      }
    };

    void loadCard();

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
