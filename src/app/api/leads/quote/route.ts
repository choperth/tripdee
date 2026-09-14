import { NextRequest, NextResponse } from 'next/server';
import { getAllQuotations, addQuotation } from '@/lib/leadsStore';

export async function GET() {
  const quotations = getAllQuotations();
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

    const newLead = addQuotation({
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
