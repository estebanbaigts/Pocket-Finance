-- Row Level Security : chaque utilisateur authentifié ne voit et ne modifie que ses propres lignes.
-- Aucun accès pour le rôle anonyme. Aucune politique globale.

revoke all on public.profiles from anon, authenticated;
alter table public.profiles enable row level security;
alter table public.profiles force row level security;
grant select on public.profiles to authenticated;
create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()));

do $$
declare t text;
begin
  foreach t in array array['app_settings', 'accounts', 'categories', 'debts', 'savings_goals', 'recurring_rules', 'transactions', 'budgets', 'debt_payments']
  loop
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id = (select auth.uid()))', t || '_select_own', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (owner_id = (select auth.uid()))', t || '_insert_own', t);
    execute format('create policy %I on public.%I for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))', t || '_update_own', t);
    execute format('create policy %I on public.%I for delete to authenticated using (owner_id = (select auth.uid()))', t || '_delete_own', t);
  end loop;
end;
$$;

-- Suppression explicite de toutes les données financières de l'utilisateur connecté (droit à l'effacement).
-- SECURITY INVOKER : s'exécute avec les droits de l'appelant, donc limité par les politiques ci-dessus.
create or replace function public.delete_my_data() returns void
language plpgsql security invoker set search_path = '' as $$
begin
  delete from public.debt_payments where owner_id = auth.uid();
  delete from public.budgets where owner_id = auth.uid();
  delete from public.transactions where owner_id = auth.uid();
  delete from public.recurring_rules where owner_id = auth.uid();
  delete from public.savings_goals where owner_id = auth.uid();
  delete from public.debts where owner_id = auth.uid();
  delete from public.categories where owner_id = auth.uid();
  delete from public.accounts where owner_id = auth.uid();
  delete from public.app_settings where owner_id = auth.uid();
end;
$$;

revoke all on function public.delete_my_data() from public, anon;
grant execute on function public.delete_my_data() to authenticated;
revoke all on function public.set_sync_fields() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
