/**
 * TripDee Lead Persistence Store
 * Manages server-side persistence for corporate quote requests and driver registrations.
 */

import type { LeadFeeStatus, OrgType, VehicleTier } from '@/lib/b2b';
import { calcLeadFee, clampCarCount } from '@/lib/b2b';
import { formatLineLink, formatWhatsAppLink } from '@/lib/contactUtils';
export type { LeadFeeStatus, OrgType, VehicleTier };

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
  /** จำนวนคันรถที่ต้องการ (B2B Fleet Matching) */
  carCount: number;
  /** ระดับมาตรฐานรถ: Standard VIP (ป้ายฟ้า) หรือ Strict Compliance 30 (ป้ายเหลือง) */
  vehicleTier: VehicleTier;
  /** ประเภทองค์กร */
  orgType: OrgType;
  /** ประกันอุบัติเหตุการเดินทางกลุ่ม คุ้มครองผู้โดยสารรายบุคคล */
  includeInsurance: boolean;
  /** ชื่อพาร์ตเนอร์กองรถที่ได้รับมอบหมายงาน */
  assignedPartner?: string | null;
  /** สถานะการเก็บค่าจัดหา (Flat Lead Fee 500 บาท/คัน) */
  leadFeeStatus: LeadFeeStatus;
  /** ค่าจัดหา = carCount * 500 */
  leadFeeAmount: number;
  customerId?: string | null;
  totalDays?: number;
  submittedAt: string;
  status: 'pending' | 'quoted' | 'confirmed' | 'cancelled';
}

export interface DriverLead {
  id: string;
  ownerId?: string;
  driverName: string;
  nickname: string;
  phone: string;
  lineId: string;
  whatsapp?: string;
  wechat?: string;
  kakao?: string;
  vehicleModel: string;
  seats: string;
  plateNumber?: string;
  plateType?: 'yellow' | 'blue';
  canIssueTaxInvoice?: boolean;
  businessType?: 'company' | 'individual';
  routes: string;
  serviceType?: 'with_driver' | 'self_drive';
  depositTerms?: string;
  amenities?: string;
  pickupLocation?: string;
  /** ราคาค่าบริการเริ่มต้นต่อวันที่คนขับกรอกตอนสมัคร (บาท/วัน) */
  pricePerDay?: number;
  /** รายละเอียดจุดเด่นของรถ / ประสบการณ์คนขับ ที่กรอกตอนสมัคร */
  description?: string;
  /** รูปถ่ายรถจริง (ภายนอก/ภายใน) ที่อัปโหลดตอนสมัคร */
  images?: string[];
  submittedAt: string;
  status: 'pending' | 'verified' | 'rejected';
}

import { Vehicle } from '@/data/mockData';
import { isExcludedTestVehicle, isExcludedTestDriver } from '@/lib/mockConfig';

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
    : [];

  const cleanLine = lead.lineId ? formatLineLink(lead.lineId) : '';
  const whatsappUrl = lead.whatsapp ? formatWhatsAppLink(lead.whatsapp) : undefined;

  const languages: ('th' | 'en' | 'zh' | 'ko')[] = ['th'];
  if (lead.whatsapp) languages.push('en');
  if (lead.wechat) languages.push('zh');
  if (lead.kakao) languages.push('ko');

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
    rentalType: lead.serviceType || 'with_driver',
    seats: seatsNum,
    driverName: lead.driverName,
    driverNickname: lead.nickname,
    driverPhone: lead.phone,
    driverLine: cleanLine,
    driverWhatsapp: whatsappUrl,
    driverWechat: lead.wechat ? lead.wechat.trim() : undefined,
    driverKakao: lead.kakao ? lead.kakao.trim() : undefined,
    languages: Array.from(new Set(languages)),
    region,
    rating: 0,
    reviewCount: 0,
    isVerified: false,
    images: Array.isArray(lead.images) ? lead.images.filter(Boolean) : [],
    // Only record the starting city rate the driver actually typed; never seed
    // placeholder zeros for the other zones the form never asked about.
    zoneRates: lead.pricePerDay && lead.pricePerDay > 0 ? { city: lead.pricePerDay } : undefined,
    rateNote: undefined,
    location: lead.pickupLocation?.trim() || lead.routes || 'บริการทั่วไทย',
    popularRoutes,
    amenities: lead.amenities
      ? lead.amenities.split(',').map((item) => item.trim()).filter(Boolean)
      : [],
    description:
      lead.description?.trim() ||
      `บริการรถพร้อมคนขับ โดย ${lead.driverName} (${lead.nickname}) ยานพาหนะ ${lead.vehicleModel}${lead.routes ? ` ชำนาญเส้นทาง ${lead.routes}` : ''}`,
    plateType: lead.plateType || (isYellow ? 'yellow' : 'blue'),
    plateNumber: lead.plateNumber || undefined,
    canIssueTaxInvoice: Boolean(lead.canIssueTaxInvoice),
    businessType: lead.businessType || (isYellow ? 'company' : 'individual'),
    isAvailable: true,
    ownerId: lead.ownerId || undefined,
    approvalStatus: 'approved',
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
    carCount: 2,
    vehicleTier: 'standard_vip',
    orgType: 'corporate',
    includeInsurance: true,
    assignedPartner: null,
    leadFeeStatus: 'pending',
    leadFeeAmount: 1000,
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
    carCount: 3,
    vehicleTier: 'strict_compliance_30',
    orgType: 'government',
    includeInsurance: true,
    assignedPartner: 'ล้านนาคาราวาน',
    leadFeeStatus: 'collected',
    leadFeeAmount: 1500,
    submittedAt: '2026-09-12T08:15:00.000Z',
    status: 'quoted',
  },
];

const INITIAL_DRIVERS: DriverLead[] = [];

/** Mock seed quotations are only served when mock/demo data is enabled */
const MOCK_QUOTATION_IDS = new Set(INITIAL_QUOTATIONS.map((q) => q.id));

export function isMockQuotationId(id: string): boolean {
  return MOCK_QUOTATION_IDS.has(id);
}

function getDb(): LeadsDatabase {
  if (!globalThis.__tripdee_leads__) {
    globalThis.__tripdee_leads__ = {
      quotations: [...INITIAL_QUOTATIONS],
      drivers: [...INITIAL_DRIVERS],
      approvedVehicles: [],
      deletedVehicleIds: [
        'v-test-admin',
        'v-drv-lead-01',
        'v-mock-test-admin',
        'v-mock-drv-lead-01',
      ],
      deletedDriverLeadIds: [
        'drv-lead-01',
        'drv-73446',
        'drv-mock-lead-01',
        'drv-mock-73446',
      ],
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
  carCount?: number;
  vehicleTier?: VehicleTier;
  orgType?: OrgType;
  includeInsurance?: boolean;
  assignedPartner?: string | null;
  leadFeeStatus?: LeadFeeStatus;
  customerId?: string | null;
  totalDays?: number;
}): QuotationLead {
  const db = getDb();
  const carCount = clampCarCount(lead.carCount);
  const newLead: QuotationLead = {
    ...lead,
    carCount,
    vehicleTier: lead.vehicleTier ?? 'standard_vip',
    orgType: lead.orgType ?? 'corporate',
    includeInsurance: lead.includeInsurance ?? true,
    assignedPartner: lead.assignedPartner ?? null,
    leadFeeStatus: lead.leadFeeStatus ?? 'pending',
    leadFeeAmount: calcLeadFee(carCount),
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
    const merged: QuotationLead = { ...db.quotations[idx], ...updates };
    if (updates.carCount !== undefined) {
      merged.carCount = clampCarCount(updates.carCount);
      merged.leadFeeAmount = calcLeadFee(merged.carCount);
    }
    db.quotations[idx] = merged;
    return merged;
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
  const db = getDb();
  const deletedIds = db.deletedDriverLeadIds || [];
  return db.drivers.filter(
    (d) => !deletedIds.includes(d.id) && !isExcludedTestDriver(d.id)
  );
}

export function addDriverLead(lead: {
  ownerId?: string;
  driverName: string;
  nickname: string;
  phone: string;
  lineId: string;
  whatsapp?: string;
  wechat?: string;
  kakao?: string;
  vehicleModel: string;
  seats: string;
  plateNumber?: string;
  plateType?: 'yellow' | 'blue';
  canIssueTaxInvoice?: boolean;
  businessType?: 'company' | 'individual';
  routes: string;
  serviceType?: 'with_driver' | 'self_drive';
  depositTerms?: string;
  amenities?: string;
  pickupLocation?: string;
  pricePerDay?: number;
  description?: string;
  images?: string[];
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
  const deletedIds = db.deletedVehicleIds || [];
  return db.approvedVehicles.filter(
    (v) => !deletedIds.includes(v.id) && !isExcludedTestVehicle(v.id)
  );
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
