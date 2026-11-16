import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

// products.ts contains TypeScript-only annotations, so transpile the repository's
// actual source before importing it instead of copying product data into tests.
const require = createRequire(import.meta.url);
const ts = require('typescript');
const productsSource = readFileSync(new URL('../src/data/products.ts', import.meta.url), 'utf8');
const { outputText, diagnostics = [] } = ts.transpileModule(productsSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
  reportDiagnostics: true,
});

assert.deepEqual(
  diagnostics.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error),
  [],
  'src/data/products.ts should transpile without errors',
);

const productModule = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
);
const { categories, products } = productModule;

const requiredFields = [
  'id',
  'name',
  'category',
  'network',
  'description',
  'features',
  'affiliateUrl',
  'images',
  'active',
  'featured',
  'trending',
];

function assertHttpUrl(value, label) {
  assert.equal(typeof value, 'string', `${label} must be a string`);
  const parsed = new URL(value);
  assert.ok(
    parsed.protocol === 'http:' || parsed.protocol === 'https:',
    `${label} must use http or https`,
  );
}

test('product IDs are unique', () => {
  const ids = products.map((product) => product.id);
  assert.equal(new Set(ids).size, ids.length, 'product IDs must not be duplicated');
});

test('every product has the required fields with valid basic types', () => {
  for (const product of products) {
    for (const field of requiredFields) {
      assert.ok(Object.hasOwn(product, field), `${product.id}: missing required field "${field}"`);
    }

    for (const field of ['id', 'name', 'category', 'network', 'description']) {
      assert.equal(typeof product[field], 'string', `${product.id}: ${field} must be a string`);
      assert.ok(product[field].trim(), `${product.id}: ${field} must not be empty`);
    }
    assert.ok(Array.isArray(product.features), `${product.id}: features must be an array`);
    assert.ok(product.features.every((feature) => typeof feature === 'string'));
    assert.ok(Array.isArray(product.images), `${product.id}: images must be an array`);
    for (const field of ['active', 'featured', 'trending']) {
      assert.equal(typeof product[field], 'boolean', `${product.id}: ${field} must be a boolean`);
    }
  }
});

test('product prices are valid when provided', () => {
  for (const product of products) {
    if (product.price !== undefined) {
      assert.equal(typeof product.price, 'number', `${product.id}: price must be a number`);
      assert.ok(Number.isFinite(product.price), `${product.id}: price must be finite`);
      assert.ok(product.price > 0, `${product.id}: price must be greater than zero`);
    }
    if (product.currency !== undefined) {
      assert.equal(typeof product.currency, 'string', `${product.id}: currency must be a string`);
      assert.ok(product.currency.trim(), `${product.id}: currency must not be empty`);
    }
  }
});

test('product images are valid URLs; active products have at least one image', () => {
  for (const product of products) {
    assert.ok(
      product.images.length > 0 || !product.active,
      `${product.id}: active products must have at least one image`,
    );
    for (const image of product.images) {
      assertHttpUrl(image, `${product.id}: image URL`);
    }
  }
});

test('product links are valid URLs when present', () => {
  for (const product of products) {
    if (product.affiliateUrl) {
      assertHttpUrl(product.affiliateUrl, `${product.id}: affiliateUrl`);
    } else {
      assert.equal(product.active, false, `${product.id}: active products need an affiliate URL`);
    }

    if (product.referenceUrl !== undefined) {
      assertHttpUrl(product.referenceUrl, `${product.id}: referenceUrl`);
    }
  }
});

test('every product references a defined category', () => {
  assert.ok(Array.isArray(categories), 'categories must be an array');
  for (const product of products) {
    assert.ok(
      categories.includes(product.category),
      `${product.id}: unknown category "${product.category}"`,
    );
  }
});
