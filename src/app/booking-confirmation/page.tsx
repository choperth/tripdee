'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookingConfirmationSheet, BookingSheetData } from '@/components/BookingConfirmationSheet';
import { VEHICLES, Vehicle } from '@/data/mockData';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { isMockDataEnabled } from '@/lib/mockConfig';

function BookingConfirmationContent() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get('vehicleId');
  const quoteId = searchParams.get('quoteId');
  const { t } = useLanguage();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [vehicleStatus, setVehicleStatus] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [initialData, setInitialData] = useState<Partial<BookingSheetData>>({});

  useEffect(() => {
    let active = true;
    const isDemo = isMockDataEnabled();

    if (vehicleId) {
      const demoMatch = () => (isDemo ? VEHICLES.find((v) => v.id === vehicleId) || null : null);
      const finish = (match: Vehicle | null) => {
        if (!active) return;
        setVehicle(match);
        setVehicleStatus(match ? 'ready' : 'missing');
      };

      fetch('/api/vehicles' + window.location.search)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load vehicles');
          return res.json();
        })
        .then((data) => {
          const list: Vehicle[] = Array.isArray(data.vehicles) ? data.vehicles : [];
          finish(list.find((v) => v.id === vehicleId) || demoMatch());
        })
        .catch(() => finish(demoMatch()));
    } else {
      queueMicrotask(() => {
        if (!active) return;
        setVehicle(null);
        setVehicleStatus(isDemo ? 'ready' : 'missing');
      });
    }

    const customer = searchParams.get('customer');
    const phone = searchParams.get('phone');
    const date = searchParams.get('date');
    const days = searchParams.get('days');
    const rate = searchParams.get('rate');
    const total = searchParams.get('total');
    const deposit = searchParams.get('deposit');
    const route = searchParams.get('route');
    const driver = searchParams.get('driver');

    const overrides: Partial<BookingSheetData> = {};
    if (quoteId) overrides.bookingId = quoteId.startsWith('TD-') ? quoteId : `TD-${quoteId.toUpperCase()}`;
    if (customer) overrides.customerName = customer;
    if (phone) overrides.customerPhone = phone;
    if (date) overrides.travelDates = date;
    const toPositive = (value: string | null) => {
      const n = Number(value);
      return Number.isFinite(n) && n > 0 ? n : undefined;
    };
    const daysNum = toPositive(days);
    const rateNum = toPositive(rate);
    const totalNum = toPositive(total);
    const depositNum = toPositive(deposit);
    if (daysNum !== undefined) overrides.totalDays = daysNum;
    if (rateNum !== undefined) overrides.dailyRate = rateNum;
    if (totalNum !== undefined) overrides.totalPrice = totalNum;
    if (depositNum !== undefined) overrides.depositAmount = depositNum;
    if (route) overrides.routeDetails = route;
    if (driver) overrides.driverName = driver;

    queueMicrotask(() => {
      if (active) setInitialData(overrides);
    });

    return () => {
      active = false;
    };
  }, [vehicleId, quoteId, searchParams]);

  return (
    <main className="min-h-screen bg-slate-100 py-6 sm:py-10 px-3 sm:px-6">
      {/* Navigation breadcrumbs (hidden in print) */}
      <nav aria-label="Breadcrumb" className="no-print max-w-4xl mx-auto mb-4 flex items-center justify-between text-xs font-bold text-slate-600">
        <ol className="flex items-center">
          <li>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{t('book.backHome')}</span>
            </Link>
          </li>
        </ol>
        <span className="flex items-center gap-1 text-slate-400">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>{t('book.verified')}</span>
        </span>
      </nav>

      {vehicleStatus === 'loading' && (
        <div className="max-w-4xl mx-auto py-16 text-center text-slate-600 text-sm font-bold">
          กำลังโหลดใบสรุปการจอง...
        </div>
      )}

      {vehicleStatus === 'missing' && (
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <h1 className="text-base font-extrabold text-slate-900">ไม่พบข้อมูลการจอง</h1>
          <p className="text-sm text-slate-600">
            ไม่พบข้อมูลรถหรือคนขับที่ตรงกับลิงก์นี้ จึงไม่สามารถแสดงใบสรุปการจองได้ กรุณาตรวจสอบลิงก์อีกครั้งหรือติดต่อคนขับโดยตรง
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            {t('book.backHome')}
          </Link>
        </div>
      )}

      {vehicleStatus === 'ready' && (
        <BookingConfirmationSheet
          vehicle={vehicle}
          initialData={initialData}
          isModal={false}
        />
      )}
    </main>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 text-sm font-bold">
          กำลังโหลดใบสรุปการจอง...
        </div>
      }
    >
      <BookingConfirmationContent />
    </Suspense>
  );
}
