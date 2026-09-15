import { NextRequest, NextResponse } from 'next/server';
import { fetchDriverLeads, saveDriverLead, verifyDriverLead, updateDriverLead, deleteDriverLead } from '@/lib/supabase/service';

export async function GET() {
  const drivers = await fetchDriverLeads();
  return NextResponse.json({
    success: true,
    total: drivers.length,
    drivers,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'approve' && body.id) {
      const ok = await verifyDriverLead(String(body.id));
      return NextResponse.json({ success: ok });
    }

    if (!body.nickname || !body.phone) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อ/ชื่อเล่น และเบอร์โทรศัพท์ติดต่อ' },
        { status: 400 }
      );
    }

    const newDriver = await saveDriverLead({
      driverName: String(body.driverName || body.nickname).trim(),
      nickname: String(body.nickname).trim(),
      phone: String(body.phone).trim(),
      lineId: String(body.lineId || '').trim(),
      vehicleModel: String(body.vehicleModel || 'Toyota Commuter').trim(),
      seats: String(body.seats || '9').trim(),
      plateNumber: body.plateNumber ? String(body.plateNumber).trim() : undefined,
      routes: String(body.routes || 'เชียงใหม่และใกล้เคียง').trim(),
    });

    return NextResponse.json({
      success: true,
      message: 'ลงทะเบียนคนขับพาร์ตเนอร์สำเร็จ ข้อมูลเข้าสู่ระบบการตรวจสอบแล้ว',
      lead: newDriver,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลคนขับ', details: String(err) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Missing driver lead ID' }, { status: 400 });
    }

    const updated = await updateDriverLead(String(body.id), body);
    if (!updated) {
      return NextResponse.json({ error: 'Driver lead not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, lead: updated });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to update driver lead', details: String(err) },
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
      return NextResponse.json({ error: 'Missing driver lead ID' }, { status: 400 });
    }

    const ok = await deleteDriverLead(String(id));
    return NextResponse.json({ success: ok });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to delete driver lead', details: String(err) },
      { status: 500 }
    );
  }
}
