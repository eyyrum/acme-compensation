/**
 * Salary generation model.
 *
 * Real compensation is log-normally distributed: bounded below, with a long
 * right tail, and a median below the mean. Uniform random values would produce
 * a flat histogram, a median equal to the mean, and no outliers — making every
 * dashboard look broken and the outlier detection find nothing.
 *
 * salary = departmentMedian x marketFactor x seniorityFactor x lognormal(sigma)
 */

/** Box-Muller transform: uniform [0,1) -> standard normal. */
export function standardNormal(rand: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Multiplier with median 1.0 and the given log-space spread.
 * sigma 0.18 gives roughly a 0.75x-1.35x interquartile spread, which matches
 * observed within-band salary dispersion.
 */
export function logNormalMultiplier(rand: () => number, sigma = 0.18): number {
  return Math.exp(standardNormal(rand) * sigma);
}

/**
 * Seniority is inferred from the title's position in its department's ladder,
 * which is ordered junior-to-senior in the reference data. Index 0 pays
 * about 0.7x the department median, the top rung about 2.1x.
 */
export function seniorityFactor(titleIndex: number, ladderSize: number): number {
  if (ladderSize <= 1) return 1;
  const position = titleIndex / (ladderSize - 1);
  return 0.7 + position * 1.4;
}

export interface SalaryInputs {
  departmentMedianUsd: number;
  marketFactor: number;
  titleIndex: number;
  ladderSize: number;
  rand: () => number;
}

/** Annual base salary in USD major units, before conversion to local currency. */
export function generateSalaryUsd(input: SalaryInputs): number {
  const { departmentMedianUsd, marketFactor, titleIndex, ladderSize, rand } = input;

  const raw =
    departmentMedianUsd *
    marketFactor *
    seniorityFactor(titleIndex, ladderSize) *
    logNormalMultiplier(rand);

  // Round to the nearest 500 USD — real salaries are not arbitrary decimals.
  return Math.round(raw / 500) * 500;
}

/**
 * USD major -> local currency minor units.
 * rateToUsd is "1 unit of local = N USD", so we divide.
 */
export function toLocalMinorUnits(
  usdMajor: number,
  rateToUsd: number,
  minorUnits: number,
): bigint {
  const localMajor = usdMajor / rateToUsd;
  const rounded = Math.round(localMajor / 1000) * 1000;
  return BigInt(Math.round(rounded * 10 ** minorUnits));
}