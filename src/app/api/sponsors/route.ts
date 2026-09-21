import { NextRequest, NextResponse } from 'next/server';
import { fetchSponsors, saveSponsor, updateSponsor, deleteSponsor } from '@/lib/supabase/service';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const referer = req.headers.get('referer') || undefined;
    const targetUrl = url.search ? req.url : (referer || req.url);
    const sponsors = await fetchSponsors(targetUrl);
    return NextResponse.json({
      success: true,
      total: sponsors.length,
      sponsors,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch sponsors', details: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.title) {
      return NextResponse.json(
        { error: 'กรุณาระบุชื่อโรงแรม/ผู้ประกอบการ' },
        { status: 400 }
      );
    }

    const newSponsor = await saveSponsor({
      title: String(body.title).trim(),
      category: body.category || 'hotel',
      categoryLabel: String(body.categoryLabel || 'ที่พักแนะนำพันธมิตร').trim(),
      tagline: String(body.tagline || '').trim(),
      badgeText: String(body.badgeText || 'สิทธิพิเศษลูกค้า TripDee').trim(),
      image: String(body.image || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80').trim(),
      link: String(body.link || 'https://line.me').trim(),
      discountText: String(body.discountText || 'ส่วนลดพิเศษเมื่อเดินทางกับ TripDee').trim(),
      location: String(body.location || 'เชียงใหม่').trim(),
    });

    return NextResponse.json({
      success: true,
      message: 'เพิ่มสปอนเซอร์เรียบร้อยแล้ว',
      sponsor: newSponsor,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to save sponsor', details: String(err) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Missing sponsor ID' }, { status: 400 });
    }

    const updated = await updateSponsor(String(body.id), body);
    if (!updated) {
      return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, sponsor: updated });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to update sponsor', details: String(err) },
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
      return NextResponse.json({ error: 'Missing sponsor ID' }, { status: 400 });
    }

    const ok = await deleteSponsor(String(id));
    return NextResponse.json({ success: ok });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to delete sponsor', details: String(err) },
      { status: 500 }
    );
  }
}
