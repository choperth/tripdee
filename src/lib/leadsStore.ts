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
  status: 'pending' | 'quoted' | 'confirmed' | 'cancelled';
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
  plateType?: 'yellow' | 'blue';
  canIssueTaxInvoice?: boolean;
  businessType?: 'company' | 'individual';
  routes: string;
  serviceType?: 'with_driver' | 'self_drive';
  submittedAt: string;
  status: 'pending' | 'verified' | 'rejected';
}

import { Vehicle } from '@/data/mockData';

export function convertLeadToVehicle(lead: DriverLead): Vehicle {
  const seatsNum = Number(lead.seats.replace(/[^0-9]/g, '')) || 9;

  let region: 'north' | 'central' | 'south' | 'east' | 'isan' = 'north';
  const routesLower = (lead.routes || '').toLowerCase();
  if (routesLower.includes('กทม') || routesLower.includes('กรุงเทพ') || routesLower.includes('อยุธยา') || routesLower.includes('หัวหิน')) {
    region = 'central';
  } else if (routesLower.includes('ภูเก็ต') || routesLower.includes('พังงา') || routesLower.includes('กระบี่') || routesLower.includes('สมุย')) {
    region = 'south';
  } else if (routesLower.includes('พัทยา') || routesLower.includes('ชลบุรี') || routesLower.includes('ระยอง')) {
    region = 'east';
  } else if (routesLower.includes('เขาใหญ่') || routesLower.includes('โคราช') || routesLower.includes('ขอนแก่น')) {
    region = 'isan';
  }

  const popularRoutes = lead.routes
    ? lead.routes.split(/[,/•]+/).map((r) => r.trim()).filter(Boolean)
    : ['ตัวเมือง', 'สนามบิน'];

  const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
  const cleanLine = lead.lineId
    ? lead.lineId.startsWith('http')
      ? lead.lineId
      : `https://line.me/ti/p/~${lead.lineId}`
    : 'https://line.me';
  const whatsapp = cleanPhone ? `https://wa.me/66${cleanPhone.replace(/^0/, '')}` : undefined;

  const titleSeats = lead.vehicleModel.includes('ที่นั่ง') ? '' : ` ${seatsNum} ที่นั่ง`;

  const isYellow = lead.plateType === 'yellow' || (lead.plateNumber ? lead.plateNumber.trim().startsWith('3') : false);

  return {
    id: `v-${lead.id}`,
    title: `${lead.vehicleModel}${titleSeats} (${lead.nickname})`,
    type:
      lead.vehicleModel.toLowerCase().includes('fortuner') ||
      lead.vehicleModel.toLowerCase().includes('suv') ||
      lead.vehicleModel.toLowerCase().includes('mu-x') ||
      lead.vehicleModel.toLowerCase().includes('cr-v') ||
      lead.vehicleModel.toLowerCase().includes('everest') ||
      lead.vehicleModel.toLowerCase().includes('pajero') ||
      lead.vehicleModel.toLowerCase().includes('veloz')
        ? 'suv'
        : lead.vehicleModel.toLowerCase().includes('camry') ||
          lead.vehicleModel.toLowerCase().includes('accord') ||
          lead.vehicleModel.toLowerCase().includes('sedan') ||
          lead.vehicleModel.toLowerCase().includes('yaris') ||
          lead.vehicleModel.toLowerCase().includes('city') ||
          lead.vehicleModel.toLowerCase().includes('mercedes') ||
          lead.vehicleModel.toLowerCase().includes('benz')
        ? 'car'
        : 'van',
    rentalType: (lead.serviceType as 'with_driver' | 'self_drive') || 'with_driver',
    seats: seatsNum,
    driverName: lead.driverName,
    driverNickname: lead.nickname,
    driverPhone: lead.phone,
    driverLine: cleanLine,
    driverWhatsapp: whatsapp,
    driverWechat: undefined,
    driverKakao: undefined,
    languages: ['th'],
    region,
    rating: 5.0,
    reviewCount: 1,
    isVerified: true,
    images: [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
    ],
    zoneRates: { city: 1900, midHill: 2100, highHill: 2300, crossProvince: 2700 },
    rateNote: 'คนขับผ่านการยืนยันตัวตน TripDee Verified เรียบร้อยแล้ว',
    location: lead.routes || 'บริการทั่วไทย',
    popularRoutes: popularRoutes.length > 0 ? popularRoutes : ['ตัวเมือง', 'สนามบิน'],
    amenities: [
      'ตรวจสภาพรถและประวัติคนขับแล้ว 100%',
      'ใบขับขี่สาธารณะถูกต้อง',
      'ประกันภัยคุ้มครองผู้โดยสาร',
      'แอร์เย็นฉ่ำ สภาพรถใหม่สะอาด',
    ],
    description: `บริการรถพร้อมคนขับ โดย ${lead.driverName} (${lead.nickname}) ยานพาหนะ ${lead.vehicleModel} ชำนาญเส้นทาง ${lead.routes} ผ่านการตรวจสอบเอกสารและอนุมัติตรา TripDee Verified พร้อมให้บริการลูกค้าทันที`,
    plateType: lead.plateType || (isYellow ? 'yellow' : 'blue'),
    plateNumber: lead.plateNumber || undefined,
    canIssueTaxInvoice: Boolean(lead.canIssueTaxInvoice),
    businessType: lead.businessType || (isYellow ? 'company' : 'individual'),
    isAvailable: true,
  };
}

export interface PushSubscriptionRecord {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  role: 'driver' | 'customer' | 'admin';
  createdAt: string;
}

interface LeadsDatabase {
  quotations: QuotationLead[];
  drivers: DriverLead[];
  approvedVehicles: Vehicle[];
  deletedVehicleIds: string[];
  deletedDriverLeadIds: string[];
  deletedQuotationIds: string[];
  pushSubscriptions?: PushSubscriptionRecord[];
}

declare global {
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
      approvedVehicles: [],
      deletedVehicleIds: [],
      deletedDriverLeadIds: [],
      deletedQuotationIds: [],
    };
  }
  if (!Array.isArray(globalThis.__tripdee_leads__.approvedVehicles)) {
    globalThis.__tripdee_leads__.approvedVehicles = [];
  }
  if (!Array.isArray(globalThis.__tripdee_leads__.deletedVehicleIds)) {
    globalThis.__tripdee_leads__.deletedVehicleIds = [];
  }
  if (!Array.isArray(globalThis.__tripdee_leads__.deletedDriverLeadIds)) {
    globalThis.__tripdee_leads__.deletedDriverLeadIds = [];
  }
  if (!Array.isArray(globalThis.__tripdee_leads__.deletedQuotationIds)) {
    globalThis.__tripdee_leads__.deletedQuotationIds = [];
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

export function updateQuotation(id: string, updates: Partial<QuotationLead>): QuotationLead | null {
  const db = getDb();
  const idx = db.quotations.findIndex((q) => q.id === id);
  if (idx >= 0) {
    db.quotations[idx] = { ...db.quotations[idx], ...updates };
    return db.quotations[idx];
  }
  return null;
}

export function deleteQuotation(id: string): boolean {
  const db = getDb();
  if (!db.deletedQuotationIds.includes(id)) {
    db.deletedQuotationIds.push(id);
  }
  db.quotations = db.quotations.filter((q) => q.id !== id);
  return true;
}

export function getDeletedQuotationIds(): string[] {
  const db = getDb();
  return db.deletedQuotationIds || [];
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
  plateType?: 'yellow' | 'blue';
  canIssueTaxInvoice?: boolean;
  businessType?: 'company' | 'individual';
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

export function updateDriverLead(id: string, updates: Partial<DriverLead>): DriverLead | null {
  const db = getDb();
  const idx = db.drivers.findIndex((d) => d.id === id);
  if (idx >= 0) {
    db.drivers[idx] = { ...db.drivers[idx], ...updates };
    return db.drivers[idx];
  }
  return null;
}

export function deleteDriverLead(id: string): boolean {
  const db = getDb();
  if (!db.deletedDriverLeadIds.includes(id)) {
    db.deletedDriverLeadIds.push(id);
  }
  db.drivers = db.drivers.filter((d) => d.id !== id);
  return true;
}

export function getDeletedDriverLeadIds(): string[] {
  const db = getDb();
  return db.deletedDriverLeadIds || [];
}

export function approveDriverLead(id: string): Vehicle | null {
  const db = getDb();
  const driver = db.drivers.find((d) => d.id === id);
  if (driver) {
    driver.status = 'verified';
    const newVehicle = convertLeadToVehicle(driver);
    const existingIdx = db.approvedVehicles.findIndex((v) => v.id === newVehicle.id);
    if (existingIdx >= 0) {
      db.approvedVehicles[existingIdx] = newVehicle;
    } else {
      db.approvedVehicles.unshift(newVehicle);
    }
    return newVehicle;
  }
  return null;
}

// Vehicle Catalog Operations (In-Memory Fallback & Sync)
export function getApprovedVehicles(): Vehicle[] {
  const db = getDb();
  if (!Array.isArray(db.approvedVehicles)) {
    db.approvedVehicles = [];
  }
  return db.approvedVehicles;
}

export function addApprovedVehicle(vehicle: Vehicle): Vehicle {
  const db = getDb();
  db.deletedVehicleIds = db.deletedVehicleIds.filter((id) => id !== vehicle.id);
  const idx = db.approvedVehicles.findIndex((v) => v.id === vehicle.id);
  if (idx >= 0) {
    db.approvedVehicles[idx] = vehicle;
  } else {
    db.approvedVehicles.unshift(vehicle);
  }
  return vehicle;
}

export function updateApprovedVehicle(id: string, updates: Partial<Vehicle>): Vehicle | null {
  const db = getDb();
  const idx = db.approvedVehicles.findIndex((v) => v.id === id);
  if (idx >= 0) {
    db.approvedVehicles[idx] = { ...db.approvedVehicles[idx], ...updates };
    return db.approvedVehicles[idx];
  }
  return null;
}

export function deleteApprovedVehicle(id: string): boolean {
  const db = getDb();
  if (!db.deletedVehicleIds.includes(id)) {
    db.deletedVehicleIds.push(id);
  }
  db.approvedVehicles = db.approvedVehicles.filter((v) => v.id !== id);
  return true;
}

export function getDeletedVehicleIds(): string[] {
  const db = getDb();
  if (!Array.isArray(db.deletedVehicleIds)) {
    db.deletedVehicleIds = [];
  }
  return db.deletedVehicleIds;
}

// Push Subscriptions Operations
export function saveLocalPushSubscription(sub: Omit<PushSubscriptionRecord, 'id' | 'createdAt'>): PushSubscriptionRecord {
  const db = getDb();
  if (!Array.isArray(db.pushSubscriptions)) {
    db.pushSubscriptions = [];
  }
  const existingIdx = db.pushSubscriptions.findIndex((s) => s.endpoint === sub.endpoint);
  const record: PushSubscriptionRecord = {
    ...sub,
    id: existingIdx >= 0 ? db.pushSubscriptions[existingIdx].id : `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  if (existingIdx >= 0) {
    db.pushSubscriptions[existingIdx] = record;
  } else {
    db.pushSubscriptions.push(record);
  }
  return record;
}

export function removeLocalPushSubscription(endpoint: string): boolean {
  const db = getDb();
  if (!Array.isArray(db.pushSubscriptions)) {
    db.pushSubscriptions = [];
    return false;
  }
  const initLen = db.pushSubscriptions.length;
  db.pushSubscriptions = db.pushSubscriptions.filter((s) => s.endpoint !== endpoint);
  return db.pushSubscriptions.length < initLen;
}

export function getLocalPushSubscriptions(role?: 'driver' | 'customer' | 'admin'): PushSubscriptionRecord[] {
  const db = getDb();
  if (!Array.isArray(db.pushSubscriptions)) {
    db.pushSubscriptions = [];
  }
  if (role) {
    return db.pushSubscriptions.filter((s) => s.role === role);
  }
  return db.pushSubscriptions;
}
