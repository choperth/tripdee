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
import { Database, Booking } from './types';
import { Vehicle, BoardPost, VEHICLES, BOARD_POSTS, ZoneId, BoardQuote, PlateType, InsuranceType } from '@/data/mockData';
import { parseVehicleTerms } from '@/lib/vehicleTerms';
import { calculateTripDates } from '@/lib/availabilityUtils';
import {
  isMockDataEnabled,
  isExcludedTestVehicle,
  isExcludedTestDriver,
  isMockVehicleId,
  isMockPostId,
  isMockSponsorId,
} from '@/lib/mockConfig';
export { isMockVehicleId, isMockPostId, isMockSponsorId };
import {
  QuotationLead,
  DriverLead,
  getAllQuotations as getLocalQuotations,
  addQuotation as addLocalQuotation,
  updateQuotation as updateLocalQuotation,
  deleteQuotation as deleteLocalQuotation,
  getDeletedQuotationIds,
  isMockQuotationId,
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
import type { LeadFeeStatus, OrgType, VehicleTier } from '@/lib/b2b';
import {
  calcLeadFee,
  clampCarCount,
  normalizeLeadFeeStatus,
  normalizeOrgType,
  normalizeVehicleTier,
} from '@/lib/b2b';
import {
  AnalyticsEvent,
  AnalyticsSummary,
  CallClickEvent,
  CallTargetType,
  SponsorClickEvent,
  SponsorClickVariant,
  computeUpdatedSummary,
  createEmptySummary,
} from '@/lib/analytics';
import {
  getServerAnalyticsSummary,
  recordServerAnalyticsEvent,
  replaceServerAnalyticsSummary,
  resetServerAnalytics,
} from '@/lib/serverAnalyticsStore';
import { isBoardPostExpired } from '@/lib/availabilityUtils';

// Type-safe helper for dynamic table updates and schema probing
type DynamicTableQuery = {
  update: (values: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> };
  select: (cols: string) => { limit: (count: number) => Promise<{ data?: unknown; error?: { message: string } | null }> };
  insert: (values: Record<string, unknown>) => { select: () => { single: () => Promise<{ data: unknown; error: { code?: string; message: string } | null }> } };
};


// In-memory deleted board posts tracking to ensure instant UI sync across all modes
const deletedBoardPostIds: string[] = [];

// In-memory active board posts store ensuring zero post-loss across all storage states
const localBoardPosts: BoardPost[] = [];

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

type QuotationRow = Database['public']['Tables']['quotations']['Row'];

/** Map a raw `quotations` row into the app-level QuotationLead shape (with B2B defaults). */
function mapQuotationRow(row: QuotationRow): QuotationLead {
  return {
    id: row.id,
    companyName: row.company_name,
    contactName: row.contact_name || undefined,
    phone: row.phone,
    travelDate: row.travel_date || '',
    route: row.route || '',
    passengers: row.passengers || '',
    needsTaxInvoice: Boolean(row.needs_tax_invoice),
    estimatedPrice: Number(row.estimated_price) || 0,
    carCount: clampCarCount(row.car_count),
    vehicleTier: normalizeVehicleTier(row.vehicle_tier),
    orgType: normalizeOrgType(row.org_type),
    includeInsurance: row.include_insurance === false ? false : true,
    assignedPartner: row.assigned_partner || null,
    leadFeeStatus: normalizeLeadFeeStatus(row.lead_fee_status),
    leadFeeAmount: Number(row.lead_fee_amount) || calcLeadFee(row.car_count),
    customerId: row.customer_id,
    totalDays: row.total_days ?? undefined,
    submittedAt: row.created_at,
    status: row.status,
  };
}

export async function fetchQuotations(
  reqUrl?: string,
  options?: { customerId?: string }
): Promise<QuotationLead[]> {
  const allowMock = isMockDataEnabled(reqUrl);
  const customerId = options?.customerId;
  const deletedIds = getDeletedQuotationIds();

  // Customer reads are always exact-id scoped. Unmatched legacy rows remain
  // admin-only, including when Supabase is unavailable and local fallback runs.
  const localLeads = getLocalQuotations().filter(
    (q) =>
      !deletedIds.includes(q.id) &&
      (allowMock || !isMockQuotationId(q.id)) &&
      (!customerId || q.customerId === customerId)
  );

  const supabase = getSupabase();
  if (!supabase) return localLeads;

  try {
    let query = supabase.from('quotations').select('*');
    if (customerId) query = query.eq('customer_id', customerId);
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error || !data) {
      // Table might not be migrated yet, return local store
      return localLeads;
    }

    const rows = data
      .filter((row) => !deletedIds.includes(row.id))
      .map((row) => mapQuotationRow(row));

    if (rows.length === 0) return localLeads;

    // Merge local-only leads (e.g. saved while the B2B migration is pending)
    const remoteIds = new Set(rows.map((row) => row.id));
    return [...rows, ...localLeads.filter((lead) => !remoteIds.has(lead.id))];
  } catch (err) {
    console.warn('[TripDee Supabase] Error fetching quotations, using fallback:', err);
    return localLeads;
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
  carCount?: number;
  vehicleTier?: VehicleTier;
  orgType?: OrgType;
  includeInsurance?: boolean;
  assignedPartner?: string | null;
  leadFeeStatus?: LeadFeeStatus;
  customerId?: string | null;
  totalDays?: number;
}): Promise<QuotationLead> {
  const carCount = clampCarCount(lead.carCount);
  const vehicleTier = lead.vehicleTier ?? 'standard_vip';
  const orgType = lead.orgType ?? 'corporate';
  const includeInsurance = lead.includeInsurance ?? true;
  const assignedPartner = lead.assignedPartner ?? null;
  const leadFeeStatus = lead.leadFeeStatus ?? 'pending';
  const leadFeeAmount = calcLeadFee(carCount);

  const payload = {
    ...lead,
    carCount,
    vehicleTier,
    orgType,
    includeInsurance,
    assignedPartner,
    leadFeeStatus,
    leadFeeAmount,
  };

  // Always update in-memory fallback
  const localLead = addLocalQuotation(payload);

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
        car_count: carCount,
        vehicle_tier: vehicleTier,
        org_type: orgType,
        include_insurance: includeInsurance,
        assigned_partner: assignedPartner,
        lead_fee_status: leadFeeStatus,
        lead_fee_amount: leadFeeAmount,
        customer_id: lead.customerId ?? null,
        total_days: lead.totalDays ?? null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.warn('[TripDee Supabase] Error inserting quotation, saved locally:', error.message);
      return localLead;
    }

    if (data) {
      return mapQuotationRow(data);
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
    // B2B Fleet Matching fields
    if (updates.carCount !== undefined) {
      const carCount = clampCarCount(updates.carCount);
      supabaseUpdates.car_count = carCount;
      supabaseUpdates.lead_fee_amount = calcLeadFee(carCount);
    }
    if (updates.vehicleTier !== undefined) supabaseUpdates.vehicle_tier = updates.vehicleTier;
    if (updates.orgType !== undefined) supabaseUpdates.org_type = updates.orgType;
    if (updates.includeInsurance !== undefined) supabaseUpdates.include_insurance = updates.includeInsurance;
    if (updates.assignedPartner !== undefined) supabaseUpdates.assigned_partner = updates.assignedPartner;
    if (updates.leadFeeStatus !== undefined) supabaseUpdates.lead_fee_status = updates.leadFeeStatus;
    if (updates.leadFeeAmount !== undefined) supabaseUpdates.lead_fee_amount = updates.leadFeeAmount;
    if (updates.totalDays !== undefined) supabaseUpdates.total_days = updates.totalDays;

    await (supabase.from('quotations') as unknown as DynamicTableQuery).update(supabaseUpdates).eq('id', id);
  } catch (err) {
    console.warn('[TripDee Supabase] Exception updating quotation:', err);
  }

  if (local) return local;

  // Row exists only in Supabase (e.g. after a server restart) — report the updated state
  const remote = (await fetchQuotations()).find((q) => q.id === id);
  return remote ? { ...remote, ...updates } : null;
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

export async function fetchDriverLeads(reqUrl?: string): Promise<DriverLead[]> {
  const allowMock = isMockDataEnabled(reqUrl);
  const deletedIds = getDeletedDriverLeadIds();
  const supabase = getSupabase();
  if (!supabase) {
    return allowMock ? getLocalDrivers().filter((d) => !deletedIds.includes(d.id) && !isExcludedTestDriver(d.id)) : [];
  }

  try {
    const { data, error } = await supabase
      .from('driver_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return allowMock ? getLocalDrivers().filter((d) => !deletedIds.includes(d.id) && !isExcludedTestDriver(d.id)) : [];
    }

    return data
      .filter((row) => !deletedIds.includes(row.id) && !isExcludedTestDriver(row.id))
      .map((row) => ({
        id: row.id,
        driverName: row.driver_name,
        nickname: row.nickname,
        phone: row.phone,
        lineId: row.line_id || '',
        whatsapp: row.whatsapp || undefined,
        wechat: row.wechat || undefined,
        kakao: row.kakao || undefined,
        vehicleModel: row.vehicle_model || '',
        seats: row.seats || '',
        plateNumber: row.plate_number || undefined,
        plateType: (row.plate_type as 'yellow' | 'blue') || undefined,
        canIssueTaxInvoice: row.can_issue_tax_invoice !== null ? Boolean(row.can_issue_tax_invoice) : undefined,
        businessType: row.business_type || undefined,
        routes: row.routes || '',
        serviceType: row.service_type || undefined,
        depositTerms: row.deposit_terms || undefined,
        amenities: row.amenities || undefined,
        pickupLocation: row.pickup_location || undefined,
        pricePerDay: row.price_per_day ?? undefined,
        description: row.description || undefined,
        images: Array.isArray(row.images) ? row.images : undefined,
        submittedAt: row.created_at,
        status: row.status,
        ownerId: row.owner_id || undefined,
      }));
  } catch (err) {
    console.warn('[TripDee Supabase] Error fetching driver leads, using fallback:', err);
    return getLocalDrivers().filter((d) => !deletedIds.includes(d.id) && !isExcludedTestDriver(d.id));
  }
}

export async function saveDriverLead(lead: {
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
  plateType?: PlateType;
  insuranceType?: InsuranceType;
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
}): Promise<DriverLead> {
  const localLead = addLocalDriver(lead);

  const supabase = getSupabase();
  if (!supabase) return localLead;

  try {
    const insertResult = await supabase
      .from('driver_leads')
      .insert({
        id: localLead.id,
        owner_id: lead.ownerId || null,
        driver_name: lead.driverName,
        nickname: lead.nickname,
        phone: lead.phone,
        line_id: lead.lineId,
        whatsapp: lead.whatsapp || null,
        wechat: lead.wechat || null,
        kakao: lead.kakao || null,
        vehicle_model: lead.vehicleModel,
        seats: lead.seats,
        plate_number: lead.plateNumber || null,
        plate_type: lead.plateType || null,
        can_issue_tax_invoice: lead.canIssueTaxInvoice ?? null,
        business_type: lead.businessType || null,
        routes: lead.routes,
        service_type: lead.serviceType ?? null,
        deposit_terms: lead.depositTerms ?? null,
        amenities: lead.amenities ?? null,
        pickup_location: lead.pickupLocation ?? null,
        price_per_day: lead.pricePerDay ?? null,
        description: lead.description || null,
        images: lead.images || null,
        status: 'pending',
      })
      .select()
      .single();

    const { data, error } = insertResult;

    if (error) {
      console.warn('[TripDee Supabase] Error inserting driver lead, saved locally:', error.message);
      return localLead;
    }

    if (data) {
      return {
        id: data.id,
        ownerId: data.owner_id || lead.ownerId || undefined,
        driverName: data.driver_name,
        nickname: data.nickname,
        phone: data.phone,
        lineId: data.line_id,
        whatsapp: data.whatsapp || undefined,
        wechat: data.wechat || undefined,
        kakao: data.kakao || undefined,
        vehicleModel: data.vehicle_model,
        seats: data.seats,
        plateNumber: data.plate_number || undefined,
        plateType: (data.plate_type as PlateType) || lead.plateType || undefined,
        insuranceType: lead.insuranceType,
        canIssueTaxInvoice: data.can_issue_tax_invoice !== null && data.can_issue_tax_invoice !== undefined ? Boolean(data.can_issue_tax_invoice) : undefined,
        businessType: data.business_type || undefined,
        routes: data.routes,
        serviceType: data.service_type || undefined,
        depositTerms: data.deposit_terms || undefined,
        amenities: data.amenities || undefined,
        pickupLocation: data.pickup_location || undefined,
        pricePerDay: data.price_per_day ?? undefined,
        description: data.description || undefined,
        images: Array.isArray(data.images) ? data.images : undefined,
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
    if (updates.routes !== undefined) supabaseUpdates.routes = updates.routes;
    if (updates.serviceType !== undefined) supabaseUpdates.service_type = updates.serviceType;
    if (updates.depositTerms !== undefined) supabaseUpdates.deposit_terms = updates.depositTerms;
    if (updates.amenities !== undefined) supabaseUpdates.amenities = updates.amenities;
    if (updates.pickupLocation !== undefined) supabaseUpdates.pickup_location = updates.pickupLocation;
    if (updates.pricePerDay !== undefined) supabaseUpdates.price_per_day = updates.pricePerDay;
    if (updates.description !== undefined) supabaseUpdates.description = updates.description;
    if (updates.images !== undefined) supabaseUpdates.images = updates.images;
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
        whatsapp: updatedLead.whatsapp || undefined,
        wechat: updatedLead.wechat || undefined,
        kakao: updatedLead.kakao || undefined,
        vehicleModel: updatedLead.vehicle_model || '',
        seats: String(updatedLead.seats || ''),
        plateNumber: updatedLead.plate_number || undefined,
        plateType: (updatedLead.plate_type as PlateType) || undefined,
        insuranceType: ((updatedLead as Record<string, unknown>).insurance_type as InsuranceType) || undefined,
        canIssueTaxInvoice: updatedLead.can_issue_tax_invoice !== null && updatedLead.can_issue_tax_invoice !== undefined ? Boolean(updatedLead.can_issue_tax_invoice) : undefined,
        businessType: updatedLead.business_type || undefined,
        routes: updatedLead.routes || '',
        serviceType: updatedLead.service_type || undefined,
        depositTerms: updatedLead.deposit_terms || undefined,
        amenities: updatedLead.amenities || undefined,
        pickupLocation: updatedLead.pickup_location || undefined,
        pricePerDay: updatedLead.price_per_day ?? undefined,
        description: updatedLead.description || undefined,
        images: Array.isArray(updatedLead.images) ? updatedLead.images : undefined,
        submittedAt: updatedLead.created_at,
        status: 'verified',
        ownerId: updatedLead.owner_id || undefined,
      };
      newVehicle = convertLeadToVehicle(leadObj);
      const approvedList = getApprovedVehicles();
      if (!approvedList.some((v) => v.id === newVehicle!.id)) {
        approvedList.unshift(newVehicle);
      }
    }

    if (newVehicle) {
      // Upsert the newly approved vehicle into Supabase public.vehicles table
      const fullVehicleData = {
        id: newVehicle.id,
        title: newVehicle.title,
        type: newVehicle.type,
        rental_type: newVehicle.rentalType || 'with_driver',
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
        is_verified: newVehicle.isVerified,
        images: newVehicle.images || [],
        zone_rates: newVehicle.zoneRates || null,
        rate_note: newVehicle.rateNote || null,
        location: newVehicle.location,
        region: newVehicle.region || 'north',
        popular_routes: newVehicle.popularRoutes || [],
        amenities: newVehicle.amenities || [],
        description: newVehicle.description,
        plate_type: newVehicle.plateType || null,
        plate_number: newVehicle.plateNumber || null,
        can_issue_tax_invoice: newVehicle.canIssueTaxInvoice ?? null,
        business_type: newVehicle.businessType || null,
        is_available: newVehicle.isAvailable ?? true,
        owner_id: newVehicle.ownerId || null,
        approval_status: 'approved' as const,
      };

      const upsertRes = await supabase.from('vehicles').upsert(fullVehicleData);
      if (upsertRes.error && (upsertRes.error.code === 'PGRST204' || upsertRes.error.message?.includes('column'))) {
        console.warn('[TripDee Supabase] Retrying vehicles upsert with base columns due to schema cache mismatch:', upsertRes.error.message);
        const baseVehicleData = {
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
          is_verified: newVehicle.isVerified,
          images: newVehicle.images || [],
          zone_rates: newVehicle.zoneRates || null,
          rate_note: newVehicle.rateNote || null,
          location: newVehicle.location,
          region: newVehicle.region || 'north',
          popular_routes: newVehicle.popularRoutes || [],
          amenities: newVehicle.amenities || [],
          description: newVehicle.description,
          owner_id: newVehicle.ownerId || null,
          approval_status: 'approved' as const,
        };
        await supabase.from('vehicles').upsert(baseVehicleData);
      }
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

/**
 * Raw `vehicles` row shape, including the columns added by migration 06.
 * Declared loosely so a pre-migration database still type-checks.
 */
type VehicleRow = {
  id: string;
  title: string;
  type: Vehicle['type'];
  seats: number;
  driver_name: string;
  driver_nickname: string;
  driver_phone: string;
  driver_line?: string | null;
  driver_whatsapp?: string | null;
  driver_wechat?: string | null;
  driver_kakao?: string | null;
  languages?: string[] | null;
  rating?: number | null;
  review_count?: number | null;
  is_verified?: boolean | null;
  images?: string[] | null;
  zone_rates?: Record<ZoneId, number> | null;
  rate_note?: string | null;
  location: string;
  region?: string | null;
  popular_routes?: string[] | null;
  amenities?: string[] | null;
  description?: string | null;
  plate_type?: PlateType | null;
  insurance_type?: InsuranceType | null;
  plate_number?: string | null;
  can_issue_tax_invoice?: boolean | null;
  business_type?: 'company' | 'individual' | null;
  is_available?: boolean | null;
  rental_type?: 'with_driver' | 'self_drive' | null;
  transmission?: 'auto' | 'manual' | null;
  busy_dates?: string[] | null;
  owner_id?: string | null;
  approval_status?: 'pending' | 'approved' | 'rejected' | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
};

/** Map a raw `vehicles` row into the app-level `Vehicle` shape. */
function mapVehicleRow(row: VehicleRow): Vehicle {
  const rateNote = row.rate_note || undefined;
  const terms = parseVehicleTerms({
    rateNote,
    plateType: (row.plate_type as PlateType) || undefined,
    insuranceType: (row.insurance_type as InsuranceType) || undefined,
  });
  const plateType = (row.plate_type as PlateType) || terms.plateType || undefined;
  const insuranceType =
    (row.insurance_type as InsuranceType) ||
    terms.insuranceType ||
    (row.amenities?.includes('ประกันภัยชั้น 1') ? 'class1' : 'transport_passenger');

  return {
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
    rating: Number(row.review_count) > 0 && row.rating != null ? Number(row.rating) : 0,
    reviewCount: Number(row.review_count) || 0,
    isVerified: Boolean(row.is_verified),
    images: row.images || [],
    zoneRates: row.zone_rates ?? undefined,
    rateNote,
    workHoursPerDay: terms.workHoursPerDay,
    workStart: terms.workStart,
    workEnd: terms.workEnd,
    overtimeRatePerHour: terms.overtimeRatePerHour,
    overnightStayRate: terms.overnightStayRate,
    fuelIncluded: terms.fuelIncluded,
    location: row.location,
    region: (row.region as 'north' | 'central' | 'south' | 'east' | 'isan') || 'north',
    popularRoutes: row.popular_routes || [],
    amenities: row.amenities || [],
    description: row.description || '',
    plateType,
    insuranceType,
    plateNumber: row.plate_number || undefined,
    canIssueTaxInvoice:
      row.can_issue_tax_invoice === null || row.can_issue_tax_invoice === undefined
        ? undefined
        : Boolean(row.can_issue_tax_invoice),
    businessType: row.business_type || undefined,
    isAvailable: row.is_available === null || row.is_available === undefined ? true : Boolean(row.is_available),
    rentalType: row.rental_type || (row.type === 'van' ? 'with_driver' : 'self_drive'),
    transmission: row.transmission || undefined,
    busyDates: Array.isArray(row.busy_dates) ? row.busy_dates : undefined,
    ownerId: row.owner_id || undefined,
    approvalStatus: row.approval_status || undefined,
    submittedAt: row.submitted_at || undefined,
    reviewedAt: row.reviewed_at || undefined,
    reviewedBy: row.reviewed_by || undefined,
  };
}

/**
 * Columns added by migration 06. The application must keep working on a
 * database where that migration has not been run yet, so writes are filtered
 * down to the columns that actually exist. Crucially, when `owner_id` /
 * `approval_status` are absent the app refuses driver self-service writes
 * instead of publishing unowned, unreviewed vehicles to the public catalogue.
 */
const OPTIONAL_VEHICLE_COLUMNS = [
  'plate_type',
  'insurance_type',
  'plate_number',
  'can_issue_tax_invoice',
  'business_type',
  'is_available',
  'rental_type',
  'transmission',
  'busy_dates',
  'owner_id',
  'approval_status',
  'submitted_at',
  'reviewed_at',
  'reviewed_by',
] as const;

type OptionalColumn = (typeof OPTIONAL_VEHICLE_COLUMNS)[number];

/**
 * Probe groups. Every optional column must appear in exactly one group,
 * otherwise it is silently dropped from writes (which is how plate numbers
 * went missing in the first place).
 */
const OPTIONAL_VEHICLE_COLUMN_GROUPS: OptionalColumn[][] = [
  // Group 1 is the base migration. Keep it small so a partial migration
  // still lets the rest through.
  ['plate_type', 'plate_number', 'can_issue_tax_invoice'],
  ['insurance_type'],
  ['business_type', 'is_available', 'rental_type', 'transmission'],
  // Ownership + approval.
  ['owner_id', 'approval_status'],
  // Decoration columns; safe to treat as best-effort.
  ['busy_dates'],
  ['submitted_at', 'reviewed_at', 'reviewed_by'],
];

let columnSupportPromise: Promise<Set<string>> | null = null;

/** Probe once per process which optional columns the live table has. */
async function getSupportedColumns(): Promise<Set<string>> {
  if (columnSupportPromise) return columnSupportPromise;

  columnSupportPromise = (async () => {
    const supabase = getSupabase();
    if (!supabase) return new Set<string>();
    const supported = new Set<string>();
    try {
      // A single select naming every optional column fails if ANY is missing,
      // so probe in small groups to learn the maximum that exists.
      for (const group of OPTIONAL_VEHICLE_COLUMN_GROUPS) {
        const { error } = await supabase
          .from('vehicles')
          .select(group.join(','))
          .limit(1);
        if (!error) group.forEach((c) => supported.add(c));
      }
    } catch (err) {
      console.warn('[TripDee Supabase] Column probe failed, assuming base schema:', err);
    }
    return supported;
  })();

  return columnSupportPromise;
}

/** True when migration 06 has been applied (ownership + approval available). */
export async function isVehicleOwnershipSupported(): Promise<boolean> {
  const cols = await getSupportedColumns();
  return cols.has('owner_id') && cols.has('approval_status');
}

/** Drop any keys the live table does not have. */
function filterToSupportedColumns(
  payload: Record<string, unknown>,
  supported: Set<string>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if ((OPTIONAL_VEHICLE_COLUMNS as readonly string[]).includes(key) && !supported.has(key)) {
      continue;
    }
    out[key] = value;
  }
  return out;
}

/** Build the column payload for an upsert. */
function toVehicleRowPayload(vehicle: Vehicle): Record<string, unknown> {
  return {
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
    languages: vehicle.languages?.length ? vehicle.languages : ['th'],
    rating: vehicle.rating,
    review_count: vehicle.reviewCount,
    is_verified: vehicle.isVerified,
    images: vehicle.images ?? [],
    zone_rates: vehicle.zoneRates ?? {},
    rate_note: vehicle.rateNote || null,
    location: vehicle.location || '',
    region: vehicle.region || 'north',
    popular_routes: vehicle.popularRoutes ?? [],
    amenities: vehicle.amenities ?? [],
    description: vehicle.description,
    plate_type: vehicle.plateType || null,
    insurance_type: vehicle.insuranceType || null,
    plate_number: vehicle.plateNumber || null,
    can_issue_tax_invoice: vehicle.canIssueTaxInvoice ?? null,
    business_type: vehicle.businessType || null,
    is_available: vehicle.isAvailable ?? true,
    rental_type: vehicle.rentalType || (vehicle.type === 'van' ? 'with_driver' : 'self_drive'),
    transmission: vehicle.transmission || null,
    busy_dates: vehicle.busyDates || null,
    owner_id: vehicle.ownerId || null,
    approval_status: vehicle.approvalStatus || 'approved',
    submitted_at: vehicle.submittedAt || new Date().toISOString(),
    reviewed_at: vehicle.reviewedAt || null,
    reviewed_by: vehicle.reviewedBy || null,
  };
}

/** Translate a `Vehicle` update patch into its snake_case column form. */
function toVehicleColumnUpdates(updates: Partial<Vehicle>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (updates.title !== undefined) out.title = updates.title;
  if (updates.type !== undefined) out.type = updates.type;
  if (updates.seats !== undefined) out.seats = updates.seats;
  if (updates.driverName !== undefined) out.driver_name = updates.driverName;
  if (updates.driverNickname !== undefined) out.driver_nickname = updates.driverNickname;
  if (updates.driverPhone !== undefined) out.driver_phone = updates.driverPhone;
  if (updates.driverLine !== undefined) out.driver_line = updates.driverLine;
  if (updates.driverWhatsapp !== undefined) out.driver_whatsapp = updates.driverWhatsapp;
  if (updates.driverWechat !== undefined) out.driver_wechat = updates.driverWechat;
  if (updates.driverKakao !== undefined) out.driver_kakao = updates.driverKakao;
  if (updates.languages !== undefined) out.languages = updates.languages?.length ? updates.languages : ['th'];
  if (updates.rating !== undefined) out.rating = updates.rating;
  if (updates.reviewCount !== undefined) out.review_count = updates.reviewCount;
  if (updates.isVerified !== undefined) out.is_verified = updates.isVerified;
  if (updates.images !== undefined) out.images = updates.images ?? [];
  if (updates.zoneRates !== undefined) out.zone_rates = updates.zoneRates ?? {};
  if (updates.rateNote !== undefined) out.rate_note = updates.rateNote;
  if (updates.location !== undefined) out.location = updates.location || '';
  if (updates.region !== undefined) out.region = updates.region;
  if (updates.popularRoutes !== undefined) out.popular_routes = updates.popularRoutes ?? [];
  if (updates.amenities !== undefined) out.amenities = updates.amenities ?? [];
  if (updates.description !== undefined) out.description = updates.description;
  if (updates.plateType !== undefined) out.plate_type = updates.plateType;
  if (updates.insuranceType !== undefined) out.insurance_type = updates.insuranceType;
  if (updates.plateNumber !== undefined) out.plate_number = updates.plateNumber;
  if (updates.canIssueTaxInvoice !== undefined) out.can_issue_tax_invoice = updates.canIssueTaxInvoice;
  if (updates.businessType !== undefined) out.business_type = updates.businessType;
  if (updates.isAvailable !== undefined) out.is_available = updates.isAvailable;
  if (updates.rentalType !== undefined) out.rental_type = updates.rentalType;
  if (updates.transmission !== undefined) out.transmission = updates.transmission;
  if (updates.busyDates !== undefined) out.busy_dates = updates.busyDates;
  if (updates.ownerId !== undefined) out.owner_id = updates.ownerId;
  if (updates.approvalStatus !== undefined) out.approval_status = updates.approvalStatus;
  if (updates.submittedAt !== undefined) out.submitted_at = updates.submittedAt;
  if (updates.reviewedAt !== undefined) out.reviewed_at = updates.reviewedAt;
  if (updates.reviewedBy !== undefined) out.reviewed_by = updates.reviewedBy;
  return out;
}

export async function fetchVehicles(
  reqUrl?: string,
  options?: { includeUnapproved?: boolean; ownerId?: string }
): Promise<Vehicle[]> {
  const allowMock = isMockDataEnabled(reqUrl);
  const includeUnapproved = Boolean(options?.includeUnapproved);
  const ownerId = options?.ownerId;
  const localApproved = (getApprovedVehicles() || []).filter((v) => !isExcludedTestVehicle(v.id) && (allowMock ? true : !isMockVehicleId(v.id)));
  const deletedIds = getDeletedVehicleIds();
  const supabase = getSupabase();

  // Public listings only ever surface approved vehicles.
  const isPubliclyVisible = (v: { approvalStatus?: string }) =>
    includeUnapproved || !v.approvalStatus || v.approvalStatus === 'approved';

  if (!supabase) {
    const combined = localApproved.filter(
      (v) =>
        !deletedIds.includes(v.id) &&
        !isExcludedTestVehicle(v.id) &&
        isPubliclyVisible(v) &&
        (!ownerId || v.ownerId === ownerId)
    );
    if (allowMock) {
      for (const v of VEHICLES) {
        if (!deletedIds.includes(v.id) && !isExcludedTestVehicle(v.id) && !combined.some((c) => c.id === v.id)) {
          combined.push(v);
        }
      }
    }
    return combined;
  }

  try {
    const supported = await getSupportedColumns();
    const ownershipAvailable = supported.has('owner_id') && supported.has('approval_status');
    const canFilterInQuery = ownershipAvailable && !includeUnapproved;
    const canFilterByOwner = ownershipAvailable && Boolean(ownerId);

    let query = supabase.from('vehicles').select('*');
    if (canFilterInQuery) {
      query = query.eq('approval_status', 'approved');
    }
    if (canFilterByOwner) {
      query = query.eq('owner_id', ownerId!);
    }
    const { data, error } = await query.order('rating', { ascending: false });

    let baseVehicles: Vehicle[] = allowMock ? VEHICLES.filter((v) => !isExcludedTestVehicle(v.id)) : [];

    if (error) {
      if (!/approval_status|owner_id|column/i.test(error.message || '')) {
        throw error;
      }
      const fallback = await supabase.from('vehicles').select('*').order('rating', { ascending: false });
      if (!fallback.error && fallback.data && fallback.data.length > 0) {
        baseVehicles = (fallback.data as unknown as VehicleRow[])
          .filter((row) => isPubliclyVisible({ approvalStatus: row.approval_status ?? undefined }))
          .filter((row) => (ownerId ? row.owner_id === ownerId : true))
          .map(mapVehicleRow);
      }
    } else if (data && data.length > 0) {
      const validRows = (allowMock ? data : data.filter((row) => !isMockVehicleId(row.id))).filter(
        (row) => !isExcludedTestVehicle(row.id)
      );
      baseVehicles = validRows.map((row) => mapVehicleRow(row as unknown as VehicleRow));
    }

    const combined = localApproved.filter(
      (v) =>
        !deletedIds.includes(v.id) &&
        !isExcludedTestVehicle(v.id) &&
        isPubliclyVisible(v) &&
        (!ownerId || v.ownerId === ownerId)
    );
    for (const v of baseVehicles) {
      if (!deletedIds.includes(v.id) && !isExcludedTestVehicle(v.id) && !combined.some((c) => c.id === v.id)) {
        combined.push(v);
      }
    }
    return combined;
  } catch (err) {
    console.warn('[TripDee Supabase] Error fetching vehicles:', err);
    const combined = localApproved.filter(
      (v) =>
        !deletedIds.includes(v.id) &&
        !isExcludedTestVehicle(v.id) &&
        isPubliclyVisible(v) &&
        (!ownerId || v.ownerId === ownerId)
    );
    if (allowMock) {
      for (const v of VEHICLES) {
        if (!deletedIds.includes(v.id) && !isExcludedTestVehicle(v.id) && !combined.some((c) => c.id === v.id)) {
          combined.push(v);
        }
      }
    }
    return combined;
  }
}

export async function saveVehicle(vehicle: Vehicle): Promise<Vehicle> {
  addApprovedVehicle(vehicle);
  const supabase = getSupabase();
  if (!supabase) return vehicle;

  const supported = await getSupportedColumns();
  const res = await (supabase.from('vehicles') as unknown as {
    upsert: (data: Record<string, unknown>) => Promise<{ error?: { code?: string; message?: string } }>;
  }).upsert(filterToSupportedColumns(toVehicleRowPayload(vehicle), supported));

  if (res?.error) {
    // Surface this instead of silently degrading to a partial write: a schema
    // mismatch must never look like a successful save to the caller.
    throw new Error(`saveVehicle failed: ${res.error.message}`);
  }
  return vehicle;
}

/**
 * Read a single vehicle including ones that are not publicly listed.
 * Owner/approval checks depend on being able to see pending rows.
 */
export async function fetchVehicleById(id: string, reqUrl?: string): Promise<Vehicle | null> {
  const cleanId = (id || '').trim();
  if (!cleanId) return null;

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', cleanId)
        .limit(1);
      if (!error && data && data.length > 0) {
        return mapVehicleRow(data[0] as unknown as VehicleRow);
      }
    } catch (err) {
      console.warn('[TripDee Supabase] Error fetching vehicle by id:', err);
    }
  }

  const local = getApprovedVehicles().find((v) => v.id === cleanId);
  if (local) return local;

  const all = await fetchVehicles(reqUrl, { includeUnapproved: true });
  const found = all.find((v) => v.id === cleanId);
  if (found) return found;

  const cleanDigits = cleanId.replace(/\D/g, '');
  if (cleanDigits.length >= 9) {
    const byPhone = all.find((v) => (v.driverPhone || '').replace(/\D/g, '') === cleanDigits);
    if (byPhone) return byPhone;
  }

  if (isMockDataEnabled(reqUrl)) {
    const mockMatch = VEHICLES.find((v) => v.id === cleanId);
    if (mockMatch) return mockMatch;
    if (cleanDigits.length >= 9) {
      const mockByPhone = VEHICLES.find((v) => (v.driverPhone || '').replace(/\D/g, '') === cleanDigits);
      if (mockByPhone) return mockByPhone;
    }
  }

  return null;
}

export async function updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> {
  const target = await fetchVehicleById(id);
  if (!target) return null;

  const merged: Vehicle = { ...target, ...updates };
  if (updates.rateNote !== undefined) {
    const parsed = parseVehicleTerms({ rateNote: updates.rateNote });
    merged.workHoursPerDay = parsed.workHoursPerDay;
    merged.workStart = parsed.workStart;
    merged.workEnd = parsed.workEnd;
    merged.overtimeRatePerHour = parsed.overtimeRatePerHour;
    merged.overnightStayRate = parsed.overnightStayRate;
    merged.fuelIncluded = parsed.fuelIncluded;
    if (parsed.plateType && updates.plateType === undefined) merged.plateType = parsed.plateType;
    if (parsed.insuranceType && updates.insuranceType === undefined) merged.insuranceType = parsed.insuranceType;
  }
  addApprovedVehicle(merged);

  const supabase = getSupabase();
  if (!supabase) return merged;

  const supported = await getSupportedColumns();
  const res = await (supabase.from('vehicles') as unknown as DynamicTableQuery)
    .update(filterToSupportedColumns(toVehicleColumnUpdates(updates), supported))
    .eq('id', id);
  const updateError = (res as { error?: { code?: string; message?: string } })?.error;
  if (updateError) {
    throw new Error(`updateVehicle failed: ${updateError.message}`);
  }
  return merged;
}

export async function deleteVehicle(id: string): Promise<boolean> {
  deleteApprovedVehicle(id);
  const supabase = getSupabase();
  if (!supabase) return true;

  const res = await supabase.from('vehicles').delete().eq('id', id);
  if (res.error) {
    throw new Error(`deleteVehicle failed: ${res.error.message}`);
  }
  return true;
}

/**
 * Approve or reject a driver-submitted vehicle. Only an administrator should
 * call this; the API route enforces that before reaching here.
 */
export async function reviewVehicle(
  id: string,
  decision: 'approved' | 'rejected',
  reviewedBy: string
): Promise<Vehicle | null> {
  const target = await fetchVehicleById(id);
  if (!target) return null;

  const merged: Vehicle = {
    ...target,
    approvalStatus: decision,
    reviewedAt: new Date().toISOString(),
    reviewedBy,
  };
  addApprovedVehicle(merged);

  const supabase = getSupabase();
  if (!supabase) return merged;

  const supported = await getSupportedColumns();
  const res = await (supabase.from('vehicles') as unknown as DynamicTableQuery)
    .update(
      filterToSupportedColumns(
        {
          approval_status: decision,
          reviewed_at: merged.reviewedAt,
          reviewed_by: reviewedBy,
        },
        supported
      )
    )
    .eq('id', id);
  const updateError = (res as { error?: { code?: string; message?: string } })?.error;
  if (updateError) {
    throw new Error(`reviewVehicle failed: ${updateError.message}`);
  }
  return merged;
}

// ==============================================================================
// 4. BOARD POSTS SERVICE
// ==============================================================================

export const OPTIONAL_BOARD_COLUMNS = [
  'category',
  'pin',
  'view_token',
  'is_closed',
  'is_negotiable',
  'max_quotes',
  'quote_count',
  'accepted_quote_id',
  'author_whatsapp',
  'author_wechat',
] as const;

type OptionalBoardColumn = (typeof OPTIONAL_BOARD_COLUMNS)[number];

const OPTIONAL_BOARD_COLUMN_GROUPS: OptionalBoardColumn[][] = [
  ['category', 'pin', 'view_token'],
  ['is_closed', 'is_negotiable'],
  ['max_quotes', 'quote_count', 'accepted_quote_id'],
  ['author_whatsapp', 'author_wechat'],
];

let boardColumnSupportPromise: Promise<Set<string>> | null = null;

async function getSupportedBoardColumns(): Promise<Set<string>> {
  if (boardColumnSupportPromise) return boardColumnSupportPromise;

  boardColumnSupportPromise = (async () => {
    const supabase = getSupabase();
    if (!supabase) return new Set<string>();
    const supported = new Set<string>();
    try {
      for (const group of OPTIONAL_BOARD_COLUMN_GROUPS) {
        const { error } = await (supabase.from('board_posts') as unknown as DynamicTableQuery)
          .select(group.join(','))
          .limit(1);
        if (!error) group.forEach((c) => supported.add(c));
      }
    } catch (err) {
      console.warn('[TripDee Supabase] Board column probe failed, assuming base schema:', err);
    }
    return supported;
  })();

  return boardColumnSupportPromise;
}

function filterToSupportedBoardColumns(
  payload: Record<string, unknown>,
  supported: Set<string>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if ((OPTIONAL_BOARD_COLUMNS as readonly string[]).includes(key) && !supported.has(key)) {
      continue;
    }
    out[key] = value;
  }
  return out;
}

export interface BoardMeta {
  category?: 'general' | 'corporate';
  pin?: string;
  viewToken?: string;
  isClosed?: boolean;
  isNegotiable?: boolean;
  maxQuotes?: number;
  quoteCount?: number;
  acceptedQuoteId?: string;
  authorWhatsApp?: string;
  authorWeChat?: string;
}

const META_TAG_REGEX = /\[\[td-meta:([^\]]+)\]\]/;

export function encodeBoardMeta(detail: string, meta: BoardMeta): string {
  const cleanDetail = (detail || '').replace(META_TAG_REGEX, '').trim();
  const parts: string[] = [];
  if (meta.category && meta.category !== 'general') parts.push(`cat=${encodeURIComponent(meta.category)}`);
  if (meta.pin) parts.push(`pin=${encodeURIComponent(meta.pin)}`);
  if (meta.viewToken) parts.push(`tok=${encodeURIComponent(meta.viewToken)}`);
  if (meta.isClosed) parts.push(`cls=1`);
  if (meta.isNegotiable) parts.push(`neg=1`);
  if (meta.maxQuotes && meta.maxQuotes !== 3) parts.push(`max=${meta.maxQuotes}`);
  if (meta.quoteCount && meta.quoteCount > 0) parts.push(`qc=${meta.quoteCount}`);
  if (meta.acceptedQuoteId) parts.push(`aq=${encodeURIComponent(meta.acceptedQuoteId)}`);
  if (meta.authorWhatsApp) parts.push(`wa=${encodeURIComponent(meta.authorWhatsApp)}`);
  if (meta.authorWeChat) parts.push(`wc=${encodeURIComponent(meta.authorWeChat)}`);

  if (parts.length === 0) return cleanDetail;
  const metaTag = `[[td-meta:${parts.join(';')}]]`;
  return cleanDetail ? `${cleanDetail}\n\n${metaTag}` : metaTag;
}

export function decodeBoardMeta(rawDetail: string): { cleanDetail: string; meta: BoardMeta } {
  if (!rawDetail) return { cleanDetail: '', meta: {} };
  const match = rawDetail.match(META_TAG_REGEX);
  if (!match) return { cleanDetail: rawDetail, meta: {} };

  const rawPairs = match[1].split(';');
  const meta: BoardMeta = {};

  for (const pair of rawPairs) {
    const [k, v] = pair.split('=');
    if (!k || v === undefined) continue;
    try {
      const decoded = decodeURIComponent(v);
      if (k === 'cat') meta.category = decoded as 'general' | 'corporate';
      else if (k === 'pin') meta.pin = decoded;
      else if (k === 'tok') meta.viewToken = decoded;
      else if (k === 'cls') meta.isClosed = decoded === '1';
      else if (k === 'neg') meta.isNegotiable = decoded === '1';
      else if (k === 'max') meta.maxQuotes = Number(decoded) || 3;
      else if (k === 'qc') meta.quoteCount = Number(decoded) || 0;
      else if (k === 'aq') meta.acceptedQuoteId = decoded;
      else if (k === 'wa') meta.authorWhatsApp = decoded;
      else if (k === 'wc') meta.authorWeChat = decoded;
    } catch {
      // Ignore malformed tag pair
    }
  }

  const cleanDetail = rawDetail.replace(META_TAG_REGEX, '').trim();
  return { cleanDetail, meta };
}

export async function fetchBoardPosts(
  reqUrl?: string,
  options?: { includeClosed?: boolean }
): Promise<BoardPost[]> {
  const supabase = getSupabase();
  const allowMock = isMockDataEnabled(reqUrl);
  const includeClosed = Boolean(options?.includeClosed);

  const processMockPosts = (posts: BoardPost[]): BoardPost[] => {
    return posts
      .filter((p) => !deletedBoardPostIds.includes(p.id))
      .filter((p) => includeClosed || !isBoardPostExpired(p))
      .map((p) => ({
        ...p,
        isClosed: Boolean(p.isClosed || isBoardPostExpired(p)),
        quoteCount: localBoardQuotes.filter((q) => q.postId === p.id).length || p.quoteCount || 0,
      }));
  };

  const getCombinedWithLocal = (dbPosts: BoardPost[]): BoardPost[] => {
    const dbPostIds = new Set(dbPosts.map((p) => p.id));
    const activeLocalPosts = localBoardPosts
      .filter((p) => !deletedBoardPostIds.includes(p.id))
      .filter((p) => !dbPostIds.has(p.id))
      .filter((p) => includeClosed || (!p.isClosed && !isBoardPostExpired(p)));

    return [...activeLocalPosts, ...dbPosts];
  };

  if (!supabase) {
    const combined = getCombinedWithLocal([]);
    if (combined.length > 0) return combined;
    if (!allowMock) return [];
    return processMockPosts(BOARD_POSTS);
  }

  try {
    const { data, error } = await supabase
      .from('board_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      const combined = getCombinedWithLocal([]);
      if (combined.length > 0) return combined;
      if (!allowMock) return [];
      return processMockPosts(BOARD_POSTS);
    }

    const validRows = allowMock ? data : data.filter((row) => !isMockPostId(row.id));

    const mapped: BoardPost[] = validRows
      .filter((row) => !deletedBoardPostIds.includes(row.id))
      .map((row) => {
        const { cleanDetail, meta } = decodeBoardMeta(row.detail || '');
        const isClosedDb = row.is_closed !== null && row.is_closed !== undefined ? Boolean(row.is_closed) : meta.isClosed;
        const isExp = isBoardPostExpired({
          date: row.date,
          days: row.days,
          created_at: row.created_at,
          isClosed: Boolean(isClosedDb),
        });

        const postItem: BoardPost = {
          id: row.id,
          type: row.type as BoardPost['type'],
          title: row.title,
          zoneId: row.zone_id as ZoneId,
          date: row.date,
          days: row.days || 1,
          seats: row.seats || 1,
          price: Number(row.price) || 0,
          priceNote: row.price_note || undefined,
          authorName: row.author_name,
          authorPhone: row.author_phone,
          authorLine: row.author_line || '',
          authorWhatsApp: row.author_whatsapp || meta.authorWhatsApp || undefined,
          authorWeChat: row.author_wechat || meta.authorWeChat || undefined,
          vehicleLabel: row.vehicle_label || undefined,
          detail: cleanDetail,
          postedAt: row.posted_at || 'เมื่อสักครู่',
          isVerified: Boolean(row.is_verified),
          category: (row.category || meta.category || 'general') as 'general' | 'corporate',
          pin: row.pin || meta.pin || undefined,
          isClosed: Boolean(isClosedDb || isExp),
          createdAt: row.created_at,
          isNegotiable: row.is_negotiable !== null && row.is_negotiable !== undefined ? Boolean(row.is_negotiable) : Boolean(meta.isNegotiable),
          maxQuotes: Number(row.max_quotes ?? meta.maxQuotes ?? 3),
          quoteCount: localBoardQuotes.filter((q) => q.postId === row.id).length || Number(row.quote_count ?? meta.quoteCount ?? 0),
          acceptedQuoteId: row.accepted_quote_id || meta.acceptedQuoteId || undefined,
          viewToken: row.view_token || meta.viewToken || undefined,
        };
        return postItem;
      })
      .filter((post) => {
        if (includeClosed) return true;
        return !post.isClosed;
      });

    const combined = getCombinedWithLocal(mapped);

    if (allowMock && combined.length < 2) {
      const existingIds = new Set(combined.map((r) => r.id));
      const mockToAdd = processMockPosts(BOARD_POSTS).filter((p) => !existingIds.has(p.id));
      return [...combined, ...mockToAdd];
    }

    return combined;
  } catch (err) {
    console.warn('[TripDee Supabase] Error fetching board posts:', err);
    const combined = getCombinedWithLocal([]);
    if (combined.length > 0) return combined;
    if (!allowMock) return [];
    return processMockPosts(BOARD_POSTS);
  }
}

export async function saveBoardPost(post: Omit<BoardPost, 'id' | 'postedAt'>): Promise<BoardPost> {
  const newId = `b-${Date.now().toString().slice(-6)}`;
  const viewToken = post.viewToken || `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
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
    viewToken,
  };

  // Always keep in local in-memory storage immediately so it is available across queries
  const existingIdx = localBoardPosts.findIndex((p) => p.id === newId);
  if (existingIdx >= 0) {
    localBoardPosts[existingIdx] = createdPost;
  } else {
    localBoardPosts.unshift(createdPost);
  }

  const supabase = getSupabase();
  if (!supabase) return createdPost;

  try {
    const meta: BoardMeta = {
      category: createdPost.category,
      pin: createdPost.pin,
      viewToken: createdPost.viewToken,
      isClosed: false,
      isNegotiable: createdPost.isNegotiable,
      maxQuotes: createdPost.maxQuotes,
      quoteCount: 0,
      authorWhatsApp: createdPost.authorWhatsApp,
      authorWeChat: createdPost.authorWeChat,
    };
    const encodedDetail = encodeBoardMeta(post.detail || '', meta);

    const supported = await getSupportedBoardColumns();

    const fullPayload: Record<string, unknown> = {
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
      detail: encodedDetail,
      posted_at: 'เมื่อสักครู่',
      is_verified: Boolean(post.isVerified),
      category: post.category || 'general',
      pin: post.pin || null,
      is_closed: false,
      is_negotiable: Boolean(post.isNegotiable),
      max_quotes: post.maxQuotes || 3,
      view_token: viewToken,
      author_whatsapp: post.authorWhatsApp || null,
      author_wechat: post.authorWeChat || null,
    };

    const insertPayload = filterToSupportedBoardColumns(fullPayload, supported);

    // Attempt insert with detected supported columns
    let res = await (supabase.from('board_posts') as unknown as DynamicTableQuery)
      .insert(insertPayload)
      .select()
      .single();

    // Fallback if schema cache or probing missed an unsupported column
    if (res.error) {
      console.warn('[TripDee Supabase] Primary insert failed:', res.error.message, '- retrying with pure baseline columns');
      const baselinePayload = {
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
        detail: encodedDetail,
        posted_at: 'เมื่อสักครู่',
        is_verified: Boolean(post.isVerified),
      };
      res = await (supabase.from('board_posts') as unknown as DynamicTableQuery)
        .insert(baselinePayload)
        .select()
        .single();
    }

    if (res.error) {
      console.warn('[TripDee Supabase] Error creating board post in db:', res.error.message);
      return createdPost;
    }

    const data = res.data as Record<string, unknown> | null;
    if (data) {
      const { cleanDetail, meta: fetchedMeta } = decodeBoardMeta(String(data.detail || ''));
      const savedPost: BoardPost = {
        id: String(data.id),
        type: data.type as BoardPost['type'],
        title: String(data.title),
        zoneId: data.zone_id as ZoneId,
        date: String(data.date),
        days: Number(data.days) || 1,
        seats: Number(data.seats) || 1,
        price: Number(data.price) || 0,
        priceNote: data.price_note ? String(data.price_note) : undefined,
        authorName: String(data.author_name),
        authorPhone: String(data.author_phone),
        authorLine: String(data.author_line || ''),
        authorWhatsApp: (data.author_whatsapp ? String(data.author_whatsapp) : undefined) || fetchedMeta.authorWhatsApp || post.authorWhatsApp,
        authorWeChat: (data.author_wechat ? String(data.author_wechat) : undefined) || fetchedMeta.authorWeChat || post.authorWeChat,
        vehicleLabel: data.vehicle_label ? String(data.vehicle_label) : undefined,
        detail: cleanDetail,
        postedAt: String(data.posted_at || 'เมื่อสักครู่'),
        isVerified: Boolean(data.is_verified),
        category: ((data.category as string) || fetchedMeta.category || 'general') as 'general' | 'corporate',
        pin: (data.pin ? String(data.pin) : undefined) || fetchedMeta.pin || post.pin,
        isClosed: Boolean(data.is_closed ?? fetchedMeta.isClosed ?? false),
        createdAt: String(data.created_at || createdPost.createdAt),
        isNegotiable: Boolean(data.is_negotiable ?? fetchedMeta.isNegotiable ?? post.isNegotiable),
        maxQuotes: Number(data.max_quotes ?? fetchedMeta.maxQuotes ?? 3),
        quoteCount: 0,
        viewToken: (data.view_token ? String(data.view_token) : undefined) || fetchedMeta.viewToken || viewToken,
      };

      // Keep updated post in local cache
      const idx = localBoardPosts.findIndex((p) => p.id === savedPost.id);
      if (idx >= 0) {
        localBoardPosts[idx] = savedPost;
      } else {
        localBoardPosts.unshift(savedPost);
      }
      return savedPost;
    }
  } catch (err) {
    console.warn('[TripDee Supabase] Exception saving board post:', err);
  }

  return createdPost;
}

export async function updateBoardPost(id: string, updates: Partial<BoardPost>): Promise<BoardPost | null> {
  const currentPosts = await fetchBoardPosts(undefined, { includeClosed: true });
  const target = currentPosts.find((p) => p.id === id);
  if (!target) return null;

  const merged = { ...target, ...updates };

  // Update in local memory cache
  const localIdx = localBoardPosts.findIndex((p) => p.id === id);
  if (localIdx >= 0) {
    localBoardPosts[localIdx] = merged;
  } else {
    localBoardPosts.unshift(merged);
  }

  const supabase = getSupabase();
  if (!supabase) return merged;

  try {
    const meta: BoardMeta = {
      category: merged.category,
      pin: merged.pin,
      viewToken: merged.viewToken,
      isClosed: merged.isClosed,
      isNegotiable: merged.isNegotiable,
      maxQuotes: merged.maxQuotes,
      quoteCount: merged.quoteCount,
      acceptedQuoteId: merged.acceptedQuoteId,
      authorWhatsApp: merged.authorWhatsApp,
      authorWeChat: merged.authorWeChat,
    };
    const encodedDetail = encodeBoardMeta(merged.detail || '', meta);

    const supported = await getSupportedBoardColumns();
    const fullUpdates: Record<string, unknown> = {};

    if (updates.type !== undefined) fullUpdates.type = updates.type;
    if (updates.title !== undefined) fullUpdates.title = updates.title;
    if (updates.zoneId !== undefined) fullUpdates.zone_id = updates.zoneId;
    if (updates.date !== undefined) fullUpdates.date = updates.date;
    if (updates.days !== undefined) fullUpdates.days = updates.days;
    if (updates.seats !== undefined) fullUpdates.seats = updates.seats;
    if (updates.price !== undefined) fullUpdates.price = updates.price;
    if (updates.priceNote !== undefined) fullUpdates.price_note = updates.priceNote;
    if (updates.authorName !== undefined) fullUpdates.author_name = updates.authorName;
    if (updates.authorPhone !== undefined) fullUpdates.author_phone = updates.authorPhone;
    if (updates.authorLine !== undefined) fullUpdates.author_line = updates.authorLine;
    if (updates.vehicleLabel !== undefined) fullUpdates.vehicle_label = updates.vehicleLabel;
    fullUpdates.detail = encodedDetail;

    if (updates.isVerified !== undefined) fullUpdates.is_verified = updates.isVerified;
    if (updates.category !== undefined) fullUpdates.category = updates.category;
    if (updates.pin !== undefined) fullUpdates.pin = updates.pin;
    if (updates.isClosed !== undefined) fullUpdates.is_closed = updates.isClosed;
    if (updates.isNegotiable !== undefined) fullUpdates.is_negotiable = updates.isNegotiable;
    if (updates.maxQuotes !== undefined) fullUpdates.max_quotes = updates.maxQuotes;
    if (updates.quoteCount !== undefined) fullUpdates.quote_count = updates.quoteCount;
    if (updates.acceptedQuoteId !== undefined) fullUpdates.accepted_quote_id = updates.acceptedQuoteId;
    if (updates.viewToken !== undefined) fullUpdates.view_token = updates.viewToken;
    if (updates.authorWhatsApp !== undefined) fullUpdates.author_whatsapp = updates.authorWhatsApp;
    if (updates.authorWeChat !== undefined) fullUpdates.author_wechat = updates.authorWeChat;

    const filteredUpdates = filterToSupportedBoardColumns(fullUpdates, supported);

    await (supabase.from('board_posts') as unknown as DynamicTableQuery).update(filteredUpdates).eq('id', id);
  } catch (err) {
    console.warn('[TripDee Supabase] Exception updating board post:', err);
  }
  return merged;
}

export async function deleteBoardPost(id: string): Promise<boolean> {
  if (!deletedBoardPostIds.includes(id)) {
    deletedBoardPostIds.push(id);
  }
  const localIdx = localBoardPosts.findIndex((p) => p.id === id);
  if (localIdx >= 0) {
    localBoardPosts.splice(localIdx, 1);
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
 * using either their view token, 4-digit PIN, or the last 4 digits of their phone number.
 */
export async function closeBoardPost(
  id: string,
  inputPin?: string,
  token?: string
): Promise<{ success: boolean; message: string }> {
  const posts = await fetchBoardPosts(undefined, { includeClosed: true });
  const post = posts.find((p) => p.id === id);
  if (!post) {
    return { success: false, message: 'ไม่พบประกาศที่ต้องการปิด หรือประกาศหมดอายุแล้ว' };
  }

  const cleanToken = (token || '').trim();
  const isTokenMatch = Boolean(
    cleanToken && post.viewToken && cleanToken === post.viewToken
  );

  if (!isTokenMatch) {
    const cleanInput = (inputPin || '').trim();
    const cleanPhone = (post.authorPhone || '').replace(/\D/g, '');
    const phoneLast4 = cleanPhone.slice(-4);
    const correctPin = (post.pin || '').trim();

    const isMatch = (correctPin && cleanInput === correctPin) || (phoneLast4 && cleanInput === phoneLast4);

    if (!isMatch) {
      return { success: false, message: 'รหัส PIN หรือลิงก์การเข้าถึงไม่ถูกต้อง' };
    }
  }

  await updateBoardPost(id, { isClosed: true });

  return { success: true, message: 'ปิดประกาศเรียบร้อยแล้ว ขอบคุณที่ใช้บริการ TripDee' };
}

/**
 * Fetch quotes for a specific post.
 * Author verification: if post has a PIN, author must provide PIN or last 4 digits of phone.
 */
export async function fetchBoardQuotes(
  postId: string,
  inputPin?: string,
  token?: string
): Promise<{
  success: boolean;
  quotes?: BoardQuote[];
  message?: string;
  authorContact?: {
    phone: string;
    line: string;
    whatsapp?: string;
    wechat?: string;
  };
}> {
  const posts = await fetchBoardPosts(undefined, { includeClosed: true });
  const post = posts.find((p) => p.id === postId);
  if (!post) {
    return { success: false, message: 'ไม่พบประกาศที่ระบุ' };
  }

  const cleanToken = (token || '').trim();
  const isTokenMatch = Boolean(
    cleanToken && post.viewToken && cleanToken === post.viewToken
  );

  // Check pin authentication if post has PIN and token is not valid
  if (post.pin && !isTokenMatch) {
    const cleanInput = (inputPin || '').trim();
    const cleanPhone = (post.authorPhone || '').replace(/\D/g, '');
    const phoneLast4 = cleanPhone.slice(-4);
    const correctPin = post.pin.trim();

    const isMatch = (correctPin && cleanInput === correctPin) || (phoneLast4 && cleanInput === phoneLast4);
    if (!isMatch) {
      return { success: false, message: 'รหัส PIN หรือเลข 4 ตัวท้ายของเบอร์โทรศัพท์ไม่ถูกต้อง ไม่สามารถเปิดดูใบเสนอราคาได้' };
    }
  }

  const authorContact = {
    phone: post.authorPhone,
    line: post.authorLine,
    whatsapp: post.authorWhatsApp,
    wechat: post.authorWeChat,
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('board_quotes')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (!error && data && Array.isArray(data) && data.length > 0) {
        return {
          success: true,
          quotes: data.map((r) => ({
            id: String(r.id),
            postId: String(r.post_id),
            driverName: String(r.driver_name),
            driverPhone: String(r.driver_phone),
            driverLine: r.driver_line ? String(r.driver_line) : undefined,
            driverWhatsApp: r.driver_whatsapp ? String(r.driver_whatsapp) : undefined,
            vehicleModel: String(r.vehicle_model),
            price: Number(r.price) || 0,
            priceNote: r.price_note ? String(r.price_note) : undefined,
            message: r.message ? String(r.message) : undefined,
            createdAt: String(r.created_at || new Date().toISOString()),
          })),
          authorContact,
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
    authorContact,
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
  if (post.isClosed || isBoardPostExpired(post)) {
    return { success: false, message: 'ประกาศนี้สิ้นสุดกำหนดวันเดินทางหรือปิดรับงานแล้ว ขอบคุณที่สนใจครับ' };
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
      const quotePayload: Database['public']['Tables']['board_quotes']['Insert'] = {
        id: newQuote.id,
        post_id: newQuote.postId,
        driver_name: newQuote.driverName,
        driver_phone: newQuote.driverPhone,
        driver_line: newQuote.driverLine || null,
        driver_whatsapp: newQuote.driverWhatsApp || null,
        vehicle_model: newQuote.vehicleModel,
        price: newQuote.price,
        price_note: newQuote.priceNote || null,
        message: newQuote.message || null,
      };
      const { error } = await supabase.from('board_quotes').insert(quotePayload);
      if (error) {
        console.warn('[TripDee Supabase] Error inserting board quote:', error.message);
      }
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
  inputPin?: string,
  token?: string
): Promise<{ success: boolean; message: string; selectedQuote?: BoardQuote }> {
  const posts = await fetchBoardPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) {
    return { success: false, message: 'ไม่พบประกาศ' };
  }

  const cleanToken = (token || '').trim();
  const isTokenMatch = Boolean(
    cleanToken && post.viewToken && cleanToken === post.viewToken
  );

  // Verify PIN if token does not match
  if (!isTokenMatch) {
    const cleanInput = (inputPin || '').trim();
    const cleanPhone = (post.authorPhone || '').replace(/\D/g, '');
    const phoneLast4 = cleanPhone.slice(-4);
    const correctPin = (post.pin || '').trim();
    const isMatch = (correctPin && cleanInput === correctPin) || (phoneLast4 && cleanInput === phoneLast4);

    if (!isMatch) {
      return { success: false, message: 'รหัส PIN หรือลิงก์การเข้าถึงไม่ถูกต้อง' };
    }
  }

  let quote = localBoardQuotes.find((q) => q.id === quoteId && q.postId === postId);
  if (!quote) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('board_quotes')
          .select('*')
          .eq('id', quoteId)
          .eq('post_id', postId)
          .single();
        if (data) {
          quote = {
            id: String(data.id),
            postId: String(data.post_id),
            driverName: String(data.driver_name),
            driverPhone: String(data.driver_phone),
            driverLine: data.driver_line ? String(data.driver_line) : undefined,
            driverWhatsApp: data.driver_whatsapp ? String(data.driver_whatsapp) : undefined,
            vehicleModel: String(data.vehicle_model),
            price: Number(data.price) || 0,
            priceNote: data.price_note ? String(data.price_note) : undefined,
            message: data.message ? String(data.message) : undefined,
            createdAt: String(data.created_at || new Date().toISOString()),
          };
        }
      } catch (e) {
        console.warn('[TripDee Supabase] Error looking up quote for acceptance:', e);
      }
    }
  }

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

export async function fetchSponsors(reqUrl?: string): Promise<Sponsor[]> {
  const allowMock = isMockDataEnabled(reqUrl);
  const local = getLocalSponsors();
  const supabase = getSupabase();
  if (!supabase) return allowMock ? local : [];

  try {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return allowMock ? local : [];
    }

    const validRows = allowMock ? data : data.filter((row) => !isMockSponsorId(row.id));

    return validRows.map((row) => ({
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
    return allowMock ? local : [];
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

type AnalyticsRow = Database['public']['Tables']['analytics_events']['Row'];

type AnalyticsMeta = Record<string, unknown>;

const SPONSOR_VARIANTS: readonly SponsorClickVariant[] = [
  'split',
  'strip',
  'card',
  'footer',
  'sidebar',
  'unknown',
];

const CALL_TARGET_TYPES: readonly CallTargetType[] = [
  'vehicle_card',
  'vehicle_detail',
  'driver_fleet',
  'trip_board',
  'sponsor',
  'admin_fleet',
  'driver_job',
  'driver_card',
  'corporate_quote',
];

function analyticsMeta(value: AnalyticsRow['meta']): AnalyticsMeta {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as AnalyticsMeta
    : {};
}

function metaString(meta: AnalyticsMeta, key: string, fallback = ''): string {
  return typeof meta[key] === 'string' ? meta[key] : fallback;
}

function metaBoolean(meta: AnalyticsMeta, key: string, fallback: boolean): boolean {
  return typeof meta[key] === 'boolean' ? meta[key] : fallback;
}

function mapAnalyticsRow(row: AnalyticsRow): AnalyticsEvent | null {
  const meta = analyticsMeta(row.meta);
  const timestamp = new Date(row.timestamp || row.created_at);
  if (Number.isNaN(timestamp.getTime())) return null;

  const id = metaString(meta, 'id', `db-${row.id}`);
  const common = {
    id,
    timestamp: timestamp.toISOString(),
    visitorId: metaString(meta, 'visitorId') || undefined,
    sessionId: metaString(meta, 'sessionId') || undefined,
    isUnique: metaBoolean(meta, 'isUnique', true),
    isSpam: metaBoolean(meta, 'isSpam', false),
  };

  if (row.event_name === 'sponsor_click' && row.sponsor_id) {
    const variant = SPONSOR_VARIANTS.includes(row.channel as SponsorClickVariant)
      ? row.channel as SponsorClickVariant
      : 'unknown';
    const event: SponsorClickEvent = {
      ...common,
      type: 'sponsor_click',
      sponsorId: row.sponsor_id,
      sponsorTitle: metaString(meta, 'sponsorTitle', row.sponsor_id),
      category: metaString(meta, 'category', 'unknown'),
      variant,
      targetUrl: metaString(meta, 'targetUrl'),
    };
    return event;
  }

  if (row.event_name === 'call_click') {
    const targetTypeValue = metaString(meta, 'targetType', row.channel || '');
    if (!CALL_TARGET_TYPES.includes(targetTypeValue as CallTargetType)) return null;
    const targetId = metaString(meta, 'targetId', row.driver_id || '');
    if (!targetId) return null;
    const event: CallClickEvent = {
      ...common,
      type: 'call_click',
      targetType: targetTypeValue as CallTargetType,
      targetId,
      targetTitle: metaString(meta, 'targetTitle', targetId),
      phoneNumber: metaString(meta, 'phoneNumber'),
      driverName: metaString(meta, 'driverName') || undefined,
    };
    return event;
  }

  return null;
}

export async function logAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  recordServerAnalyticsEvent(event);

  const supabase = getSupabase();
  if (!supabase) return;

  const isSponsor = event.type === 'sponsor_click';
  const { error } = await supabase.from('analytics_events').insert({
    event_name: event.type,
    driver_id: isSponsor ? null : event.targetId,
    sponsor_id: isSponsor ? event.sponsorId : null,
    channel: isSponsor ? event.variant : event.targetType,
    route_id: null,
    timestamp: new Date(event.timestamp).toISOString(),
    meta: isSponsor
      ? {
          id: event.id,
          sponsorTitle: event.sponsorTitle,
          category: event.category,
          targetUrl: event.targetUrl,
          visitorId: event.visitorId,
          sessionId: event.sessionId,
          isUnique: event.isUnique ?? true,
          isSpam: event.isSpam ?? false,
        }
      : {
          id: event.id,
          targetId: event.targetId,
          phoneNumber: event.phoneNumber,
          targetTitle: event.targetTitle,
          targetType: event.targetType,
          driverName: event.driverName,
          visitorId: event.visitorId,
          sessionId: event.sessionId,
          isUnique: event.isUnique ?? true,
          isSpam: event.isSpam ?? false,
        },
  });

  if (error) {
    throw new Error(`logAnalyticsEvent failed: ${error.message}`);
  }
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const supabase = getSupabase();
  if (!supabase) return getServerAnalyticsSummary();

  try {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .order('timestamp', { ascending: true });

    if (error) {
      console.warn('[TripDee Supabase] Error fetching analytics, using memory:', error.message);
      return getServerAnalyticsSummary();
    }

    const summary = (data || []).reduce<AnalyticsSummary>((current, row) => {
      const event = mapAnalyticsRow(row);
      return event ? computeUpdatedSummary(current, event) : current;
    }, createEmptySummary());
    return replaceServerAnalyticsSummary(summary);
  } catch (err) {
    console.warn('[TripDee Supabase] Exception fetching analytics, using memory:', err);
    return getServerAnalyticsSummary();
  }
}

export async function resetAnalyticsEvents(): Promise<AnalyticsSummary> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('analytics_events').delete().neq('id', 0);
    if (error) {
      throw new Error(`resetAnalyticsEvents failed: ${error.message}`);
    }
  }
  return resetServerAnalytics();
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

// ==============================================================================
// 8. BOOKINGS & PAYMENTS SERVICE
// ==============================================================================

type BookingRow = Database['public']['Tables']['bookings']['Row'];

function mapBookingRow(row: BookingRow): Booking {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    driverId: row.driver_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerLine: row.customer_line,
    route: row.route,
    travelDate: row.travel_date,
    totalDays: row.total_days,
    totalPrice: Number(row.total_price),
    depositAmount: Number(row.deposit_amount),
    remainingAmount: Number(row.remaining_amount),
    paymentStatus: row.payment_status,
    chillpayTransactionId: row.chillpay_transaction_id,
    chillpayPaymentUrl: row.chillpay_payment_url,
    chillpayQrPayload: row.chillpay_qr_payload,
    isContactUnlocked: row.is_contact_unlocked,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    completedAt: row.completed_at,
  };
}

// In-memory fallback bookings store
const localBookings: Booking[] = [];

export async function createBooking(data: {
  id?: string;
  vehicleId?: string | null;
  driverId?: string | null;
  customerName: string;
  customerPhone: string;
  customerLine?: string | null;
  route: string;
  travelDate: string;
  totalDays?: number;
  totalPrice: number;
  depositAmount: number;
  remainingAmount: number;
  chillpayTransactionId?: string | null;
  chillpayPaymentUrl?: string | null;
  chillpayQrPayload?: string | null;
}): Promise<Booking> {
  const bookingId = data.id || `TD-BK-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const nowIso = new Date().toISOString();
  const newBooking: Booking = {
    id: bookingId,
    vehicleId: data.vehicleId || null,
    driverId: data.driverId || null,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerLine: data.customerLine || null,
    route: data.route,
    travelDate: data.travelDate,
    totalDays: data.totalDays || 1,
    totalPrice: data.totalPrice,
    depositAmount: data.depositAmount,
    remainingAmount: data.remainingAmount,
    paymentStatus: 'pending',
    chillpayTransactionId: data.chillpayTransactionId || null,
    chillpayPaymentUrl: data.chillpayPaymentUrl || null,
    chillpayQrPayload: data.chillpayQrPayload || null,
    isContactUnlocked: false,
    createdAt: nowIso,
    paidAt: null,
  };

  const sb = getSupabase();
  if (sb) {
    try {
      const { data: inserted, error } = await sb
        .from('bookings')
        .insert({
          id: newBooking.id,
          vehicle_id: newBooking.vehicleId,
          driver_id: newBooking.driverId,
          customer_name: newBooking.customerName,
          customer_phone: newBooking.customerPhone,
          customer_line: newBooking.customerLine,
          route: newBooking.route,
          travel_date: newBooking.travelDate,
          total_days: newBooking.totalDays,
          total_price: newBooking.totalPrice,
          deposit_amount: newBooking.depositAmount,
          remaining_amount: newBooking.remainingAmount,
          payment_status: newBooking.paymentStatus,
          chillpay_transaction_id: newBooking.chillpayTransactionId,
          chillpay_payment_url: newBooking.chillpayPaymentUrl,
          chillpay_qr_payload: newBooking.chillpayQrPayload,
          is_contact_unlocked: newBooking.isContactUnlocked,
        })
        .select()
        .single();

      if (!error && inserted) {
        return mapBookingRow(inserted);
      }
      console.warn('[Supabase Bookings Insert Fallback]:', error?.message);
    } catch (err) {
      console.warn('[Supabase Bookings Insert Exception]:', err);
    }
  }

  localBookings.unshift(newBooking);
  return newBooking;
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('bookings')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return mapBookingRow(data);
      }
    } catch (err) {
      console.warn('[Supabase Bookings Fetch Exception]:', err);
    }
  }

  const found = localBookings.find((b) => b.id === id);
  return found || null;
}

export async function updateBookingPayment(
  id: string,
  updates: {
    paymentStatus: 'pending' | 'paid' | 'failed' | 'expired';
    chillpayTransactionId?: string | null;
    isContactUnlocked?: boolean;
    paidAt?: string | null;
    completedAt?: string | null;
  }
): Promise<Booking | null> {
  const sb = getSupabase();
  if (sb) {
    try {
      const updatePayload: Database['public']['Tables']['bookings']['Update'] = {
        payment_status: updates.paymentStatus,
      };
      if (updates.chillpayTransactionId !== undefined) {
        updatePayload.chillpay_transaction_id = updates.chillpayTransactionId;
      }
      if (updates.isContactUnlocked !== undefined) {
        updatePayload.is_contact_unlocked = updates.isContactUnlocked;
      }
      if (updates.paidAt !== undefined) {
        updatePayload.paid_at = updates.paidAt;
      }
      if (updates.completedAt !== undefined) {
        updatePayload.completed_at = updates.completedAt;
      }
      const { data, error } = await sb
        .from('bookings')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .maybeSingle();

      // Calendar Auto-Lock: lock or unlock vehicle.busyDates
      try {
        const currentBooking = await getBookingById(id);
        if (currentBooking?.vehicleId && currentBooking.travelDate) {
          const tripDates = calculateTripDates(currentBooking.travelDate, currentBooking.totalDays || 1);
          if (tripDates.length > 0) {
            const vehicle = await fetchVehicleById(currentBooking.vehicleId);
            if (vehicle) {
              if (updates.paymentStatus === 'paid') {
                const currentBusy = Array.isArray(vehicle.busyDates) ? vehicle.busyDates : [];
                const mergedBusy = Array.from(new Set([...currentBusy, ...tripDates])).sort();
                await updateVehicle(currentBooking.vehicleId, { busyDates: mergedBusy });
                console.info(`[Calendar Auto-Lock]: Locked ${tripDates.length} days for vehicle ${currentBooking.vehicleId}:`, tripDates);
              } else if (updates.paymentStatus === 'failed' || updates.paymentStatus === 'expired') {
                if (Array.isArray(vehicle.busyDates)) {
                  const updatedBusy = vehicle.busyDates.filter((d) => !tripDates.includes(d));
                  await updateVehicle(currentBooking.vehicleId, { busyDates: updatedBusy });
                  console.info(`[Calendar Auto-Unlock]: Unlocked ${tripDates.length} days for vehicle ${currentBooking.vehicleId}`);
                }
              }
            }
          }
        }
      } catch (calErr) {
        console.error('[Calendar Auto-Lock Error]:', calErr);
      }

      if (!error && data) {
        return mapBookingRow(data);
      }
    } catch (err) {
      console.warn('[Supabase Bookings Update Exception]:', err);
    }
  }

  const idx = localBookings.findIndex((b) => b.id === id);
  if (idx !== -1) {
    localBookings[idx] = {
      ...localBookings[idx],
      paymentStatus: updates.paymentStatus,
      ...(updates.chillpayTransactionId !== undefined ? { chillpayTransactionId: updates.chillpayTransactionId } : {}),
      ...(updates.isContactUnlocked !== undefined ? { isContactUnlocked: updates.isContactUnlocked } : {}),
      ...(updates.paidAt !== undefined ? { paidAt: updates.paidAt } : {}),
      ...(updates.completedAt !== undefined ? { completedAt: updates.completedAt } : {}),
    };

    const currentBooking = localBookings[idx];
    if (currentBooking?.vehicleId && currentBooking.travelDate) {
      const tripDates = calculateTripDates(currentBooking.travelDate, currentBooking.totalDays || 1);
      if (tripDates.length > 0) {
        const vehicle = getApprovedVehicles().find((v) => v.id === currentBooking.vehicleId) || VEHICLES.find((v) => v.id === currentBooking.vehicleId);
        if (vehicle) {
          if (updates.paymentStatus === 'paid') {
            const currentBusy = Array.isArray(vehicle.busyDates) ? vehicle.busyDates : [];
            vehicle.busyDates = Array.from(new Set([...currentBusy, ...tripDates])).sort();
          } else if (updates.paymentStatus === 'failed' || updates.paymentStatus === 'expired') {
            if (Array.isArray(vehicle.busyDates)) {
              vehicle.busyDates = vehicle.busyDates.filter((d) => !tripDates.includes(d));
            }
          }
        }
      }
    }

    return localBookings[idx];
  }
  return null;
}

