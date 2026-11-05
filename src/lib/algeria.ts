import type { Locale } from "./i18n";

/**
 * Delivery pricing per wilaya.
 *
 * The fees below are launch prices (DZD) and live in one place so they can be
 * tuned without touching the checkout UI. "desk" = pickup at a delivery office.
 */
export type DeliveryMode = "home" | "desk";

export type Zone = "centre" | "north" | "highland" | "south" | "deep";

export const deliveryFees: Record<Zone, Record<DeliveryMode, number>> = {
  centre: { home: 500, desk: 300 },
  north: { home: 650, desk: 350 },
  highland: { home: 750, desk: 400 },
  south: { home: 950, desk: 500 },
  deep: { home: 1300, desk: 700 },
};

export type Wilaya = {
  code: number;
  ar: string;
  en: string;
  zone: Zone;
  /**
   * For the eleven wilayas created in 2026 (codes 59–69), the wilaya that still
   * runs them until their own institutions are installed (at most 31 Dec 2026,
   * Law 26-06 amending Law 84-09).
   */
  parentCode?: number;
};

/**
 * Law 26-06 (Journal Officiel no. 25 of 2026) created eleven wilayas on top of
 * the historical 58. Their numbers and chief towns are fixed by the executive
 * decree published in Journal Officiel no. 40 of 2026: 59 Aflou … 69 El Abiodh
 * Sidi Cheikh. Their delivery zones mirror the wilaya they were cut from.
 */
export const NEW_WILAYA_FROM = 59;

export const wilayas: Wilaya[] = [
  { code: 1, ar: "أدرار", en: "Adrar", zone: "deep" },
  { code: 2, ar: "الشلف", en: "Chlef", zone: "north" },
  { code: 3, ar: "الأغواط", en: "Laghouat", zone: "south" },
  { code: 4, ar: "أم البواقي", en: "Oum El Bouaghi", zone: "highland" },
  { code: 5, ar: "باتنة", en: "Batna", zone: "highland" },
  { code: 6, ar: "بجاية", en: "Béjaïa", zone: "north" },
  { code: 7, ar: "بسكرة", en: "Biskra", zone: "south" },
  { code: 8, ar: "بشار", en: "Béchar", zone: "south" },
  { code: 9, ar: "البليدة", en: "Blida", zone: "centre" },
  { code: 10, ar: "البويرة", en: "Bouira", zone: "north" },
  { code: 11, ar: "تمنراست", en: "Tamanrasset", zone: "deep" },
  { code: 12, ar: "تبسة", en: "Tébessa", zone: "highland" },
  { code: 13, ar: "تلمسان", en: "Tlemcen", zone: "north" },
  { code: 14, ar: "تيارت", en: "Tiaret", zone: "highland" },
  { code: 15, ar: "تيزي وزو", en: "Tizi Ouzou", zone: "north" },
  { code: 16, ar: "الجزائر", en: "Alger", zone: "centre" },
  { code: 17, ar: "الجلفة", en: "Djelfa", zone: "highland" },
  { code: 18, ar: "جيجل", en: "Jijel", zone: "north" },
  { code: 19, ar: "سطيف", en: "Sétif", zone: "north" },
  { code: 20, ar: "سعيدة", en: "Saïda", zone: "highland" },
  { code: 21, ar: "سكيكدة", en: "Skikda", zone: "north" },
  { code: 22, ar: "سيدي بلعباس", en: "Sidi Bel Abbès", zone: "north" },
  { code: 23, ar: "عنابة", en: "Annaba", zone: "north" },
  { code: 24, ar: "قالمة", en: "Guelma", zone: "north" },
  { code: 25, ar: "قسنطينة", en: "Constantine", zone: "north" },
  { code: 26, ar: "المدية", en: "Médéa", zone: "highland" },
  { code: 27, ar: "مستغانم", en: "Mostaganem", zone: "north" },
  { code: 28, ar: "المسيلة", en: "M'Sila", zone: "highland" },
  { code: 29, ar: "معسكر", en: "Mascara", zone: "north" },
  { code: 30, ar: "ورقلة", en: "Ouargla", zone: "south" },
  { code: 31, ar: "وهران", en: "Oran", zone: "north" },
  { code: 32, ar: "البيض", en: "El Bayadh", zone: "highland" },
  { code: 33, ar: "إليزي", en: "Illizi", zone: "deep" },
  { code: 34, ar: "برج بوعريريج", en: "Bordj Bou Arréridj", zone: "north" },
  { code: 35, ar: "بومرداس", en: "Boumerdès", zone: "centre" },
  { code: 36, ar: "الطارف", en: "El Tarf", zone: "north" },
  { code: 37, ar: "تندوف", en: "Tindouf", zone: "deep" },
  { code: 38, ar: "تيسمسيلت", en: "Tissemsilt", zone: "highland" },
  { code: 39, ar: "الوادي", en: "El Oued", zone: "south" },
  { code: 40, ar: "خنشلة", en: "Khenchela", zone: "highland" },
  { code: 41, ar: "سوق أهراس", en: "Souk Ahras", zone: "highland" },
  { code: 42, ar: "تيبازة", en: "Tipaza", zone: "centre" },
  { code: 43, ar: "ميلة", en: "Mila", zone: "north" },
  { code: 44, ar: "عين الدفلى", en: "Aïn Defla", zone: "north" },
  { code: 45, ar: "النعامة", en: "Naâma", zone: "highland" },
  { code: 46, ar: "عين تموشنت", en: "Aïn Témouchent", zone: "north" },
  { code: 47, ar: "غرداية", en: "Ghardaïa", zone: "south" },
  { code: 48, ar: "غليزان", en: "Relizane", zone: "north" },
  { code: 49, ar: "تيميمون", en: "Timimoun", zone: "deep" },
  { code: 50, ar: "برج باجي مختار", en: "Bordj Badji Mokhtar", zone: "deep" },
  { code: 51, ar: "أولاد جلال", en: "Ouled Djellal", zone: "south" },
  { code: 52, ar: "بني عباس", en: "Béni Abbès", zone: "deep" },
  { code: 53, ar: "عين صالح", en: "In Salah", zone: "deep" },
  { code: 54, ar: "عين قزام", en: "In Guezzam", zone: "deep" },
  { code: 55, ar: "تقرت", en: "Touggourt", zone: "south" },
  { code: 56, ar: "جانت", en: "Djanet", zone: "deep" },
  { code: 57, ar: "المغير", en: "El M'Ghair", zone: "south" },
  { code: 58, ar: "المنيعة", en: "El Meniaa", zone: "south" },
  // Created by Law 26-06 (2026); numbered by the executive decree in JO 40/2026.
  { code: 59, ar: "آفلو", en: "Aflou", zone: "south", parentCode: 3 },
  { code: 60, ar: "بريكة", en: "Barika", zone: "highland", parentCode: 5 },
  { code: 61, ar: "القنطرة", en: "El Kantara", zone: "south", parentCode: 7 },
  { code: 62, ar: "بئر العاتر", en: "Bir El Ater", zone: "highland", parentCode: 12 },
  { code: 63, ar: "العريشة", en: "El Aricha", zone: "north", parentCode: 13 },
  { code: 64, ar: "قصر الشلالة", en: "Ksar Chellala", zone: "highland", parentCode: 14 },
  { code: 65, ar: "عين وسارة", en: "Aïn Ouessara", zone: "highland", parentCode: 17 },
  { code: 66, ar: "مسعد", en: "Messaad", zone: "highland", parentCode: 17 },
  { code: 67, ar: "قصر البخاري", en: "Ksar El Boukhari", zone: "highland", parentCode: 26 },
  { code: 68, ar: "بوسعادة", en: "Bou Saada", zone: "highland", parentCode: 28 },
  { code: 69, ar: "الأبيض سيدي الشيخ", en: "El Abiodh Sidi Cheikh", zone: "highland", parentCode: 32 },
];

export const WILAYAS_COUNT = wilayas.length;

export function isNewWilaya(wilaya: Wilaya): boolean {
  return wilaya.code >= NEW_WILAYA_FROM;
}

export function getWilaya(code: number): Wilaya | undefined {
  return wilayas.find((wilaya) => wilaya.code === code);
}

export function wilayaName(wilaya: Wilaya, locale: Locale): string {
  return locale === "ar" ? wilaya.ar : wilaya.en;
}

export function deliveryFee(code: number, mode: DeliveryMode): number {
  const wilaya = getWilaya(code);
  if (!wilaya) return 0;
  return deliveryFees[wilaya.zone][mode];
}
