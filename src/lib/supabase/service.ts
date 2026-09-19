/**
 * Supabase Service Layer for TripDee
 * Provides typed, resilient data access functions for:
 * - Quotations (Corporate & Convoy leads)
 * - Driver Leads (Partner registration)
 * - Vehicles Catalog
 * - Trip Board Posts (Community rides & requests)
 * - Analytics Events
 *
 * Implements graceful fallback to in-memory store / mockData
 * so the application remains 100% operational whether the Supabase
 * tables have been migrated yet or are in transition.
 */

import { getSupabase } from './client';
import { Vehicle, BoardPost, VEHICLES, BOARD_POSTS, ZoneId, BoardQuote } from '@/data/mockData';
import {
  QuotationLead,
  DriverLead,
  getAllQuotations as getLocalQuotations,
  addQuotation as addLocalQuotation,
  updateQuotation as updateLocalQuotation,
  deleteQuotation as deleteLocalQuotation,
  getDeletedQuotationIds,
  getAllDriverLeads as getLocalDrivers,
  addDriverLead as addLocalDriver,
  updateDriverLead as updateLocalDriver,
  deleteDriverLead as deleteLocalDriver,
  getDeletedDriverLeadIds,
  approveDriverLead as approveLocalDriver,
  getApprovedVehicles,
  addApprovedVehicle,
  deleteApprovedVehicle,
  getDeletedVehicleIds,
  convertLeadToVehicle,
} from '@/lib/leadsStore';
import {
  getAllSponsors as getLocalSponsors,
  addSponsor as addLocalSponsor,
  updateSponsor as updateLocalSponsor,
  deleteSponsor as deleteLocalSponsor,
} from '@/lib/sponsorsStore';
import { Sponsor } from '@/data/mockData';
import { AnalyticsEvent } from '@/lib/analytics';
import { recordServerAnalyticsEvent } from '@/lib/serverAnalyticsStore';

// Type-safe helper for dynamic table updates
type DynamicTableQuery = {
  update: (values: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> };
};

// In-memory deleted board posts tracking to ensure instant UI sync across all modes
const deletedBoardPostIds: string[] = [];

// In-memory quotes store for board posts
const localBoardQuotes: BoardQuote[] = [
  {
    id: 'q-demo-1',
    postId: 'b-7',
    driverName: 'พี่สมชาย VIP Lanna',
    driverPhone: '081-555-4321',
    driverLine: 'https://line.me',
    vehicleModel: 'Toyota Commuter VIP 9 ที่นั่ง (เบาะนวดไฟฟ้า)',
    price: 6500,
    priceNote: 'ราคารวม 3 วัน ไม่รวมน้ำมัน (เติมตามจริง)',
    message: 'คนขับชำนาญทางดอยอินทนนท์-ปาย ประสบการณ์ 12 ปี มีที่พักคนขับเตรียมไว้เรียบร้อยครับ',
    createdAt: new Date().toISOString(),
  }
];

// ==============================================================================
// 1. QUOTATION LEADS SERVICE
// ==============================================================================

export async function fetchQuotations(): Promise<QuotationLead[]> {
  const deletedIds = getDeletedQuotationIds();
  const supabase = getSupabase();
  if (!supabase) {
    return getLocalQuotations().filter((q) => !deletedIds.includes(q.id));
  }

  try {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      // Table might not be migrated yet or empty, return local store
      return getLocalQuotations().filter((q) => !deletedIds.includes(q.id));
    }

    return data
      .filter((row) => !deletedIds.includes(row.id))
      .map((row) => ({
        id: row.id,
        companyName: row.company_name,
        contactName: row.contact_name || undefined,
        phone: row.phone,
        travelDate: row.travel_date || '',
        route: row.route || '',
        passengers: row.passengers || '',
        needsTaxInvoice: Boolean(row.needs_tax_invoice),
        estimatedPrice: Number(row.estimated_price) || 0,
        submittedAt: row.created_at,
        status: row.status,
      }));
  } catch (err) {
    console.warn('[TripDee Supabase] Error fetching quotations, using fallback:', err);
    return getLocalQuotations().filter((q) => !deletedIds.includes(q.id));
  }
}

export async function saveQuotation(lead: {
  companyName: string;
  contactName?: string;
  phone: string;
  travelDate: string;
  route: string;
  passengers: string;
  needsTaxInvoice: boolean;
  estimatedPrice: number;
}): Promise<QuotationLead> {
  // Always update in-memory fallback
  const localLead = addLocalQuotation(lead);

  const supabase = getSupabase();
  if (!supabase) return localLead;

  try {
    const { data, error } = await supabase
      .from('quotations')
      .insert({
        id: localLead.id,
        company_name: lead.companyName,
        contact_name: lead.contactName || null,
        phone: lead.phone,
        travel_date: lead.travelDate,
        route: lead.route,
        passengers: lead.passengers,
        needs_tax_invoice: lead.needsTaxInvoice,
        estimated_price: lead.estimatedPrice,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.warn('[TripDee Supabase] Error inserting quotation, saved locally:', error.message);
      return localLead;
    }

    if (data) {
      return {
        id: data.id,
        companyName: data.company_name,
        contactName: data.contact_name || undefined,
        phone: data.phone,
        travelDate: data.travel_date,
        route: data.route,
        passengers: data.passengers,
        needsTaxInvoice: data.needs_tax_invoice,
        estimatedPrice: Number(data.estimated_price) || 0,
        submittedAt: data.created_at,
        status: data.status,
      };
    }
  } catch (err) {
    console.warn('[TripDee Supabase] Exception saving quotation:', err);
  }

  return localLead;
}

export async function updateQuotation(id: string, updates: Partial<QuotationLead>): Promise<QuotationLead | null> {
  const local = updateLocalQuotation(id, updates);
  const supabase = getSupabase();
  if (!supabase) return local;

  try {
    const supabaseUpdates: Record<string, unknown> = {};
    if (updates.companyName) supabaseUpdates.company_name = updates.companyName;
    if (updates.contactName !== undefined) supabaseUpdates.contact_name = updates.contactName;
    if (updates.phone) supabaseUpdates.phone = updates.phone;
    if (updates.travelDate !== undefined) supabaseUpdates.travel_date = updates.travelDate;
    if (updates.route !== undefined) supabaseUpdates.route = updates.route;
    if (updates.passengers !== undefined) supabaseUpdates.passengers = updates.passengers;
    if (updates.needsTaxInvoice !== undefined) supabaseUpdates.needs_tax_invoice = updates.needsTaxInvoice;
    if (updates.estimatedPrice !== undefined) supabaseUpdates.estimated_price = updates.estimatedPrice;
    if (updates.status) supabaseUpdates.status = updates.status;

    await (supabase.from('quotations') as unknown as DynamicTableQuery).update(supabaseUpdates).eq('id', id);
  } catch (err) {
    console.warn('[TripDee Supabase] Exception updating quotation:', err);
  }
  return local;
}

export async function deleteQuotation(id: string): Promise<boolean> {
  deleteLocalQuotation(id);
  const supabase = getSupabase();
  if (!supabase) return true;

  try {
    await supabase.from('quotations').delete().eq('id', id);
    return true;
  } catch (err) {
    console.warn('[TripDee Supabase] Exception deleting quotation:', err);
    return true;
  }
}

// ==============================================================================
// 2. DRIVER LEADS SERVICE
// ==============================================================================

export async function fetchDriverLeads(): Promise<DriverLead[]> {
  const deletedIds = getDeletedDriverLeadIds();
  const supabase = getSupabase();
  if (!supabase) {
    return getLocalDrivers().filter((d) => !deletedIds.includes(d.id));
  }

  try {
    const { data, error } = await supabase
      .from('driver_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return getLocalDrivers().filter((d) => !deletedIds.includes(d.id));
    }

    return data
      .filter((row) => !deletedIds.includes(row.id))
      .map((row) => ({
        id: row.id,
        driverName: row.driver_name,
        nickname: row.nickname,
        phone: row.phone,
        lineId: row.line_id || '',
        vehicleModel: row.vehicle_model || '',
        seats: row.seats || '',
        plateNumber: row.plate_number || undefined,
        plateType: (row.plate_type as 'yellow' | 'blue') || undefined,
        canIssueTaxInvoice: row.can_issue_tax_invoice !== null ? Boolean(row.can_issue_tax_invoice) : undefined,
        businessType: (row.business_type as 'company' | 'individual') || undefined,
        routes: row.routes || '',
        submittedAt: row.created_at,
        status: row.status,
      }));
  } catch (err) {
    console.warn('[TripDee Supabase] Error fetching driver leads, using fallback:', err);
    return getLocalDrivers().filter((d) => !deletedIds.includes(d.id));
  }
}

export async function saveDriverLead(lead: {
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
}): Promise<DriverLead> {
  const localLead = addLocalDriver(lead);

  const supabase = getSupabase();
  if (!supabase) return localLead;

  try {
    const { data, error } = await supabase
      .from('driver_leads')
      .insert({
        id: localLead.id,
        driver_name: lead.driverName,
        nickname: lead.nickname,
        phone: lead.phone,
        line_id: lead.lineId,
        vehicle_model: lead.vehicleModel,
        seats: lead.seats,
        plate_number: lead.plateNumber || null,
        plate_type: lead.plateType || null,
        can_issue_tax_invoice: lead.canIssueTaxInvoice ?? null,
        business_type: lead.businessType || null,
        routes: lead.routes,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.warn('[TripDee Supabase] Error inserting driver lead, saved locally:', error.message);
      return localLead;
    }

    if (data) {
      return {
        id: data.id,
        driverName: data.driver_name,
        nickname: data.nickname,
        phone: data.phone,
        lineId: data.line_id,
        vehicleModel: data.vehicle_model,
        seats: data.seats,
        plateNumber: data.plate_number || undefined,
        plateType: (data.plate_type as 'yellow' | 'blue') || undefined,
        canIssueTaxInvoice: data.can_issue_tax_invoice !== null ? Boolean(data.can_issue_tax_invoice) : undefined,
        businessType: (data.business_type as 'company' | 'individual') || undefined,
        routes: data.routes,
        submittedAt: data.created_at,
        status: data.status,
      };
    }
  } catch (err) {
    console.warn('[TripDee Supabase] Exception saving driver lead:', err);
  }

  return localLead;
}

export async function updateDriverLead(id: string, updates: Partial<DriverLead>): Promise<DriverLead | null> {
  const local = updateLocalDriver(id, updates);
  const supabase = getSupabase();
  if (!supabase) return local;

  try {
    const supabaseUpdates: Record<string, unknown> = {};
    if (updates.driverName) supabaseUpdates.driver_name = updates.driverName;
    if (updates.nickname) supabaseUpdates.nickname = updates.nickname;
    if (updates.phone) supabaseUpdates.phone = updates.phone;
    if (updates.lineId !== undefined) supabaseUpdates.line_id = updates.lineId;
    if (updates.vehicleModel) supabaseUpdates.vehicle_model = updates.vehicleModel;
    if (updates.seats) supabaseUpdates.seats = updates.seats;
    if (updates.plateNumber !== undefined) supabaseUpdates.plate_number = updates.plateNumber;
    if (updates.plateType !== undefined) supabaseUpdates.plate_type = updates.plateType;
    if (updates.canIssueTaxInvoice !== undefined) supabaseUpdates.can_issue_tax_invoice = updates.canIssueTaxInvoice;
    if (updates.businessType !== undefined) supabaseUpdates.business_type = updates.businessType;
    if (updates.routes) supabaseUpdates.routes = updates.routes;
    if (updates.status) supabaseUpdates.status = updates.status;

    await (supabase.from('driver_leads') as unknown as DynamicTableQuery).update(supabaseUpdates).eq('id', id);
  } catch (err) {
    console.warn('[TripDee Supabase] Exception updating driver lead:', err);
  }
  return local;
}

export async function deleteDriverLead(id: string): Promise<boolean> {
  deleteLocalDriver(id);
  const supabase = getSupabase();
  if (!supabase) return true;

  try {
    await supabase.from('driver_leads').delete().eq('id', id);
    return true;
  } catch (err) {
    console.warn('[TripDee Supabase] Exception deleting driver lead:', err);
    return true;
  }
}

export async function verifyDriverLead(id: string): Promise<boolean> {
  let newVehicle = approveLocalDriver(id);

  const supabase = getSupabase();
  if (!supabase) return true;

  try {
    const { data: updatedLead, error } = await supabase
      .from('driver_leads')
      .update({ status: 'verified' })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[TripDee Supabase] Error approving driver in db:', error.message);
    }

    if (!newVehicle && updatedLead) {
      const leadObj: DriverLead = {
        id: updatedLead.id,
        driverName: updatedLead.driver_name,
        nickname: updatedLead.nickname,
        phone: updatedLead.phone,
        lineId: updatedLead.line_id || '',
        vehicleModel: updatedLead.vehicle_model || 'Toyota Commuter VIP',
        seats: String(updatedLead.seats || '9'),
        plateNumber: updatedLead.plate_number || undefined,
        routes: updatedLead.routes || 'เชียงใหม่และใกล้เคียง',
        submittedAt: updatedLead.created_at,
        status: 'verified',
      };
      newVehicle = convertLeadToVehicle(leadObj);
      const approvedList = getApprovedVehicles();
      if (!approvedList.some((v) => v.id === newVehicle!.id)) {
        approvedList.unshift(newVehicle);
      }
    }

    if (newVehicle) {
      // Upsert the newly approved vehicle into Supabase public.vehicles table
      await supabase.from('vehicles').upsert({
        id: newVehicle.id,
        title: newVehicle.title,
        type: newVehicle.type,
        seats: newVehicle.seats,
        driver_name: newVehicle.driverName,
        driver_nickname: newVehicle.driverNickname,
        driver_phone: newVehicle.driverPhone,
        driver_line: newVehicle.driverLine || null,
        driver_whatsapp: newVehicle.driverWhatsapp || null,
        driver_wechat: newVehicle.driverWechat || null,
        driver_kakao: newVehicle.driverKakao || null,
        languages: newVehicle.languages,
        rating: newVehicle.rating,
        review_count: newVehicle.reviewCount,
        is_verified: true,
        images: newVehicle.images,
        zone_rates: newVehicle.zoneRates,
        rate_note: newVehicle.rateNote || null,
        location: newVehicle.location,
        region: newVehicle.region || 'north',
        popular_routes: newVehicle.popularRoutes,
        amenities: newVehicle.amenities,
        description: newVehicle.description,
        plate_type: newVehicle.plateType || null,
        plate_number: newVehicle.plateNumber || null,
        can_issue_tax_invoice: newVehicle.canIssueTaxInvoice ?? null,
        business_type: newVehicle.businessType || null,
        is_available: newVehicle.isAvailable ?? true,
      });
    }

    return true;
  } catch (err) {
    console.warn('[TripDee Supabase] Exception approving driver:', err);
    return true;
  }
}

// ==============================================================================
// 3. VEHICLES CATALOG SERVICE
// ==============================================================================

export async function fetchVehicles(): Promise<Vehicle[]> {
  const localApproved = getApprovedVehicles() || [];
  const deletedIds = getDeletedVehicleIds();
  const supabase = getSupabase();

  if (!supabase) {
    const combined = localApproved.filter((v) => !deletedIds.includes(v.id));
    for (const v of VEHICLES) {
      if (!deletedIds.includes(v.id) && !combined.some((c) => c.id === v.id)) {
        combined.push(v);
      }
    }
    return combined;
  }

  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('rating', { ascending: false });

    let baseVehicles: Vehicle[] = VEHICLES;

    if (!error && data && data.length > 0) {
      baseVehicles = data.map((row) => ({
        id: row.id,
        title: row.title,
        type: row.type,
        seats: row.seats,
        driverName: row.driver_name,
        driverNickname: row.driver_nickname,
        driverPhone: row.driver_phone,
        driverLine: row.driver_line || '',
        driverWhatsapp: row.driver_whatsapp || undefined,
        driverWechat: row.driver_wechat || undefined,
        driverKakao: row.driver_kakao || undefined,
        languages: (row.languages as ('th' | 'en' | 'zh' | 'ko')[]) || ['th'],
        rating: Number(row.rating) || 5.0,
        reviewCount: Number(row.review_count) || 0,
        isVerified: Boolean(row.is_verified),
        images: row.images || [],
        zoneRates: row.zone_rates as Record<ZoneId, number>,
        rateNote: row.rate_note || undefined,
        location: row.location,
        region: (row.region as 'north' | 'central' | 'south' | 'east' | 'isan') || 'north',
        popularRoutes: row.popular_routes || [],
        amenities: row.amenities || [],
        description: row.description || '',
        plateType: (row.plate_type as 'yellow' | 'blue') || undefined,
        plateNumber: row.plate_number || undefined,
        canIssueTaxInvoice: row.can_issue_tax_invoice !== null ? Boolean(row.can_issue_tax_invoice) : undefined,
        businessType: (row.business_type as 'company' | 'individual') || undefined,
        isAvailable: row.is_available !== null ? Boolean(row.is_available) : true,
        rentalType: (row.rental_type as 'with_driver' | 'self_drive') || (row.type === 'van' ? 'with_driver' : 'self_drive'),
        transmission: (row.transmission as 'auto' | 'manual') || undefined,
      }));
    }

    const combined = localApproved.filter((v) => !deletedIds.includes(v.id));
    for (const v of baseVehicles) {
      if (!deletedIds.includes(v.id) && !combined.some((c) => c.id === v.id)) {
        combined.push(v);
      }
    }
    return combined;
  } catch (err) {
    console.warn('[TripDee Supabase] Error fetching vehicles, using mock data:', err);
    const combined = localApproved.filter((v) => !deletedIds.includes(v.id));
    for (const v of VEHICLES) {
      if (!deletedIds.includes(v.id) && !combined.some((c) => c.id === v.id)) {
        combined.push(v);
      }
    }
    return combined;
  }
}

export async function saveVehicle(vehicle: Vehicle): Promise<Vehicle> {
  addApprovedVehicle(vehicle);
  const supabase = getSupabase();
  if (!supabase) return vehicle;

  try {
    await supabase.from('vehicles').upsert({
      id: vehicle.id,
      title: vehicle.title,
      type: vehicle.type,
      seats: vehicle.seats,
      driver_name: vehicle.driverName,
      driver_nickname: vehicle.driverNickname,
      driver_phone: vehicle.driverPhone,
      driver_line: vehicle.driverLine || null,
      driver_whatsapp: vehicle.driverWhatsapp || null,
      driver_wechat: vehicle.driverWechat || null,
      driver_kakao: vehicle.driverKakao || null,
      languages: vehicle.languages,
      rating: vehicle.rating,
      review_count: vehicle.reviewCount,
      is_verified: vehicle.isVerified,
      images: vehicle.images,
      zone_rates: vehicle.zoneRates,
      rate_note: vehicle.rateNote || null,
      location: vehicle.location,
      region: vehicle.region || 'north',
      popular_routes: vehicle.popularRoutes,
      amenities: vehicle.amenities,
      description: vehicle.description,
      plate_type: vehicle.plateType || null,
      plate_number: vehicle.plateNumber || null,
      can_issue_tax_invoice: vehicle.canIssueTaxInvoice ?? null,
      business_type: vehicle.businessType || null,
      is_available: vehicle.isAvailable ?? true,
      rental_type: vehicle.rentalType || (vehicle.type === 'van' ? 'with_driver' : 'self_drive'),
      transmission: vehicle.transmission || null,
    });
  } catch (err) {
    console.warn('[TripDee Supabase] Exception saving vehicle:', err);
  }
  return vehicle;
}

export async function updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> {
  const currentVehicles = await fetchVehicles();
  const target = currentVehicles.find((v) => v.id === id);
  if (!target) return null;

  const merged: Vehicle = { ...target, ...updates };
  addApprovedVehicle(merged);

  const supabase = getSupabase();
  if (!supabase) return merged;

  try {
    const supabaseUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) supabaseUpdates.title = updates.title;
    if (updates.type !== undefined) supabaseUpdates.type = updates.type;
    if (updates.seats !== undefined) supabaseUpdates.seats = updates.seats;
    if (updates.driverName !== undefined) supabaseUpdates.driver_name = updates.driverName;
    if (updates.driverNickname !== undefined) supabaseUpdates.driver_nickname = updates.driverNickname;
    if (updates.driverPhone !== undefined) supabaseUpdates.driver_phone = updates.driverPhone;
    if (updates.driverLine !== undefined) supabaseUpdates.driver_line = updates.driverLine;
    if (updates.driverWhatsapp !== undefined) supabaseUpdates.driver_whatsapp = updates.driverWhatsapp;
    if (updates.driverWechat !== undefined) supabaseUpdates.driver_wechat = updates.driverWechat;
    if (updates.driverKakao !== undefined) supabaseUpdates.driver_kakao = updates.driverKakao;
    if (updates.languages !== undefined) supabaseUpdates.languages = updates.languages;
    if (updates.rating !== undefined) supabaseUpdates.rating = updates.rating;
    if (updates.reviewCount !== undefined) supabaseUpdates.review_count = updates.reviewCount;
    if (updates.isVerified !== undefined) supabaseUpdates.is_verified = updates.isVerified;
    if (updates.images !== undefined) supabaseUpdates.images = updates.images;
    if (updates.zoneRates !== undefined) supabaseUpdates.zone_rates = updates.zoneRates;
    if (updates.rateNote !== undefined) supabaseUpdates.rate_note = updates.rateNote;
    if (updates.location !== undefined) supabaseUpdates.location = updates.location;
    if (updates.region !== undefined) supabaseUpdates.region = updates.region;
    if (updates.popularRoutes !== undefined) supabaseUpdates.popular_routes = updates.popularRoutes;
    if (updates.amenities !== undefined) supabaseUpdates.amenities = updates.amenities;
    if (updates.description !== undefined) supabaseUpdates.description = updates.description;
    if (updates.plateType !== undefined) supabaseUpdates.plate_type = updates.plateType;
    if (updates.plateNumber !== undefined) supabaseUpdates.plate_number = updates.plateNumber;
    if (updates.canIssueTaxInvoice !== undefined) supabaseUpdates.can_issue_tax_invoice = updates.canIssueTaxInvoice;
    if (updates.businessType !== undefined) supabaseUpdates.business_type = updates.businessType;
    if (updates.isAvailable !== undefined) supabaseUpdates.is_available = updates.isAvailable;
    if (updates.rentalType !== undefined) supabaseUpdates.rental_type = updates.rentalType;
    if (updates.transmission !== undefined) supabaseUpdates.transmission = updates.transmission;

    await (supabase.from('vehicles') as unknown as DynamicTableQuery).update(supabaseUpdates).eq('id', id);
  } catch (err) {
    console.warn('[TripDee Supabase] Exception updating vehicle:', err);
  }
  return merged;
}

export async function deleteVehicle(id: string): Promise<boolean> {
  deleteApprovedVehicle(id);
  const supabase = getSupabase();
  if (!supabase) return true;

  try {
    await supabase.from('vehicles').delete().eq('id', id);
    return true;
  } catch (err) {
    console.warn('[TripDee Supabase] Exception deleting vehicle:', err);
    return true;
  }
}

// ==============================================================================
// 4. BOARD POSTS SERVICE
// ==============================================================================

export async function fetchBoardPosts(): Promise<BoardPost[]> {
  const supabase = getSupabase();
  const now = new Date();

  // Helper to check if a post is auto-expired
  const isPostExpired = (post: { date?: string; created_at?: string; createdAt?: string }): boolean => {
    // If created_at is older than 30 days, expire it
    const dateStr = post.created_at || post.createdAt;
    if (dateStr) {
      const created = new Date(dateStr);
      if (!isNaN(created.getTime())) {
        const daysDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > 30) return true;
      }
    }
    return false;
  };

  if (!supabase) {
    return BOARD_POSTS
      .filter((p) => !deletedBoardPostIds.includes(p.id))
      .filter((p) => !p.isClosed)
      .filter((p) => !isPostExpired(p))
      .map((p) => ({
        ...p,
        quoteCount: localBoardQuotes.filter((q) => q.postId === p.id).length || p.quoteCount || 0,
      }));
  }

  try {
    const { data, error } = await supabase
      .from('board_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return BOARD_POSTS
        .filter((p) => !deletedBoardPostIds.includes(p.id))
        .filter((p) => !p.isClosed)
        .filter((p) => !isPostExpired(p))
        .map((p) => ({
          ...p,
          quoteCount: localBoardQuotes.filter((q) => q.postId === p.id).length || p.quoteCount || 0,
        }));
    }

    return data
      .filter((row) => !deletedBoardPostIds.includes(row.id))
      .filter((row) => !row.is_closed)
      .filter((row) => !isPostExpired(row))
      .map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        zoneId: row.zone_id as ZoneId,
        date: row.date,
        days: row.days || 1,
        seats: row.seats || 1,
        price: Number(row.price) || 0,
        priceNote: row.price_note || undefined,
        authorName: row.author_name,
        authorPhone: row.author_phone,
        authorLine: row.author_line,
        vehicleLabel: row.vehicle_label || undefined,
        detail: row.detail,
        postedAt: row.posted_at || 'เมื่อสักครู่',
        isVerified: Boolean(row.is_verified),
        category: (row.category as 'general' | 'corporate') || 'general',
        pin: row.pin || undefined,
        isClosed: Boolean(row.is_closed),
        createdAt: row.created_at,
        isNegotiable: Boolean((row as any).is_negotiable),
        maxQuotes: Number((row as any).max_quotes) || 3,
        quoteCount: localBoardQuotes.filter((q) => q.postId === row.id).length || Number((row as any).quote_count) || 0,
        acceptedQuoteId: (row as any).accepted_quote_id || undefined,
      }));
  } catch (err) {
    console.warn('[TripDee Supabase] Error fetching board posts, using mock data:', err);
    return BOARD_POSTS
      .filter((p) => !deletedBoardPostIds.includes(p.id))
      .filter((p) => !p.isClosed)
      .filter((p) => !isPostExpired(p))
      .map((p) => ({
        ...p,
        quoteCount: localBoardQuotes.filter((q) => q.postId === p.id).length || p.quoteCount || 0,
      }));
  }
}

export async function saveBoardPost(post: Omit<BoardPost, 'id' | 'postedAt'>): Promise<BoardPost> {
  const newId = `b-${Date.now().toString().slice(-6)}`;
  const createdPost: BoardPost = {
    ...post,
    id: newId,
    postedAt: 'เมื่อสักครู่',
    category: post.category || 'general',
    isClosed: false,
    createdAt: new Date().toISOString(),
    isNegotiable: Boolean(post.isNegotiable),
    maxQuotes: post.maxQuotes || 3,
    quoteCount: 0,
  };

  const supabase = getSupabase();
  if (!supabase) return createdPost;

  try {
    const { data, error } = await supabase
      .from('board_posts')
      .insert({
        id: newId,
        type: post.type,
        title: post.title,
        zone_id: post.zoneId,
        date: post.date,
        days: post.days,
        seats: post.seats,
        price: post.price,
        price_note: post.priceNote || null,
        author_name: post.authorName,
        author_phone: post.authorPhone,
        author_line: post.authorLine,
        vehicle_label: post.vehicleLabel || null,
        detail: post.detail,
        posted_at: 'เมื่อสักครู่',
        is_verified: Boolean(post.isVerified),
        category: post.category || 'general',
        pin: post.pin || null,
        is_closed: false,
        is_negotiable: Boolean(post.isNegotiable),
        max_quotes: post.maxQuotes || 3,
      } as any)
      .select()
      .single();

    if (error) {
      console.warn('[TripDee Supabase] Error creating board post:', error.message);
      return createdPost;
    }

    if (data) {
      return {
        id: data.id,
        type: data.type,
        title: data.title,
        zoneId: data.zone_id as ZoneId,
        date: data.date,
        days: data.days,
        seats: data.seats,
        price: Number(data.price) || 0,
        priceNote: data.price_note || undefined,
        authorName: data.author_name,
        authorPhone: data.author_phone,
        authorLine: data.author_line,
        vehicleLabel: data.vehicle_label || undefined,
        detail: data.detail,
        postedAt: data.posted_at || 'เมื่อสักครู่',
        isVerified: Boolean(data.is_verified),
        category: (data.category as 'general' | 'corporate') || 'general',
        pin: data.pin || undefined,
        isClosed: Boolean(data.is_closed),
        createdAt: data.created_at,
        isNegotiable: Boolean((data as any).is_negotiable),
        maxQuotes: Number((data as any).max_quotes) || 3,
        quoteCount: 0,
      };
    }
  } catch (err) {
    console.warn('[TripDee Supabase] Exception saving board post:', err);
  }

  return createdPost;
}

export async function updateBoardPost(id: string, updates: Partial<BoardPost>): Promise<BoardPost | null> {
  const currentPosts = await fetchBoardPosts();
  const target = currentPosts.find((p) => p.id === id);
  if (!target) return null;

  const merged = { ...target, ...updates };

  const supabase = getSupabase();
  if (!supabase) return merged;

  try {
    const supabaseUpdates: Record<string, unknown> = {};
    if (updates.type !== undefined) supabaseUpdates.type = updates.type;
    if (updates.title !== undefined) supabaseUpdates.title = updates.title;
    if (updates.zoneId !== undefined) supabaseUpdates.zone_id = updates.zoneId;
    if (updates.date !== undefined) supabaseUpdates.date = updates.date;
    if (updates.days !== undefined) supabaseUpdates.days = updates.days;
    if (updates.seats !== undefined) supabaseUpdates.seats = updates.seats;
    if (updates.price !== undefined) supabaseUpdates.price = updates.price;
    if (updates.priceNote !== undefined) supabaseUpdates.price_note = updates.priceNote;
    if (updates.authorName !== undefined) supabaseUpdates.author_name = updates.authorName;
    if (updates.authorPhone !== undefined) supabaseUpdates.author_phone = updates.authorPhone;
    if (updates.authorLine !== undefined) supabaseUpdates.author_line = updates.authorLine;
    if (updates.vehicleLabel !== undefined) supabaseUpdates.vehicle_label = updates.vehicleLabel;
    if (updates.detail !== undefined) supabaseUpdates.detail = updates.detail;
    if (updates.isVerified !== undefined) supabaseUpdates.is_verified = updates.isVerified;
    if (updates.category !== undefined) supabaseUpdates.category = updates.category;
    if (updates.pin !== undefined) supabaseUpdates.pin = updates.pin;
    if (updates.isClosed !== undefined) supabaseUpdates.is_closed = updates.isClosed;
    if (updates.isNegotiable !== undefined) supabaseUpdates.is_negotiable = updates.isNegotiable;
    if (updates.maxQuotes !== undefined) supabaseUpdates.max_quotes = updates.maxQuotes;
    if (updates.quoteCount !== undefined) supabaseUpdates.quote_count = updates.quoteCount;
    if (updates.acceptedQuoteId !== undefined) supabaseUpdates.accepted_quote_id = updates.acceptedQuoteId;

    await (supabase.from('board_posts') as unknown as DynamicTableQuery).update(supabaseUpdates).eq('id', id);
  } catch (err) {
    console.warn('[TripDee Supabase] Exception updating board post:', err);
  }
  return merged;
}

export async function deleteBoardPost(id: string): Promise<boolean> {
  if (!deletedBoardPostIds.includes(id)) {
    deletedBoardPostIds.push(id);
  }
  const supabase = getSupabase();
  if (!supabase) return true;

  try {
    await supabase.from('board_posts').delete().eq('id', id);
    return true;
  } catch (err) {
    console.warn('[TripDee Supabase] Exception deleting board post:', err);
    return true;
  }
}

/**
 * Customer Board Self-Close: Allows post author to mark post as closed
 * using either their 4-digit PIN or the last 4 digits of their phone number.
 */
export async function closeBoardPost(id: string, inputPin: string): Promise<{ success: boolean; message: string }> {
  const posts = await fetchBoardPosts();
  const post = posts.find((p) => p.id === id);
  if (!post) {
    return { success: false, message: 'ไม่พบประกาศที่ต้องการปิด หรือประกาศหมดอายุแล้ว' };
  }

  const cleanInput = inputPin.trim();
  const cleanPhone = (post.authorPhone || '').replace(/\D/g, '');
  const phoneLast4 = cleanPhone.slice(-4);
  const correctPin = (post.pin || '').trim();

  const isMatch = (correctPin && cleanInput === correctPin) || (phoneLast4 && cleanInput === phoneLast4);

  if (!isMatch) {
    return { success: false, message: 'รหัส PIN หรือเลข 4 ตัวท้ายของเบอร์โทรศัพท์ไม่ถูกต้อง' };
  }

  await updateBoardPost(id, { isClosed: true });
  if (!deletedBoardPostIds.includes(id)) {
    deletedBoardPostIds.push(id);
  }

  return { success: true, message: 'ปิดประกาศเรียบร้อยแล้ว ขอบคุณที่ใช้บริการ TripDee' };
}

/**
 * Fetch quotes for a specific post.
 * Author verification: if post has a PIN, author must provide PIN or last 4 digits of phone.
 */
export async function fetchBoardQuotes(
  postId: string,
  inputPin?: string
): Promise<{ success: boolean; quotes?: BoardQuote[]; message?: string; authorContact?: { phone: string; line: string } }> {
  const posts = await fetchBoardPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) {
    return { success: false, message: 'ไม่พบประกาศที่ระบุ' };
  }

  // Check pin authentication if post has PIN
  if (post.pin) {
    const cleanInput = (inputPin || '').trim();
    const cleanPhone = (post.authorPhone || '').replace(/\D/g, '');
    const phoneLast4 = cleanPhone.slice(-4);
    const correctPin = post.pin.trim();

    const isMatch = (correctPin && cleanInput === correctPin) || (phoneLast4 && cleanInput === phoneLast4);
    if (!isMatch) {
      return { success: false, message: 'รหัส PIN หรือเลข 4 ตัวท้ายของเบอร์โทรศัพท์ไม่ถูกต้อง ไม่สามารถเปิดดูใบเสนอราคาได้' };
    }
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await (supabase as any)
        .from('board_quotes')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (!error && data && Array.isArray(data) && data.length > 0) {
        return {
          success: true,
          quotes: data.map((r: any) => ({
            id: String(r.id),
            postId: String(r.post_id),
            driverName: String(r.driver_name),
            driverPhone: String(r.driver_phone),
            driverLine: r.driver_line ? String(r.driver_line) : undefined,
            vehicleModel: String(r.vehicle_model),
            price: Number(r.price) || 0,
            priceNote: r.price_note ? String(r.price_note) : undefined,
            message: r.message ? String(r.message) : undefined,
            createdAt: String(r.created_at || new Date().toISOString()),
          })),
          authorContact: { phone: post.authorPhone, line: post.authorLine },
        };
      }
    } catch (err) {
      console.warn('[TripDee Supabase] Error fetching quotes from db:', err);
    }
  }

  const quotes = localBoardQuotes.filter((q) => q.postId === postId);
  return {
    success: true,
    quotes,
    authorContact: { phone: post.authorPhone, line: post.authorLine },
  };
}

/**
 * Submit a quote for a post. Enforces maxQuotes quota (default 3).
 */
export async function saveBoardQuote(quote: Omit<BoardQuote, 'id' | 'createdAt'>): Promise<{
  success: boolean;
  message: string;
  quote?: BoardQuote;
  remainingQuota?: number;
}> {
  const posts = await fetchBoardPosts();
  const post = posts.find((p) => p.id === quote.postId);
  if (!post) {
    return { success: false, message: 'ไม่พบประกาศนี้ในระบบ หรือประกาศอาจถูกปิดแล้ว' };
  }
  if (post.isClosed) {
    return { success: false, message: 'ประกาศนี้ได้รถและปิดรับข้อเสนอแล้ว ขอบคุณที่สนใจครับ' };
  }

  const maxQuotes = post.maxQuotes || 3;
  const currentQuotes = localBoardQuotes.filter((q) => q.postId === quote.postId);
  if (currentQuotes.length >= maxQuotes) {
    return {
      success: false,
      message: `ประกาศนี้ได้รับข้อเสนอครบโควตา ${maxQuotes} เจ้าแล้ว เพื่อรักษาความเป็นส่วนตัวของผู้โดยสาร`,
    };
  }

  const newQuote: BoardQuote = {
    ...quote,
    id: `q-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
  };

  localBoardQuotes.push(newQuote);

  const newCount = currentQuotes.length + 1;
  await updateBoardPost(quote.postId, { quoteCount: newCount });

  const supabase = getSupabase();
  if (supabase) {
    try {
      await (supabase as any).from('board_quotes').insert({
        id: newQuote.id,
        post_id: newQuote.postId,
        driver_name: newQuote.driverName,
        driver_phone: newQuote.driverPhone,
        driver_line: newQuote.driverLine || null,
        vehicle_model: newQuote.vehicleModel,
        price: newQuote.price,
        price_note: newQuote.priceNote || null,
        message: newQuote.message || null,
      });
    } catch (err) {
      console.warn('[TripDee Supabase] Error inserting board quote:', err);
    }
  }

  const remaining = Math.max(0, maxQuotes - newCount);
  return {
    success: true,
    message: `ส่งใบเสนอราคาเรียบร้อยแล้ว (เหลือโควตาอีก ${remaining} เจ้า)`,
    quote: newQuote,
    remainingQuota: remaining,
  };
}

/**
 * Customer accepts a specific quote: closes the post and marks chosen quote
 */
export async function acceptBoardQuote(
  postId: string,
  quoteId: string,
  inputPin: string
): Promise<{ success: boolean; message: string; selectedQuote?: BoardQuote }> {
  const posts = await fetchBoardPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) {
    return { success: false, message: 'ไม่พบประกาศ' };
  }

  // Verify PIN
  const cleanInput = inputPin.trim();
  const cleanPhone = (post.authorPhone || '').replace(/\D/g, '');
  const phoneLast4 = cleanPhone.slice(-4);
  const correctPin = (post.pin || '').trim();
  const isMatch = (correctPin && cleanInput === correctPin) || (phoneLast4 && cleanInput === phoneLast4);

  if (!isMatch) {
    return { success: false, message: 'รหัส PIN ไม่ถูกต้อง' };
  }

  const quote = localBoardQuotes.find((q) => q.id === quoteId && q.postId === postId);
  if (!quote) {
    return { success: false, message: 'ไม่พบใบเสนอราคาที่เลือก' };
  }

  await updateBoardPost(postId, {
    isClosed: true,
    acceptedQuoteId: quoteId,
  });

  return {
    success: true,
    message: `คุณได้เลือกข้อเสนอของ ${quote.driverName} เรียบร้อยแล้ว ระบบได้ปิดประกาศอัตโนมัติแล้วครับ`,
    selectedQuote: quote,
  };
}

// ==============================================================================
// 5. SPONSORS SERVICE
// ==============================================================================

export async function fetchSponsors(): Promise<Sponsor[]> {
  const local = getLocalSponsors();
  const supabase = getSupabase();
  if (!supabase) return local;

  try {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return local;
    }

    return data.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category as Sponsor['category'],
      categoryLabel: row.category_label,
      tagline: row.tagline || '',
      badgeText: row.badge_text || '',
      image: row.image,
      link: row.link,
      discountText: row.discount_text || '',
      location: row.location || '',
    }));
  } catch (err) {
    console.warn('[TripDee Supabase] Error fetching sponsors, using local store:', err);
    return local;
  }
}

export async function saveSponsor(data: Omit<Sponsor, 'id'> & { id?: string }): Promise<Sponsor> {
  const localSponsor = addLocalSponsor(data);
  const supabase = getSupabase();
  if (!supabase) return localSponsor;

  try {
    await supabase.from('sponsors').upsert({
      id: localSponsor.id,
      title: localSponsor.title,
      category: localSponsor.category,
      category_label: localSponsor.categoryLabel,
      tagline: localSponsor.tagline,
      badge_text: localSponsor.badgeText,
      image: localSponsor.image,
      link: localSponsor.link,
      discount_text: localSponsor.discountText,
      location: localSponsor.location,
    });
  } catch (err) {
    console.warn('[TripDee Supabase] Error saving sponsor to db:', err);
  }

  return localSponsor;
}

export async function updateSponsor(id: string, updates: Partial<Sponsor>): Promise<Sponsor | null> {
  const local = updateLocalSponsor(id, updates);
  const supabase = getSupabase();
  if (!supabase) return local;

  try {
    const supabaseUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) supabaseUpdates.title = updates.title;
    if (updates.category !== undefined) supabaseUpdates.category = updates.category;
    if (updates.categoryLabel !== undefined) supabaseUpdates.category_label = updates.categoryLabel;
    if (updates.tagline !== undefined) supabaseUpdates.tagline = updates.tagline;
    if (updates.badgeText !== undefined) supabaseUpdates.badge_text = updates.badgeText;
    if (updates.image !== undefined) supabaseUpdates.image = updates.image;
    if (updates.link !== undefined) supabaseUpdates.link = updates.link;
    if (updates.discountText !== undefined) supabaseUpdates.discount_text = updates.discountText;
    if (updates.location !== undefined) supabaseUpdates.location = updates.location;

    await (supabase.from('sponsors') as unknown as DynamicTableQuery).update(supabaseUpdates).eq('id', id);
  } catch (err) {
    console.warn('[TripDee Supabase] Error updating sponsor in db:', err);
  }

  return local;
}

export async function deleteSponsor(id: string): Promise<boolean> {
  deleteLocalSponsor(id);
  const supabase = getSupabase();
  if (!supabase) return true;

  try {
    await supabase.from('sponsors').delete().eq('id', id);
  } catch (err) {
    console.warn('[TripDee Supabase] Error deleting sponsor from db:', err);
  }

  return true;
}

// ==============================================================================
// 6. ANALYTICS SERVICE
// ==============================================================================

export async function logAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  // Always update server memory summary
  recordServerAnalyticsEvent(event);

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const isSponsor = event.type === 'sponsor_click';
    await supabase.from('analytics_events').insert({
      event_name: event.type,
      driver_id: isSponsor ? null : (event.driverName || event.targetId || null),
      sponsor_id: isSponsor ? event.sponsorId : null,
      channel: isSponsor ? event.variant : event.targetType,
      route_id: null,
      timestamp: new Date(event.timestamp).toISOString(),
      meta: isSponsor
        ? { sponsorTitle: event.sponsorTitle, targetUrl: event.targetUrl }
        : { phoneNumber: event.phoneNumber, targetTitle: event.targetTitle, targetType: event.targetType },
    });
  } catch (err) {
    // Analytics logging should never disrupt user requests
    console.debug('[TripDee Supabase] Analytics log skipped:', err);
  }
}

// ==============================================================================
// 7. SUPABASE CONNECTION HEALTH CHECK
// ==============================================================================

export interface SupabaseHealthStatus {
  connected: boolean;
  timestamp: string;
  latencyMs?: number;
  urlConfigured: boolean;
  keyConfigured: boolean;
  tables: {
    vehicles: boolean;
    driver_leads: boolean;
    quotations: boolean;
    board_posts: boolean;
  };
  error?: string;
}

export async function checkSupabaseHealth(): Promise<SupabaseHealthStatus> {
  const supabase = getSupabase();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabase || !url || !key) {
    return {
      connected: false,
      timestamp: new Date().toISOString(),
      urlConfigured: Boolean(url),
      keyConfigured: Boolean(key),
      tables: {
        vehicles: false,
        driver_leads: false,
        quotations: false,
        board_posts: false,
      },
      error: 'Supabase URL or Key environment variables are missing.',
    };
  }

  const start = Date.now();
  const tables = {
    vehicles: false,
    driver_leads: false,
    quotations: false,
    board_posts: false,
  };

  try {
    const [vRes, dRes, qRes, bRes] = await Promise.all([
      supabase.from('vehicles').select('id').limit(1),
      supabase.from('driver_leads').select('id').limit(1),
      supabase.from('quotations').select('id').limit(1),
      supabase.from('board_posts').select('id').limit(1),
    ]);

    tables.vehicles = !vRes.error;
    tables.driver_leads = !dRes.error;
    tables.quotations = !qRes.error;
    tables.board_posts = !bRes.error;

    const latency = Date.now() - start;
    const isOk = tables.vehicles || tables.driver_leads;

    return {
      connected: isOk,
      timestamp: new Date().toISOString(),
      latencyMs: latency,
      urlConfigured: true,
      keyConfigured: true,
      tables,
      error: isOk ? undefined : (vRes.error?.message || dRes.error?.message || 'Tables not accessible'),
    };
  } catch (err) {
    return {
      connected: false,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - start,
      urlConfigured: true,
      keyConfigured: true,
      tables,
      error: String(err),
    };
  }
}

