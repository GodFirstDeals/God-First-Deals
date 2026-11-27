begin;

alter table public.products
  add column if not exists source_active boolean not null default false,
  add column if not exists reference_url text;

insert into public.markets (code, name, default_locale, default_currency)
values ('NG', 'Nigeria', 'en-NG', 'NGN')
on conflict (code) do update
set name = excluded.name,
    default_locale = excluded.default_locale,
    default_currency = excluded.default_currency;

insert into public.countries (market_id, code, name, default_locale, currency_code)
select markets.id, 'NG', 'Nigeria', 'en-NG', 'NGN'
from public.markets
where markets.code = 'NG'
on conflict (code) do update
set market_id = excluded.market_id,
    name = excluded.name,
    default_locale = excluded.default_locale,
    currency_code = excluded.currency_code;

insert into public.categories (slug, sort_order)
values
  ('power-and-charging', 1),
  ('phone-accessories', 2),
  ('audio', 3),
  ('smart-gadgets', 4),
  ('home-and-living', 5),
  ('kitchen', 6),
  ('lighting', 7),
  ('car-accessories', 8),
  ('beauty', 9),
  ('travel', 10),
  ('other-deals', 11)
on conflict (slug) do update
set sort_order = excluded.sort_order;

insert into public.category_translations (category_id, locale, name)
select categories.id, 'en-NG', seed.name
from (
  values
    ('power-and-charging', 'Power & Charging'),
    ('phone-accessories', 'Phone Accessories'),
    ('audio', 'Audio'),
    ('smart-gadgets', 'Smart Gadgets'),
    ('home-and-living', 'Home & Living'),
    ('kitchen', 'Kitchen'),
    ('lighting', 'Lighting'),
    ('car-accessories', 'Car Accessories'),
    ('beauty', 'Beauty'),
    ('travel', 'Travel'),
    ('other-deals', 'Other Deals')
) as seed(slug, name)
join public.categories on categories.slug = seed.slug
on conflict (category_id, locale) do update
set name = excluded.name;

insert into public.affiliate_programs (name, network, website_url, terms_url)
values ('Jumia', 'Jumia', null, null)
on conflict (network, name) do update
set website_url = excluded.website_url,
    terms_url = excluded.terms_url;

insert into public.affiliate_accounts (
  affiliate_program_id,
  account_label,
  external_account_id,
  status
)
select affiliate_programs.id, 'Existing Jumia catalogue links', null, 'paused'
from public.affiliate_programs
where affiliate_programs.network = 'Jumia'
  and affiliate_programs.name = 'Jumia'
on conflict (affiliate_program_id, account_label) do update
set external_account_id = excluded.external_account_id,
    status = excluded.status;

insert into public.products (
  slug,
  status,
  is_featured,
  is_trending,
  source_active,
  reference_url
)
values
  (
    '60000mah-65w-power-bank-built-in-cables',
    'draft',
    true,
    true,
    true,
    null
  ),
  (
    '60000mah-65w-fast-charging-power-bank',
    'draft',
    true,
    false,
    true,
    null
  ),
  (
    'foldable-mosquito-swatter-uv-trap',
    'draft',
    true,
    true,
    true,
    null
  ),
  (
    'itel-20000mah-power-bank',
    'draft',
    false,
    false,
    false,
    'https://www.jumia.com.ng/20000mah-power-bank-12w-type-c-3-port-output-led-flashlight-itel-mpg12107278.html'
  )
on conflict (slug) do update
set status = excluded.status,
    is_featured = excluded.is_featured,
    is_trending = excluded.is_trending,
    published_at = null,
    source_active = excluded.source_active,
    reference_url = excluded.reference_url;

insert into public.product_translations (
  product_id,
  locale,
  name,
  short_description,
  description,
  features
)
select
  products.id,
  'en-NG',
  seed.name,
  null,
  seed.description,
  seed.features
from (
  values
    (
      '60000mah-65w-power-bank-built-in-cables',
      '60,000mAh Power Bank with 65W Fast Charging',
      'A high-capacity portable power bank advertised with 65W fast charging, built-in charging cables, multiple device outputs, and a digital battery display.',
      jsonb_build_array(
        'Advertised 60,000mAh capacity',
        'Advertised 65W fast charging',
        'Built-in charging cables',
        'Multiple device outputs',
        'Digital battery display'
      )
    ),
    (
      '60000mah-65w-fast-charging-power-bank',
      '60,000mAh 65W Fast-Charging Power Bank',
      'A portable power bank advertised with 60,000mAh capacity, PD 65W charging, four charging outputs, and Type-C connectivity.',
      jsonb_build_array(
        'Advertised 60,000mAh capacity',
        'PD 65W charging',
        'Four charging outputs',
        'Type-C connectivity'
      )
    ),
    (
      'foldable-mosquito-swatter-uv-trap',
      '2-in-1 Foldable Electric Mosquito Swatter and UV Trap Lamp',
      'A rechargeable foldable mosquito swatter advertised with manual swatter and automatic UV trap modes, USB Type-C charging, and a standing base.',
      jsonb_build_array(
        'Manual swatter and automatic UV trap modes',
        'USB Type-C charging',
        'Foldable design',
        'Standing base'
      )
    ),
    (
      'itel-20000mah-power-bank',
      'Itel 20,000mAh Power Bank',
      'Awaiting the owner’s approved affiliate URL and product image links. This product is not available for promotion yet.',
      jsonb_build_array()
    )
) as seed(slug, name, description, features)
join public.products on products.slug = seed.slug
on conflict (product_id, locale) do update
set name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    features = excluded.features;

update public.product_categories
set is_primary = false
where is_primary
  and product_id in (
    select id
    from public.products
    where slug in (
      '60000mah-65w-power-bank-built-in-cables',
      '60000mah-65w-fast-charging-power-bank',
      'foldable-mosquito-swatter-uv-trap',
      'itel-20000mah-power-bank'
    )
  );

insert into public.product_categories (product_id, category_id, is_primary)
select products.id, categories.id, true
from (
  values
    ('60000mah-65w-power-bank-built-in-cables', 'power-and-charging'),
    ('60000mah-65w-fast-charging-power-bank', 'power-and-charging'),
    ('foldable-mosquito-swatter-uv-trap', 'home-and-living'),
    ('itel-20000mah-power-bank', 'power-and-charging')
) as seed(product_slug, category_slug)
join public.products on products.slug = seed.product_slug
join public.categories on categories.slug = seed.category_slug
on conflict (product_id, category_id) do update
set is_primary = excluded.is_primary;

update public.product_images
set is_primary = false
where is_primary
  and product_id in (
    select id
    from public.products
    where slug in (
      '60000mah-65w-power-bank-built-in-cables',
      '60000mah-65w-fast-charging-power-bank',
      'foldable-mosquito-swatter-uv-trap'
    )
  );

insert into public.product_images (
  product_id,
  image_url,
  position,
  is_primary
)
select products.id, seed.image_url, seed.position, seed.position = 1
from (
  values
    (
      '60000mah-65w-power-bank-built-in-cables',
      'https://ng.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/53/7468814/1.jpg?2307',
      1
    ),
    (
      '60000mah-65w-power-bank-built-in-cables',
      'https://ng.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/53/7468814/3.jpg?2704',
      2
    ),
    (
      '60000mah-65w-power-bank-built-in-cables',
      'https://ng.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/53/7468814/4.jpg?2704',
      3
    ),
    (
      '60000mah-65w-fast-charging-power-bank',
      'https://ng.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/14/3533914/1.jpg?2936',
      1
    ),
    (
      '60000mah-65w-fast-charging-power-bank',
      'https://ng.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/14/3533914/2.jpg?2936',
      2
    ),
    (
      'foldable-mosquito-swatter-uv-trap',
      'https://ng.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/20/3663014/1.jpg?7323',
      1
    ),
    (
      'foldable-mosquito-swatter-uv-trap',
      'https://ng.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/20/3663014/2.jpg?6982',
      2
    ),
    (
      'foldable-mosquito-swatter-uv-trap',
      'https://ng.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/20/3663014/7.jpg?5738',
      3
    )
) as seed(product_slug, image_url, position)
join public.products on products.slug = seed.product_slug
on conflict (product_id, image_url) do update
set position = excluded.position,
    is_primary = excluded.is_primary,
    is_active = excluded.is_active;

insert into public.product_offers (
  product_id,
  country_id,
  affiliate_program_id,
  affiliate_account_id,
  affiliate_url,
  link_validation_status,
  currency_code,
  is_active
)
select
  products.id,
  countries.id,
  affiliate_programs.id,
  affiliate_accounts.id,
  seed.affiliate_url,
  'unchecked',
  'NGN',
  false
from (
  values
    (
      '60000mah-65w-power-bank-built-in-cables',
      'https://jmia.io/o65w6cx'
    ),
    (
      '60000mah-65w-fast-charging-power-bank',
      'https://jmia.io/GkCcLk4'
    ),
    (
      'foldable-mosquito-swatter-uv-trap',
      'https://jmia.io/yJW6tME'
    ),
    (
      'itel-20000mah-power-bank',
      null
    )
) as seed(product_slug, affiliate_url)
join public.products on products.slug = seed.product_slug
join public.countries on countries.code = 'NG'
join public.affiliate_programs
  on affiliate_programs.network = 'Jumia'
  and affiliate_programs.name = 'Jumia'
join public.affiliate_accounts
  on affiliate_accounts.affiliate_program_id = affiliate_programs.id
  and affiliate_accounts.account_label = 'Existing Jumia catalogue links'
on conflict (product_id, country_id, affiliate_program_id) do update
set affiliate_account_id = excluded.affiliate_account_id,
    affiliate_url = excluded.affiliate_url,
    link_validation_status = excluded.link_validation_status,
    link_validated_at = null,
    link_validation_http_status = null,
    link_validation_final_url = null,
    link_validation_error = null,
    currency_code = excluded.currency_code,
    availability = 'unknown',
    is_active = excluded.is_active;

commit;
