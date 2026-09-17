'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookingConfirmationSheet, BookingSheetData } from '@/components/BookingConfirmationSheet';
import { VEHICLES, Vehicle } from '@/data/mockData';
import Link from 'next/link';
import { ArrowLeft, Home, Sparkles } from 'lucide-react';

function BookingConfirmationContent() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get('vehicleId');
  const quoteId = searchParams.get('quoteId');

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [initialData, setInitialData] = useState<Partial<BookingSheetData>>({});

  useEffect(() => {
    // 1. If vehicleId is provided, try finding in VEHICLES first or fetch from API
    if (vehicleId) {
      const found = VEHICLES.find((v) => v.id === vehicleId);
      if (found) {
        setVehicle(found);
      } else {
        fetch('/api/vehicles')
          .then((res) => res.json())
          .then((data) => {
            const match = (data.vehicles || []).find((v: Vehicle) => v.id === vehicleId);
            if (match) setVehicle(match);
          })
          .catch(() => {});
      }
    }

    // 2. Parse any query parameters
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
    if (days) overrides.totalDays = Number(days) || 1;
    if (rate) overrides.dailyRate = Number(rate) || 1900;
    if (total) overrides.totalPrice = Number(total) || 3800;
    if (deposit) overrides.depositAmount = Number(deposit) || 1000;
    if (route) overrides.routeDetails = route;
    if (driver) overrides.driverName = driver;

    setInitialData(overrides);
  }, [vehicleId, quoteId, searchParams]);

  return (
    <main className="min-h-screen bg-slate-100 py-6 sm:py-10 px-3 sm:px-6">
      {/* Navigation breadcrumbs (hidden in print) */}
      <div className="no-print max-w-4xl mx-auto mb-4 flex items-center justify-between text-xs font-bold text-slate-600">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>กลับหน้าแรก TripDee</span>
        </Link>
        <span className="flex items-center gap-1 text-slate-400">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>TripDee Verified · เอกสารยืนยันมาตรฐาน</span>
        </span>
      </div>

      <BookingConfirmationSheet
        vehicle={vehicle}
        initialData={initialData}
        isModal={false}
      />
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
