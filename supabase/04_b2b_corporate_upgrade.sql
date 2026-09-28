-- ==============================================================================
-- TripDee - 04 B2B Corporate & Caravan Quoting Upgrade
-- ระบบ B2B Fleet Matching & Lead Generation
--   * 2 ระดับมาตรฐานรถขบวน: Standard VIP (ป้ายฟ้า) / Strict Compliance 30 (ป้ายเหลือง)
--   * Flat Lead Fee 500 บาท/คัน (ค่าจัดหาพาร์ตเนอร์)
--   * การส่งต่องานให้พาร์ตเนอร์ผ่าน LINE
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. COLUMNS: ข้อมูลคำขอใบเสนอราคาองค์กร ( caravan / fleet )
-- ------------------------------------------------------------------------------
alter table public.quotations
    add column if not exists car_count integer not null default 1,
    add column if not exists vehicle_tier text not null default 'standard_vip',
    add column if not exists org_type text not null default 'corporate',
    add column if not exists include_insurance boolean not null default true,
    add column if not exists assigned_partner text,
    add column if not exists lead_fee_status text not null default 'pending',
    add column if not exists lead_fee_amount numeric not null default 0;

-- ------------------------------------------------------------------------------
-- 2. CHECK CONSTRAINTS (กันค่านอกเหนือจากที่ระบบรองรับ)
-- ------------------------------------------------------------------------------
alter table public.quotations drop constraint if exists quotations_car_count_check;
alter table public.quotations add constraint quotations_car_count_check
    check (car_count >= 1 and car_count <= 50);

alter table public.quotations drop constraint if exists quotations_vehicle_tier_check;
alter table public.quotations add constraint quotations_vehicle_tier_check
    check (vehicle_tier in ('standard_vip', 'strict_compliance_30'));

alter table public.quotations drop constraint if exists quotations_org_type_check;
alter table public.quotations add constraint quotations_org_type_check
    check (org_type in ('corporate', 'government', 'state_enterprise', 'sme'));

alter table public.quotations drop constraint if exists quotations_lead_fee_status_check;
alter table public.quotations add constraint quotations_lead_fee_status_check
    check (lead_fee_status in ('pending', 'collected', 'waived'));

alter table public.quotations drop constraint if exists quotations_lead_fee_amount_check;
alter table public.quotations add constraint quotations_lead_fee_amount_check
    check (lead_fee_amount >= 0);

-- สถานะ 'cancelled' ถูกใช้โดยหน้าแอดมินอยู่แล้ว ให้ฐานข้อมูลยอมรับด้วย
alter table public.quotations drop constraint if exists quotations_status_check;
alter table public.quotations add constraint quotations_status_check
    check (status in ('pending', 'quoted', 'confirmed', 'cancelled'));

-- ------------------------------------------------------------------------------
-- 3. BACKFILL ข้อมูลเดิม (คันรถ = 1 คัน, ค่าแนะนำ = 500 บาท)
-- ------------------------------------------------------------------------------
update public.quotations
   set car_count = 1
 where car_count is null or car_count < 1;

update public.quotations
   set lead_fee_amount = car_count * 500
 where coalesce(lead_fee_amount, 0) = 0;

-- ------------------------------------------------------------------------------
-- 4. TRIGGER: คำนวณ lead_fee_amount = car_count * 500 อัตโนมัติทุกครั้งที่ insert/update
--    (สถานะการเก็บเงินแยกกันใน lead_fee_status)
-- ------------------------------------------------------------------------------
create or replace function public.tripdee_sync_lead_fee()
returns trigger
language plpgsql
as $$
begin
    if new.car_count is null or new.car_count < 1 then
        new.car_count := 1;
    end if;
    new.lead_fee_amount := new.car_count * 500;
    return new;
end;
$$;

drop trigger if exists trg_quotations_sync_lead_fee on public.quotations;
create trigger trg_quotations_sync_lead_fee
    before insert or update of car_count
    on public.quotations
    for each row
    execute function public.tripdee_sync_lead_fee();

-- ------------------------------------------------------------------------------
-- 5. INDEX: ค้นหางานตามพาร์ตเนอร์ / ตามสถานะค่าแนะนำ
-- ------------------------------------------------------------------------------
create index if not exists idx_quotations_assigned_partner
    on public.quotations (assigned_partner);

create index if not exists idx_quotations_lead_fee_status
    on public.quotations (lead_fee_status);

create index if not exists idx_quotations_vehicle_tier
    on public.quotations (vehicle_tier);
