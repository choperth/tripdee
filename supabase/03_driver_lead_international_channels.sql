-- 03_driver_lead_international_channels.sql
-- Adds international direct channels to driver_leads (WhatsApp / WeChat / KakaoTalk)
alter table public.driver_leads
  add column if not exists whatsapp text,
  add column if not exists wechat text,
  add column if not exists kakao text;
