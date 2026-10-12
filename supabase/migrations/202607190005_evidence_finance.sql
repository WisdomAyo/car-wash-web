-- Private evidence, durable finance requests and server-issued receipts.
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('job-evidence', 'job-evidence', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp']);

create function public.gw_can_upload_evidence(p_name text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.gw_job_assignments a
    join public.gw_bookings b on b.id = a.booking_id
    where a.staff_id = auth.uid()
      and split_part(p_name, '/', 1) = a.staff_id::text
      and split_part(p_name, '/', 2) = a.booking_id::text
      and b.status in ('accepted', 'clocked_in', 'washing', 'ready', 'verdict_given')
  )
$$;
revoke all on function public.gw_can_upload_evidence(text) from public, anon;
grant execute on function public.gw_can_upload_evidence(text) to authenticated;
create policy evidence_insert on storage.objects for insert to authenticated
with check (bucket_id = 'job-evidence' and public.gw_can_upload_evidence(name));
create policy evidence_read on storage.objects for select to authenticated
using (bucket_id = 'job-evidence' and exists (
  select 1 from public.gw_job_photos p
  where p.storage_path = name and public.gw_can_read_job(p.booking_id)
));

create or replace function public.gw_record_job_photo(
  p_booking_id uuid, p_phase text, p_storage_path text
) returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_status text; v_id uuid;
begin
  if not public.gw_is_assigned_staff(p_booking_id) then
    raise exception 'This job is not assigned to you.';
  end if;
  select status into v_status from public.gw_bookings where id = p_booking_id for update;
  if p_phase is null or p_phase not in ('before', 'after')
    or (p_phase = 'before' and v_status not in ('clocked_in', 'washing'))
    or (p_phase = 'after' and v_status not in ('washing', 'ready')) then
    raise exception 'Photo phase is not available for this job.';
  end if;
  if not exists (select 1 from storage.objects
    where bucket_id = 'job-evidence' and name = p_storage_path
      and split_part(name, '/', 1) = auth.uid()::text
      and split_part(name, '/', 2) = p_booking_id::text
      and split_part(name, '/', 3) = p_phase) then
    raise exception 'Upload private evidence before recording this photo.';
  end if;
  insert into public.gw_job_photos (booking_id, staff_id, phase, storage_path)
  values (p_booking_id, auth.uid(), p_phase, p_storage_path)
  returning id into v_id;
  perform public.gw_add_job_event(p_booking_id, p_phase || '_photo_added');
  return v_id;
end;
$$;

create table public.gw_refund_requests (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null unique references public.gw_payments(id),
  requested_by uuid not null references auth.users(id),
  reason text not null check (length(trim(reason)) between 10 and 1000),
  status text not null default 'requested'
    check (status in ('requested', 'processing', 'processed', 'failed')),
  provider_refund_id text unique,
  created_at timestamptz not null default now()
);
alter table public.gw_refund_requests enable row level security;
create policy refunds_read on public.gw_refund_requests for select to authenticated
using (requested_by = auth.uid() or public.gw_has_role('finance') or public.gw_has_role('super_admin'));
revoke all on public.gw_refund_requests from anon, authenticated;
grant select on public.gw_refund_requests to authenticated;

create function public.gw_request_refund(p_payment_id uuid, p_reason text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_payment public.gw_payments; v_id uuid;
begin
  select * into v_payment from public.gw_payments where id = p_payment_id for update;
  if not found or v_payment.status <> 'paid' then raise exception 'A paid payment is required.'; end if;
  if auth.uid() is null or not (v_payment.owner_id = auth.uid()
    or public.gw_has_role('finance') or public.gw_has_role('super_admin')) then
    raise exception 'Payment access is required.';
  end if;
  insert into public.gw_refund_requests (payment_id, requested_by, reason)
  values (p_payment_id, auth.uid(), trim(p_reason))
  on conflict (payment_id) do update set payment_id = excluded.payment_id
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.gw_request_refund(uuid, text) from public, anon;
grant execute on function public.gw_request_refund(uuid, text) to authenticated;

-- Read-only receipts are derived exclusively from reconciled payments.
create function public.gw_receipts()
returns table (receipt_number text, booking_id uuid, service_name text,
  amount_kobo bigint, currency text, paid_at timestamptz, payment_status text)
language sql stable security definer set search_path = ''
as $$
  select p.reference, b.id, b.service_name, p.amount_kobo, p.currency, p.paid_at, p.status
  from public.gw_payments p join public.gw_bookings b on b.id = p.booking_id
  where p.paid_at is not null and (p.owner_id = auth.uid()
    or public.gw_has_role('finance') or public.gw_has_role('super_admin'))
  order by p.paid_at desc
$$;
revoke all on function public.gw_receipts() from public, anon;
grant execute on function public.gw_receipts() to authenticated;

-- Requests are deliberately not active recurring billing mandates.
create table public.gw_subscription_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  service_id text not null references public.gw_services(id),
  washes_per_month integer not null check (washes_per_month between 1 and 12),
  status text not null default 'requested' check (status in ('requested', 'cancelled')),
  created_at timestamptz not null default now()
);
alter table public.gw_subscription_requests enable row level security;
create policy subscriptions_read on public.gw_subscription_requests for select to authenticated
using (owner_id = auth.uid() or public.gw_has_role('finance') or public.gw_has_role('super_admin'));
create policy subscriptions_insert on public.gw_subscription_requests for insert to authenticated
with check (owner_id = auth.uid() and status = 'requested');
revoke all on public.gw_subscription_requests from anon, authenticated;
grant select on public.gw_subscription_requests to authenticated;
grant insert (service_id, washes_per_month) on public.gw_subscription_requests to authenticated;
commit;
