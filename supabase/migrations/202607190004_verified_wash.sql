-- Server-enforced dispatch and Verified Wash transitions.
begin;

alter table public.gw_locations
  add column latitude double precision check (latitude between -90 and 90),
  add column longitude double precision check (longitude between -180 and 180),
  add column geofence_radius_m integer not null default 150
    check (geofence_radius_m between 25 and 1000);

create table public.gw_staff_profiles (
  user_id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null check (length(trim(display_name)) between 2 and 120),
  status text not null default 'inactive'
    check (status in ('inactive', 'available', 'busy', 'suspended')),
  screening_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.gw_job_assignments (
  booking_id uuid primary key references public.gw_bookings(id) on delete restrict,
  staff_id uuid not null references public.gw_staff_profiles(user_id) on delete restrict,
  assigned_by uuid not null references auth.users(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  accepted_at timestamptz
);

create table public.gw_job_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.gw_bookings(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete restrict,
  event text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.gw_gps_points (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.gw_bookings(id) on delete restrict,
  staff_id uuid not null references auth.users(id) on delete restrict,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy_m double precision not null check (accuracy_m > 0 and accuracy_m <= 500),
  captured_at timestamptz not null default now()
);

create table public.gw_plate_scans (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.gw_bookings(id) on delete restrict,
  staff_id uuid not null references auth.users(id) on delete restrict,
  phase text not null check (phase in ('arrival', 'submission')),
  scanned_plate text not null check (length(trim(scanned_plate)) between 4 and 20),
  normalized_plate text not null,
  matched boolean not null,
  source text not null check (source in ('ocr', 'manual')),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  captured_at timestamptz not null default now()
);

create table public.gw_job_photos (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.gw_bookings(id) on delete restrict,
  staff_id uuid not null references auth.users(id) on delete restrict,
  phase text not null check (phase in ('before', 'after')),
  storage_path text not null check (
    length(storage_path) between 8 and 500
    and storage_path not like '%..%'
  ),
  captured_at timestamptz not null default now(),
  unique (booking_id, phase, storage_path)
);

create table public.gw_verdicts (
  booking_id uuid primary key references public.gw_bookings(id) on delete restrict,
  confirmer_id uuid not null references auth.users(id) on delete restrict,
  outcome text not null check (
    outcome in ('satisfied', 'not_pleased', 'untreated')
  ),
  remark text check (remark is null or length(trim(remark)) between 3 and 1000),
  created_at timestamptz not null default now()
);

create table public.gw_job_exceptions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.gw_bookings(id) on delete restrict,
  kind text not null check (
    kind in (
      'plate_mismatch', 'outside_geofence', 'not_pleased',
      'untreated', 'verdict_timeout', 'admin_release'
    )
  ),
  status text not null default 'open' check (status in ('open', 'resolved')),
  details jsonb not null default '{}'::jsonb,
  resolved_by uuid references auth.users(id) on delete restrict,
  resolution_reason text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index gw_assignments_staff on public.gw_job_assignments(staff_id, assigned_at desc);
create index gw_job_events_booking on public.gw_job_events(booking_id, created_at);
create index gw_gps_booking on public.gw_gps_points(booking_id, captured_at);
create index gw_scans_booking on public.gw_plate_scans(booking_id, captured_at);
create index gw_photos_booking on public.gw_job_photos(booking_id, captured_at);
create index gw_exceptions_status on public.gw_job_exceptions(status, created_at);

alter table public.gw_staff_profiles enable row level security;
alter table public.gw_job_assignments enable row level security;
alter table public.gw_job_events enable row level security;
alter table public.gw_gps_points enable row level security;
alter table public.gw_plate_scans enable row level security;
alter table public.gw_job_photos enable row level security;
alter table public.gw_verdicts enable row level security;
alter table public.gw_job_exceptions enable row level security;

create policy bookings_read_operations on public.gw_bookings
  for select to authenticated using (
    public.gw_has_role('dispatcher')
    or public.gw_has_role('support')
    or public.gw_has_role('super_admin')
  );
create policy booking_events_read_operations on public.gw_booking_events
  for select to authenticated using (
    public.gw_has_role('dispatcher')
    or public.gw_has_role('support')
    or public.gw_has_role('super_admin')
  );

create function public.gw_is_assigned_staff(p_booking_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.gw_job_assignments assignment
    where assignment.booking_id = p_booking_id
      and assignment.staff_id = auth.uid()
  )
$$;

create function public.gw_can_read_job(p_booking_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.gw_bookings booking
    where booking.id = p_booking_id and booking.owner_id = auth.uid()
  )
  or public.gw_is_assigned_staff(p_booking_id)
  or public.gw_has_role('dispatcher')
  or public.gw_has_role('support')
  or public.gw_has_role('super_admin')
$$;

create function public.gw_my_assigned_jobs()
returns table (
  booking_id uuid,
  service_name text,
  vehicle_label text,
  plate text,
  scheduled_at timestamptz,
  status text,
  location_label text
)
language sql stable security definer set search_path = ''
as $$
  select
    booking.id,
    booking.service_name,
    booking.vehicle_label,
    booking.plate,
    booking.scheduled_at,
    booking.status,
    case
      when booking.status in (
        'accepted', 'clocked_in', 'washing', 'ready', 'verdict_given', 'submitted'
      ) then booking.location_label
      else null
    end
  from public.gw_job_assignments assignment
  join public.gw_bookings booking on booking.id = assignment.booking_id
  where assignment.staff_id = auth.uid()
  order by booking.scheduled_at
$$;

create policy staff_profiles_read on public.gw_staff_profiles
  for select to authenticated using (
    user_id = auth.uid()
    or public.gw_has_role('dispatcher')
    or public.gw_has_role('super_admin')
  );
create policy assignments_read on public.gw_job_assignments
  for select to authenticated using (public.gw_can_read_job(booking_id));
create policy job_events_read on public.gw_job_events
  for select to authenticated using (public.gw_can_read_job(booking_id));
create policy gps_read on public.gw_gps_points
  for select to authenticated using (public.gw_can_read_job(booking_id));
create policy scans_read on public.gw_plate_scans
  for select to authenticated using (public.gw_can_read_job(booking_id));
create policy photos_read on public.gw_job_photos
  for select to authenticated using (public.gw_can_read_job(booking_id));
create policy verdicts_read on public.gw_verdicts
  for select to authenticated using (public.gw_can_read_job(booking_id));
create policy exceptions_read on public.gw_job_exceptions
  for select to authenticated using (public.gw_can_read_job(booking_id));

revoke all on public.gw_staff_profiles, public.gw_job_assignments,
  public.gw_job_events, public.gw_gps_points, public.gw_plate_scans,
  public.gw_job_photos, public.gw_verdicts, public.gw_job_exceptions
  from anon, authenticated;
grant select on public.gw_staff_profiles, public.gw_job_assignments,
  public.gw_job_events, public.gw_gps_points, public.gw_plate_scans,
  public.gw_job_photos, public.gw_verdicts, public.gw_job_exceptions
  to authenticated;

create function public.gw_normalize_plate(p_plate text)
returns text language sql immutable set search_path = ''
as $$select regexp_replace(upper(coalesce(p_plate, '')), '[^A-Z0-9]', '', 'g')$$;

create function public.gw_distance_m(
  p_latitude_a double precision,
  p_longitude_a double precision,
  p_latitude_b double precision,
  p_longitude_b double precision
) returns double precision
language sql immutable set search_path = ''
as $$
  select sqrt(
    power((p_latitude_a - p_latitude_b) * 111320.0, 2)
    + power(
      (p_longitude_a - p_longitude_b) * 111320.0
      * cos(radians((p_latitude_a + p_latitude_b) / 2.0)),
      2
    )
  )
$$;

create function public.gw_add_job_event(
  p_booking_id uuid, p_event text, p_details jsonb default '{}'::jsonb
) returns void
language sql security definer set search_path = ''
as $$
  insert into public.gw_job_events (booking_id, actor_id, event, details)
  values (p_booking_id, auth.uid(), p_event, coalesce(p_details, '{}'::jsonb))
$$;

create function public.gw_assign_job(p_booking_id uuid, p_staff_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_booking public.gw_bookings;
  v_staff public.gw_staff_profiles;
  v_location public.gw_locations;
begin
  if not (public.gw_has_role('dispatcher') or public.gw_has_role('super_admin')) then
    raise exception 'Dispatcher access is required.';
  end if;
  select * into v_booking from public.gw_bookings
    where id = p_booking_id for update;
  if not found or v_booking.status <> 'paid_pending_assignment' then
    raise exception 'Only paid, unassigned bookings can be assigned.';
  end if;
  select * into v_staff from public.gw_staff_profiles
    where user_id = p_staff_id for update;
  if not found or v_staff.status <> 'available' or not v_staff.screening_verified then
    raise exception 'Staff must be available and fully screened.';
  end if;
  if not exists (
    select 1 from public.gw_memberships
    where user_id = p_staff_id and role = 'washman' and status = 'approved'
  ) then raise exception 'Staff membership is not approved.'; end if;
  select location.* into v_location
    from public.gw_locations location where location.id = v_booking.location_id;
  if v_location.latitude is null or v_location.longitude is null then
    raise exception 'The booking location needs a verified geofence before assignment.';
  end if;
  insert into public.gw_job_assignments (booking_id, staff_id, assigned_by)
    values (v_booking.id, p_staff_id, auth.uid());
  update public.gw_bookings set status = 'assigned' where id = v_booking.id;
  update public.gw_staff_profiles set status = 'busy' where user_id = p_staff_id;
  perform public.gw_add_job_event(
    v_booking.id, 'assigned', jsonb_build_object('staff_id', p_staff_id)
  );
end;
$$;

create function public.gw_staff_accept(p_booking_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.gw_is_assigned_staff(p_booking_id) then
    raise exception 'This job is not assigned to you.';
  end if;
  update public.gw_bookings set status = 'accepted'
    where id = p_booking_id and status = 'assigned';
  if not found then raise exception 'This job cannot be accepted.'; end if;
  update public.gw_job_assignments set accepted_at = now()
    where booking_id = p_booking_id and staff_id = auth.uid();
  perform public.gw_add_job_event(p_booking_id, 'accepted');
end;
$$;

create function public.gw_record_gps_point(
  p_booking_id uuid,
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy_m double precision
) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.gw_is_assigned_staff(p_booking_id) then
    raise exception 'This job is not assigned to you.';
  end if;
  if not exists (
    select 1 from public.gw_bookings where id = p_booking_id
      and status in ('accepted', 'clocked_in', 'washing', 'ready', 'verdict_given', 'submitted')
  ) then raise exception 'GPS tracking is not active for this job.'; end if;
  insert into public.gw_gps_points (
    booking_id, staff_id, latitude, longitude, accuracy_m
  ) values (
    p_booking_id, auth.uid(), p_latitude, p_longitude, p_accuracy_m
  );
end;
$$;

create function public.gw_staff_clock_in(
  p_booking_id uuid,
  p_scanned_plate text,
  p_source text,
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy_m double precision
) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_booking public.gw_bookings;
  v_location public.gw_locations;
  v_normalized text := public.gw_normalize_plate(p_scanned_plate);
  v_matched boolean;
  v_distance double precision;
begin
  if not public.gw_is_assigned_staff(p_booking_id) then
    raise exception 'This job is not assigned to you.';
  end if;
  select * into v_booking from public.gw_bookings
    where id = p_booking_id and status = 'accepted' for update;
  if not found then raise exception 'This job cannot be clocked in.'; end if;
  select * into v_location from public.gw_locations where id = v_booking.location_id;
  v_matched := v_normalized = public.gw_normalize_plate(v_booking.plate);
  v_distance := public.gw_distance_m(
    p_latitude, p_longitude, v_location.latitude, v_location.longitude
  );
  insert into public.gw_gps_points (
    booking_id, staff_id, latitude, longitude, accuracy_m
  ) values (
    p_booking_id, auth.uid(), p_latitude, p_longitude, p_accuracy_m
  );
  insert into public.gw_plate_scans (
    booking_id, staff_id, phase, scanned_plate, normalized_plate, matched,
    source, latitude, longitude
  ) values (
    p_booking_id, auth.uid(), 'arrival', p_scanned_plate, v_normalized, v_matched,
    p_source, p_latitude, p_longitude
  );
  if not v_matched then
    insert into public.gw_job_exceptions (booking_id, kind, details)
      values (p_booking_id, 'plate_mismatch',
        jsonb_build_object('phase', 'arrival'));
    perform public.gw_add_job_event(p_booking_id, 'arrival_plate_mismatch');
    return 'plate_mismatch';
  end if;
  if v_distance > v_location.geofence_radius_m + p_accuracy_m then
    insert into public.gw_job_exceptions (booking_id, kind, details)
      values (p_booking_id, 'outside_geofence',
        jsonb_build_object(
          'distance_m', round(v_distance::numeric, 1),
          'allowed_m', v_location.geofence_radius_m
        ));
    perform public.gw_add_job_event(p_booking_id, 'outside_geofence');
    return 'outside_geofence';
  end if;
  update public.gw_bookings set status = 'clocked_in' where id = p_booking_id;
  perform public.gw_add_job_event(p_booking_id, 'clocked_in');
  return 'clocked_in';
end;
$$;

create function public.gw_record_job_photo(
  p_booking_id uuid, p_phase text, p_storage_path text
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_status text;
  v_id uuid;
begin
  if not public.gw_is_assigned_staff(p_booking_id) then
    raise exception 'This job is not assigned to you.';
  end if;
  select status into v_status from public.gw_bookings where id = p_booking_id;
  if p_phase = 'before' and v_status not in ('clocked_in', 'washing') then
    raise exception 'Before photos require a clocked-in job.';
  elsif p_phase = 'after' and v_status not in ('washing', 'ready') then
    raise exception 'After photos require a wash in progress.';
  elsif p_phase not in ('before', 'after') then
    raise exception 'Photo phase is invalid.';
  end if;
  insert into public.gw_job_photos (booking_id, staff_id, phase, storage_path)
    values (p_booking_id, auth.uid(), p_phase, p_storage_path)
    returning id into v_id;
  perform public.gw_add_job_event(p_booking_id, p_phase || '_photo_added');
  return v_id;
end;
$$;

create function public.gw_start_wash(p_booking_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.gw_is_assigned_staff(p_booking_id) then
    raise exception 'This job is not assigned to you.';
  end if;
  if not exists (
    select 1 from public.gw_job_photos
    where booking_id = p_booking_id and phase = 'before'
  ) then raise exception 'A before photo is required.'; end if;
  update public.gw_bookings set status = 'washing'
    where id = p_booking_id and status = 'clocked_in';
  if not found then raise exception 'This wash cannot be started.'; end if;
  perform public.gw_add_job_event(p_booking_id, 'washing');
end;
$$;

create function public.gw_mark_ready(p_booking_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.gw_is_assigned_staff(p_booking_id) then
    raise exception 'This job is not assigned to you.';
  end if;
  if not exists (
    select 1 from public.gw_job_photos
    where booking_id = p_booking_id and phase = 'after'
  ) then raise exception 'An after photo is required.'; end if;
  update public.gw_bookings set status = 'ready'
    where id = p_booking_id and status = 'washing';
  if not found then raise exception 'This wash cannot be marked ready.'; end if;
  perform public.gw_add_job_event(p_booking_id, 'ready_for_verdict');
end;
$$;

create function public.gw_give_verdict(
  p_booking_id uuid, p_outcome text, p_remark text default null
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_booking public.gw_bookings;
begin
  select * into v_booking from public.gw_bookings
    where id = p_booking_id and owner_id = auth.uid() and status = 'ready'
    for update;
  if not found then raise exception 'This job is not ready for your verdict.'; end if;
  if p_outcome not in ('satisfied', 'not_pleased', 'untreated') then
    raise exception 'Verdict outcome is invalid.';
  end if;
  if p_outcome <> 'satisfied' and length(trim(coalesce(p_remark, ''))) < 3 then
    raise exception 'Please add a short reason for this verdict.';
  end if;
  insert into public.gw_verdicts (booking_id, confirmer_id, outcome, remark)
    values (p_booking_id, auth.uid(), p_outcome, nullif(trim(p_remark), ''));
  if p_outcome = 'untreated' then
    update public.gw_bookings set status = 'disputed' where id = p_booking_id;
    insert into public.gw_job_exceptions (booking_id, kind, details)
      values (p_booking_id, 'untreated', jsonb_build_object('remark', p_remark));
  else
    update public.gw_bookings set status = 'verdict_given' where id = p_booking_id;
    if p_outcome = 'not_pleased' then
      insert into public.gw_job_exceptions (booking_id, kind, details)
        values (p_booking_id, 'not_pleased', jsonb_build_object('remark', p_remark));
    end if;
  end if;
  perform public.gw_add_job_event(
    p_booking_id, 'verdict_given', jsonb_build_object('outcome', p_outcome)
  );
end;
$$;

create function public.gw_staff_submit(
  p_booking_id uuid,
  p_scanned_plate text,
  p_source text,
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy_m double precision
) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_booking public.gw_bookings;
  v_normalized text := public.gw_normalize_plate(p_scanned_plate);
  v_matched boolean;
begin
  if not public.gw_is_assigned_staff(p_booking_id) then
    raise exception 'This job is not assigned to you.';
  end if;
  select * into v_booking from public.gw_bookings
    where id = p_booking_id and status = 'verdict_given' for update;
  if not found then raise exception 'Customer verdict is required before submission.'; end if;
  v_matched := v_normalized = public.gw_normalize_plate(v_booking.plate);
  insert into public.gw_gps_points (
    booking_id, staff_id, latitude, longitude, accuracy_m
  ) values (
    p_booking_id, auth.uid(), p_latitude, p_longitude, p_accuracy_m
  );
  insert into public.gw_plate_scans (
    booking_id, staff_id, phase, scanned_plate, normalized_plate, matched,
    source, latitude, longitude
  ) values (
    p_booking_id, auth.uid(), 'submission', p_scanned_plate, v_normalized,
    v_matched, p_source, p_latitude, p_longitude
  );
  if not v_matched then
    insert into public.gw_job_exceptions (booking_id, kind, details)
      values (p_booking_id, 'plate_mismatch',
        jsonb_build_object('phase', 'submission'));
    perform public.gw_add_job_event(p_booking_id, 'submission_plate_mismatch');
    return 'plate_mismatch';
  end if;
  update public.gw_bookings set status = 'submitted' where id = p_booking_id;
  perform public.gw_add_job_event(p_booking_id, 'submitted');
  return 'submitted';
end;
$$;

create function public.gw_staff_clock_out(p_booking_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.gw_is_assigned_staff(p_booking_id) then
    raise exception 'This job is not assigned to you.';
  end if;
  if (select count(*) from public.gw_gps_points where booking_id = p_booking_id) < 2 then
    raise exception 'A GPS trail is required before clock-out.';
  end if;
  if not exists (
    select 1 from public.gw_plate_scans
    where booking_id = p_booking_id and phase = 'arrival' and matched
  ) or not exists (
    select 1 from public.gw_plate_scans
    where booking_id = p_booking_id and phase = 'submission' and matched
  ) then raise exception 'Two matching plate scans are required.'; end if;
  if not exists (
    select 1 from public.gw_job_photos
    where booking_id = p_booking_id and phase = 'before'
  ) or not exists (
    select 1 from public.gw_job_photos
    where booking_id = p_booking_id and phase = 'after'
  ) then raise exception 'Before and after photos are required.'; end if;
  if not exists (
    select 1 from public.gw_verdicts where booking_id = p_booking_id
  ) then raise exception 'A customer verdict is required.'; end if;
  update public.gw_bookings set status = 'closed'
    where id = p_booking_id and status = 'submitted';
  if not found then raise exception 'This job cannot be clocked out.'; end if;
  update public.gw_staff_profiles set status = 'available'
    where user_id = auth.uid();
  perform public.gw_add_job_event(p_booking_id, 'closed');
end;
$$;

create function public.gw_admin_release_job(p_booking_id uuid, p_reason text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not (public.gw_has_role('dispatcher') or public.gw_has_role('super_admin')) then
    raise exception 'Dispatcher access is required.';
  end if;
  if length(trim(coalesce(p_reason, ''))) < 10 then
    raise exception 'A detailed release reason is required.';
  end if;
  update public.gw_bookings set status = 'unconfirmed'
    where id = p_booking_id and status in ('ready', 'disputed');
  if not found then raise exception 'This job is not eligible for admin release.'; end if;
  update public.gw_job_exceptions set
    status = 'resolved', resolved_by = auth.uid(),
    resolution_reason = trim(p_reason), resolved_at = now()
    where booking_id = p_booking_id and status = 'open';
  insert into public.gw_job_exceptions (
    booking_id, kind, status, details, resolved_by, resolution_reason, resolved_at
  ) values (
    p_booking_id, 'admin_release', 'resolved', '{}'::jsonb,
    auth.uid(), trim(p_reason), now()
  );
  perform public.gw_add_job_event(
    p_booking_id, 'admin_released', jsonb_build_object('reason', trim(p_reason))
  );
end;
$$;

revoke all on function public.gw_is_assigned_staff(uuid) from public, anon;
revoke all on function public.gw_can_read_job(uuid) from public, anon;
revoke all on function public.gw_my_assigned_jobs() from public, anon;
grant execute on function public.gw_is_assigned_staff(uuid) to authenticated;
grant execute on function public.gw_can_read_job(uuid) to authenticated;
grant execute on function public.gw_my_assigned_jobs() to authenticated;
revoke all on function public.gw_normalize_plate(text) from public, anon;
grant execute on function public.gw_normalize_plate(text) to authenticated;
revoke all on function public.gw_distance_m(
  double precision, double precision, double precision, double precision
) from public, anon;
grant execute on function public.gw_distance_m(
  double precision, double precision, double precision, double precision
) to authenticated;
revoke all on function public.gw_add_job_event(uuid, text, jsonb)
  from public, anon, authenticated;

revoke all on function public.gw_assign_job(uuid, uuid) from public, anon;
revoke all on function public.gw_admin_release_job(uuid, text) from public, anon;
grant execute on function public.gw_assign_job(uuid, uuid) to authenticated;
grant execute on function public.gw_admin_release_job(uuid, text) to authenticated;

revoke all on function public.gw_staff_accept(uuid) from public, anon;
revoke all on function public.gw_record_gps_point(
  uuid, double precision, double precision, double precision
) from public, anon;
revoke all on function public.gw_staff_clock_in(
  uuid, text, text, double precision, double precision, double precision
) from public, anon;
revoke all on function public.gw_record_job_photo(uuid, text, text) from public, anon;
revoke all on function public.gw_start_wash(uuid) from public, anon;
revoke all on function public.gw_mark_ready(uuid) from public, anon;
revoke all on function public.gw_staff_submit(
  uuid, text, text, double precision, double precision, double precision
) from public, anon;
revoke all on function public.gw_staff_clock_out(uuid) from public, anon;
grant execute on function public.gw_staff_accept(uuid) to authenticated;
grant execute on function public.gw_record_gps_point(
  uuid, double precision, double precision, double precision
) to authenticated;
grant execute on function public.gw_staff_clock_in(
  uuid, text, text, double precision, double precision, double precision
) to authenticated;
grant execute on function public.gw_record_job_photo(uuid, text, text) to authenticated;
grant execute on function public.gw_start_wash(uuid) to authenticated;
grant execute on function public.gw_mark_ready(uuid) to authenticated;
grant execute on function public.gw_staff_submit(
  uuid, text, text, double precision, double precision, double precision
) to authenticated;
grant execute on function public.gw_staff_clock_out(uuid) to authenticated;

revoke all on function public.gw_give_verdict(uuid, text, text) from public, anon;
grant execute on function public.gw_give_verdict(uuid, text, text) to authenticated;

commit;
