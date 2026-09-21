'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { isMockDataEnabled } from '@/lib/mockConfig';

export type UserRole = 'driver' | 'customer' | 'admin';

export interface UserProfile {
  id: string;
  role: UserRole;
  name: string;
  emailOrPhone: string;
  avatar?: string;
  lineId?: string;

  // Driver fields
  driverNickname?: string;
  vehicleTitle?: string;
  vehiclePlate?: string;
  seats?: number;
  isAvailable?: boolean;
  verificationStatus?: 'verified' | 'pending' | 'unverified';
  uploadedDocs?: {
    driverLicense?: string;
    vehicleRegistration?: string;
    idCard?: string;
  };

  // Corporate / Customer fields
  companyName?: string;
  taxId?: string;
  companyAddress?: string;
  branch?: string;
}

export interface QuotationRecord {
  id: string;
  date: string;
  companyName: string;
  route: string;
  totalDays: number;
  passengers: string;
  estimatedPrice: number;
  status: 'pending' | 'confirmed' | 'completed';
  needsTaxInvoice: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  loginAsDemo: (role: UserRole) => void;
  loginWithCredentials: (
    role: UserRole,
    name: string,
    contact: string,
    extra?: Partial<UserProfile>
  ) => void;
  logout: () => void;
  toggleDriverAvailability: () => void;
  updateDriverProfile: (data: Partial<UserProfile>) => void;
  updateCorporateProfile: (data: Partial<UserProfile>) => void;
  submitVerificationDocs: (docs: { driverLicense: string; vehicleRegistration: string; idCard: string }) => void;
  approveDriverVerification: (driverId: string) => void;
  quotations: QuotationRecord[];
  addQuotation: (q: Omit<QuotationRecord, 'id' | 'date' | 'status'>) => void;
}

const DEMO_ACCOUNTS: Record<UserRole, UserProfile> = {
  driver: {
    id: 'drv-01',
    role: 'driver',
    name: 'นายสุรชัย ใจดี',
    driverNickname: 'พี่ชัย รถตู้เชียงใหม่',
    emailOrPhone: '081-234-5678',
    lineId: '@chaivan_cnx',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    vehicleTitle: 'Toyota Commuter VIP 9 ที่นั่ง เบาะนวดไฟฟ้า',
    vehiclePlate: 'นข-8899 เชียงใหม่ (ป้ายเหลือง)',
    seats: 9,
    isAvailable: true,
    verificationStatus: 'verified',
    uploadedDocs: {
      driverLicense: 'ใบขับขี่สาธารณะ ท.2 (หมดอายุ 2571)',
      vehicleRegistration: 'สำเนาตรวจสภาพรถ ตรอ. ประจำปี',
      idCard: 'บัตรประชาชน ยืนยันตัวตนแล้ว',
    },
  },
  customer: {
    id: 'corp-01',
    role: 'customer',
    name: 'คุณสมชาย วงศ์สวัสดิ์',
    emailOrPhone: 'somchai@siamtech.co.th',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    companyName: 'บริษัท สยาม อินโนเวชั่น จำกัด (มหาชน)',
    taxId: '0105559088123',
    companyAddress: '88/9 อาคารสยามทาวเวอร์ ชั้น 14 ถนนสุขุมวิท คลองเตย กทม. 10110',
    branch: 'สำนักงานใหญ่',
  },
  admin: {
    id: 'adm-01',
    role: 'admin',
    name: 'แอดมิน TripDee (ผู้ดูแลระบบ)',
    emailOrPhone: 'admin@tripdee.co',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
  },
};

const INITIAL_QUOTATIONS: QuotationRecord[] = [
  {
    id: 'QT-2026-001',
    date: '12 ก.ย. 2569',
    companyName: 'บริษัท สยาม อินโนเวชั่น จำกัด (มหาชน)',
    route: 'กทม. - ม่อนแจ่ม - เชียงดาว (สัมมนาประจำปี)',
    totalDays: 3,
    passengers: '15-20 คน (2 คัน VIP)',
    estimatedPrice: 12600,
    status: 'confirmed',
    needsTaxInvoice: true,
  },
  {
    id: 'QT-2026-002',
    date: '10 ก.ย. 2569',
    companyName: 'หจก. เชียงใหม่ ดิจิทัล พลัส',
    route: 'สนามบินเชียงใหม่ - ดอยอินทนนท์',
    totalDays: 1,
    passengers: '7-9 คน (1 คัน)',
    estimatedPrice: 2200,
    status: 'completed',
    needsTaxInvoice: true,
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [quotations, setQuotations] = useState<QuotationRecord[]>(INITIAL_QUOTATIONS);

  useEffect(() => {
    let isMounted = true;
    try {
      const saved = localStorage.getItem('td-auth-user');
      if (saved) {
        const parsed: UserProfile = JSON.parse(saved);
        const isDemo = isMockDataEnabled();
        // If in real mode and saved user is one of demo accounts (drv-01, corp-01, adm-01), clear it
        if (!isDemo && (parsed.id === 'drv-01' || parsed.id === 'corp-01' || parsed.id === 'adm-01')) {
          localStorage.removeItem('td-auth-user');
          queueMicrotask(() => {
            if (isMounted) setUser(null);
          });
        } else {
          queueMicrotask(() => {
            if (isMounted) setUser(parsed);
          });
        }
      }
    } catch {
      /* ignore storage access error */
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const saveUser = (newUser: UserProfile | null) => {
    setUser(newUser);
    try {
      if (newUser) {
        localStorage.setItem('td-auth-user', JSON.stringify(newUser));
      } else {
        localStorage.removeItem('td-auth-user');
      }
    } catch {
      /* ignore storage access error */
    }
  };

  const loginAsDemo = (role: UserRole) => {
    saveUser(DEMO_ACCOUNTS[role]);
  };

  const loginWithCredentials = (
    role: UserRole,
    name: string,
    contact: string,
    extra?: Partial<UserProfile>
  ) => {
    const newUser: UserProfile = {
      id: extra?.id || `usr-${Date.now()}`,
      role,
      name: name || (role === 'driver' ? 'คนขับพาร์ตเนอร์ใหม่' : role === 'admin' ? 'ผู้ดูแลระบบ TripDee' : 'ลูกค้าผู้ใช้งาน'),
      emailOrPhone: contact || '08x-xxx-xxxx',
      isAvailable: role === 'driver' ? (extra?.isAvailable ?? true) : undefined,
      verificationStatus: role === 'driver' ? (extra?.verificationStatus ?? 'pending') : undefined,
      ...extra,
    };
    saveUser(newUser);
  };

  const logout = () => {
    saveUser(null);
  };

  const toggleDriverAvailability = () => {
    if (!user || user.role !== 'driver') return;
    const updated = { ...user, isAvailable: !user.isAvailable };
    saveUser(updated);
  };

  const updateDriverProfile = (data: Partial<UserProfile>) => {
    if (!user) return;
    saveUser({ ...user, ...data });
  };

  const updateCorporateProfile = (data: Partial<UserProfile>) => {
    if (!user) return;
    saveUser({ ...user, ...data });
  };

  const submitVerificationDocs = (docs: { driverLicense: string; vehicleRegistration: string; idCard: string }) => {
    if (!user || user.role !== 'driver') return;
    const updated: UserProfile = {
      ...user,
      verificationStatus: 'pending',
      uploadedDocs: docs,
    };
    saveUser(updated);
  };

  const approveDriverVerification = (driverId: string) => {
    if (user && (user.id === driverId || user.role === 'driver')) {
      saveUser({ ...user, verificationStatus: 'verified' });
    }
  };

  const addQuotation = (q: Omit<QuotationRecord, 'id' | 'date' | 'status'>) => {
    const newRecord: QuotationRecord = {
      ...q,
      id: `QT-2026-${String(quotations.length + 1).padStart(3, '0')}`,
      date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'pending',
    };
    setQuotations([newRecord, ...quotations]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loginAsDemo,
        loginWithCredentials,
        logout,
        toggleDriverAvailability,
        updateDriverProfile,
        updateCorporateProfile,
        submitVerificationDocs,
        approveDriverVerification,
        quotations,
        addQuotation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
