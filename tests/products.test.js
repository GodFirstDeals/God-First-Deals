import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

// Load the real TypeScript catalogue so the tests exercise the data and helpers
// used by the application, rather than a duplicated test fixture.
const source = await readFile(new URL('../src/data/products.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const catalogue = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const { activeProducts, categories, products, slugify } = catalogue;

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
  } catch {
    return false;
  }
};

test('product IDs are unique', () => {
  const ids = products.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length, 'each catalogue product must have a unique ID');
});

test('every product has its required information', () => {
  assert.ok(products.length > 0, 'the product catalogue should not be empty');

  for (const product of products) {
    assert.equal(typeof product.id, 'string');
    assert.ok(product.id.trim(), 'product ID must not be empty');
    assert.equal(typeof product.name, 'string');
    assert.ok(product.name.trim(), `product ${product.id} must have a name`);
    assert.ok(categories.includes(product.category), `product ${product.id} must use a listed category`);
    assert.ok(['Jumia', 'Temu', 'Other'].includes(product.network), `product ${product.id} must have a supported network`);
    assert.equal(typeof product.description, 'string');
    assert.ok(product.description.trim(), `product ${product.id} must have a description`);
    assert.ok(Array.isArray(product.features), `product ${product.id} must have a features array`);
    assert.ok(product.features.every((feature) => typeof feature === 'string'), `product ${product.id} features must be strings`);
    assert.equal(typeof product.affiliateUrl, 'string');
    assert.ok(Array.isArray(product.images), `product ${product.id} must have an images array`);
    assert.equal(typeof product.active, 'boolean');
    assert.equal(typeof product.featured, 'boolean');
    assert.equal(typeof product.trending, 'boolean');
  }
});

test('active products have valid HTTP(S) affiliate URLs', () => {
  const listedActiveProducts = products.filter((product) => product.active);
  assert.ok(listedActiveProducts.length > 0, 'the catalogue should contain active products');

  for (const product of listedActiveProducts) {
    assert.ok(isHttpUrl(product.affiliateUrl), `active product ${product.id} must have a valid affiliate URL`);
  }
});

test('active products have valid HTTP(S) image URLs', () => {
  const listedActiveProducts = products.filter((product) => product.active);
  assert.ok(listedActiveProducts.length > 0, 'the catalogue should contain active products');

  for (const product of listedActiveProducts) {
    assert.ok(product.images.length > 0, `active product ${product.id} must have at least one image`);
    for (const imageUrl of product.images) {
      assert.ok(isHttpUrl(imageUrl), `active product ${product.id} has an invalid image URL: ${imageUrl}`);
    }
  }
});

test('inactive products are excluded from active listings', () => {
  const inactiveProducts = products.filter((product) => !product.active);
  const activeProductIds = new Set(activeProducts.map(({ id }) => id));

  for (const product of inactiveProducts) {
    assert.ok(!activeProductIds.has(product.id), `inactive product ${product.id} must not appear in activeProducts`);
  }

  assert.deepEqual(
    activeProducts,
    products.filter((product) => product.active && product.affiliateUrl && product.images.length > 0),
    'activeProducts should include only active products with affiliate URLs and images',
  );
});

test('category slugs are generated from category names', () => {
  for (const category of categories) {
    const slug = slugify(category);
    assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `category ${category} should produce a URL-safe slug`);
  }

  assert.equal(slugify('Power & Charging'), 'power-and-charging');
});
