import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

// Node.js does not execute this project's TypeScript source directly, so
// transpile the existing data module in memory without changing project files.
const source = await readFile(
  new URL('../src/data/products.ts', import.meta.url),
  'utf8'
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022
  }
});
const { products, activeProducts, categories, slugify } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
);

const isValidHttpUrl = (value) => {
  if (typeof value !== 'string' || value.length === 0) return false;

  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname.length > 0;
  } catch {
    return false;
  }
};

test('every product has a unique ID', () => {
  const ids = products.map((product) => product.id);
  assert.equal(new Set(ids).size, ids.length, 'product IDs must be unique');
});

test('every product has the required fields and field types', () => {
  const requiredFields = [
    'id', 'name', 'category', 'network', 'description', 'features',
    'affiliateUrl', 'images', 'active', 'featured', 'trending'
  ];

  for (const product of products) {
    for (const field of requiredFields) {
      assert.ok(Object.hasOwn(product, field), `product is missing ${field}`);
    }

    assert.equal(typeof product.id, 'string');
    assert.ok(product.id.length > 0);
    assert.equal(typeof product.name, 'string');
    assert.ok(product.name.length > 0);
    assert.ok(categories.includes(product.category));
    assert.ok(['Jumia', 'Temu', 'Other'].includes(product.network));
    assert.equal(typeof product.description, 'string');
    assert.ok(product.description.length > 0);
    assert.ok(Array.isArray(product.features));
    assert.ok(product.features.every((feature) => typeof feature === 'string'));
    assert.equal(typeof product.affiliateUrl, 'string');
    assert.ok(Array.isArray(product.images));
    assert.ok(product.images.every((image) => typeof image === 'string'));
    assert.equal(typeof product.active, 'boolean');
    assert.equal(typeof product.featured, 'boolean');
    assert.equal(typeof product.trending, 'boolean');

    if (Object.hasOwn(product, 'price')) {
      assert.equal(typeof product.price, 'number');
    }
    if (Object.hasOwn(product, 'currency')) {
      assert.equal(typeof product.currency, 'string');
    }
    if (Object.hasOwn(product, 'referenceUrl')) {
      assert.equal(typeof product.referenceUrl, 'string');
    }
  }
});

test('every active product has a valid affiliate URL', () => {
  for (const product of products.filter((item) => item.active)) {
    assert.ok(
      isValidHttpUrl(product.affiliateUrl),
      `active product ${product.id} must have a valid HTTP(S) affiliate URL`
    );
  }
});

test('every active product has at least one valid image URL', () => {
  for (const product of products.filter((item) => item.active)) {
    assert.ok(
      product.images.length > 0,
      `active product ${product.id} must have at least one image`
    );
    assert.ok(
      product.images.every(isValidHttpUrl),
      `all image URLs for active product ${product.id} must be valid HTTP(S) URLs`
    );
  }
});

test('inactive products are excluded from active product listings', () => {
  const expectedActiveProducts = products.filter(
    (product) => product.active && product.affiliateUrl && product.images.length > 0
  );

  assert.deepEqual(activeProducts, expectedActiveProducts);
  for (const product of products.filter((item) => !item.active)) {
    assert.ok(
      !activeProducts.includes(product),
      `inactive product ${product.id} must not appear in activeProducts`
    );
  }
});

test('category slug generation works correctly', () => {
  assert.equal(slugify('Power & Charging'), 'power-and-charging');
  assert.equal(slugify('Home & Living'), 'home-and-living');
  assert.deepEqual(
    categories.map((category) => slugify(category)),
    categories.map((category) =>
      category.toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    )
  );
});
