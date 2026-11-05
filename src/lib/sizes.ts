/**
 * The size chart shown on /{ar|en}/sizes.
 *
 * Mirrors the owner's reference chart: size, weight and height only.
 * Values are ranges in kilograms and centimetres; "85+" and "180+" mean
 * "that number and above". Replace the rows here when the workshop changes
 * its sizing — the page renders the data as-is.
 */
export type SizeChartRow = {
  size: string;
  /** Body weight range in kilograms, e.g. "45–55" or "85+". */
  weight: string;
  /** Body height range in centimetres. */
  height: string;
};

export const sizeChart: SizeChartRow[] = [
  { size: "S", weight: "45–55", height: "150–164" },
  { size: "M", weight: "56–70", height: "164–173" },
  { size: "L", weight: "70–85", height: "174–179" },
  { size: "XL", weight: "85+", height: "180+" },
];
