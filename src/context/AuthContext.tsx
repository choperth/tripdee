'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isMockDataEnabled } from '@/lib/mockConfig';
import { getSupabase } from '@/lib/supabase/client';

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
  images?: string[];
  seats?: number;
  isAvailable?: boolean;
  busyDates?: string[];
  verificationStatus?: 'verified' | 'pending' | 'unverified';
  /** International direct channels (WhatsApp / WeChat / KakaoTalk) */
  whatsapp?: string;
  wechat?: string;
  kakao?: string;
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
  deleteAccount: () => Promise<void>;
  loginWithOAuth: (
    provider: 'line' | 'google',
    role?: UserRole
  ) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
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
    images: [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    ],
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

  const saveUser = useCallback((newUser: UserProfile | null) => {
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
  }, []);

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

    // Subscribe to Supabase auth events
    const supabase = getSupabase();
    let authSubscription: { unsubscribe: () => void } | null = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!isMounted) return;
        if (session?.user) {
          const u = session.user;
          const meta = (u.user_metadata || {}) as Record<string, unknown>;
          const pendingRole = (typeof window !== 'undefined' ? localStorage.getItem('td-pending-oauth-role') : null) as UserRole | null;
          const role: UserRole = pendingRole || 'customer';

          const fullName = (meta.full_name as string) || (meta.name as string) || (meta.display_name as string) || (u.email ? u.email.split('@')[0] : 'ผู้ใช้งาน');
          const avatarUrl = (meta.avatar_url as string) || (meta.picture as string) || undefined;
          const lineId = (meta.line_id as string) || undefined;

          const oauthUser: UserProfile = {
            id: u.id,
            role,
            name: fullName,
            emailOrPhone: u.email || (meta.phone as string) || '',
            avatar: avatarUrl,
            lineId,
            isAvailable: role === 'driver' ? true : undefined,
            verificationStatus: role === 'driver' ? 'pending' : undefined,
          };
          saveUser(oauthUser);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('td-pending-oauth-role');
          }
        }
      });
      authSubscription = data.subscription;
    }

    return () => {
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [saveUser]);

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

  const loginWithOAuth = async (
    provider: 'line' | 'google',
    role: UserRole = 'customer'
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
    const isDemo = isMockDataEnabled();

    // 1. Direct LINE Login Flow (Uses native LINE OAuth without needing Supabase custom OIDC)
    if (provider === 'line') {
      if (isDemo) {
        const simulatedUser: UserProfile = {
          id: `usr-line-${Date.now().toString().slice(-4)}`,
          role,
          name: role === 'driver' ? 'พี่ชัย รถตู้เชียงใหม่ (LINE)' : 'คุณนิดา (LINE User)',
          emailOrPhone: '081-234-5678',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          lineId: '@chaivan_cnx',
          isAvailable: role === 'driver' ? true : undefined,
          verificationStatus: role === 'driver' ? 'verified' : undefined,
          companyName: role === 'customer' ? 'นิดา ทราเวล กรุ๊ป' : undefined,
        };
        saveUser(simulatedUser);
        return { success: true, user: simulatedUser };
      }

      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search;
        // Full browser navigation required for OAuth 302 redirect
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/api/auth/line/login?role=${encodeURIComponent(role)}&next=${encodeURIComponent(currentPath)}`;
      }
      return { success: true };
    }

    // 2. Google Login via Supabase OAuth
    const supabase = getSupabase();
    if (!supabase || isDemo) {
      const simulatedUser: UserProfile = {
        id: `usr-google-${Date.now().toString().slice(-4)}`,
        role,
        name: role === 'driver' ? 'พี่วิทย์ นอร์ธเทิร์น (Google)' : 'คุณสมชาย วงศ์สวัสดิ์ (Google Workspace)',
        emailOrPhone: role === 'driver' ? 'chai.cnx@gmail.com' : 'somchai@siamtech.co.th',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        isAvailable: role === 'driver' ? true : undefined,
        verificationStatus: role === 'driver' ? 'verified' : undefined,
        companyName: role === 'customer' ? 'บริษัท สยาม อินโนเวชั่น จำกัด (มหาชน)' : undefined,
      };
      saveUser(simulatedUser);
      return { success: true, user: simulatedUser };
    }

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('td-pending-oauth-role', role);
      }
      const redirectTo = `${window.location.origin}/auth/callback?role=${encodeURIComponent(role)}`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes('not enabled') ||
          error.message.toLowerCase().includes('unsupported provider')
        ) {
          return {
            success: false,
            error: `ยังไม่ได้เปิดใช้งาน Provider "${provider.toUpperCase()}" ใน Supabase Dashboard กรุณาใส่ Client ID ใน Dashboard`,
          };
        }
        return { success: false, error: error.message };
      }

      if (data?.url) {
        window.location.href = data.url;
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  };

  const logout = async () => {
    saveUser(null);
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        /* ignore */
      }
    }
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

  const deleteAccount = async () => {
    if (!user) return;
    try {
      if (user.role === 'driver') {
        const phone = user.emailOrPhone;
        if (phone) {
          const cleanPhone = phone.replace(/[^0-9]/g, '');
          if (cleanPhone.length >= 9) {
            const res = await fetch('/api/vehicles');
            if (res.ok) {
              const data = await res.json();
              const vehicles = data.vehicles || [];
              const matches = vehicles.filter((v: { driverPhone?: string }) => {
                const vp = (v.driverPhone || '').replace(/[^0-9]/g, '');
                return vp.includes(cleanPhone) || cleanPhone.includes(vp);
              });
              for (const v of matches) {
                await fetch(`/api/vehicles?id=${v.id}`, { method: 'DELETE' });
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('[TripDee] Error during account deletion cleanup:', err);
    }

    saveUser(null);
    try {
      localStorage.removeItem('td-auth-user');
      window.dispatchEvent(new CustomEvent('tripdee-auth-updated'));
      window.dispatchEvent(new CustomEvent('tripdee-vehicles-updated'));
    } catch {
      /* ignore */
    }
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
        deleteAccount,
        loginWithOAuth,
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
