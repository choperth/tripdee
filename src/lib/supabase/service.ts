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
import { Vehicle, BoardPost, VEHICLES, BOARD_POSTS, ZoneId } from '@/data/mockData';
import {
  QuotationLead,
  DriverLead,
  getAllQuotations as getLocalQuotations,
  addQuotation as addLocalQuotation,
  getAllDriverLeads as getLocalDrivers,
  addDriverLead as addLocalDriver,
  approveDriverLead as approveLocalDriver,
  getApprovedVehicles,
  convertLeadToVehicle,
} from '@/lib/leadsStore';
import { AnalyticsEvent } from '@/lib/analytics';
import { recordServerAnalyticsEvent } from '@/lib/serverAnalyticsStore';

// ==============================================================================
// 1. QUOTATION LEADS SERVICE
// ==============================================================================

export async function fetchQuotations(): Promise<QuotationLead[]> {
  const supabase = getSupabase();
  if (!supabase) return getLocalQuotations();

  try {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      // Table might not be migrated yet or empty, return local store
      return getLocalQuotations();
    }

    return data.map((row) => ({
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
    return getLocalQuotations();
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

// ==============================================================================
// 2. DRIVER LEADS SERVICE
// ==============================================================================

export async function fetchDriverLeads(): Promise<DriverLead[]> {
  const supabase = getSupabase();
  if (!supabase) return getLocalDrivers();

  try {
    const { data, error } = await supabase
      .from('driver_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return getLocalDrivers();
    }

    return data.map((row) => ({
      id: row.id,
      driverName: row.driver_name,
      nickname: row.nickname,
      phone: row.phone,
      lineId: row.line_id || '',
      vehicleModel: row.vehicle_model || '',
      seats: row.seats || '',
      plateNumber: row.plate_number || undefined,
      routes: row.routes || '',
      submittedAt: row.created_at,
      status: row.status,
    }));
  } catch (err) {
    console.warn('[TripDee Supabase] Error fetching driver leads, using fallback:', err);
    return getLocalDrivers();
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
  const supabase = getSupabase();
  if (!supabase) {
    const combined = [...localApproved];
    for (const v of VEHICLES) {
      if (!combined.some((c) => c.id === v.id)) {
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
      }));
    }

    // Merge in any locally approved vehicles so they show up immediately
    const combined = [...localApproved];
    for (const v of baseVehicles) {
      if (!combined.some((c) => c.id === v.id)) {
        combined.push(v);
      }
    }
    return combined;
  } catch (err) {
    console.warn('[TripDee Supabase] Error fetching vehicles, using mock data:', err);
    const combined = [...localApproved];
    for (const v of VEHICLES) {
      if (!combined.some((c) => c.id === v.id)) {
        combined.push(v);
      }
    }
    return combined;
  }
}

// ==============================================================================
// 4. BOARD POSTS SERVICE
// ==============================================================================

export async function fetchBoardPosts(): Promise<BoardPost[]> {
  const supabase = getSupabase();
  if (!supabase) return BOARD_POSTS;

  try {
    const { data, error } = await supabase
      .from('board_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return BOARD_POSTS;
    }

    return data.map((row) => ({
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
    }));
  } catch (err) {
    console.warn('[TripDee Supabase] Error fetching board posts, using mock data:', err);
    return BOARD_POSTS;
  }
}

export async function saveBoardPost(post: Omit<BoardPost, 'id' | 'postedAt'>): Promise<BoardPost> {
  const newId = `b-${Date.now().toString().slice(-6)}`;
  const createdPost: BoardPost = {
    ...post,
    id: newId,
    postedAt: 'เมื่อสักครู่',
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
      })
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
      };
    }
  } catch (err) {
    console.warn('[TripDee Supabase] Exception saving board post:', err);
  }

  return createdPost;
}

// ==============================================================================
// 5. ANALYTICS SERVICE
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
