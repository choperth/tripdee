export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { fetchDriverLeads, saveDriverLead, verifyDriverLead, updateDriverLead, deleteDriverLead } from '@/lib/supabase/service';
import { validateHoneypot } from '@/lib/honeypot';
import { verifyAdminAccess, unauthorizedAdminResponse, getDriverSession } from '@/lib/authGuard';
import { sendDriverNotification, sendTelegramMessage, escapeTg } from '@/lib/notification';

export async function GET(req: NextRequest) {
  // Security (CWE-200 / PDPA): Driver registration list contains driver names, phone numbers, and documents.
  if (!(await verifyAdminAccess(req))) {
    return unauthorizedAdminResponse();
  }

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

    // Check Honeypot spam trap
    const hpResult = validateHoneypot(body);
    if (hpResult.isSpam) {
      console.warn(`[Driver Registration Spam Blocked] reason=${hpResult.reason}, nickname="${body.nickname}"`);
      // Return simulated success
      return NextResponse.json({
        success: true,
        message: 'ลงทะเบียนคนขับพาร์ตเนอร์สำเร็จ ข้อมูลพร้อมเผยแพร่บนระบบเรียบร้อยแล้ว',
        lead: {
          id: `drv-spm-${Date.now().toString().slice(-6)}`,
          nickname: String(body.nickname || ''),
        },
      });
    }

    if (body.action === 'approve' && body.id) {
      if (!(await verifyAdminAccess(req))) {
        return unauthorizedAdminResponse('Unauthorized: Only administrators can approve driver verification');
      }
      const ok = await verifyDriverLead(String(body.id));
      if (ok) {
        sendTelegramMessage(
          `✅ *[TripDee: แอดมินอนุมัติคนขับพาร์ตเนอร์แล้ว]*\n\n` +
          `🆔 *รหัส:* \`${escapeTg(String(body.id))}\`\n` +
          `🎉 รถยนต์ได้รับการอนุมัติและเปิดให้ผู้โดยสารค้นหาได้บนหน้าเว็บแล้ว`
        ).catch((err) => console.error('[Notification Driver Approve Error]:', err));
      }
      return NextResponse.json({ success: ok });
    }

    if (!body.nickname || !body.phone) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อ/ชื่อเล่น และเบอร์โทรศัพท์ติดต่อ' },
        { status: 400 }
      );
    }

    const isAdmin = await verifyAdminAccess(req);
    const session = await getDriverSession(req);
    const ownerId =
      session?.role === 'driver'
        ? session.userId
        : (isAdmin && typeof body.ownerId === 'string' ? body.ownerId.trim() : undefined);

    const newDriver = await saveDriverLead({
      ownerId,
      driverName: String(body.driverName || body.nickname).trim(),
      nickname: String(body.nickname).trim(),
      phone: String(body.phone).trim(),
      lineId: String(body.lineId || '').trim(),
      whatsapp: body.whatsapp ? String(body.whatsapp).trim() : undefined,
      wechat: body.wechat ? String(body.wechat).trim() : undefined,
      kakao: body.kakao ? String(body.kakao).trim() : undefined,
      vehicleModel: String(body.vehicleModel || 'Toyota Commuter').trim(),
      seats: String(body.seats || '9').trim(),
      plateType: body.plateType === 'yellow' ? 'yellow' : 'blue',
      plateNumber: body.plateNumber ? String(body.plateNumber).trim() : undefined,
      canIssueTaxInvoice: Boolean(body.canIssueTaxInvoice),
      businessType: body.businessType === 'company' ? 'company' : 'individual',
      routes: String(body.routes || 'เชียงใหม่และใกล้เคียง').trim(),
      serviceType: body.serviceType === 'self_drive' ? 'self_drive' : body.serviceType === 'with_driver' ? 'with_driver' : undefined,
      depositTerms: body.depositTerms ? String(body.depositTerms).trim() : undefined,
      amenities: body.amenities ? String(body.amenities).trim() : undefined,
      pickupLocation: body.pickupLocation ? String(body.pickupLocation).trim() : undefined,
      pricePerDay:
        Number.isFinite(Number(body.pricePerDay)) && Number(body.pricePerDay) > 0
          ? Number(body.pricePerDay)
          : undefined,
      description: body.description ? String(body.description).trim() : undefined,
      images: Array.isArray(body.images) ? body.images.filter(Boolean).slice(0, 4) : undefined,
    });

    // Dispatch notification to Telegram & Discord
    sendDriverNotification({
      driverName: newDriver.driverName,
      nickname: newDriver.nickname,
      phone: newDriver.phone,
      lineId: newDriver.lineId,
      vehicleModel: newDriver.vehicleModel,
      seats: newDriver.seats,
      zone: newDriver.pickupLocation || newDriver.routes,
      amenities: newDriver.amenities,
    }).catch((err) => console.error('[Notification Driver Error]:', err));

    return NextResponse.json({
      success: true,
      message: 'ลงทะเบียนคนขับพาร์ตเนอร์สำเร็จ ข้อมูลพร้อมเผยแพร่บนระบบเรียบร้อยแล้ว',
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
  if (!(await verifyAdminAccess(req))) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Missing driver lead ID' }, { status: 400 });
    }
    const updated = await updateDriverLead(String(body.id), body);
    if (!updated) {
      return NextResponse.json({ error: 'Driver lead not found' }, { status: 404 });
    }

    // Dispatch Telegram alert for admin driver lead updates
    sendTelegramMessage(
      `✏️ *[TripDee: แอดมินอัปเดตข้อมูลคนขับ]*\n\n` +
      `🆔 *รหัส:* \`${escapeTg(updated.id)}\`\n` +
      `👤 *คนขับ:* ${escapeTg(updated.driverName)} (${escapeTg(updated.nickname)})\n` +
      `📞 *โทร:* [${updated.phone}](tel:${updated.phone})\n` +
      `🚘 *รุ่นรถ:* ${escapeTg(updated.vehicleModel)} (${updated.seats} ที่นั่ง)\n` +
      `📊 *สถานะ:* \`${updated.status}\``
    ).catch((err) => console.error('[Notification Driver Update Error]:', err));

    return NextResponse.json({ success: true, lead: updated });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to update driver lead', details: String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminAccess(req))) {
    return unauthorizedAdminResponse();
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
