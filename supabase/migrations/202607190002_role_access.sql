-- Approved role access. Browser clients can inspect their own memberships but
-- cannot create, approve, suspend or change any privileged access.
begin;

create table public.gw_organisations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('corporate', 'estate')),
  name text not null check (length(trim(name)) between 2 and 160),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended')),
  created_at timestamptz not null default now()
);

create table public.gw_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organisation_id uuid references public.gw_organisations(id) on delete cascade,
  role text not null check (role in (
    'washman', 'corporate_manager', 'corporate_confirmer', 'estate_manager',
    'dispatcher', 'finance', 'support', 'super_admin'
  )),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'suspended')),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (role in ('corporate_manager', 'corporate_confirmer', 'estate_manager')
      and organisation_id is not null)
    or
    (role in ('washman', 'dispatcher', 'finance', 'support', 'super_admin')
      and organisation_id is null)
  ),
  check ((status = 'approved') = (approved_at is not null))
);

create unique index gw_memberships_unique_scope on public.gw_memberships (
  user_id,
  role,
  coalesce(organisation_id, '00000000-0000-0000-0000-000000000000'::uuid)
);
create index gw_memberships_user on public.gw_memberships(user_id, status);
create index gw_memberships_organisation on public.gw_memberships(organisation_id, status);

create function public.gw_validate_membership_scope()
returns trigger
language plpgsql set search_path = ''
as $$
declare
  v_kind text;
begin
  if new.organisation_id is null then return new; end if;
  select kind into v_kind
    from public.gw_organisations
    where id = new.organisation_id;
  if new.role in ('corporate_manager', 'corporate_confirmer')
    and v_kind <> 'corporate' then
    raise exception 'Corporate roles require a corporate organisation.';
  end if;
  if new.role = 'estate_manager' and v_kind <> 'estate' then
    raise exception 'Estate roles require an estate organisation.';
  end if;
  return new;
end;
$$;
create trigger gw_membership_scope
  before insert or update on public.gw_memberships
  for each row execute function public.gw_validate_membership_scope();

alter table public.gw_organisations enable row level security;
alter table public.gw_memberships enable row level security;

-- SECURITY DEFINER avoids recursive membership policies. It exposes only a
-- boolean and always binds the lookup to the authenticated user.
create function public.gw_has_role(p_role text, p_organisation_id uuid default null)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.gw_memberships membership
    left join public.gw_organisations organisation
      on organisation.id = membership.organisation_id
    where membership.user_id = auth.uid()
      and membership.role = p_role
      and membership.status = 'approved'
      and (
        membership.organisation_id is null
        or organisation.status = 'active'
      )
      and (
        p_organisation_id is null
        or membership.organisation_id = p_organisation_id
      )
  )
$$;

create policy memberships_read_own on public.gw_memberships
  for select to authenticated using (user_id = auth.uid());
create policy organisations_read_member on public.gw_organisations
  for select to authenticated using (
    public.gw_has_role('super_admin')
    or exists (
      select 1 from public.gw_memberships membership
      where membership.user_id = auth.uid()
        and membership.organisation_id = gw_organisations.id
        and membership.status = 'approved'
    )
  );

revoke all on public.gw_organisations, public.gw_memberships from anon, authenticated;
grant select on public.gw_organisations, public.gw_memberships to authenticated;

revoke all on function public.gw_has_role(text, uuid) from public, anon;
grant execute on function public.gw_has_role(text, uuid) to authenticated;
revoke all on function public.gw_validate_membership_scope() from public, anon, authenticated;

-- Provision memberships only through a trusted administrative workflow or SQL
-- migration. Never grant browser clients INSERT or UPDATE on these tables.
commit;
