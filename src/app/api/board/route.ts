import { NextRequest, NextResponse } from 'next/server';
import { fetchBoardPosts, saveBoardPost } from '@/lib/supabase/service';
import { ZoneId } from '@/data/mockData';

export async function GET() {
  try {
    const posts = await fetchBoardPosts();
    return NextResponse.json({
      success: true,
      total: posts.length,
      posts,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch board posts', details: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.title || !body.authorName || !body.authorPhone) {
      return NextResponse.json(
        { error: 'กรุณากรอกหัวข้อประกาศ ชื่อผู้ติดต่อ และเบอร์โทรศัพท์' },
        { status: 400 }
      );
    }

    const newPost = await saveBoardPost({
      type: body.type === 'offer' ? 'offer' : 'request',
      title: String(body.title).trim(),
      zoneId: (body.zoneId || 'city') as ZoneId,
      date: String(body.date || '').trim(),
      days: Math.max(1, Number(body.days) || 1),
      seats: Math.max(1, Number(body.seats) || 1),
      price: Math.max(0, Math.round(Number(body.price) || 0)),
      priceNote: body.priceNote ? String(body.priceNote).trim() : undefined,
      authorName: String(body.authorName).trim(),
      authorPhone: String(body.authorPhone).trim(),
      authorLine: String(body.authorLine || '').trim(),
      vehicleLabel: body.vehicleLabel ? String(body.vehicleLabel).trim() : undefined,
      detail: String(body.detail || '').trim(),
      isVerified: Boolean(body.isVerified),
    });

    return NextResponse.json({
      success: true,
      message: 'โพสต์ประกาศลงกระดานเรียบร้อยแล้ว',
      post: newPost,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to save board post', details: String(err) },
      { status: 500 }
    );
  }
}
