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

  return {
    id: `v-${lead.id}`,
    title: `${lead.vehicleModel}${titleSeats} (${lead.nickname})`,
    type: lead.vehicleModel.toLowerCase().includes('fortuner') || lead.vehicleModel.toLowerCase().includes('suv') ? 'suv' : 'van',
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
    description: `บริการรถตู้พร้อมคนขับ โดย ${lead.driverName} (${lead.nickname}) ยานพาหนะ ${lead.vehicleModel} ชำนาญเส้นทาง ${lead.routes} ผ่านการตรวจสอบเอกสารและอนุมัติตรา TripDee Verified พร้อมให้บริการลูกค้าทันที`,
  };
}

interface LeadsDatabase {
  quotations: QuotationLead[];
  drivers: DriverLead[];
  approvedVehicles: Vehicle[];
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
      approvedVehicles: [],
    };
  }
  if (!Array.isArray(globalThis.__tripdee_leads__.approvedVehicles)) {
    globalThis.__tripdee_leads__.approvedVehicles = [];
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

export function getApprovedVehicles(): Vehicle[] {
  const db = getDb();
  if (!Array.isArray(db.approvedVehicles)) {
    db.approvedVehicles = [];
  }
  return db.approvedVehicles;
}
