import type { Locale } from "./i18n";

export const garmentTypes = ["tee", "oversized", "hoodie", "sweatshirt", "cap"] as const;

export type GarmentType = (typeof garmentTypes)[number];

export type Localized = Record<Locale, string>;

export function isGarmentType(value: string | undefined): value is GarmentType {
  return Boolean(value) && (garmentTypes as readonly string[]).includes(value as string);
}

/** Singular label used on product cards and filter chips. */
export const garmentLabels: Record<GarmentType, Localized> = {
  tee: { ar: "تيشيرت", en: "T-Shirt" },
  oversized: { ar: "تيشيرت واسع", en: "Oversized T-Shirt" },
  hoodie: { ar: "هودي", en: "Hoodie" },
  sweatshirt: { ar: "سويت شيرت", en: "Sweatshirt" },
  cap: { ar: "كاب", en: "Cap" },
};

/** Plural label used for the five homepage collection cards. */
export const garmentCollections: Record<GarmentType, Localized> = {
  tee: { ar: "تيشيرتات", en: "T-Shirts" },
  oversized: { ar: "تيشيرتات واسعة", en: "Oversized T-Shirts" },
  hoodie: { ar: "هوديز", en: "Hoodies" },
  sweatshirt: { ar: "سويت شيرتات", en: "Sweatshirts" },
  cap: { ar: "كابات", en: "Caps" },
};

export type Color = {
  name: Localized;
  hex: string;
};

export type Product = {
  slug: string;
  name: Localized;
  type: GarmentType;
  price: number;
  compareAt?: number;
  colors: Color[];
  sizes: string[];
  blurb: Localized;
  details: { ar: string[]; en: string[] };
  featured: boolean;
};

const ink: Color = { name: { ar: "أسود", en: "Black" }, hex: "#111110" };
const bone: Color = { name: { ar: "أبيض عاجي", en: "Bone" }, hex: "#EDE8DD" };
const sand: Color = { name: { ar: "رملي", en: "Sand" }, hex: "#D8C7AC" };
const slate: Color = { name: { ar: "رمادي", en: "Slate" }, hex: "#7C7C78" };

export const products: Product[] = [
  {
    slug: "essential-tee",
    name: { ar: "قميص أساسي", en: "Essential Tee" },
    type: "tee",
    price: 2900,
    colors: [ink, bone, sand],
    sizes: ["S", "M", "L", "XL"],
    blurb: {
      ar: "قطن مُمشّط 180غ. قَصّة مستقيمة، خياطة مزدوجة، أساس كل خزانة.",
      en: "180gsm combed cotton. Straight cut, double stitching, the base of every wardrobe.",
    },
    details: {
      ar: ["100% قطن مُمشّط", "وزن 180 غ/م²", "قَصّة عادية", "قابل للغسل في 30°"],
      en: ["100% combed cotton", "180 gsm", "Regular fit", "Wash at 30°"],
    },
    featured: true,
  },
  {
    slug: "oversized-tee",
    name: { ar: "قميص واسع", en: "Oversized Tee" },
    type: "oversized",
    price: 3400,
    colors: [ink, bone],
    sizes: ["M", "L", "XL"],
    blurb: {
      ar: "قطن ثقيل 220غ بقَصّة واسعة وأكتاف مسدلة. مساحة أكبر للتصميم.",
      en: "220gsm heavy cotton with a boxy cut and dropped shoulders. More room for the design.",
    },
    details: {
      ar: ["100% قطن", "وزن 220 غ/م²", "قَصّة واسعة", "أكتاف مسدلة"],
      en: ["100% cotton", "220 gsm", "Boxy fit", "Dropped shoulders"],
    },
    featured: true,
  },
  {
    slug: "heavy-hoodie",
    name: { ar: "هودي ثقيل", en: "Heavy Hoodie" },
    type: "hoodie",
    price: 5900,
    colors: [ink, slate, bone],
    sizes: ["S", "M", "L", "XL"],
    blurb: {
      ar: "قطن مبطن 380غ، غطاء مزدوج، جيب أمامي مساحته مناسبة للطباعة الكبيرة.",
      en: "380gsm brushed cotton, double-lined hood, front pocket sized for large prints.",
    },
    details: {
      ar: ["قطن مبطن 380 غ/م²", "غطاء مزدوج الطبقة", "جيب أمامي", "أساور مضلعة"],
      en: ["380 gsm fleece", "Double-layer hood", "Front pocket", "Ribbed cuffs"],
    },
    featured: true,
  },
  {
    slug: "crew-sweatshirt",
    name: { ar: "سويت شيرت", en: "Crew Sweatshirt" },
    type: "sweatshirt",
    price: 4700,
    colors: [ink, sand, slate],
    sizes: ["S", "M", "L", "XL"],
    blurb: {
      ar: "قطن مبطن 340غ بياقة مضلعة. قطعة بين القميص والهودي، تناسب الطباعة الصغيرة.",
      en: "340gsm fleece with a ribbed collar. Between a tee and a hoodie, ideal for small prints.",
    },
    details: {
      ar: ["قطن مبطن 340 غ/م²", "ياقة مضلعة", "قَصّة مستقيمة", "بطانة ناعمة"],
      en: ["340 gsm fleece", "Ribbed collar", "Regular fit", "Soft brushed inside"],
    },
    featured: false,
  },
  {
    slug: "canvas-cap",
    name: { ar: "كاب قماشي", en: "Canvas Cap" },
    type: "cap",
    price: 2200,
    colors: [ink, bone, sand],
    sizes: ["ONE"],
    blurb: {
      ar: "كاب ستة قطع بقماش متين وإغلاق خلفي قابل للتعديل. مساحة صغيرة للتصميم.",
      en: "Six-panel cap in durable canvas with an adjustable back. A small print area.",
    },
    details: {
      ar: ["قماش قطني متين", "ستة قطع", "إغلاق خلفي معدني", "مقاس قابل للتعديل"],
      en: ["Durable cotton canvas", "Six panels", "Metal back closure", "Adjustable fit"],
    },
    featured: false,
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function getProductSlugs(): string[] {
  return products.map((product) => product.slug);
}

export function formatPrice(value: number, locale: Locale): string {
  const number = new Intl.NumberFormat("en-US").format(value);
  return locale === "ar" ? `${number} د.ج` : `${number} DA`;
}
