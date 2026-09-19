import { NextRequest, NextResponse } from 'next/server';
import {
  fetchBoardPosts,
  saveBoardPost,
  updateBoardPost,
  deleteBoardPost,
  closeBoardPost,
  fetchBoardQuotes,
  saveBoardQuote,
  acceptBoardQuote,
} from '@/lib/supabase/service';
import { sendPushToDrivers } from '@/lib/pushService';
import { ZoneId } from '@/data/mockData';
import { validateHoneypot } from '@/lib/honeypot';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // Action: Fetch quotes for a post (requires post PIN or author phone last 4)
    if (action === 'get_quotes') {
      const postId = searchParams.get('postId');
      const pin = searchParams.get('pin') || '';
      if (!postId) {
        return NextResponse.json({ error: 'Missing postId parameter' }, { status: 400 });
      }
      const res = await fetchBoardQuotes(postId, pin);
      if (!res.success) {
        return NextResponse.json({ error: res.message }, { status: 403 });
      }
      return NextResponse.json({
        success: true,
        quotes: res.quotes || [],
        authorContact: res.authorContact,
      });
    }

    const posts = await fetchBoardPosts();
    return NextResponse.json({
      success: true,
      total: posts.length,
      posts,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch board data', details: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Action 1: Submit quote by a driver
    if (body.action === 'submit_quote') {
      if (!body.postId || !body.driverName || !body.driverPhone || !body.vehicleModel) {
        return NextResponse.json(
          { error: 'กรุณากรอกข้อมูลให้ครบถ้วน: ชื่อคนขับ, เบอร์โทร, รุ่นรถ และราคาที่เสนอ' },
          { status: 400 }
        );
      }
      const res = await saveBoardQuote({
        postId: String(body.postId),
        driverName: String(body.driverName).trim(),
        driverPhone: String(body.driverPhone).trim(),
        driverLine: body.driverLine ? String(body.driverLine).trim() : undefined,
        vehicleModel: String(body.vehicleModel).trim(),
        price: Math.max(0, Math.round(Number(body.price) || 0)),
        priceNote: body.priceNote ? String(body.priceNote).trim() : undefined,
        message: body.message ? String(body.message).trim() : undefined,
      });

      if (!res.success) {
        return NextResponse.json({ error: res.message }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: res.message,
        quote: res.quote,
        remainingQuota: res.remainingQuota,
      });
    }

    // Action 2: Customer accepts a quote
    if (body.action === 'accept_quote') {
      if (!body.postId || !body.quoteId || !body.pin) {
        return NextResponse.json(
          { error: 'ข้อมูลไม่ครบถ้วน กรุณาระบุ postId, quoteId และ PIN 4 หลัก' },
          { status: 400 }
        );
      }
      const res = await acceptBoardQuote(String(body.postId), String(body.quoteId), String(body.pin));
      if (!res.success) {
        return NextResponse.json({ error: res.message }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: res.message,
        selectedQuote: res.selectedQuote,
      });
    }

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

    // Action 3: Check if user is closing their post
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

    const isNegotiable = Boolean(body.isNegotiable);

    const newPost = await saveBoardPost({
      type: body.type === 'offer' ? 'offer' : 'request',
      title: String(body.title).trim(),
      zoneId: (body.zoneId || 'city') as ZoneId,
      date: String(body.date || '').trim(),
      days: Math.max(1, Number(body.days) || 1),
      seats: Math.max(1, Number(body.seats) || 1),
      price: isNegotiable ? 0 : Math.max(0, Math.round(Number(body.price) || 0)),
      priceNote: isNegotiable ? (body.priceNote || 'รอคนขับเสนอราคา') : (body.priceNote ? String(body.priceNote).trim() : undefined),
      authorName: String(body.authorName).trim(),
      authorPhone: String(body.authorPhone).trim(),
      authorLine: String(body.authorLine || '').trim(),
      vehicleLabel: body.vehicleLabel ? String(body.vehicleLabel).trim() : undefined,
      detail: String(body.detail || '').trim(),
      isVerified: Boolean(body.isVerified),
      category: body.category === 'corporate' ? 'corporate' : 'general',
      pin: body.pin ? String(body.pin).trim() : undefined,
      isNegotiable,
      maxQuotes: 3,
    });

    // Trigger Web Push Notification to all subscribed drivers
    try {
      const isCorporate = newPost.category === 'corporate';
      const pushTitle = isCorporate
        ? '🏢 มีงานองค์กร/สัมมนาใหม่! (TripDee)'
        : isNegotiable
        ? '🚐 มีงานใหม่ [รอเสนอราคา]! (TripDee)'
        : '🚐 มีงานใหม่ในบอร์ด! (TripDee)';
      const pushBody = isNegotiable
        ? `[${newPost.title}] ${newPost.date} • รอรับใบเสนอราคาด่วน (จำกัด 3 เจ้าแรก)`
        : `[${newPost.title}] ${newPost.date} งบ ${newPost.price.toLocaleString()} บ. • แตะเพื่อดูเบอร์โทรและรับงาน`;

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
