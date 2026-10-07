'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Vehicle, Sponsor, VEHICLES } from '@/data/mockData';
import { isMockDataEnabled } from '@/lib/mockConfig';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { VehicleDetailView } from '@/components/vehicle/VehicleDetailView';

const LoginModal = dynamic(
  () => import('@/components/LoginModal').then((m) => m.LoginModal),
  { ssr: false }
);
const DriverRegisterModal = dynamic(
  () => import('@/components/DriverRegisterModal').then((m) => m.DriverRegisterModal),
  { ssr: false }
);

export default function VehicleDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);

  const router = useRouter();
  // This page has no driver console of its own, so the driver entry navigates
  // to the dedicated driver centre.
  const openDriverCentre = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(false);
    router.push('/driver');
  };

  useEffect(() => {
    let active = true;
    const isDemo = isMockDataEnabled();
    const demoMatch = () => (isDemo ? VEHICLES.find((v) => v.id === id) || null : null);

    fetch('/api/vehicles' + (typeof window !== 'undefined' ? window.location.search : ''))
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load vehicles');
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        const list: Vehicle[] = Array.isArray(data.vehicles) ? data.vehicles : [];
        setAllVehicles(list);
        const match = list.find((v) => v.id === id) || demoMatch();
        setVehicle(match);
        setStatus(match ? 'ready' : 'missing');
      })
      .catch(() => {
        if (!active) return;
        const match = demoMatch();
        setAllVehicles(match ? [match] : []);
        setVehicle(match);
        setStatus(match ? 'ready' : 'missing');
      });

    fetch('/api/sponsors' + (typeof window !== 'undefined' ? window.location.search : ''))
      .then((res) => (res.ok ? res.json() : { sponsors: [] }))
      .then((data) => {
        if (active) setSponsors(Array.isArray(data.sponsors) ? data.sponsors : []);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [id]);

  if (status === 'loading' || !vehicle) {
    return (
      <div className="flex min-h-dvh flex-col bg-paper font-body text-ink">
        <Navbar onOpenLoginModal={() => setIsLoginOpen(true)} onOpenDriverEntry={openDriverCentre} />
        <div aria-hidden="true" className="h-16 shrink-0" />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-16 text-center">
          {status === 'loading' ? (
            <p className="text-sm font-bold text-ink-2">กำลังโหลดข้อมูลรถ...</p>
          ) : (
            <div className="mx-auto max-w-xl space-y-3 rounded-2xl border border-rule bg-card p-8">
              <h1 className="text-base font-extrabold">ไม่พบข้อมูลรถคันนี้</h1>
              <p className="text-sm text-ink-2">
                รถอาจถูกปิดการแสดงผลชั่วคราวหรือลิงก์ไม่ถูกต้อง กรุณากลับไปค้นหารถคันอื่น
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-xl bg-navy-deep px-4 py-2 text-xs font-bold text-white hover:bg-navy-surface transition-colors"
              >
                กลับหน้าหลัก
              </Link>
            </div>
          )}
        </main>
        <Footer />
        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onOpenDriverEntry={openDriverCentre}
        />
        <DriverRegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} vehicles={allVehicles} />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper font-body text-ink">
      <Navbar onOpenLoginModal={() => setIsLoginOpen(true)} onOpenDriverEntry={openDriverCentre} />
      <div aria-hidden="true" className="h-16 shrink-0" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6 py-6">
        <VehicleDetailView
          vehicle={vehicle}
          allVehicles={allVehicles}
          sponsors={sponsors}
          isModal={false}
        />
      </main>
      <Footer />
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onOpenDriverEntry={openDriverCentre}
      />
      <DriverRegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} vehicles={allVehicles} />
    </div>
  );
}
