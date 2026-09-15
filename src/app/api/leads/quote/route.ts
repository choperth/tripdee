import { NextRequest, NextResponse } from 'next/server';
import { fetchQuotations, saveQuotation, updateQuotation, deleteQuotation } from '@/lib/supabase/service';

export async function GET() {
  const quotations = await fetchQuotations();
  return NextResponse.json({
    success: true,
    total: quotations.length,
    quotations,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

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
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Missing quotation ID' }, { status: 400 });
    }

    const updated = await updateQuotation(String(body.id), body);
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
