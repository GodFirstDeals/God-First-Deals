create table public.markets (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_-]+$'),
  name text not null,
  default_locale text not null,
  default_currency text not null check (default_currency ~ '^[A-Z]{3}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.countries (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete restrict,
  code text not null unique check (code ~ '^[A-Z]{2}$'),
  name text not null,
  default_locale text not null,
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  parent_id uuid references public.categories(id) on delete restrict,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.category_translations (
  category_id uuid not null references public.categories(id) on delete cascade,
  locale text not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (category_id, locale)
);

create table public.affiliate_programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  network text not null,
  website_url text,
  terms_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (network, name)
);

create table public.affiliate_accounts (
  id uuid primary key default gen_random_uuid(),
  affiliate_program_id uuid not null references public.affiliate_programs(id) on delete restrict,
  account_label text not null,
  external_account_id text,
  status text not null default 'active'
    check (status in ('active', 'paused', 'closed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (affiliate_program_id, account_label),
  unique (id, affiliate_program_id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sku text unique,
  brand text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  is_trending boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or published_at is not null)
);

create table public.product_translations (
  product_id uuid not null references public.products(id) on delete cascade,
  locale text not null,
  name text not null,
  short_description text,
  description text,
  features jsonb not null default '[]'::jsonb
    check (jsonb_typeof(features) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (product_id, locale)
);

create table public.product_offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  country_id uuid not null references public.countries(id) on delete restrict,
  affiliate_program_id uuid not null
    references public.affiliate_programs(id) on delete restrict,
  affiliate_account_id uuid,
  external_offer_id text,
  affiliate_url text,
  link_validation_status text not null default 'unchecked'
    check (link_validation_status in ('unchecked', 'valid', 'invalid', 'blocked', 'error')),
  link_validated_at timestamptz,
  link_validation_http_status smallint
    check (link_validation_http_status between 100 and 599),
  link_validation_final_url text,
  link_validation_error text,
  price numeric(12, 2) check (price is null or price >= 0),
  list_price numeric(12, 2) check (list_price is null or list_price >= 0),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  availability text not null default 'unknown'
    check (availability in ('unknown', 'in_stock', 'out_of_stock', 'preorder', 'discontinued')),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, country_id, affiliate_program_id),
  foreign key (affiliate_account_id, affiliate_program_id)
    references public.affiliate_accounts(id, affiliate_program_id) on delete restrict,
  check (affiliate_url is null or affiliate_url ~* '^https?://'),
  check (link_validation_final_url is null or link_validation_final_url ~* '^https?://'),
  check (link_validation_status <> 'valid' or (affiliate_url is not null and link_validated_at is not null)),
  check (price is null or list_price is null or list_price >= price),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null check (image_url ~* '^https?://'),
  alt_text text,
  position integer not null default 0,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, image_url)
);

create table public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (product_id, category_id)
);

create table public.price_history (
  id uuid primary key default gen_random_uuid(),
  product_offer_id uuid not null references public.product_offers(id) on delete cascade,
  price numeric(12, 2) not null check (price >= 0),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (product_offer_id, observed_at)
);

create table public.import_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  source_type text not null check (source_type in ('manual', 'feed', 'api', 'other')),
  affiliate_program_id uuid references public.affiliate_programs(id) on delete restrict,
  country_id uuid references public.countries(id) on delete restrict,
  settings jsonb not null default '{}'::jsonb
    check (jsonb_typeof(settings) = 'object'),
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  import_source_id uuid not null references public.import_sources(id) on delete restrict,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  started_at timestamptz,
  finished_at timestamptz,
  records_read integer not null default 0 check (records_read >= 0),
  records_created integer not null default 0 check (records_created >= 0),
  records_updated integer not null default 0 check (records_updated >= 0),
  records_failed integer not null default 0 check (records_failed >= 0),
  error_summary text,
  triggered_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (finished_at is null or started_at is null or finished_at >= started_at)
);

alter table public.product_offers
  add column import_source_id uuid
    references public.import_sources(id) on delete set null;
alter table public.price_history
  add column import_source_id uuid
    references public.import_sources(id) on delete set null;

create table public.publishing_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  action text not null check (action in ('published', 'unpublished', 'archived', 'restored')),
  actor_id uuid references auth.users(id) on delete set null,
  details jsonb not null default '{}'::jsonb
    check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now()
);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create trigger set_markets_updated_at before update on public.markets
  for each row execute function public.set_updated_at();
create trigger set_countries_updated_at before update on public.countries
  for each row execute function public.set_updated_at();
create trigger set_categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger set_category_translations_updated_at before update on public.category_translations
  for each row execute function public.set_updated_at();
create trigger set_affiliate_programs_updated_at before update on public.affiliate_programs
  for each row execute function public.set_updated_at();
create trigger set_affiliate_accounts_updated_at before update on public.affiliate_accounts
  for each row execute function public.set_updated_at();
create trigger set_products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger set_product_translations_updated_at before update on public.product_translations
  for each row execute function public.set_updated_at();
create trigger set_product_offers_updated_at before update on public.product_offers
  for each row execute function public.set_updated_at();
create trigger set_product_images_updated_at before update on public.product_images
  for each row execute function public.set_updated_at();
create trigger set_import_sources_updated_at before update on public.import_sources
  for each row execute function public.set_updated_at();

create index countries_market_id_idx on public.countries (market_id);
create index categories_parent_id_idx on public.categories (parent_id);
create index affiliate_accounts_program_id_idx on public.affiliate_accounts (affiliate_program_id);
create index products_status_created_at_idx on public.products (status, created_at desc);
create index products_published_at_idx on public.products (published_at desc)
  where status = 'published';
create index product_offers_country_program_idx
  on public.product_offers (country_id, affiliate_program_id);
create index product_offers_product_active_idx
  on public.product_offers (product_id, is_active);
create index product_offers_import_source_id_idx
  on public.product_offers (import_source_id);
create index product_images_product_position_idx
  on public.product_images (product_id, position);
create unique index product_images_one_primary_idx
  on public.product_images (product_id) where is_primary;
create index product_categories_category_id_idx
  on public.product_categories (category_id, product_id);
create unique index product_categories_one_primary_idx
  on public.product_categories (product_id) where is_primary;
create index price_history_offer_observed_at_idx
  on public.price_history (product_offer_id, observed_at desc);
create index price_history_import_source_id_idx
  on public.price_history (import_source_id);
create index import_jobs_source_created_at_idx
  on public.import_jobs (import_source_id, created_at desc);
create index publishing_logs_product_created_at_idx
  on public.publishing_logs (product_id, created_at desc);

alter table public.markets enable row level security;
alter table public.countries enable row level security;
alter table public.categories enable row level security;
alter table public.category_translations enable row level security;
alter table public.affiliate_programs enable row level security;
alter table public.affiliate_accounts enable row level security;
alter table public.products enable row level security;
alter table public.product_translations enable row level security;
alter table public.product_offers enable row level security;
alter table public.product_images enable row level security;
alter table public.product_categories enable row level security;
alter table public.price_history enable row level security;
alter table public.import_sources enable row level security;
alter table public.import_jobs enable row level security;
alter table public.publishing_logs enable row level security;
alter table public.admin_users enable row level security;

create policy "Active markets are publicly readable"
  on public.markets for select to anon, authenticated
  using (is_active);
create policy "Active countries are publicly readable"
  on public.countries for select to anon, authenticated
  using (is_active and exists (
    select 1 from public.markets
    where markets.id = countries.market_id and markets.is_active
  ));
create policy "Active categories are publicly readable"
  on public.categories for select to anon, authenticated
  using (is_active);
create policy "Published category translations are publicly readable"
  on public.category_translations for select to anon, authenticated
  using (exists (
    select 1 from public.categories
    where categories.id = category_translations.category_id and categories.is_active
  ));
create policy "Published products are publicly readable"
  on public.products for select to anon, authenticated
  using (status = 'published');
create policy "Published product translations are publicly readable"
  on public.product_translations for select to anon, authenticated
  using (exists (
    select 1 from public.products
    where products.id = product_translations.product_id and products.status = 'published'
  ));
create policy "Validated published offers are publicly readable"
  on public.product_offers for select to anon, authenticated
  using (
    is_active
    and link_validation_status = 'valid'
    and exists (
      select 1 from public.products
      where products.id = product_offers.product_id and products.status = 'published'
    )
  );
create policy "Published product images are publicly readable"
  on public.product_images for select to anon, authenticated
  using (
    is_active
    and exists (
      select 1 from public.products
      where products.id = product_images.product_id and products.status = 'published'
    )
  );
create policy "Published product categories are publicly readable"
  on public.product_categories for select to anon, authenticated
  using (
    exists (
      select 1 from public.products
      where products.id = product_categories.product_id and products.status = 'published'
    )
    and exists (
      select 1 from public.categories
      where categories.id = product_categories.category_id and categories.is_active
    )
  );
create policy "Published offer price history is publicly readable"
  on public.price_history for select to anon, authenticated
  using (exists (
    select 1
    from public.product_offers
    join public.products on products.id = product_offers.product_id
    where product_offers.id = price_history.product_offer_id
      and product_offers.is_active
      and product_offers.link_validation_status = 'valid'
      and products.status = 'published'
  ));

create policy "Users can read their own admin membership"
  on public.admin_users for select to authenticated
  using (user_id = auth.uid());

create policy "Admins can manage markets"
  on public.markets for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage countries"
  on public.countries for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage categories"
  on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage category translations"
  on public.category_translations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage affiliate programs"
  on public.affiliate_programs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage affiliate accounts"
  on public.affiliate_accounts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage products"
  on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage product translations"
  on public.product_translations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage product offers"
  on public.product_offers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage product images"
  on public.product_images for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage product categories"
  on public.product_categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage price history"
  on public.price_history for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage import sources"
  on public.import_sources for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage import jobs"
  on public.import_jobs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins can manage publishing logs"
  on public.publishing_logs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select on public.markets, public.countries, public.categories,
  public.category_translations, public.products, public.product_translations,
  public.product_offers, public.product_images, public.product_categories,
  public.price_history to anon, authenticated;

grant select, insert, update, delete on public.markets, public.countries,
  public.categories, public.category_translations, public.affiliate_programs,
  public.affiliate_accounts, public.products, public.product_translations,
  public.product_offers, public.product_images, public.product_categories,
  public.price_history, public.import_sources, public.import_jobs,
  public.publishing_logs, public.admin_users to authenticated;
