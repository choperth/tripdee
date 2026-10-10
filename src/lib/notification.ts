/**
 * Unified Free Notification Dispatcher
 * Supports Discord Webhook, Telegram Bot, and Google Sheet Webhooks with 0 cost.
 */
import { BoardJobPayload, sendLineBoardJobNotification } from './lineNotification';
import { formatWhatsAppLink } from './contactUtils';
import { Booking } from './supabase/types';
import { fetchVehicleById } from './supabase/service';
import { sendPushToDrivers } from './pushService';
export interface QuotationLeadPayload {
  companyName: string;
  phone: string;
  travelDate?: string;
  passengers?: string;
  needsTaxInvoice?: boolean;
  details?: string;
}

export interface DriverLeadPayload {
  driverName: string;
  nickname: string;
  phone: string;
  lineId: string;
  vehicleModel: string;
  seats: string;
  zone?: string;
  amenities?: string;
}

export async function sendQuotationNotification(lead: QuotationLeadPayload) {
  const results: { channel: string; ok: boolean }[] = [];

  // 1. Discord Webhook
  const discordUrl = process.env.DISCORD_WEBHOOK_URL;
  if (discordUrl) {
    try {
      const res = await fetch(discordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '🔔 **มีลูกค้าองค์กรขอใบเสนอราคาใหม่ (TripDee)**',
          embeds: [
            {
              title: `🏢 ${lead.companyName || 'ไม่ระบุชื่อบริษัท'}`,
              color: 0x0d5c3a,
              fields: [
                { name: '📞 เบอร์โทรศัพท์', value: lead.phone || '-', inline: true },
                { name: '📅 วันที่เดินทาง', value: lead.travelDate || 'ยังไม่กำหนด', inline: true },
                { name: '👥 ผู้โดยสาร', value: `${lead.passengers || '-'} คน`, inline: true },
                {
                  name: '📑 ใบกำกับภาษี',
                  value: lead.needsTaxInvoice ? '✅ ต้องการ (หัก ณ ที่จ่าย 3%)' : '❌ ไม่ต้องการ',
                  inline: true,
                },
                { name: '📝 รายละเอียดงาน', value: lead.details || '-', inline: false },
              ],
              footer: { text: 'TripDee Mobility System • แจ้งเตือนอัตโนมัติ' },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
      results.push({ channel: 'discord', ok: res.ok });
    } catch (e) {
      console.error('[Notification] Discord quote error:', e);
      results.push({ channel: 'discord', ok: false });
    }
  }

  // 2. Telegram Bot
  const tgText =
    `🔔 *มีลูกค้าขอใบเสนอราคาใหม่ (TripDee)*\n\n` +
    `🏢 *บริษัท:* ${escapeTg(lead.companyName || '-')}\n` +
    `📞 *โทร:* [${lead.phone}](tel:${lead.phone})\n` +
    `📅 *วันเดินทาง:* ${escapeTg(lead.travelDate || '-')}\n` +
    `👥 *ผู้โดยสาร:* ${escapeTg(lead.passengers || '-')} คน\n` +
    `📑 *ใบกำกับภาษี:* ${lead.needsTaxInvoice ? 'ต้องการ' : 'ไม่ต้องการ'}\n` +
    `📝 *รายละเอียด:* ${escapeTg(lead.details || '-')}`;
  const tgOk = await sendTelegramMessage(tgText);
  results.push({ channel: 'telegram', ok: tgOk });

  // 3. Google Sheet Webhook
  const sheetUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (sheetUrl) {
    try {
      const res = await fetch(sheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'quotation',
          ...lead,
          createdAt: new Date().toISOString(),
        }),
      });
      results.push({ channel: 'google_sheet', ok: res.ok });
    } catch (e) {
      console.error('[Notification] Google Sheet error:', e);
      results.push({ channel: 'google_sheet', ok: false });
    }
  }

  return results;
}

export async function sendDriverNotification(driver: DriverLeadPayload) {
  const results: { channel: string; ok: boolean }[] = [];

  // 1. Discord Webhook
  const discordUrl = process.env.DISCORD_WEBHOOK_URL;
  if (discordUrl) {
    try {
      const res = await fetch(discordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '🚗 **มีคนขับลงทะเบียนร่วมงานใหม่ (TripDee)**',
          embeds: [
            {
              title: `🚐 ${driver.driverName} (${driver.nickname})`,
              color: 0xd97706,
              fields: [
                { name: '📞 เบอร์โทรศัพท์', value: driver.phone, inline: true },
                { name: '💬 LINE ID', value: driver.lineId || '-', inline: true },
                { name: '🚘 รุ่นรถยนต์', value: driver.vehicleModel, inline: true },
                { name: '💺 จำนวนที่นั่ง', value: `${driver.seats} ที่นั่ง`, inline: true },
                { name: '📍 โซนวิ่งประจำ', value: driver.zone || 'เชียงใหม่', inline: true },
                { name: '✨ อุปกรณ์เสริม', value: driver.amenities || '-', inline: false },
              ],
              footer: { text: 'TripDee Driver Portal • รอตรวจเอกสารใบขับขี่สาธารณะ' },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
      results.push({ channel: 'discord', ok: res.ok });
    } catch (e) {
      console.error('[Notification] Discord driver error:', e);
      results.push({ channel: 'discord', ok: false });
    }
  }

  // 2. Telegram Bot
  const tgText =
    `🚗 *มีคนขับสมัครร่วมงานใหม่ (TripDee)*\n\n` +
    `👤 *คนขับ:* ${escapeTg(driver.driverName)} (${escapeTg(driver.nickname)})\n` +
    `📞 *โทร:* [${driver.phone}](tel:${driver.phone})\n` +
    `💬 *LINE:* ${escapeTg(driver.lineId || '-')}\n` +
    `🚘 *รถยนต์:* ${escapeTg(driver.vehicleModel)} (${driver.seats} ที่นั่ง)\n` +
    `📍 *โซน:* ${escapeTg(driver.zone || 'เชียงใหม่')}\n` +
    `✨ *ออปชัน:* ${escapeTg(driver.amenities || '-')}`;
  const tgOk = await sendTelegramMessage(tgText);
  results.push({ channel: 'telegram', ok: tgOk });

  // 3. Google Sheet Webhook
  const sheetUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (sheetUrl) {
    try {
      const res = await fetch(sheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'driver_register',
          ...driver,
          createdAt: new Date().toISOString(),
        }),
      });
      results.push({ channel: 'google_sheet', ok: res.ok });
    } catch (e) {
      console.error('[Notification] Google Sheet error:', e);
      results.push({ channel: 'google_sheet', ok: false });
    }
  }

  return results;
}

export async function sendBoardJobNotification(post: BoardJobPayload) {
  const results: { channel: string; ok: boolean }[] = [];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tripdeeth.com';
  const isCorporate = post.category === 'corporate';
  const isNegotiable = Boolean(post.isNegotiable || post.price <= 0);
  const priceDisplay = isNegotiable
    ? 'รอคนขับเสนอราคา (รับ 3 เจ้าแรก)'
    : `฿${post.price.toLocaleString()} (${post.priceNote || 'รวมน้ำมัน'})`;

  // 1. Dispatch to LINE Drivers Group (Flex Message)
  try {
    const lineRes = await sendLineBoardJobNotification(post);
    if (lineRes.success) {
      results.push({ channel: 'line', ok: true });
    }
  } catch (err) {
    console.error('[Notification] LINE dispatch error:', err);
    results.push({ channel: 'line', ok: false });
  }

  // 2. Dispatch to Telegram Channel / Bot
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_DRIVER_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChatId) {
    try {
      const text =
        `${isCorporate ? '🏢 *[งานองค์กร/สัมมนาใหม่ - TripDee]*' : '🚐 *[มีงานใหม่ในกระดาน TripDee]*'}\n\n` +
        `📌 *หัวข้อ:* ${escapeTg(post.title)}\n` +
        `📅 *เดินทาง:* ${escapeTg(post.date || 'ไม่ระบุวัน')} (${post.days || 1} วัน)\n` +
        `🚐 *รถที่ต้องการ:* ${escapeTg(post.vehicleLabel || `${post.seats || 9} ที่นั่ง`)}\n` +
        `💰 *งบประมาณ:* ${escapeTg(priceDisplay)}\n` +
        `👤 *ลูกค้า:* ${escapeTg(post.authorName)}\n` +
        (!isNegotiable && post.authorPhone ? `📞 *โทรตรง:* [${post.authorPhone}](tel:${post.authorPhone})\n` : '') +
        (post.authorWhatsApp ? `💬 *WhatsApp:* [แชตทันที](${formatWhatsAppLink(post.authorWhatsApp)})\n` : '') +
        (post.authorWeChat ? `💬 *WeChat:* \`${escapeTg(post.authorWeChat)}\`\n` : '') +
        (post.detail ? `📝 *รายละเอียด:* ${escapeTg(post.detail)}\n` : '') +
        `\n👉 [กดดูงานและเสนอราคาบนเว็บ](${baseUrl}/#tripboard)`;

      const res = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text,
          parse_mode: 'Markdown',
          disable_web_page_preview: false,
        }),
      });
      results.push({ channel: 'telegram', ok: res.ok });
    } catch (e) {
      console.error('[Notification] Telegram job dispatch error:', e);
      results.push({ channel: 'telegram', ok: false });
    }
  }

  // 3. Dispatch to Discord Channel
  const discordUrl = process.env.DISCORD_DRIVER_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  if (discordUrl) {
    try {
      const res = await fetch(discordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: isCorporate
            ? '🏢 **มีงานองค์กร/สัมมนาใหม่ในระบบ (TripDee)**'
            : '🚐 **มีลูกค้าโพสต์หารถใหม่ในกระดาน (TripDee)**',
          embeds: [
            {
              title: post.title,
              url: `${baseUrl}/#tripboard`,
              color: isCorporate ? 0x0b2545 : isNegotiable ? 0xd97706 : 0x059669,
              fields: [
                { name: '📅 วันที่เดินทาง', value: `${post.date || '-'} (${post.days || 1} วัน)`, inline: true },
                { name: '🚐 สเปกรถ', value: post.vehicleLabel || `${post.seats || 9} ที่นั่ง`, inline: true },
                { name: '💰 งบประมาณ', value: priceDisplay, inline: true },
                { name: '👤 ลูกค้า', value: post.authorName || '-', inline: true },
                ...(!isNegotiable && post.authorPhone ? [{ name: '📞 เบอร์โทรตรง', value: post.authorPhone, inline: true }] : []),
                ...(post.authorWhatsApp ? [{ name: '💬 WhatsApp', value: `[เปิดแชต](${formatWhatsAppLink(post.authorWhatsApp)}) (${post.authorWhatsApp})`, inline: true }] : []),
                ...(post.authorWeChat ? [{ name: '💬 WeChat ID', value: post.authorWeChat, inline: true }] : []),
                ...(post.detail ? [{ name: '📝 รายละเอียด', value: post.detail, inline: false }] : []),
              ],
              footer: { text: 'TripDee Driver Dispatch • Real-time Notification' },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
      results.push({ channel: 'discord', ok: res.ok });
    } catch (e) {
      console.error('[Notification] Discord job dispatch error:', e);
      results.push({ channel: 'discord', ok: false });
    }
  }

  return results;
}

export function escapeTg(str: string): string {
  return str.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

/**
 * Sends a Markdown-formatted message to Telegram.
 * Checks TELEGRAM_ADMIN_CHAT_ID -> TELEGRAM_CHAT_ID -> TELEGRAM_DRIVER_CHAT_ID.
 */
export async function sendTelegramMessage(text: string, customChatId?: string): Promise<boolean> {
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId =
    customChatId ||
    process.env.TELEGRAM_ADMIN_CHAT_ID ||
    process.env.TELEGRAM_CHAT_ID ||
    process.env.TELEGRAM_DRIVER_CHAT_ID;

  if (!tgToken || !tgChatId) {
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: tgChatId,
        text,
        parse_mode: 'Markdown',
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('[Notification] Telegram send error:', err);
    return false;
  }
}

export interface VehicleNotificationPayload {
  action: 'registered' | 'approved' | 'rejected' | 'updated' | 'deleted';
  vehicleId: string;
  title: string;
  driverName?: string;
  driverPhone?: string;
  plateNumber?: string;
  source?: 'admin' | 'driver' | 'system';
}

export async function sendVehicleNotification(v: VehicleNotificationPayload): Promise<boolean> {
  const actionEmoji =
    v.action === 'approved' ? '✅' :
    v.action === 'rejected' ? '❌' :
    v.action === 'registered' ? '🚐' :
    v.action === 'deleted' ? '🗑️' : '✏️';

  const actionLabel =
    v.action === 'approved' ? 'อนุมัติรถเรียบร้อย (แสดงบนเว็บแล้ว)' :
    v.action === 'rejected' ? 'ปฏิเสธรถยนต์' :
    v.action === 'registered' ? 'มีรถลงทะเบียนใหม่ในระบบ' :
    v.action === 'deleted' ? 'ลบรถยนต์ออกจากระบบ' : 'อัปเดตข้อมูลรถยนต์';

  const text =
    `${actionEmoji} *[TripDee: ${actionLabel}]*\n\n` +
    `🚘 *รถ:* ${escapeTg(v.title || '-')}\n` +
    `🆔 *รหัส:* \`${escapeTg(v.vehicleId)}\`\n` +
    (v.driverName ? `👤 *คนขับ:* ${escapeTg(v.driverName)}\n` : '') +
    (v.driverPhone ? `📞 *โทร:* [${v.driverPhone}](tel:${v.driverPhone})\n` : '') +
    (v.plateNumber ? `🔢 *ทะเบียน:* ${escapeTg(v.plateNumber)}\n` : '') +
    `🕒 *เวลา:* ${escapeTg(new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }))}\n` +
    `👤 *ดำเนินการโดย:* ${v.source === 'driver' ? 'คนขับ' : v.source === 'admin' ? 'แอดมิน' : 'ระบบ'}`;

  return sendTelegramMessage(text);
}

/**
 * Sends comprehensive direct notifications to Driver, Admin, LINE, and Web Push
 * when a deposit payment is confirmed (via Webhook or Inquiry Fallback).
 */
export async function sendBookingSuccessNotifications(booking: Booking): Promise<void> {
  try {
    const vehicle = booking.vehicleId ? await fetchVehicleById(booking.vehicleId) : null;
    const driverName = vehicle?.driverName || vehicle?.driverNickname || 'คนขับ TripDee';
    const driverPhone = vehicle?.driverPhone || '-';

    // 1. Telegram Dispatch to Admin & Dispatch Channel
    const text =
      `🎉 *[TripDee: มีคิวจองและมัดจำสำเร็จใหม่!]*\n\n` +
      `🆔 *Order No:* \`${escapeTg(booking.id)}\`\n` +
      `👤 *ลูกค้า:* ${escapeTg(booking.customerName)}\n` +
      `📞 *โทร:* [${booking.customerPhone}](tel:${booking.customerPhone})\n` +
      (booking.customerLine ? `💬 *LINE:* ${escapeTg(booking.customerLine)}\n` : '') +
      `📅 *วันเดินทาง:* ${escapeTg(booking.travelDate)} (${booking.totalDays} วัน)\n` +
      `📍 *เส้นทาง:* ${escapeTg(booking.route)}\n` +
      `💰 *มัดจำแล้ว:* ฿${booking.depositAmount.toLocaleString()} บ.\n` +
      `💵 *คงเหลือเก็บหน้างาน:* ฿${booking.remainingAmount.toLocaleString()} บ.\n\n` +
      `🚐 *คนขับเจ้าของรถ:*\n` +
      `👤 *ชื่อ:* ${escapeTg(driverName)}\n` +
      `📞 *โทรตรงคนขับ:* [${driverPhone}](tel:${driverPhone})\n` +
      `🚘 *รถ:* ${escapeTg(vehicle?.title || '-')}\n` +
      (vehicle?.plateNumber ? `🔢 *ทะเบียน:* ${escapeTg(vehicle.plateNumber)}\n` : '') +
      `\n🔔 *โปรดประสานงานคนขับทันทีเพื่อยืนยันเวลานัดหมาย*`;

    await sendTelegramMessage(text);

    // 2. Direct Driver Alert via Web Push
    sendPushToDrivers({
      title: `🎉 มีคิวจองรถสำเร็จ! (${booking.route})`,
      body: `คนขับ: ${driverName} • วันที่ ${booking.travelDate} • มัดจำแล้ว ฿${booking.depositAmount.toLocaleString()} บ.`,
      url: `/booking-confirmation?bookingId=${encodeURIComponent(booking.id)}`,
      tag: `booking-paid-${booking.id}`,
    }).catch((err) => console.error('[Push Booking Error]:', err));

    // 3. Dispatch to LINE Dispatcher
    await sendLineBoardJobNotification({
      id: booking.id,
      type: 'request',
      title: `🎉 รถได้รับคิวจองใหม่! มัดจำ ฿${booking.depositAmount.toLocaleString()} (${booking.route})`,
      date: booking.travelDate,
      days: booking.totalDays,
      seats: vehicle?.seats || 10,
      price: booking.totalPrice,
      priceNote: `มัดจำแล้ว ฿${booking.depositAmount.toLocaleString()} | เหลือจ่ายคนขับ ฿${booking.remainingAmount.toLocaleString()}`,
      authorName: booking.customerName,
      authorPhone: booking.customerPhone,
      authorLine: booking.customerLine || undefined,
      detail: `คนขับ: ${driverName} (${driverPhone}) ทะเบียน: ${vehicle?.plateNumber || '-'} ยืนยันการล็อกคิวรถเรียบร้อย!`,
      category: 'general',
      isNegotiable: false,
    }).catch((lineErr) => console.error('[LINE Booking Dispatch Error]:', lineErr));
  } catch (err) {
    console.error('[sendBookingSuccessNotifications Error]:', err);
  }
}
