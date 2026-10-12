-- Payment initialization and webhook-owned reconciliation.
begin;

alter table public.gw_bookings drop constraint gw_bookings_status_check;
alter table public.gw_bookings add constraint gw_bookings_status_check check (
  status in (
    'pending_review', 'payment_pending', 'paid_pending_assignment',
    'assigned', 'accepted', 'clocked_in', 'washing', 'ready',
    'verdict_given', 'submitted', 'closed', 'disputed', 'unconfirmed',
    'cancelled'
  )
);

create table public.gw_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.gw_bookings(id) on delete restrict,
  owner_id uuid not null references auth.users(id) on delete restrict,
  provider text not null check (provider in ('paystack')),
  reference text not null unique check (reference ~ '^GW-[A-F0-9]{32}$'),
  request_id uuid not null,
  amount_kobo bigint not null check (amount_kobo > 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  status text not null default 'initialized' check (
    status in (
      'initialized', 'pending', 'paid', 'failed', 'cancelled',
      'refunded', 'partially_refunded'
    )
  ),
  authorization_url text,
  access_code text,
  provider_transaction_id text,
  initialized_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, request_id)
);

create table public.gw_payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.gw_payments(id) on delete restrict,
  provider_event_id text not null unique,
  event_type text not null,
  provider_status text,
  amount_kobo bigint,
  payload_hash text not null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);

create index gw_payments_owner on public.gw_payments(owner_id, created_at desc);
create index gw_payments_booking on public.gw_payments(booking_id, created_at desc);
create unique index gw_payments_one_active_per_booking
  on public.gw_payments(booking_id)
  where status in ('initialized', 'pending', 'paid');
create index gw_payment_events_payment on public.gw_payment_events(payment_id, received_at);

alter table public.gw_payments enable row level security;
alter table public.gw_payment_events enable row level security;

create policy payments_read_own on public.gw_payments
  for select to authenticated using (owner_id = auth.uid());
create policy payments_read_finance on public.gw_payments
  for select to authenticated using (
    public.gw_has_role('finance') or public.gw_has_role('super_admin')
  );
create policy payment_events_read_own on public.gw_payment_events
  for select to authenticated using (
    exists (
      select 1 from public.gw_payments payment
      where payment.id = gw_payment_events.payment_id
        and payment.owner_id = auth.uid()
    )
  );
create policy payment_events_read_finance on public.gw_payment_events
  for select to authenticated using (
    public.gw_has_role('finance') or public.gw_has_role('super_admin')
  );

revoke all on public.gw_payments, public.gw_payment_events from anon, authenticated;
grant select on public.gw_payments, public.gw_payment_events to authenticated;

create function public.gw_prepare_payment(p_booking_id uuid, p_request_id uuid)
returns table (
  payment_id uuid,
  reference text,
  amount_kobo bigint,
  currency text,
  authorization_url text
)
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_booking public.gw_bookings;
  v_payment public.gw_payments;
  v_payment_id uuid := gen_random_uuid();
begin
  if v_user is null then raise exception 'Sign in to initialize payment.'; end if;
  if p_request_id is null then raise exception 'A payment request identifier is required.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text || p_request_id::text, 0));

  select * into v_payment from public.gw_payments
    where owner_id = v_user and request_id = p_request_id;
  if found then
    return query select v_payment.id, v_payment.reference, v_payment.amount_kobo,
      v_payment.currency, v_payment.authorization_url;
    return;
  end if;

  select * into v_booking from public.gw_bookings
    where id = p_booking_id and owner_id = v_user for update;
  if not found then raise exception 'Booking is unavailable for this account.'; end if;
  if v_booking.status not in ('pending_review', 'payment_pending') then
    raise exception 'This booking is not awaiting payment.';
  end if;
  if v_booking.scheduled_at <= now() then
    raise exception 'This booking time has passed.';
  end if;

  select * into v_payment from public.gw_payments
    where booking_id = v_booking.id
      and status in ('initialized', 'pending', 'paid')
    order by created_at desc limit 1;
  if found then
    return query select v_payment.id, v_payment.reference, v_payment.amount_kobo,
      v_payment.currency, v_payment.authorization_url;
    return;
  end if;

  insert into public.gw_payments (
    id, booking_id, owner_id, provider, reference, request_id, amount_kobo
  ) values (
    v_payment_id, v_booking.id, v_user, 'paystack',
    'GW-' || upper(replace(v_payment_id::text, '-', '')),
    p_request_id, v_booking.price_kobo
  ) returning * into v_payment;

  update public.gw_bookings set status = 'payment_pending'
    where id = v_booking.id and status = 'pending_review';
  insert into public.gw_booking_events (booking_id, owner_id, event, scheduled_at)
    values (v_booking.id, v_user, 'payment_initialized', v_booking.scheduled_at);

  return query select v_payment.id, v_payment.reference, v_payment.amount_kobo,
    v_payment.currency, v_payment.authorization_url;
end;
$$;

create function public.gw_reconcile_payment(
  p_reference text,
  p_provider_event_id text,
  p_event_type text,
  p_provider_status text,
  p_amount_kobo bigint,
  p_transaction_id text,
  p_paid_at timestamptz,
  p_payload_hash text,
  p_payload jsonb default '{}'::jsonb
) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_payment public.gw_payments;
  v_inserted uuid;
  v_status text;
begin
  if p_reference is null or p_provider_event_id is null or p_payload_hash is null then
    raise exception 'Webhook reconciliation fields are required.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_reference, 0));
  select * into v_payment from public.gw_payments
    where reference = p_reference for update;
  if not found then raise exception 'Unknown payment reference.'; end if;

  insert into public.gw_payment_events (
    payment_id, provider_event_id, event_type, provider_status,
    amount_kobo, payload_hash, payload
  ) values (
    v_payment.id, p_provider_event_id, p_event_type, p_provider_status,
    p_amount_kobo, p_payload_hash, coalesce(p_payload, '{}'::jsonb)
  ) on conflict (provider_event_id) do nothing
  returning id into v_inserted;
  if v_inserted is null then return v_payment.status; end if;

  if p_event_type = 'charge.success' and p_provider_status = 'success' then
    if p_amount_kobo <> v_payment.amount_kobo then
      update public.gw_payments set
        status = 'failed', updated_at = now()
        where id = v_payment.id;
      return 'amount_mismatch';
    end if;
    update public.gw_payments set
      status = 'paid',
      provider_transaction_id = p_transaction_id,
      paid_at = coalesce(p_paid_at, now()),
      updated_at = now()
      where id = v_payment.id and status <> 'paid';
    update public.gw_bookings set status = 'paid_pending_assignment'
      where id = v_payment.booking_id
        and status in ('pending_review', 'payment_pending');
    insert into public.gw_booking_events (booking_id, owner_id, event, scheduled_at)
      select booking.id, booking.owner_id, 'payment_succeeded', booking.scheduled_at
      from public.gw_bookings booking where booking.id = v_payment.booking_id;
    v_status := 'paid';
  elsif p_event_type in ('charge.failed', 'charge.abandoned') then
    update public.gw_payments set status = 'failed', updated_at = now()
      where id = v_payment.id and status <> 'paid';
    v_status := 'failed';
  else
    v_status := v_payment.status;
  end if;
  return v_status;
end;
$$;

-- Mark initialization details only from the service-role Edge Function.
create function public.gw_mark_payment_pending(
  p_payment_id uuid,
  p_authorization_url text,
  p_access_code text
) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if p_authorization_url !~ '^https://' then
    raise exception 'Payment authorization URL must use HTTPS.';
  end if;
  update public.gw_payments set
    status = 'pending',
    authorization_url = p_authorization_url,
    access_code = p_access_code,
    initialized_at = now(),
    updated_at = now()
    where id = p_payment_id and status in ('initialized', 'pending');
  if not found then raise exception 'Payment is unavailable for initialization.'; end if;
end;
$$;

-- Pending provider sessions may be cancelled; paid bookings require a refund flow.
create or replace function public.gw_change_booking(p_booking_id uuid, p_scheduled_at timestamptz)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_booking public.gw_bookings;
begin
  if auth.uid() is null then raise exception 'Sign in to change a booking.'; end if;
  select * into v_booking from public.gw_bookings
    where id = p_booking_id and owner_id = auth.uid() for update;
  if not found then raise exception 'Booking is unavailable for this account.'; end if;
  if v_booking.status not in ('pending_review', 'payment_pending') then
    raise exception 'This booking cannot be changed.';
  end if;
  if v_booking.scheduled_at - make_interval(mins => v_booking.cancellation_minutes) <= now() then
    raise exception 'The change window has closed. Please contact support.';
  end if;
  if p_scheduled_at is not null and (p_scheduled_at < now() + interval '2 hours'
    or p_scheduled_at > now() + interval '90 days') then
    raise exception 'Choose a time between 2 hours and 90 days from now.';
  end if;
  update public.gw_bookings set
    scheduled_at = coalesce(p_scheduled_at, scheduled_at),
    status = case when p_scheduled_at is null then 'cancelled' else status end
    where id = v_booking.id;
  if p_scheduled_at is null then
    update public.gw_payments set status = 'cancelled', updated_at = now()
      where booking_id = v_booking.id and status in ('initialized', 'pending');
  end if;
  insert into public.gw_booking_events (booking_id, owner_id, event, scheduled_at)
    values (v_booking.id, auth.uid(),
      case when p_scheduled_at is null then 'cancelled' else 'rescheduled' end,
      coalesce(p_scheduled_at, v_booking.scheduled_at));
end;
$$;

revoke all on function public.gw_prepare_payment(uuid, uuid) from public, anon;
grant execute on function public.gw_prepare_payment(uuid, uuid) to authenticated;
revoke all on function public.gw_reconcile_payment(
  text, text, text, text, bigint, text, timestamptz, text, jsonb
) from public, anon, authenticated;
grant execute on function public.gw_reconcile_payment(
  text, text, text, text, bigint, text, timestamptz, text, jsonb
) to service_role;
revoke all on function public.gw_mark_payment_pending(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.gw_mark_payment_pending(uuid, text, text)
  to service_role;

commit;
