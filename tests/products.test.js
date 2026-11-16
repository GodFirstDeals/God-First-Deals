import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const productsFile = new URL('../src/data/products.ts', import.meta.url);
const source = readFileSync(productsFile, 'utf8');

const { outputText, diagnostics = [] } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
  reportDiagnostics: true,
});

const errors = diagnostics.filter(
  (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
);

assert.deepEqual(
  errors,
  [],
  'src/data/products.ts should transpile without errors'
);

const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
const { activeProducts, categories, products, slugify } = await import(moduleUrl);

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

const allowedNetworks = ['Jumia', 'Temu', 'Other'];

function assertValidUrl(value, label) {
  assert.equal(typeof value, 'string', `${label} must be a string`);
  const parsed = new URL(value);
  assert.ok(
    parsed.protocol === 'http:' || parsed.protocol === 'https:',
    `${label} must use http or https`
  );
}

test('product IDs are unique', () => {
  const ids = products.map((product) => product.id);
  assert.equal(
    new Set(ids).size,
    ids.length,
    'product IDs must not be duplicated'
  );
});

test('every product has the required fields with valid basic types', () => {
  for (const product of products) {
    for (const field of requiredFields) {
      assert.ok(
        Object.hasOwn(product, field),
        `${product.id}: missing required field "${field}"`
      );
    }

    for (const field of ['id', 'name', 'category', 'network', 'description']) {
      assert.equal(
        typeof product[field],
        'string',
        `${product.id}: ${field} must be a string`
      );
      assert.ok(
        product[field].trim(),
        `${product.id}: ${field} must not be empty`
      );
    }

    assert.ok(
      Array.isArray(product.features),
      `${product.id}: features must be an array`
    );
    assert.ok(
      product.features.every((feature) => typeof feature === 'string'),
      `${product.id}: all features must be strings`
    );

    assert.ok(
      Array.isArray(product.images),
      `${product.id}: images must be an array`
    );

    for (const field of ['active', 'featured', 'trending']) {
      assert.equal(
        typeof product[field],
        'boolean',
        `${product.id}: ${field} must be a boolean`
      );
    }
  }
});

test('product prices are valid when provided', () => {
  for (const product of products) {
    if (product.price !== undefined) {
      assert.equal(
        typeof product.price,
        'number',
        `${product.id}: price must be a number`
      );
      assert.ok(
        Number.isFinite(product.price),
        `${product.id}: price must be finite`
      );
      assert.ok(
        product.price > 0,
        `${product.id}: price must be greater than zero`
      );
    }

    if (product.currency !== undefined) {
      assert.equal(
        typeof product.currency,
        'string',
        `${product.id}: currency must be a string`
      );
      assert.ok(
        product.currency.trim(),
        `${product.id}: currency must not be empty`
      );
    }
  }
});

test('product images are valid URLs; active products have at least one image', () => {
  for (const product of products) {
    assert.ok(
      product.images.length > 0 || !product.active,
      `${product.id}: active products must have at least one image`
    );

    for (const image of product.images) {
      assertValidUrl(image, `${product.id}: image URL`);
    }
  }
});

test('product links are valid URLs when present', () => {
  for (const product of products) {
    if (product.affiliateUrl) {
      assertValidUrl(product.affiliateUrl, `${product.id}: affiliateUrl`);
    } else {
      assert.equal(
        product.active,
        false,
        `${product.id}: active products need an affiliate URL`
      );
    }

    if (product.referenceUrl !== undefined) {
      assertValidUrl(product.referenceUrl, `${product.id}: referenceUrl`);
    }
  }
});

test('every product references a defined category', () => {
  assert.ok(Array.isArray(categories), 'categories must be an array');

  for (const product of products) {
    assert.ok(
      categories.includes(product.category),
      `${product.id}: unknown category "${product.category}"`
    );
  }
});

test('categories are non-empty, unique, and have unique URL slugs', () => {
  assert.ok(categories.length > 0, 'the catalog must define at least one category');

  for (const category of categories) {
    assert.equal(typeof category, 'string', 'categories must be strings');
    assert.ok(category.trim(), 'categories must not be empty');
    assert.ok(slugify(category), `${category}: category slug must not be empty`);
  }

  assert.equal(
    new Set(categories).size,
    categories.length,
    'categories must not be duplicated'
  );
  assert.equal(
    new Set(categories.map(slugify)).size,
    categories.length,
    'category URL slugs must not collide'
  );
});

test('product IDs are safe, non-empty URL path segments', () => {
  for (const product of products) {
    assert.match(
      product.id,
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      `${product.id}: ID must be lowercase kebab-case`
    );
  }
});

test('products use supported marketplace networks', () => {
  for (const product of products) {
    assert.ok(
      allowedNetworks.includes(product.network),
      `${product.id}: unsupported network "${product.network}"`
    );
  }
});

test('features are non-empty strings', () => {
  for (const product of products) {
    for (const [index, feature] of product.features.entries()) {
      assert.ok(
        feature.trim(),
        `${product.id}: feature ${index + 1} must not be empty`
      );
    }
  }
});

test('active products are complete and not included in promotional sections when inactive', () => {
  for (const product of products) {
    if (product.active) {
      assert.ok(product.affiliateUrl, `${product.id}: active products need an affiliate URL`);
      assert.ok(product.images.length > 0, `${product.id}: active products need images`);
    } else {
      assert.equal(product.featured, false, `${product.id}: inactive products cannot be featured`);
      assert.equal(product.trending, false, `${product.id}: inactive products cannot be trending`);
    }
  }
});

test('activeProducts contains exactly the complete active catalog entries', () => {
  const expected = products.filter(
    (product) => product.active && product.affiliateUrl && product.images.length > 0
  );

  assert.deepEqual(activeProducts, expected);
  assert.ok(
    activeProducts.every((product) => products.includes(product)),
    'activeProducts must only contain catalog entries'
  );
});
