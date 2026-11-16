
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ProductCard from '../../components/ProductCard.astro';
import { activeProducts, categories, slugify } from '../../data/products';

export function getStaticPaths() {
  return categories.map((category) => ({
    params: { slug: slugify(category) },
    props: { category },
  }));
}

const { category } = Astro.props;
const items = activeProducts.filter((product) => product.category === category);
---

<BaseLayout
  title={`${category} Deals | God First Deals`}
  description={`Browse curated ${category.toLowerCase()} finds from God First Deals.`}
>
  <main id="main" class="shell listing-page">
    <div class="breadcrumbs">
      <a href="/">Home</a>
      <span> / </span>
      <a href="/categories/">Categories</a>
      <span> / {category}</span>
    </div>

    <span class="eyebrow">BROWSE THE EDIT</span>
    <h1>{category}</h1>
    <p class="page-intro">
      Thoughtfully gathered picks in {category.toLowerCase()}.
    </p>

    {items.length ? (
      <div class="product-grid">
        {items.map((product) => <ProductCard product={product} />)}
      </div>
    ) : (
      <div class="empty-category">
        <span>✳</span>
        <h2>More good finds are on the way.</h2>
        <p>
          There are no active products in this category just yet.
          Explore another collection in the meantime.
        </p>
        <a class="button button-dark" href="/categories/">
          Browse categories ↗
        </a>
      </div>
    )}
  </main>
</BaseLayout>
