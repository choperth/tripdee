import { NextRequest, NextResponse } from 'next/server';
import { fetchVehicles, saveVehicle, updateVehicle, deleteVehicle } from '@/lib/supabase/service';
import { Vehicle } from '@/data/mockData';

export async function GET() {
  try {
    const vehicles = await fetchVehicles();
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
    if (!body.title || !body.driverName || !body.driverPhone) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อรถ ชื่อคนขับ และเบอร์โทรศัพท์' },
        { status: 400 }
      );
    }

    const newId = body.id || `v-custom-${Date.now().toString().slice(-6)}`;
    const vehicleData: Vehicle = {
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
      rating: Number(body.rating) || 5.0,
      reviewCount: Number(body.reviewCount) || 1,
      isVerified: Boolean(body.isVerified ?? true),
      images: Array.isArray(body.images) && body.images.length > 0
        ? body.images
        : ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'],
      zoneRates: body.zoneRates || { city: 1900, midHill: 2100, highHill: 2300, crossProvince: 2700 },
      rateNote: body.rateNote ? String(body.rateNote).trim() : undefined,
      location: String(body.location || 'เชียงใหม่และใกล้เคียง').trim(),
      region: body.region || 'north',
      popularRoutes: Array.isArray(body.popularRoutes) && body.popularRoutes.length > 0
        ? body.popularRoutes
        : ['ตัวเมือง', 'สนามบิน'],
      amenities: Array.isArray(body.amenities) && body.amenities.length > 0
        ? body.amenities
        : ['แอร์เย็นฉ่ำ สภาพรถใหม่สะอาด', 'ตรวจสภาพรถและประวัติคนขับแล้ว 100%'],
      description: String(body.description || '').trim(),
    };

    const saved = await saveVehicle(vehicleData);
    return NextResponse.json({ success: true, vehicle: saved });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to create vehicle', details: String(err) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Missing vehicle ID' }, { status: 400 });
    }

    const updated = await updateVehicle(String(body.id), body);
    if (!updated) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, vehicle: updated });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to update vehicle', details: String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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

    const ok = await deleteVehicle(String(id));
    return NextResponse.json({ success: ok });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to delete vehicle', details: String(err) },
      { status: 500 }
    );
  }
}
