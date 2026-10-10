import { NextRequest, NextResponse } from 'next/server';
import { fetchQuotations, saveQuotation, updateQuotation, deleteQuotation } from '@/lib/supabase/service';
import type { QuotationLead } from '@/lib/leadsStore';
import {
  clampCarCount,
  normalizeLeadFeeStatus,
  normalizeOrgType,
  normalizeVehicleTier,
} from '@/lib/b2b';
import { getDriverSession, verifyAdminAccess, unauthorizedAdminResponse } from '@/lib/authGuard';
import { validateHoneypot } from '@/lib/honeypot';

export async function GET(req: NextRequest) {
  // Security (CWE-200 / PDPA): admins see all rows; customers only see rows
  // stamped with their signed server-side identity. Legacy null rows are admin-only.
  const isAdmin = await verifyAdminAccess(req);
  if (isAdmin) {
    const quotations = await fetchQuotations(req.url);
    return NextResponse.json({
      success: true,
      total: quotations.length,
      quotations,
    });
  }

  const session = await getDriverSession(req);
  if (!session || session.role !== 'customer') {
    return unauthorizedAdminResponse('Unauthorized: Customer or admin access required');
  }

  const quotations = await fetchQuotations(req.url, { customerId: session.userId });
  return NextResponse.json({
    success: true,
    total: quotations.length,
    quotations,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check Honeypot spam trap
    const hpResult = validateHoneypot(body);
    if (hpResult.isSpam) {
      console.warn(`[Quotation Lead Spam Blocked] reason=${hpResult.reason}, company="${body.companyName}"`);
      return NextResponse.json({
        success: true,
        message: 'บันทึกคำขอใบเสนอราคาเรียบร้อยแล้ว เจ้าหน้าที่จะติดต่อกลับภายใน 15 นาที',
        lead: {
          id: `qt-spm-${Date.now().toString().slice(-6)}`,
          companyName: String(body.companyName || ''),
        },
      });
    }

    const session = await getDriverSession(req);
    const customerId = session?.role === 'customer' ? session.userId : null;
    if (!body.companyName || !body.phone) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อบริษัท/ผู้ติดต่อ และเบอร์โทรศัพท์' },
        { status: 400 }
      );
    }

    const newLead = await saveQuotation({
      companyName: String(body.companyName).trim(),
      contactName: body.contactName ? String(body.contactName).trim() : undefined,
      phone: String(body.phone).trim(),
      travelDate: String(body.travelDate || 'ยังไม่ระบุวัน').trim(),
      route: String(body.route || 'เชียงใหม่และใกล้เคียง').trim(),
      passengers: String(body.passengers || '10-20').trim(),
      needsTaxInvoice: Boolean(body.needsTaxInvoice ?? true),
      estimatedPrice: Number(body.estimatedPrice) || 3800,
      // B2B Fleet Matching fields
      carCount: clampCarCount(body.carCount),
      vehicleTier: normalizeVehicleTier(body.vehicleTier),
      orgType: normalizeOrgType(body.orgType),
      includeInsurance: body.includeInsurance === undefined ? true : Boolean(body.includeInsurance),
      assignedPartner: body.assignedPartner ? String(body.assignedPartner).trim() : null,
      leadFeeStatus: normalizeLeadFeeStatus(body.leadFeeStatus),
      customerId,
      totalDays: Number.isInteger(Number(body.totalDays)) && Number(body.totalDays) >= 1
        ? Number(body.totalDays)
        : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'บันทึกคำขอใบเสนอราคาเรียบร้อยแล้ว เจ้าหน้าที่จะติดต่อกลับภายใน 15 นาที',
      lead: newLead,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', details: String(err) },
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
      return NextResponse.json({ error: 'Missing quotation ID' }, { status: 400 });
    }

    const updates: Partial<QuotationLead> = {};
    if (body.companyName) updates.companyName = String(body.companyName);
    if (body.contactName !== undefined) {
      updates.contactName = body.contactName ? String(body.contactName) : undefined;
    }
    if (body.phone) updates.phone = String(body.phone);
    if (body.travelDate !== undefined) updates.travelDate = String(body.travelDate);
    if (body.route !== undefined) updates.route = String(body.route);
    if (body.passengers !== undefined) updates.passengers = String(body.passengers);
    if (body.estimatedPrice !== undefined) updates.estimatedPrice = Number(body.estimatedPrice) || 0;
    if (body.needsTaxInvoice !== undefined) updates.needsTaxInvoice = Boolean(body.needsTaxInvoice);
    if (body.status) updates.status = body.status as QuotationLead['status'];
    if (body.carCount !== undefined) updates.carCount = clampCarCount(body.carCount);
    if (body.vehicleTier !== undefined) updates.vehicleTier = normalizeVehicleTier(body.vehicleTier);
    if (body.orgType !== undefined) updates.orgType = normalizeOrgType(body.orgType);
    if (body.leadFeeStatus !== undefined) updates.leadFeeStatus = normalizeLeadFeeStatus(body.leadFeeStatus);
    if (body.includeInsurance !== undefined) updates.includeInsurance = Boolean(body.includeInsurance);
    if (body.assignedPartner !== undefined) {
      updates.assignedPartner = body.assignedPartner ? String(body.assignedPartner).trim() : null;
    }
    if (body.leadFeeAmount !== undefined) updates.leadFeeAmount = Number(body.leadFeeAmount) || 0;
    if (body.totalDays !== undefined) {
      const parsedDays = Number(body.totalDays);
      if (Number.isInteger(parsedDays) && parsedDays >= 1) {
        updates.totalDays = parsedDays;
      }
    }

    const updated = await updateQuotation(String(body.id), updates);
    if (!updated) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, quotation: updated });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to update quotation', details: String(err) },
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
      return NextResponse.json({ error: 'Missing quotation ID' }, { status: 400 });
    }

    const ok = await deleteQuotation(String(id));
    return NextResponse.json({ success: ok });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to delete quotation', details: String(err) },
      { status: 500 }
    );
  }
}
