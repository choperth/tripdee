/**
 * LINE Messaging API Job Dispatcher for TripDee Driver Network
 * Sends high-impact Flex Messages to LINE Groups / 1-on-1 Driver Chats with 0 broker markup.
 */

import { formatWhatsAppLink } from './contactUtils';

export interface BoardJobPayload {
  id: string;
  type?: 'request' | 'share' | 'offer';
  title: string;
  date: string;
  days: number;
  seats: number;
  zoneId?: string;
  price: number;
  priceNote?: string;
  authorName: string;
  authorPhone: string;
  authorLine?: string;
  authorWhatsApp?: string;
  authorWeChat?: string;
  vehicleLabel?: string;
  detail?: string;
  category?: 'general' | 'corporate';
  isNegotiable?: boolean;
  maxQuotes?: number;
}

const ZONE_LABELS: Record<string, string> = {
  city: 'ในเมือง / ตัวจังหวัด / สนามบิน',
  midHill: 'ชานเมือง / แหล่งท่องเที่ยวเนินเขา / ชายหาด',
  highHill: 'ดอยสูงชัน / ทางคดเคี้ยว / เส้นทางสมบุกสมบัน',
  crossProvince: 'เดินทางข้ามจังหวัดระยะไกล',
};

/**
 * Builds a clean, professional LINE Flex Message Bubble tailored for drivers.
 */
export function buildJobFlexMessage(post: BoardJobPayload, baseUrl: string) {
  const isCorporate = post.category === 'corporate';
  const isNegotiable = Boolean(post.isNegotiable || post.price <= 0);
  const zoneText = (post.zoneId && ZONE_LABELS[post.zoneId]) || 'เส้นทางท่องเที่ยว';
  const destinationUrl = `${baseUrl}/#tripboard`;

  const headerColor = isCorporate ? '#0B2545' : isNegotiable ? '#D97706' : '#059669';
  const categoryTag = isCorporate ? '🏢 งานองค์กร / สัมมนา' : post.type === 'share' ? '🤝 หาเพื่อนร่วมทาง' : '🚐 ลูกค้าหารถพร้อมคนขับ';
  const priceDisplay = isNegotiable
    ? 'รอคนขับเสนอราคา (รับ 3 เจ้าแรก)'
    : `฿${post.price.toLocaleString()} (${post.priceNote || 'รวมน้ำมันแล้ว'})`;

  return {
    type: 'bubble',
    size: 'mega',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: headerColor,
      paddingTop: '16px',
      paddingBottom: '16px',
      paddingStart: '20px',
      paddingEnd: '20px',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: 'TRIPDEE DRIVER DISPATCH',
              size: 'xxs',
              color: '#FFFFFF',
              weight: 'bold',
              letterSpacing: '1px',
            },
            {
              type: 'text',
              text: '0% คอมมิชชั่น',
              size: 'xxs',
              color: '#FCD34D',
              align: 'end',
              weight: 'bold',
            },
          ],
        },
        {
          type: 'text',
          text: categoryTag,
          size: 'xs',
          color: '#E2E8F0',
          margin: 'xs',
        },
        {
          type: 'text',
          text: post.title,
          size: 'md',
          color: '#FFFFFF',
          weight: 'bold',
          wrap: true,
          margin: 'sm',
        },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      paddingTop: '16px',
      paddingBottom: '12px',
      paddingStart: '20px',
      paddingEnd: '20px',
      contents: [
        // Date & Duration
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'xs',
          contents: [
            {
              type: 'text',
              text: '📅 เดินทาง:',
              size: 'xs',
              color: '#64748B',
              flex: 3,
            },
            {
              type: 'text',
              text: `${post.date || 'ยังไม่กำหนดวัน'} (${post.days || 1} วัน)`,
              size: 'xs',
              color: '#0F172A',
              weight: 'bold',
              flex: 7,
              wrap: true,
            },
          ],
        },
        // Vehicle / Seats
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'sm',
          contents: [
            {
              type: 'text',
              text: '🚐 ประเภทรภ:',
              size: 'xs',
              color: '#64748B',
              flex: 3,
            },
            {
              type: 'text',
              text: post.vehicleLabel || `รถตู้ ${post.seats || 9-10} ที่นั่ง`,
              size: 'xs',
              color: '#0F172A',
              weight: 'bold',
              flex: 7,
              wrap: true,
            },
          ],
        },
        // Zone
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'sm',
          contents: [
            {
              type: 'text',
              text: '📍 โซนปลายทาง:',
              size: 'xs',
              color: '#64748B',
              flex: 3,
            },
            {
              type: 'text',
              text: zoneText,
              size: 'xs',
              color: '#0F172A',
              flex: 7,
              wrap: true,
            },
          ],
        },
        // Budget / Quotation
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'sm',
          contents: [
            {
              type: 'text',
              text: '💰 งบประมาณ:',
              size: 'xs',
              color: '#64748B',
              flex: 3,
            },
            {
              type: 'text',
              text: priceDisplay,
              size: 'xs',
              color: isNegotiable ? '#D97706' : '#059669',
              weight: 'bold',
              flex: 7,
              wrap: true,
            },
          ],
        },
        // Details if provided
        ...(post.detail
          ? [
              {
                type: 'separator',
                margin: 'md',
                color: '#F1F5F9',
              },
              {
                type: 'box',
                layout: 'vertical',
                margin: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '📝 รายละเอียดเพิ่มเติม:',
                    size: 'xxs',
                    color: '#94A3B8',
                    weight: 'bold',
                  },
                  {
                    type: 'text',
                    text: post.detail,
                    size: 'xs',
                    color: '#334155',
                    wrap: true,
                    maxLines: 3,
                  },
                ],
              },
            ]
          : []),
        // Customer Name
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'md',
          contents: [
            {
              type: 'text',
              text: '👤 ผู้ติดต่อ:',
              size: 'xs',
              color: '#64748B',
              flex: 3,
            },
            {
              type: 'text',
              text: post.authorName,
              size: 'xs',
              color: '#0F172A',
              weight: 'bold',
              flex: 7,
            },
          ],
        },
        ...(post.authorWhatsApp
          ? [
              {
                type: 'box',
                layout: 'horizontal',
                margin: 'md',
                contents: [
                  {
                    type: 'text',
                    text: '💬 WhatsApp:',
                    size: 'xs',
                    color: '#64748B',
                    flex: 3,
                  },
                  {
                    type: 'text',
                    text: post.authorWhatsApp,
                    size: 'xs',
                    color: '#16A34A',
                    weight: 'bold',
                    flex: 7,
                  },
                ],
              },
            ]
          : []),
        ...(post.authorWeChat
          ? [
              {
                type: 'box',
                layout: 'horizontal',
                margin: 'md',
                contents: [
                  {
                    type: 'text',
                    text: '💬 WeChat ID:',
                    size: 'xs',
                    color: '#64748B',
                    flex: 3,
                  },
                  {
                    type: 'text',
                    text: post.authorWeChat,
                    size: 'xs',
                    color: '#059669',
                    weight: 'bold',
                    flex: 7,
                  },
                ],
              },
            ]
          : []),
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      paddingTop: '8px',
      paddingBottom: '16px',
      paddingStart: '20px',
      paddingEnd: '20px',
      contents: [
        {
          type: 'button',
          style: 'primary',
          height: 'sm',
          color: '#06C755', // LINE Green
          action: {
            type: 'uri',
            label: isNegotiable ? '⚡ ดูงาน & ยื่นเสนอราคา' : '👀 ดูรายละเอียด & เบอร์ลูกค้า',
            uri: destinationUrl,
          },
        },
        ...(!isNegotiable && (post.authorWhatsApp || post.authorPhone)
          ? [
              ...(post.authorWhatsApp
                ? [
                    {
                      type: 'button',
                      style: 'secondary',
                      height: 'sm',
                      color: '#DCFCE7', // WhatsApp light green
                      action: {
                        type: 'uri',
                        label: '💬 แชต WhatsApp ลูกค้า',
                        uri: formatWhatsAppLink(
                          post.authorWhatsApp,
                          `Hello ${post.authorName}, I saw your trip request "${post.title}" on TripDee.`
                        ),
                      },
                    },
                  ]
                : []),
              ...(post.authorPhone
                ? [
                    {
                      type: 'button',
                      style: 'secondary',
                      height: 'sm',
                      color: '#F1F5F9',
                      action: {
                        type: 'uri',
                        label: `📞 โทรตรง: ${post.authorPhone}`,
                        uri: `tel:${post.authorPhone}`,
                      },
                    },
                  ]
                : []),
            ]
          : []),
      ],
    },
  };
}

/**
 * Builds a clear text message fallback for environments not supporting Flex messages.
 */
export function buildJobFallbackText(post: BoardJobPayload, baseUrl: string): string {
  const isCorporate = post.category === 'corporate';
  const isNegotiable = Boolean(post.isNegotiable || post.price <= 0);
  const zoneText = (post.zoneId && ZONE_LABELS[post.zoneId]) || 'เส้นทางท่องเที่ยว';
  const priceDisplay = isNegotiable
    ? 'รอเสนอราคา (รับ 3 เจ้าแรก)'
    : `฿${post.price.toLocaleString()} (${post.priceNote || 'รวมน้ำมัน'})`;

  return [
    isCorporate ? '🏢 [งานองค์กร/สัมมนาใหม่ - TripDee]' : '🚐 [มีงานหารถใหม่ - TripDee]',
    `📌 หัวข้อ: ${post.title}`,
    `📅 เดินทาง: ${post.date} (${post.days || 1} วัน)`,
    `📍 โซน: ${zoneText}`,
    `👥 ขนาดรถ: ${post.vehicleLabel || `${post.seats} ที่นั่ง`}`,
    `💰 งบ: ${priceDisplay}`,
    post.detail ? `📝 รายละเอียด: ${post.detail}` : '',
    `👤 ลูกค้า: ${post.authorName}`,
    !isNegotiable && post.authorPhone ? `📞 โทรตรง: ${post.authorPhone}` : '',
    post.authorWhatsApp ? `💬 WhatsApp: ${formatWhatsAppLink(post.authorWhatsApp)}` : '',
    post.authorWeChat ? `💬 WeChat ID: ${post.authorWeChat}` : '',
    `👉 กดดูงานและรับงานได้ที่: ${baseUrl}/#tripboard`,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Sends notification directly to a designated LINE Group or Driver channel.
 */
export async function sendLineBoardJobNotification(post: BoardJobPayload): Promise<{
  success: boolean;
  channel: 'line';
  error?: string;
}> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const targetId = process.env.LINE_DRIVER_GROUP_ID;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tripdee.co';

  if (!token || !targetId) {
    console.debug('[LINE Dispatch] Skipped: LINE_CHANNEL_ACCESS_TOKEN or LINE_DRIVER_GROUP_ID is not configured');
    return { success: false, channel: 'line', error: 'Missing LINE configuration' };
  }

  const flexMessage = buildJobFlexMessage(post, baseUrl);
  const fallbackText = buildJobFallbackText(post, baseUrl);

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: targetId,
        messages: [
          {
            type: 'flex',
            altText: `🚐 [TripDee งานใหม่] ${post.title}`,
            contents: flexMessage,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[LINE Dispatch] Flex push failed, attempting text message fallback:', errText);

      // Fallback: send clean plain text
      const textRes = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: targetId,
          messages: [{ type: 'text', text: fallbackText }],
        }),
      });

      if (!textRes.ok) {
        const textErr = await textRes.text();
        console.error('[LINE Dispatch] Text fallback also failed:', textErr);
        return { success: false, channel: 'line', error: textErr };
      }
    }

    return { success: true, channel: 'line' };
  } catch (err) {
    console.error('[LINE Dispatch Exception]:', err);
    return { success: false, channel: 'line', error: String(err) };
  }
}
