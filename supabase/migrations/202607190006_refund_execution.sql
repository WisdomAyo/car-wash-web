begin;
create function public.gw_claim_refund(p_refund_id uuid)
returns table (refund_id uuid, reference text, amount_kobo bigint)
language plpgsql security definer set search_path = ''
as $$
declare v_refund public.gw_refund_requests; v_payment public.gw_payments;
begin
  if not (public.gw_has_role('finance') or public.gw_has_role('super_admin')) then
    raise exception 'Finance access is required.';
  end if;
  select * into v_refund from public.gw_refund_requests where id = p_refund_id for update;
  if not found or v_refund.status <> 'requested' then
    raise exception 'Refund already processing or unavailable. Reconcile before retrying.';
  end if;
  select * into v_payment from public.gw_payments where id = v_refund.payment_id for update;
  if v_payment.status <> 'paid' then raise exception 'Payment is not refundable.'; end if;
  update public.gw_refund_requests set status = 'processing' where id = p_refund_id;
  return query select v_refund.id, v_payment.reference, v_payment.amount_kobo;
end;
$$;
revoke all on function public.gw_claim_refund(uuid) from public, anon;
grant execute on function public.gw_claim_refund(uuid) to authenticated;

create function public.gw_reconcile_refund(
  p_refund_id uuid, p_provider_id text, p_status text, p_reference text, p_amount_kobo bigint
) returns void language plpgsql security definer set search_path = ''
as $$
declare v_refund public.gw_refund_requests; v_payment public.gw_payments;
begin
  select * into v_refund from public.gw_refund_requests where id = p_refund_id for update;
  if not found then raise exception 'Unknown refund.'; end if;
  select * into v_payment from public.gw_payments where id = v_refund.payment_id for update;
  if p_reference is distinct from v_payment.reference
    or p_amount_kobo is distinct from v_payment.amount_kobo
    or coalesce(p_provider_id, '') = '' then raise exception 'Refund provider fields mismatch.'; end if;
  if v_refund.provider_refund_id is not null and v_refund.provider_refund_id <> p_provider_id then
    raise exception 'Refund provider identifier mismatch.';
  end if;
  if v_refund.status = 'processed' then return; end if;
  update public.gw_refund_requests set provider_refund_id = p_provider_id,
    status = case when p_status = 'processed' then 'processed'
      when p_status = 'failed' then 'failed' else 'processing' end where id = p_refund_id;
  if p_status = 'processed' then
    update public.gw_payments set status = 'refunded', updated_at = now() where id = v_payment.id;
    update public.gw_bookings set status = 'cancelled'
      where id = v_payment.booking_id and status = 'paid_pending_assignment';
    insert into public.gw_booking_events (booking_id, owner_id, event, scheduled_at)
      select id, owner_id, 'refund_processed', scheduled_at from public.gw_bookings where id = v_payment.booking_id;
  end if;
end;
$$;
revoke all on function public.gw_reconcile_refund(uuid, text, text, text, bigint) from public, anon, authenticated;
grant execute on function public.gw_reconcile_refund(uuid, text, text, text, bigint) to service_role;
-- A late charge event must not revert a reconciled refund to paid.
create function public.gw_preserve_refunded_payment()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if old.status in ('refunded', 'partially_refunded') and new.status not in ('refunded', 'partially_refunded') then
    return old;
  end if;
  return new;
end;
$$;
create trigger gw_preserve_refunded before update on public.gw_payments
for each row execute function public.gw_preserve_refunded_payment();
commit;
