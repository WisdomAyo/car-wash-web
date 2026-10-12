-- Customer request MVP. No payment, dispatch or verification success is simulated.
begin;

create table public.gw_services (
  id text primary key,
  name text not null,
  price_kobo bigint not null check (price_kobo > 0),
  cancellation_minutes integer not null default 120 check (cancellation_minutes >= 0),
  active boolean not null default true
);
-- Example quotes only: operations must approve prices/policy before launch.
insert into public.gw_services (id, name, price_kobo) values
  ('essential', 'Essential Wash', 500000),
  ('signature', 'Signature Wash', 850000),
  ('premium', 'Premium Detail', 1800000);

create table public.gw_vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plate text not null check (length(plate) between 4 and 20 and plate ~ '^[A-Za-z0-9 -]+$'),
  normalized_plate text generated always as
    (regexp_replace(upper(plate), '[^A-Z0-9]', '', 'g')) stored,
  make text not null check (length(trim(make)) between 1 and 80),
  model text not null check (length(trim(model)) between 1 and 80),
  colour text not null check (length(trim(colour)) between 1 and 60),
  vehicle_type text not null check (vehicle_type in ('Sedan', 'SUV', 'Truck', 'Sports car', 'Jeep', 'Van')),
  created_at timestamptz not null default now(),
  unique (normalized_plate),
  check (length(normalized_plate) between 4 and 15)
);
create table public.gw_locations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text not null check (length(trim(label)) between 1 and 80),
  address text not null check (length(trim(address)) between 5 and 300),
  city text not null check (length(trim(city)) between 1 and 100),
  state text not null check (state in (
    'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
    'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Federal Capital Territory',
    'Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
    'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
    'Taraba','Yobe','Zamfara'
  )),
  outdoor_confirmed boolean not null default true check (outdoor_confirmed),
  created_at timestamptz not null default now()
);
create table public.gw_bookings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.gw_vehicles(id),
  location_id uuid not null references public.gw_locations(id),
  service_id text not null references public.gw_services(id),
  service_name text not null,
  vehicle_label text not null,
  plate text not null,
  location_label text not null,
  price_kobo bigint not null check (price_kobo > 0),
  cancellation_minutes integer not null check (cancellation_minutes >= 0),
  scheduled_at timestamptz not null,
  status text not null default 'pending_review' check (status in ('pending_review', 'cancelled')),
  request_id uuid not null,
  created_at timestamptz not null default now(),
  unique (owner_id, request_id)
);
create table public.gw_booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.gw_bookings(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  event text not null,
  scheduled_at timestamptz not null,
  created_at timestamptz not null default now()
);
create table public.gw_support_tickets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject text not null check (length(trim(subject)) between 3 and 120),
  message text not null check (length(trim(message)) between 10 and 2000),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.gw_services enable row level security;
alter table public.gw_vehicles enable row level security;
alter table public.gw_locations enable row level security;
alter table public.gw_bookings enable row level security;
alter table public.gw_booking_events enable row level security;
alter table public.gw_support_tickets enable row level security;

create policy services_read on public.gw_services for select to authenticated using (active);
create policy vehicles_read on public.gw_vehicles for select to authenticated using (owner_id = auth.uid());
create policy vehicles_create on public.gw_vehicles for insert to authenticated with check (owner_id = auth.uid());
create policy locations_read on public.gw_locations for select to authenticated using (owner_id = auth.uid());
create policy locations_create on public.gw_locations for insert to authenticated with check (owner_id = auth.uid());
create policy bookings_read on public.gw_bookings for select to authenticated using (owner_id = auth.uid());
create policy events_read on public.gw_booking_events for select to authenticated using (owner_id = auth.uid());
create policy tickets_read on public.gw_support_tickets for select to authenticated using (owner_id = auth.uid());
create policy tickets_create on public.gw_support_tickets for insert to authenticated
  with check (owner_id = auth.uid() and status = 'open');

-- Explicit column grants block clients setting ownership, status, prices or timestamps.
revoke all on public.gw_services, public.gw_vehicles, public.gw_locations,
  public.gw_bookings, public.gw_booking_events, public.gw_support_tickets from anon, authenticated;
grant select on public.gw_services, public.gw_vehicles, public.gw_locations,
  public.gw_bookings, public.gw_booking_events, public.gw_support_tickets to authenticated;
grant insert (plate, make, model, colour, vehicle_type) on public.gw_vehicles to authenticated;
grant insert (label, address, city, state) on public.gw_locations to authenticated;
grant insert (subject, message) on public.gw_support_tickets to authenticated;

create function public.gw_request_booking(
  p_vehicle_id uuid, p_location_id uuid, p_service_id text,
  p_scheduled_at timestamptz, p_request_id uuid
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_vehicle public.gw_vehicles;
  v_location public.gw_locations;
  v_service public.gw_services;
  v_id uuid;
begin
  if v_user is null then raise exception 'Sign in to request a booking.'; end if;
  if p_request_id is null then raise exception 'A request identifier is required.'; end if;
  -- Serialize retries for this user's request, including concurrent submissions.
  perform pg_advisory_xact_lock(hashtextextended(v_user::text || p_request_id::text, 0));
  select id into v_id from public.gw_bookings where owner_id = v_user and request_id = p_request_id;
  if v_id is not null then return v_id; end if;
  if p_scheduled_at is null or p_scheduled_at < now() + interval '2 hours'
    or p_scheduled_at > now() + interval '90 days' then
    raise exception 'Choose a time between 2 hours and 90 days from now.';
  end if;
  select * into v_vehicle from public.gw_vehicles where id = p_vehicle_id and owner_id = v_user;
  if not found then raise exception 'Vehicle is unavailable for this account.'; end if;
  select * into v_location from public.gw_locations where id = p_location_id and owner_id = v_user;
  if not found then raise exception 'Location is unavailable for this account.'; end if;
  select * into v_service from public.gw_services where id = p_service_id and active;
  if not found then raise exception 'Service is unavailable.'; end if;
  insert into public.gw_bookings (
    owner_id, vehicle_id, location_id, service_id, service_name, vehicle_label,
    plate, location_label, price_kobo, cancellation_minutes, scheduled_at, request_id
  ) values (
    v_user, v_vehicle.id, v_location.id, v_service.id, v_service.name,
    v_vehicle.make || ' ' || v_vehicle.model, v_vehicle.plate,
    v_location.label || ' · ' || v_location.address || ', ' || v_location.city || ', ' || v_location.state,
    v_service.price_kobo, v_service.cancellation_minutes, p_scheduled_at, p_request_id
  ) returning id into v_id;
  insert into public.gw_booking_events (booking_id, owner_id, event, scheduled_at)
    values (v_id, v_user, 'requested', p_scheduled_at);
  return v_id;
end;
$$;

-- NULL new time cancels; both operations are locked, owned and policy-window checked.
create function public.gw_change_booking(p_booking_id uuid, p_scheduled_at timestamptz)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_booking public.gw_bookings;
begin
  if auth.uid() is null then raise exception 'Sign in to change a booking.'; end if;
  select * into v_booking from public.gw_bookings
    where id = p_booking_id and owner_id = auth.uid() for update;
  if not found then raise exception 'Booking is unavailable for this account.'; end if;
  if v_booking.status <> 'pending_review' then raise exception 'This booking cannot be changed.'; end if;
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
  insert into public.gw_booking_events (booking_id, owner_id, event, scheduled_at)
    values (v_booking.id, auth.uid(),
      case when p_scheduled_at is null then 'cancelled' else 'rescheduled' end,
      coalesce(p_scheduled_at, v_booking.scheduled_at));
end;
$$;
revoke all on function public.gw_request_booking(uuid, uuid, text, timestamptz, uuid) from public, anon;
revoke all on function public.gw_change_booking(uuid, timestamptz) from public, anon;
grant execute on function public.gw_request_booking(uuid, uuid, text, timestamptz, uuid) to authenticated;
grant execute on function public.gw_change_booking(uuid, timestamptz) to authenticated;
create index gw_bookings_owner_schedule on public.gw_bookings(owner_id, scheduled_at desc);
create index gw_events_owner on public.gw_booking_events(owner_id);
create index gw_tickets_owner on public.gw_support_tickets(owner_id);
create index gw_vehicles_owner on public.gw_vehicles(owner_id);
create index gw_locations_owner on public.gw_locations(owner_id);
commit;
