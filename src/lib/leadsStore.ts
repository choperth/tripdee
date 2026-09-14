/**
 * TripDee Lead Persistence Store
 * Manages server-side persistence for corporate quote requests and driver registrations.
 */

export interface QuotationLead {
  id: string;
  companyName: string;
  contactName?: string;
  phone: string;
  travelDate: string;
  route: string;
  passengers: string;
  needsTaxInvoice: boolean;
  estimatedPrice: number;
  submittedAt: string;
  status: 'pending' | 'quoted' | 'confirmed';
}

export interface DriverLead {
  id: string;
  driverName: string;
  nickname: string;
  phone: string;
  lineId: string;
  vehicleModel: string;
  seats: string;
  plateNumber?: string;
  routes: string;
  submittedAt: string;
  status: 'pending' | 'verified' | 'rejected';
}

interface LeadsDatabase {
  quotations: QuotationLead[];
  drivers: DriverLead[];
}

declare global {
  // eslint-disable-next-line no-var
  var __tripdee_leads__: LeadsDatabase | undefined;
}

const INITIAL_QUOTATIONS: QuotationLead[] = [
  {
    id: 'qt-101',
    companyName: 'บจก. สยามอินโนเวชั่น เทรดดิ้ง (กทม.)',
    contactName: 'คุณวรัญญา (ฝ่ายจัดซื้อ)',
    phone: '081-998-7766',
    travelDate: '15-17 ธ.ค. 2569',
    route: 'สนามบินเชียงใหม่ - นิมมาน - ม่อนแจ่ม (3 วัน 2 คืน)',
    passengers: '15-20 คน (รถตู้ 2 คัน)',
    needsTaxInvoice: true,
    estimatedPrice: 12500,
    submittedAt: '2026-09-13T04:30:00.000Z',
    status: 'pending',
  },
  {
    id: 'qt-102',
    companyName: 'สำนักงานส่งเสริมเศรษฐกิจดิจิทัล (สาขาภาคเหนือ)',
    contactName: 'คุณภานุเดช',
    phone: '053-241-555',
    travelDate: '2-4 พ.ย. 2569',
    route: 'ศูนย์ประชุมนานาชาติเชียงใหม่ - อ่างขาง',
    passengers: '25-30 คน (รถตู้ 3 คัน)',
    needsTaxInvoice: true,
    estimatedPrice: 22000,
    submittedAt: '2026-09-12T08:15:00.000Z',
    status: 'quoted',
  },
];

const INITIAL_DRIVERS: DriverLead[] = [
  {
    id: 'drv-lead-01',
    driverName: 'นายกิตติศักดิ์ ศรีล้านนา',
    nickname: 'พี่เอก เชียงใหม่แวน',
    phone: '089-876-5432',
    lineId: 'ake_van_cm',
    vehicleModel: 'Toyota All New Commuter 10 ที่นั่ง',
    seats: '10',
    plateNumber: 'นข-4521 ชม.',
    routes: 'ม่อนแจ่ม, ดอยอินทนนท์, แม่กำปอง, เชียงราย',
    submittedAt: '2026-09-14T02:00:00.000Z',
    status: 'pending',
  },
];

function getDb(): LeadsDatabase {
  if (!globalThis.__tripdee_leads__) {
    globalThis.__tripdee_leads__ = {
      quotations: [...INITIAL_QUOTATIONS],
      drivers: [...INITIAL_DRIVERS],
    };
  }
  return globalThis.__tripdee_leads__;
}

// Quotation Lead Operations
export function getAllQuotations(): QuotationLead[] {
  return getDb().quotations;
}

export function addQuotation(lead: {
  companyName: string;
  contactName?: string;
  phone: string;
  travelDate: string;
  route: string;
  passengers: string;
  needsTaxInvoice: boolean;
  estimatedPrice: number;
}): QuotationLead {
  const db = getDb();
  const newLead: QuotationLead = {
    ...lead,
    id: `qt-${Date.now().toString().slice(-5)}`,
    submittedAt: new Date().toISOString(),
    status: 'pending',
  };
  db.quotations.unshift(newLead);
  return newLead;
}

// Driver Lead Operations
export function getAllDriverLeads(): DriverLead[] {
  return getDb().drivers;
}

export function addDriverLead(lead: {
  driverName: string;
  nickname: string;
  phone: string;
  lineId: string;
  vehicleModel: string;
  seats: string;
  plateNumber?: string;
  routes: string;
}): DriverLead {
  const db = getDb();
  const newLead: DriverLead = {
    ...lead,
    id: `drv-${Date.now().toString().slice(-5)}`,
    submittedAt: new Date().toISOString(),
    status: 'pending',
  };
  db.drivers.unshift(newLead);
  return newLead;
}

export function approveDriverLead(id: string): boolean {
  const db = getDb();
  const driver = db.drivers.find((d) => d.id === id);
  if (driver) {
    driver.status = 'verified';
    return true;
  }
  return false;
}
