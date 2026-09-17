import { NextRequest, NextResponse } from 'next/server';
import { fetchBoardPosts, saveBoardPost, updateBoardPost, deleteBoardPost, closeBoardPost } from '@/lib/supabase/service';
import { sendPushToDrivers } from '@/lib/pushService';
import { ZoneId } from '@/data/mockData';
import { validateHoneypot } from '@/lib/honeypot';

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

    // Check Honeypot spam trap
    const hpResult = validateHoneypot(body);
    if (hpResult.isSpam) {
      console.warn(`[TripBoard Spam Blocked] reason=${hpResult.reason}, title="${body.title}"`);
      // Return simulated success so bots don't adapt
      return NextResponse.json({
        success: true,
        message: 'โพสต์ประกาศลงกระดานเรียบร้อยแล้ว',
        post: {
          id: `b-spm-${Date.now().toString().slice(-6)}`,
          title: String(body.title || ''),
        },
      });
    }

    // Check if user is closing their post
    if (body.action === 'close' && body.id) {
      const pin = body.pin || '';
      const res = await closeBoardPost(String(body.id), String(pin));
      if (!res.success) {
        return NextResponse.json({ error: res.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: res.message });
    }

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
      category: body.category === 'corporate' ? 'corporate' : 'general',
      pin: body.pin ? String(body.pin).trim() : undefined,
    });

    // Trigger Web Push Notification to all subscribed drivers
    try {
      const isCorporate = newPost.category === 'corporate';
      const pushTitle = isCorporate
        ? '🏢 มีงานองค์กร/สัมมนาใหม่! (TripDee)'
        : '🚐 มีงานใหม่ในบอร์ด! (TripDee)';
      const pushBody = `[${newPost.title}] ${newPost.date} งบ ${newPost.price.toLocaleString()} บ. • แตะเพื่อดูเบอร์โทรและรับงาน`;

      sendPushToDrivers({
        title: pushTitle,
        body: pushBody,
        url: '/#trip-board',
        tag: `tripdee-board-${newPost.id}`,
      }).catch((e) => console.error('[Board Push Error]:', e));
    } catch (pushErr) {
      console.error('[Board Push Dispatch Error]:', pushErr);
    }

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

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Missing board post ID' }, { status: 400 });
    }

    const updated = await updateBoardPost(String(body.id), body);
    if (!updated) {
      return NextResponse.json({ error: 'Board post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, post: updated });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to update board post', details: String(err) },
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
      return NextResponse.json({ error: 'Missing board post ID' }, { status: 400 });
    }

    const ok = await deleteBoardPost(String(id));
    return NextResponse.json({ success: ok });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to delete board post', details: String(err) },
      { status: 500 }
    );
  }
}
