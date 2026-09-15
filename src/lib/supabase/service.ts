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
  updateApprovedVehicle,
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

// In-memory deleted board posts tracking to ensure instant UI sync across all modes
const deletedBoardPostIds: string[] = [];

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

    await (supabase.from('quotations') as any).update(supabaseUpdates).eq('id', id);
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
    if (updates.routes) supabaseUpdates.routes = updates.routes;
    if (updates.status) supabaseUpdates.status = updates.status;

    await (supabase.from('driver_leads') as any).update(supabaseUpdates).eq('id', id);
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

    await (supabase.from('vehicles') as any).update(supabaseUpdates).eq('id', id);
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
  if (!supabase) return BOARD_POSTS.filter((p) => !deletedBoardPostIds.includes(p.id));

  try {
    const { data, error } = await supabase
      .from('board_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return BOARD_POSTS.filter((p) => !deletedBoardPostIds.includes(p.id));
    }

    return data
      .filter((row) => !deletedBoardPostIds.includes(row.id))
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
      }));
  } catch (err) {
    console.warn('[TripDee Supabase] Error fetching board posts, using mock data:', err);
    return BOARD_POSTS.filter((p) => !deletedBoardPostIds.includes(p.id));
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

    await (supabase.from('board_posts') as any).update(supabaseUpdates).eq('id', id);
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

    await (supabase.from('sponsors') as any).update(supabaseUpdates).eq('id', id);
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
