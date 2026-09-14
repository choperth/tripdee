/**
 * Unified Free Notification Dispatcher
 * Supports Discord Webhook, Telegram Bot, and Google Sheet Webhooks with 0 cost.
 */

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
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChatId) {
    try {
      const text =
        `🔔 *มีลูกค้าขอใบเสนอราคาใหม่ (TripDee)*\n\n` +
        `🏢 *บริษัท:* ${escapeTg(lead.companyName || '-')}\n` +
        `📞 *โทร:* [${lead.phone}](tel:${lead.phone})\n` +
        `📅 *วันเดินทาง:* ${escapeTg(lead.travelDate || '-')}\n` +
        `👥 *ผู้โดยสาร:* ${escapeTg(lead.passengers || '-')} คน\n` +
        `📑 *ใบกำกับภาษี:* ${lead.needsTaxInvoice ? 'ต้องการ' : 'ไม่ต้องการ'}\n` +
        `📝 *รายละเอียด:* ${escapeTg(lead.details || '-')}`;

      const res = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text,
          parse_mode: 'Markdown',
        }),
      });
      results.push({ channel: 'telegram', ok: res.ok });
    } catch (e) {
      console.error('[Notification] Telegram quote error:', e);
      results.push({ channel: 'telegram', ok: false });
    }
  }

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
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChatId) {
    try {
      const text =
        `🚗 *มีคนขับสมัครร่วมงานใหม่ (TripDee)*\n\n` +
        `👤 *คนขับ:* ${escapeTg(driver.driverName)} (${escapeTg(driver.nickname)})\n` +
        `📞 *โทร:* [${driver.phone}](tel:${driver.phone})\n` +
        `💬 *LINE:* ${escapeTg(driver.lineId || '-')}\n` +
        `🚘 *รถยนต์:* ${escapeTg(driver.vehicleModel)} (${driver.seats} ที่นั่ง)\n` +
        `📍 *โซน:* ${escapeTg(driver.zone || 'เชียงใหม่')}\n` +
        `✨ *ออปชัน:* ${escapeTg(driver.amenities || '-')}`;

      const res = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text,
          parse_mode: 'Markdown',
        }),
      });
      results.push({ channel: 'telegram', ok: res.ok });
    } catch (e) {
      console.error('[Notification] Telegram driver error:', e);
      results.push({ channel: 'telegram', ok: false });
    }
  }

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

function escapeTg(str: string): string {
  return str.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}
