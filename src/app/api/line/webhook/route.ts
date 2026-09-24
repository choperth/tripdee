import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface LineEventSource {
  type: 'user' | 'group' | 'room';
  userId?: string;
  groupId?: string;
  roomId?: string;
}

interface LineMessage {
  id: string;
  type: string;
  text?: string;
}

interface LineWebhookEvent {
  type: string;
  mode?: string;
  timestamp: number;
  source: LineEventSource;
  replyToken?: string;
  message?: LineMessage;
}

interface LineWebhookPayload {
  destination?: string;
  events?: LineWebhookEvent[];
}

function verifyLineSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return true;
  const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  return hash === signature;
}

async function replyLineMessage(replyToken: string, text: string, accessToken: string) {
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: 'text', text }],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.warn('[LINE Webhook Reply Error]:', err);
    }
  } catch (err) {
    console.error('[LINE Webhook Reply Exception]:', err);
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'TripDee LINE Webhook Dispatcher',
    description: 'Invite bot to LINE group to discover Group ID for automated driver dispatch.',
  });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-line-signature');
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (channelSecret && signature && !verifyLineSignature(rawBody, signature, channelSecret)) {
      console.warn('[LINE Webhook] Invalid signature rejected');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let payload: LineWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const events = payload.events || [];

    for (const event of events) {
      const replyToken = event.replyToken;
      if (!replyToken || !channelAccessToken) continue;

      // Event 1: Bot joins group/room
      if (event.type === 'join') {
        const groupId = event.source.groupId || event.source.roomId;
        if (groupId) {
          const welcomeMsg =
            `🚐 ยินดีต้อนรับสู่ระบบแจ้งเตือนงาน TripDee Driver Dispatch!\n\n` +
            `📌 LINE Group ID ของกลุ่มนี้คือ:\n${groupId}\n\n` +
            `👉 คัดลอก ID ด้านบนนี้ ไปใส่ใน Environment Variable:\nLINE_DRIVER_GROUP_ID\n\n` +
            `ระบบจะเริ่มกระจายงานหารถจากลูกค้าส่งตรงเข้ากลุ่มนี้แบบอัตโนมัติทันทีครับ`;
          await replyLineMessage(replyToken, welcomeMsg, channelAccessToken);
        }
      }

      // Event 2: Message asking for ID
      if (event.type === 'message' && event.message?.type === 'text') {
        const text = (event.message.text || '').trim().toLowerCase();
        if (
          text === 'id' ||
          text === '#id' ||
          text === '/id' ||
          text === 'groupid' ||
          text === 'group id' ||
          text === 'ไอดี'
        ) {
          if (event.source.type === 'group' && event.source.groupId) {
            const reply =
              `📌 LINE Group ID ของกลุ่มนี้คือ:\n${event.source.groupId}\n\n` +
              `นำไปตั้งค่าที่ LINE_DRIVER_GROUP_ID ในระบบ TripDee เพื่อรับงานลูกค้าทันที`;
            await replyLineMessage(replyToken, reply, channelAccessToken);
          } else if (event.source.userId) {
            const reply =
              `👤 LINE User ID ของคุณคือ:\n${event.source.userId}\n\n` +
              `สำหรับใช้รับการแจ้งเตือนงานส่วนตัว`;
            await replyLineMessage(replyToken, reply, channelAccessToken);
          }
        }
      }
    }

    return NextResponse.json({ success: true, processed: events.length });
  } catch (err) {
    console.error('[LINE Webhook Error]:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: String(err) }, { status: 500 });
  }
}
