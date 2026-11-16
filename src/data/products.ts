export const categories = [
  'Power & Charging', 'Phone Accessories', 'Audio', 'Smart Gadgets',
  'Home & Living', 'Kitchen', 'Lighting', 'Car Accessories', 'Beauty', 'Travel', 'Other Deals'
] as const;

export type Product = {
  id: string;
  name: string;
  category: typeof categories[number];
  network: 'Jumia' | 'Temu' | 'Other';
  description: string;
  features: string[];
  price?: number;
  currency?: string;
  affiliateUrl: string;
  referenceUrl?: string;
  images: string[];
  active: boolean;
  featured: boolean;
  trending: boolean;
};

export const products: Product[] = [
  {
    id: '60000mah-65w-power-bank-built-in-cables',
    name: '60,000mAh Power Bank with 65W Fast Charging',
    category: 'Power & Charging',
    network: 'Jumia',
    description: 'A high-capacity portable power bank advertised with 65W fast charging, built-in charging cables, multiple device outputs, and a digital battery display.',
    features: ['Advertised 60,000mAh capacity', 'Advertised 65W fast charging', 'Built-in charging cables', 'Multiple device outputs', 'Digital battery display'],
    affiliateUrl: 'https://jmia.io/o65w6cx',
    images: [
      'https://ng.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/53/7468814/1.jpg?2307',
      'https://ng.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/53/7468814/3.jpg?2704',
      'https://ng.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/53/7468814/4.jpg?2704'
    ], active: true, featured: true, trending: true
  },
  {
    id: '60000mah-65w-fast-charging-power-bank',
    name: '60,000mAh 65W Fast-Charging Power Bank',
    category: 'Power & Charging',
    network: 'Jumia',
    description: 'A portable power bank advertised with 60,000mAh capacity, PD 65W charging, four charging outputs, and Type-C connectivity.',
    features: ['Advertised 60,000mAh capacity', 'PD 65W charging', 'Four charging outputs', 'Type-C connectivity'],
    affiliateUrl: 'https://jmia.io/GkCcLk4',
    images: [
      'https://ng.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/14/3533914/1.jpg?2936',
      'https://ng.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/14/3533914/2.jpg?2936'
    ], active: true, featured: true, trending: false
  },
  {
    id: 'foldable-mosquito-swatter-uv-trap',
    name: '2-in-1 Foldable Electric Mosquito Swatter and UV Trap Lamp',
    category: 'Home & Living',
    network: 'Jumia',
    description: 'A rechargeable foldable mosquito swatter advertised with manual swatter and automatic UV trap modes, USB Type-C charging, and a standing base.',
    features: ['Manual swatter and automatic UV trap modes', 'USB Type-C charging', 'Foldable design', 'Standing base'],
    affiliateUrl: 'https://jmia.io/yJW6tME',
    images: [
      'https://ng.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/20/3663014/1.jpg?7323',
      'https://ng.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/20/3663014/2.jpg?6982',
      'https://ng.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/20/3663014/7.jpg?5738'
    ], active: true, featured: true, trending: true
  },
  {
    id: 'itel-20000mah-power-bank',
    name: 'Itel 20,000mAh Power Bank',
    category: 'Power & Charging',
    network: 'Jumia',
    description: 'Awaiting the owner’s approved affiliate URL and product image links. This product is not available for promotion yet.',
    features: [],
    affiliateUrl: '',
    referenceUrl: 'https://www.jumia.com.ng/20000mah-power-bank-12w-type-c-3-port-output-led-flashlight-itel-mpg12107278.html',
    images: [], active: false, featured: false, trending: false
  }
];

export const fifthProductPlaceholder = {
  label: 'Product 5 — details to be supplied by the owner',
  active: false as const
};

export const activeProducts = products.filter((product) => product.active && product.affiliateUrl && product.images.length > 0);
export const slugify = (value: string) => value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
