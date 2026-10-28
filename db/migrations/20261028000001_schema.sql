-- Pocket — schéma relationnel synchronisé.
-- Chaque table privée possède : owner_id (propriétaire), id (UUID client), version (verrou optimiste),
-- created_at / updated_at / deleted_at (horodatages client, suppression logique) et server_updated_at
-- (horodatage serveur servant de curseur de synchronisation).
-- Clé primaire composite (owner_id, id) : les clés étrangères composites garantissent qu'une ligne ne
-- peut référencer que des lignes du même propriétaire.

-- Profil minimal, créé automatiquement à l'inscription.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Champs de synchronisation gérés par le serveur : propriétaire imposé, version strictement incrémentée.
create or replace function public.set_sync_fields() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.owner_id := auth.uid();
    if new.owner_id is null then
      raise exception 'authentification requise' using errcode = '42501';
    end if;
    new.version := 1;
  else
    if new.owner_id is distinct from old.owner_id or new.id is distinct from old.id then
      raise exception 'propriétaire ou identifiant non modifiable' using errcode = '42501';
    end if;
    if new.version is distinct from old.version + 1 then
      raise exception 'conflit de version' using errcode = '40001';
    end if;
  end if;
  new.server_updated_at := clock_timestamp();
  return new;
end;
$$;

create table public.app_settings (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id uuid not null,
  created_at timestamptz not null, updated_at timestamptz not null, deleted_at timestamptz,
  version integer not null check (version >= 1),
  server_updated_at timestamptz not null default clock_timestamp(),
  app_name text not null check (char_length(app_name) between 1 and 60),
  onboarding_done boolean not null,
  sync_mode text not null check (sync_mode in ('local', 'cloud')),
  tracking_start_date date,
  safety_threshold_cents bigint not null check (safety_threshold_cents >= 0),
  scenario_factors jsonb not null,
  variable_spending_override_cents bigint check (variable_spending_override_cents >= 0),
  tax_parameters jsonb not null default '[]'::jsonb check (jsonb_typeof(tax_parameters) = 'array'),
  revenue_declarations jsonb not null default '[]'::jsonb check (jsonb_typeof(revenue_declarations) = 'array'),
  primary key (owner_id, id),
  unique (owner_id)
);

create table public.accounts (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id uuid not null,
  created_at timestamptz not null, updated_at timestamptz not null, deleted_at timestamptz,
  version integer not null check (version >= 1),
  server_updated_at timestamptz not null default clock_timestamp(),
  name text not null check (char_length(name) between 1 and 120),
  kind text not null check (kind in ('checking', 'savings', 'cash', 'credit', 'other')),
  currency text not null check (currency = 'EUR'),
  opening_balance_cents bigint,
  opening_date date,
  include_in_totals boolean not null,
  archived boolean not null,
  origin text not null check (origin in ('user_declared', 'user_entered')),
  primary key (owner_id, id)
);

create table public.categories (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id uuid not null,
  created_at timestamptz not null, updated_at timestamptz not null, deleted_at timestamptz,
  version integer not null check (version >= 1),
  server_updated_at timestamptz not null default clock_timestamp(),
  name text not null check (char_length(name) between 1 and 80),
  kind text not null check (kind in ('expense', 'income', 'savings')),
  tone text not null check (tone in ('green', 'amber', 'red', 'blue', 'violet', 'slate', 'teal', 'rose')),
  fixed boolean not null,
  primary key (owner_id, id)
);

create table public.debts (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id uuid not null,
  created_at timestamptz not null, updated_at timestamptz not null, deleted_at timestamptz,
  version integer not null check (version >= 1),
  server_updated_at timestamptz not null default clock_timestamp(),
  creditor text not null check (char_length(creditor) between 1 and 120),
  label text not null check (char_length(label) <= 120),
  kind text not null check (kind in ('loan', 'installment', 'overdraft', 'other')),
  initial_amount_cents bigint check (initial_amount_cents >= 0),
  principal_cents bigint check (principal_cents >= 0),
  principal_as_of date,
  monthly_payment_cents bigint not null check (monthly_payment_cents >= 0),
  annual_rate_bps integer check (annual_rate_bps between 0 and 100000),
  next_due_date date,
  remaining_installments integer check (remaining_installments >= 0),
  fees_cents bigint check (fees_cents >= 0),
  status text not null check (status in ('active', 'paid_off', 'paused')),
  linked_account_id uuid,
  note text check (char_length(note) <= 1000),
  origin text not null check (origin in ('user_declared', 'user_entered')),
  primary key (owner_id, id),
  foreign key (owner_id, linked_account_id) references public.accounts (owner_id, id)
);

create table public.savings_goals (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id uuid not null,
  created_at timestamptz not null, updated_at timestamptz not null, deleted_at timestamptz,
  version integer not null check (version >= 1),
  server_updated_at timestamptz not null default clock_timestamp(),
  name text not null check (char_length(name) between 1 and 120),
  kind text not null check (kind in ('emergency', 'purchase', 'travel', 'project', 'tax', 'other')),
  target_cents bigint not null check (target_cents >= 0),
  starting_cents bigint not null check (starting_cents >= 0),
  deadline date,
  priority smallint not null check (priority between 1 and 3),
  account_id uuid,
  planned_monthly_cents bigint check (planned_monthly_cents >= 0),
  primary key (owner_id, id),
  foreign key (owner_id, account_id) references public.accounts (owner_id, id)
);

create table public.recurring_rules (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id uuid not null,
  created_at timestamptz not null, updated_at timestamptz not null, deleted_at timestamptz,
  version integer not null check (version >= 1),
  server_updated_at timestamptz not null default clock_timestamp(),
  kind text not null check (kind in ('bill', 'subscription', 'income', 'debt_installment', 'savings', 'other')),
  type text not null check (type in ('income', 'expense', 'transfer')),
  label text not null check (char_length(label) between 1 and 120),
  payee text check (char_length(payee) <= 120),
  amount_cents bigint not null check (amount_cents >= 0),
  amount_min_cents bigint check (amount_min_cents >= 0),
  account_id uuid, to_account_id uuid, category_id uuid,
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly', 'custom_days')),
  interval integer not null check (interval between 1 and 366),
  start_date date,
  day_unknown boolean not null,
  end_date date,
  occurrence_count integer check (occurrence_count >= 1),
  fixed boolean not null,
  debt_id uuid, goal_id uuid,
  confidence text check (confidence in ('high', 'medium', 'low')),
  scenario text check (scenario in ('prudent', 'realistic', 'favorable')),
  active boolean not null,
  note text check (char_length(note) <= 1000),
  origin text not null check (origin in ('user_declared', 'user_entered')),
  primary key (owner_id, id),
  check (amount_min_cents is null or amount_min_cents <= amount_cents),
  check (end_date is null or start_date is null or end_date >= start_date),
  foreign key (owner_id, account_id) references public.accounts (owner_id, id),
  foreign key (owner_id, to_account_id) references public.accounts (owner_id, id),
  foreign key (owner_id, category_id) references public.categories (owner_id, id),
  foreign key (owner_id, debt_id) references public.debts (owner_id, id),
  foreign key (owner_id, goal_id) references public.savings_goals (owner_id, id)
);

create table public.transactions (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id uuid not null,
  created_at timestamptz not null, updated_at timestamptz not null, deleted_at timestamptz,
  version integer not null check (version >= 1),
  server_updated_at timestamptz not null default clock_timestamp(),
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount_cents bigint not null check (amount_cents >= 0),
  amount_min_cents bigint check (amount_min_cents >= 0),
  currency text not null check (currency = 'EUR'),
  date date not null,
  value_date date,
  date_estimated boolean not null,
  account_id uuid, to_account_id uuid, category_id uuid,
  description text not null check (char_length(description) <= 500),
  status text not null,
  recurring_rule_id uuid,
  occurrence_key text check (char_length(occurrence_key) <= 120),
  is_bill boolean not null,
  payee text check (char_length(payee) <= 120),
  debt_id uuid, goal_id uuid,
  confidence text check (confidence in ('high', 'medium', 'low')),
  scenario text check (scenario in ('prudent', 'realistic', 'favorable')),
  source text check (char_length(source) <= 120),
  invoice_ref text check (char_length(invoice_ref) <= 60),
  attachment_name text check (char_length(attachment_name) <= 200),
  note text check (char_length(note) <= 1000),
  origin text not null check (origin in ('user_declared', 'user_entered')),
  primary key (owner_id, id),
  -- Statuts autorisés selon le type (mêmes règles que src/domain/model/status.ts).
  check (
    (type = 'income' and status in ('planned', 'confirmed', 'received', 'cancelled')) or
    (type = 'expense' and status in ('planned', 'confirmed', 'paid', 'cancelled')) or
    (type = 'transfer' and status in ('planned', 'paid', 'cancelled'))
  ),
  -- Un transfert relie deux comptes distincts ; une autre opération n'a pas de compte destination.
  check (
    (type = 'transfer' and to_account_id is not null and to_account_id is distinct from account_id) or
    (type <> 'transfer' and to_account_id is null)
  ),
  check (amount_min_cents is null or amount_min_cents <= amount_cents),
  foreign key (owner_id, account_id) references public.accounts (owner_id, id),
  foreign key (owner_id, to_account_id) references public.accounts (owner_id, id),
  foreign key (owner_id, category_id) references public.categories (owner_id, id),
  foreign key (owner_id, recurring_rule_id) references public.recurring_rules (owner_id, id),
  foreign key (owner_id, debt_id) references public.debts (owner_id, id),
  foreign key (owner_id, goal_id) references public.savings_goals (owner_id, id)
);

-- Une occurrence récurrente n'existe qu'une fois par utilisateur (hors lignes supprimées).
create unique index transactions_occurrence_unique on public.transactions (owner_id, occurrence_key)
  where occurrence_key is not null and deleted_at is null;

create table public.budgets (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id uuid not null,
  created_at timestamptz not null, updated_at timestamptz not null, deleted_at timestamptz,
  version integer not null check (version >= 1),
  server_updated_at timestamptz not null default clock_timestamp(),
  category_id uuid not null,
  from_month text not null check (from_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  amount_cents bigint not null check (amount_cents >= 0),
  rollover boolean not null,
  alert_percent smallint not null check (alert_percent between 1 and 100),
  primary key (owner_id, id),
  foreign key (owner_id, category_id) references public.categories (owner_id, id)
);

create unique index budgets_month_unique on public.budgets (owner_id, category_id, from_month) where deleted_at is null;

create table public.debt_payments (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id uuid not null,
  created_at timestamptz not null, updated_at timestamptz not null, deleted_at timestamptz,
  version integer not null check (version >= 1),
  server_updated_at timestamptz not null default clock_timestamp(),
  debt_id uuid not null,
  date date not null,
  total_cents bigint not null check (total_cents >= 0),
  principal_cents bigint check (principal_cents >= 0),
  interest_cents bigint check (interest_cents >= 0),
  fees_cents bigint check (fees_cents >= 0),
  transaction_id uuid,
  primary key (owner_id, id),
  check (coalesce(principal_cents, 0) + coalesce(interest_cents, 0) + coalesce(fees_cents, 0) <= total_cents),
  foreign key (owner_id, debt_id) references public.debts (owner_id, id),
  foreign key (owner_id, transaction_id) references public.transactions (owner_id, id)
);

-- Triggers de synchronisation et index de curseur sur chaque table privée.
do $$
declare t text;
begin
  foreach t in array array['app_settings', 'accounts', 'categories', 'debts', 'savings_goals', 'recurring_rules', 'transactions', 'budgets', 'debt_payments']
  loop
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.set_sync_fields()', t || '_sync_fields', t);
    execute format('create index %I on public.%I (owner_id, server_updated_at)', t || '_sync_cursor', t);
  end loop;
end;
$$;

create index transactions_owner_date on public.transactions (owner_id, date);
