-- Tests de sécurité et d'intégrité exécutés en tant qu'utilisateurs authentifiés distincts.
\set ON_ERROR_STOP 1
insert into auth.users values ('11111111-1111-4111-a111-111111111111'), ('22222222-2222-4222-a222-222222222222');

-- Profils créés automatiquement.
do $$ begin
  assert (select count(*) from public.profiles) = 2, 'profils non créés';
end $$;

set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-a111-111111111111', false);

insert into public.accounts (id, created_at, updated_at, version, name, kind, currency, opening_balance_cents, opening_date, include_in_totals, archived, origin)
values ('aaaaaaaa-0000-4000-a000-000000000001', now(), now(), 1, 'CIC', 'checking', 'EUR', -21200, '2026-10-01', true, false, 'user_declared'),
       ('aaaaaaaa-0000-4000-a000-000000000002', now(), now(), 1, 'Livret', 'savings', 'EUR', 0, '2026-10-01', true, false, 'user_entered');

-- 1. Propriétaire imposé par le serveur, version initiale 1.
do $$ begin
  assert (select count(*) from public.accounts where owner_id = '11111111-1111-4111-a111-111111111111' and version = 1) = 2, 'propriétaire/version non imposés';
end $$;

-- 2. Intégrité : transfert vers le même compte refusé, statut incompatible refusé, montant négatif refusé.
do $$ begin
  begin
    insert into public.transactions (id, created_at, updated_at, version, type, amount_cents, currency, date, date_estimated, account_id, to_account_id, description, status, is_bill, origin)
    values (gen_random_uuid(), now(), now(), 1, 'transfer', 100, 'EUR', '2026-10-10', false, 'aaaaaaaa-0000-4000-a000-000000000001', 'aaaaaaaa-0000-4000-a000-000000000001', '', 'paid', false, 'user_entered');
    raise exception 'transfert circulaire accepté';
  exception when check_violation then null; end;
  begin
    insert into public.transactions (id, created_at, updated_at, version, type, amount_cents, currency, date, date_estimated, description, status, is_bill, origin)
    values (gen_random_uuid(), now(), now(), 1, 'expense', 100, 'EUR', '2026-10-10', false, '', 'received', false, 'user_entered');
    raise exception 'statut incompatible accepté';
  exception when check_violation then null; end;
  begin
    insert into public.transactions (id, created_at, updated_at, version, type, amount_cents, currency, date, date_estimated, description, status, is_bill, origin)
    values (gen_random_uuid(), now(), now(), 1, 'expense', -5, 'EUR', '2026-10-10', false, '', 'paid', false, 'user_entered');
    raise exception 'montant négatif accepté';
  exception when check_violation then null; end;
end $$;

insert into public.transactions (id, created_at, updated_at, version, type, amount_cents, currency, date, date_estimated, account_id, to_account_id, description, status, is_bill, occurrence_key, origin)
values ('bbbbbbbb-0000-4000-a000-000000000001', now(), now(), 1, 'transfer', 5000, 'EUR', '2026-10-10', false, 'aaaaaaaa-0000-4000-a000-000000000001', 'aaaaaaaa-0000-4000-a000-000000000002', 'Épargne', 'paid', false, null, 'user_entered'),
       ('bbbbbbbb-0000-4000-a000-000000000002', now(), now(), 1, 'expense', 90000, 'EUR', '2026-10-31', true, 'aaaaaaaa-0000-4000-a000-000000000001', null, 'Loyer', 'planned', true, 'rule:2026-10-31', 'user_declared');

-- 3. Occurrence récurrente unique par utilisateur.
do $$ begin
  begin
    insert into public.transactions (id, created_at, updated_at, version, type, amount_cents, currency, date, date_estimated, description, status, is_bill, occurrence_key, origin)
    values (gen_random_uuid(), now(), now(), 1, 'expense', 90000, 'EUR', '2026-10-31', true, 'Loyer', 'planned', true, 'rule:2026-10-31', 'user_declared');
    raise exception 'occurrence dupliquée acceptée';
  exception when unique_violation then null; end;
end $$;

-- 4. Verrou optimiste : une mise à jour qui ne part pas de la bonne version est refusée.
update public.accounts set name = 'CIC courant', version = 2 where id = 'aaaaaaaa-0000-4000-a000-000000000001' and version = 1;
do $$ begin
  assert (select version from public.accounts where id = 'aaaaaaaa-0000-4000-a000-000000000001') = 2, 'version non incrémentée';
  begin
    update public.accounts set name = 'Écrasement', version = 2 where id = 'aaaaaaaa-0000-4000-a000-000000000001';
    raise exception 'conflit de version non détecté';
  exception when serialization_failure then null; end;
end $$;

-- 5. Second utilisateur : ne voit rien, ne peut rien modifier ni supprimer, ne peut pas se faire passer pour le premier.
select set_config('request.jwt.claim.sub', '22222222-2222-4222-a222-222222222222', false);
do $$
declare n int;
begin
  assert (select count(*) from public.accounts) = 0, 'fuite de lecture entre utilisateurs';
  assert (select count(*) from public.transactions) = 0, 'fuite de lecture (transactions)';
  update public.accounts set name = 'piraté', version = 3 where id = 'aaaaaaaa-0000-4000-a000-000000000001';
  get diagnostics n = row_count;
  assert n = 0, 'modification croisée possible';
  delete from public.transactions;
  get diagnostics n = row_count;
  assert n = 0, 'suppression croisée possible';
  insert into public.accounts (owner_id, id, created_at, updated_at, version, name, kind, currency, include_in_totals, archived, origin)
  values ('11111111-1111-4111-a111-111111111111', 'cccccccc-0000-4000-a000-000000000001', now(), now(), 1, 'Usurpation', 'checking', 'EUR', true, false, 'user_entered');
  assert (select owner_id from public.accounts where id = 'cccccccc-0000-4000-a000-000000000001') = '22222222-2222-4222-a222-222222222222', 'propriétaire usurpable';
  -- Référencer le compte d'un autre utilisateur est impossible (clé étrangère composite).
  begin
    insert into public.transactions (id, created_at, updated_at, version, type, amount_cents, currency, date, date_estimated, account_id, description, status, is_bill, origin)
    values (gen_random_uuid(), now(), now(), 1, 'expense', 100, 'EUR', '2026-10-10', false, 'aaaaaaaa-0000-4000-a000-000000000001', '', 'paid', false, 'user_entered');
    raise exception 'référence croisée acceptée';
  exception when foreign_key_violation then null; end;
end $$;

-- 6. Le rôle anonyme n'a aucun accès.
reset role;
set role anon;
do $$ begin
  begin
    perform count(*) from public.accounts;
    raise exception 'accès anonyme possible';
  exception when insufficient_privilege then null; end;
end $$;

-- 7. Effacement explicite : supprime uniquement les données de l'appelant.
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-a222-222222222222', false);
select public.delete_my_data();
reset role;
do $$ begin
  assert (select count(*) from public.accounts where owner_id = '22222222-2222-4222-a222-222222222222') = 0, 'effacement incomplet';
  assert (select count(*) from public.accounts where owner_id = '11111111-1111-4111-a111-111111111111') = 2, 'effacement trop large';
end $$;

\echo 'Tous les tests RLS et d''intégrité sont passés.'
