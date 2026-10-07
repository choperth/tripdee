import { NextRequest, NextResponse } from 'next/server';
import {
  fetchVehicles,
  fetchVehicleById,
  saveVehicle,
  updateVehicle,
  deleteVehicle,
  reviewVehicle,
  isVehicleOwnershipSupported,
} from '@/lib/supabase/service';
import { Vehicle } from '@/data/mockData';
import {
  verifyAdminAccess,
  unauthorizedAdminResponse,
  getDriverSession,
  unauthorizedDriverResponse,
} from '@/lib/authGuard';

/**
 * Fields a driver is allowed to write on their own vehicle.
 * Deliberately excludes `isVerified` (featured) and anything approval-related:
 * those are administrator decisions.
 */
const DRIVER_EDITABLE_FIELDS = [
  'title',
  'driverName',
  'driverNickname',
  'driverPhone',
  'driverLine',
  'driverWhatsapp',
  'driverWechat',
  'driverKakao',
  'seats',
  'plateType',
  'plateNumber',
  'canIssueTaxInvoice',
  'businessType',
  'location',
  'region',
  'description',
  'images',
  'popularRoutes',
  'amenities',
  'zoneRates',
  'isAvailable',
  'rentalType',
  'transmission',
  'busyDates',
  'rating',
  'reviewCount',
] as const;

/** Pull only driver-editable keys out of an untrusted request body. */
function pickDriverFields(body: Record<string, unknown>): Partial<Vehicle> {
  const out: Record<string, unknown> = {};
  for (const key of DRIVER_EDITABLE_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out as Partial<Vehicle>;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // Admin console view: needs the full fleet including pending submissions.
    if (url.searchParams.get('scope') === 'admin') {
      if (!verifyAdminAccess(req)) {
        return unauthorizedAdminResponse();
      }
      const vehicles = await fetchVehicles(undefined, { includeUnapproved: true });
      return NextResponse.json({
        success: true,
        total: vehicles.length,
        pending: vehicles.filter((v) => v.approvalStatus === 'pending').length,
        vehicles,
      });
    }

    // A signed-in driver's own view: their vehicle even while still pending.
    const session = await getDriverSession(req);
    if (session?.role === 'driver' && url.searchParams.get('scope') === 'mine') {
      const owned = await fetchVehicles(undefined, {
        includeUnapproved: true,
        ownerId: session.userId,
      });
      return NextResponse.json({
        success: true,
        total: owned.length,
        vehicles: owned,
      });
    }

    // Single vehicle lookup, used by the driver's portal to hydrate the form.
    const singleId = url.searchParams.get('id');
    if (singleId) {
      const vehicle = await fetchVehicleById(singleId);
      const isAdmin = verifyAdminAccess(req);
      const isOwner = Boolean(
        session && vehicle?.ownerId && vehicle.ownerId === session.userId
      );
      if (!vehicle) {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      }
      if (!isAdmin && !isOwner && vehicle.approvalStatus !== 'approved') {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, vehicle });
    }

    const referer = req.headers.get('referer') || undefined;
    const targetUrl = url.search ? req.url : (referer || req.url);
    const vehicles = await fetchVehicles(targetUrl);
    return NextResponse.json({
      success: true,
      total: vehicles.length,
      vehicles,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch vehicles', details: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const isAdmin = verifyAdminAccess(req);

    if (!body.title || !body.driverName || !body.driverPhone) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อรถ ชื่อคนขับ และเบอร์โทรศัพท์' },
        { status: 400 }
      );
    }

    const session = await getDriverSession(req);
    const isDriverSelfService = !isAdmin && session?.role === 'driver';

    if (!isAdmin && !isDriverSelfService) {
      return unauthorizedDriverResponse();
    }

    // Without the ownership columns there is no way to record who owns a
    // vehicle or whether it was reviewed, so a driver submission would be
    // published unreviewed. Fail loudly instead. Administrators are unaffected:
    // they are the approval authority and their writes already assume 'approved'.
    if (isDriverSelfService && !(await isVehicleOwnershipSupported())) {
      return NextResponse.json(
        {
          error:
            'ยังไม่ได้ตั้งค่าระบบอนุมัติรถ กรุณาให้ผู้ดูแลระบบรัน migration 06_vehicle_ownership_and_approval.sql',
        },
        { status: 503 }
      );
    }

    // A driver submitting their own vehicle always lands as pending, regardless
    // of what the request body claims. Admins are the approval authority, so
    // their own creations publish immediately.
    const approvalStatus: Vehicle['approvalStatus'] = isAdmin
      ? body.approvalStatus === 'rejected' || body.approvalStatus === 'pending'
        ? body.approvalStatus
        : 'approved'
      : 'pending';

    const ownerId = isAdmin ? (body.ownerId || undefined) : session!.userId;

    // Reuse an existing vehicle for this owner rather than creating duplicates
    // on every save.
    let newId = typeof body.id === 'string' && body.id ? body.id : '';
    if (!newId && ownerId) {
      const existing = await fetchVehicles(undefined, {
        includeUnapproved: true,
        ownerId,
      });
      newId = existing[0]?.id || '';
    }
    if (!newId) {
      newId = `v-${ownerId || 'custom'}-${Date.now().toString().slice(-6)}`.replace(/[^a-zA-Z0-9_-]/g, '');
    }

    const newVehicleData: Vehicle = {
      id: newId,
      title: String(body.title).trim(),
      type: body.type === 'suv' || body.type === 'car' ? body.type : 'van',
      seats: Number(body.seats) || 9,
      driverName: String(body.driverName).trim(),
      driverNickname: String(body.driverNickname || body.driverName).trim(),
      driverPhone: String(body.driverPhone).trim(),
      driverLine: String(body.driverLine || '').trim(),
      driverWhatsapp: body.driverWhatsapp ? String(body.driverWhatsapp).trim() : undefined,
      driverWechat: body.driverWechat ? String(body.driverWechat).trim() : undefined,
      driverKakao: body.driverKakao ? String(body.driverKakao).trim() : undefined,
      languages: Array.isArray(body.languages) ? body.languages : ['th'],
      rating: Number(body.rating) || 0,
      reviewCount: Number(body.reviewCount) || 0,
      // A driver cannot feature their own vehicle; only an admin sets this.
      isVerified: isAdmin ? Boolean(body.isVerified) : false,
      plateType: body.plateType === 'blue' ? 'blue' : 'yellow',
      plateNumber: body.plateNumber ? String(body.plateNumber).trim() : undefined,
      canIssueTaxInvoice: Boolean(body.canIssueTaxInvoice),
      businessType: body.businessType === 'company' ? 'company' : 'individual',
      isAvailable: body.isAvailable !== false,
      rentalType:
        body.rentalType === 'self_drive'
          ? 'self_drive'
          : body.type === 'van'
            ? 'with_driver'
            : body.rentalType || 'self_drive',
      transmission: body.transmission === 'manual' ? 'manual' : 'auto',
      busyDates: Array.isArray(body.busyDates) ? body.busyDates : undefined,
      images: Array.isArray(body.images) ? body.images.filter(Boolean) : [],
      zoneRates: body.zoneRates || undefined,
      rateNote: body.rateNote ? String(body.rateNote).trim() : undefined,
      location: String(body.location || 'เชียงใหม่และใกล้เคียง').trim(),
      region: body.region || 'north',
      popularRoutes: Array.isArray(body.popularRoutes)
        ? body.popularRoutes.filter(Boolean)
        : [],
      amenities: Array.isArray(body.amenities) ? body.amenities.filter(Boolean) : [],
      description: String(body.description || '').trim(),
      ownerId,
      approvalStatus,
      submittedAt: new Date().toISOString(),
    };

    const saved = await saveVehicle(newVehicleData);
    return NextResponse.json({ success: true, vehicle: saved });
  } catch (err) {
    console.error('[TripDee Vehicles] Failed to create vehicle:', err);
    return NextResponse.json(
      {
        error:
          'บันทึกรถไม่สำเร็จ เนื่องจากฐานข้อมูลปฏิเสธข้อมูลที่ส่งไป กรุณากรอกข้อมูลให้ครบและลองใหม่อีกครั้ง',
        details: String(err),
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const isAdmin = verifyAdminAccess(req);
  if (!isAdmin) {
    const session = await getDriverSession(req);
    if (session?.role !== 'driver') {
      return unauthorizedAdminResponse();
    }
  }

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Missing vehicle ID' }, { status: 400 });
    }

    // Administrator-only transitions.
    if (body.approvalStatus === 'approved' || body.approvalStatus === 'rejected') {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Only an administrator can approve or reject a vehicle' },
          { status: 403 }
        );
      }
      const reviewed = await reviewVehicle(
        String(body.id),
        body.approvalStatus,
        'admin'
      );
      if (!reviewed) {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, vehicle: reviewed });
    }

    if (isAdmin) {
      const updated = await updateVehicle(String(body.id), body);
      if (!updated) {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, vehicle: updated });
    }

    // Driver path: verify ownership, then write only the allowed fields.
    const session = (await getDriverSession(req))!;
    const existing = await fetchVehicleById(String(body.id));
    if (!existing) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    if (existing.ownerId !== session.userId) {
      return NextResponse.json(
        { error: 'You can only edit your own vehicle' },
        { status: 403 }
      );
    }

    const patches = pickDriverFields(body);
    // Editing an approved vehicle sends it back for review rather than
    // silently changing what customers already see.
    const resendForReview = existing.approvalStatus === 'approved';
    const updated = await updateVehicle(String(body.id), {
      ...patches,
      ...(resendForReview ? { approvalStatus: 'pending', reviewedAt: undefined, reviewedBy: undefined } : {}),
    });
    return NextResponse.json({ success: true, vehicle: updated, resendForReview });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to update vehicle', details: String(err) },
      { status: 500 }
    );
  }
}

export const PATCH = PUT;

export async function DELETE(req: NextRequest) {
  const isAdmin = verifyAdminAccess(req);
  if (!isAdmin) {
    const session = await getDriverSession(req);
    if (session?.role !== 'driver') {
      return unauthorizedAdminResponse();
    }
  }

  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {
        // No json body
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing vehicle ID' }, { status: 400 });
    }

    if (!isAdmin) {
      const session = (await getDriverSession(req))!;
      const existing = await fetchVehicleById(String(id));
      if (!existing) {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      }
      if (existing.ownerId !== session.userId) {
        return NextResponse.json(
          { error: 'You can only delete your own vehicle' },
          { status: 403 }
        );
      }
    }

    const ok = await deleteVehicle(String(id));
    return NextResponse.json({ success: ok });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to delete vehicle', details: String(err) },
      { status: 500 }
    );
  }
}
