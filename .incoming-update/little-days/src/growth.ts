import references from "../assets/who/percentiles-0-24.json";

export type GrowthMetric = "weight" | "length" | "head";
export type GrowthSex = "male" | "female" | "unspecified";
export interface ReferencePoint {
  months: number;
  p3: number;
  p15: number;
  p50: number;
  p85: number;
  p97: number;
}

/** WHO monthly reference points, kg for weight and cm for length/head.
 * Lines between monthly points are a visual aid, not a clinical percentile
 * calculation. Never extrapolates past 24 months or assumes an unknown sex.
 */
export function referenceSeries(
  metric: GrowthMetric,
  sex: GrowthSex,
  maxMonths = 24,
): ReferencePoint[] {
  if (sex === "unspecified" || !Number.isFinite(maxMonths) || maxMonths < 0)
    return [];
  const series: ReferencePoint[] = references[`${metric}-${sex}`];
  return series
    .filter((point) => point.months <= Math.min(24, maxMonths))
    .map((point) => ({ ...point }));
}
