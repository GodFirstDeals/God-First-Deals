
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

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

const catalog = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
);

const {
  products,
  activeProducts,
  categories,
  fifthProductPlaceholder,
  slugify
} = catalog;

const isValidUrl = (value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

test('catalogue contains four products with unique IDs', () => {
  assert.equal(products.length, 4);

  const ids = products.map((product) => product.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every product has valid basic information', () => {
  for (const product of products) {
    assert.ok(product.id);
    assert.ok(product.name);
    assert.ok(product.description);
    assert.ok(categories.includes(product.category));
    assert.ok(['Jumia', 'Temu', 'Other'].includes(product.network));
    assert.ok(Array.isArray(product.features));
    assert.ok(Array.isArray(product.images));
  }
});

test('only eligible products appear in activeProducts', () => {
  assert.equal(activeProducts.length, 3);

  for (const product of activeProducts) {
    assert.equal(product.active, true);
    assert.ok(isValidUrl(product.affiliateUrl));
    assert.ok(product.images.length > 0);

    for (const image of product.images) {
      assert.ok(isValidUrl(image));
    }
  }
});

test('Itel power bank remains inactive until approved links are supplied', () => {
  const itel = products.find(
    (product) => product.id === 'itel-20000mah-power-bank'
  );

  assert.ok(itel);
  assert.equal(itel.active, false);
  assert.equal(itel.affiliateUrl, '');
  assert.deepEqual(itel.images, []);
  assert.ok(!activeProducts.includes(itel));
});

test('fifth product placeholder remains inactive', () => {
  assert.equal(fifthProductPlaceholder.active, false);
  assert.match(fifthProductPlaceholder.label, /Product 5/);
});

test('category slug generation works correctly', () => {
  assert.equal(slugify('Power & Charging'), 'power-and-charging');
  assert.equal(slugify('Home & Living'), 'home-and-living');
});
