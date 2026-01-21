import referenceTable from './referenceTable.json';

// Define valid input range boundaries based on the reference table
// Min: Week 14 mean - 4SD
// Max: Week 40 mean + 4SD
const minRow = referenceTable[0];
const maxRow = referenceTable[referenceTable.length - 1];

export const MIN_VALID_HC = minRow.mu - 4 * minRow.sd;
export const MAX_VALID_HC = maxRow.mu + 4 * maxRow.sd;

// --- Types & Interfaces ---

// Structure of a single row in your reference table (from the CSV/JSON)
interface ReferenceRow {
  pregweek: number; // Gestational Age in weeks (decimal)
  mu: number;       // Mean Head Circumference
  sd: number;       // Standard Deviation
}

// Return type for the gestational age estimation
interface GestationalAgeResult {
  estimatedAge: { weeks: number; days: number } | string | null;
  confidenceInterval: {
    min: { weeks: number; days: number } | null;
    max: { weeks: number; days: number } | null;
  };
}

// --- Math Helper Functions ---

/**
 * Standard Normal Cumulative Distribution Function (CDF).
 * Converts a Z-score into a percentile (0-1).
 * Uses the Abramowitz & Stegun approximation (standard for non-stat environments).
 */
function pnorm(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  // If z > 0, we want the area to the left, so 1 - p (since the algo calculates the tail)
  if (z > 0) p = 1 - p;
  return p;
}

/**
 * Linear Interpolation.
 * Finds a Y value for a given X, based on two surrounding points in the data.
 */
function interpolate(
  x: number,
  data: ReferenceRow[],
  xKey: keyof ReferenceRow,
  yKey: keyof ReferenceRow
): number | null {
  // Ensure data is sorted by xKey before searching
  const sorted = [...data].sort((a, b) => a[xKey] - b[xKey]);

  // Check boundaries
  if (x < sorted[0][xKey] || x > sorted[sorted.length - 1][xKey]) {
    return null; // Out of range
  }

  // Find the interval [x0, x1] containing x
  for (let i = 0; i < sorted.length - 1; i++) {
    if (x >= sorted[i][xKey] && x <= sorted[i + 1][xKey]) {
      const x0 = sorted[i][xKey];
      const x1 = sorted[i + 1][xKey];
      const y0 = sorted[i][yKey];
      const y1 = sorted[i + 1][yKey];

      // Avoid division by zero
      if (x1 === x0) return y0;

      // Linear interpolation formula: y = y0 + (slope * distance)
      return y0 + (x - x0) * ((y1 - y0) / (x1 - x0));
    }
  }
  return null;
}

/**
 * Reverse Lookup / Inverse Interpolation.
 * We need this to find the Week (Y) given a Head Circumference (X).
 * Since the table is mapped Week -> HC, we perform a reverse search.
 * * @param targetValue The measured HC value we are looking for.
 * @param valueExtractor Function to get the specific curve value (e.g., Mean, Mean + 2SD).
 */
function findWeekForMetric(
  targetValue: number,
  valueExtractor: (row: ReferenceRow) => number
): number | null {
  // 1. Create a virtual dataset mapping: { value -> week }
  // We filter out any potential non-monotonic data to ensure safe search
  const virtualData = referenceTable
    .map((row) => ({
      week: row.pregweek,
      val: valueExtractor(row),
    }))
    .sort((a, b) => a.val - b.val); // MUST sort by value to search

  const minVal = virtualData[0].val;
  const maxVal = virtualData[virtualData.length - 1].val;

  // 2. Perform interpolation on the virtual reversed dataset
  // Note: We now allow extrapolation if the value is outside [minVal, maxVal]
  // but passed the validation check elsewhere.

  // Extrapolate below the Minimum
  if (targetValue < minVal) {
    const x0 = virtualData[0].val;
    const x1 = virtualData[1].val;
    const y0 = virtualData[0].week;
    const y1 = virtualData[1].week;
    // Slope
    const m = (y1 - y0) / (x1 - x0);
    return y0 + (targetValue - x0) * m;
  }

  // Extrapolate above the Maximum
  if (targetValue > maxVal) {
    const n = virtualData.length;
    const x0 = virtualData[n - 2].val;
    const x1 = virtualData[n - 1].val;
    const y0 = virtualData[n - 2].week;
    const y1 = virtualData[n - 1].week;
    const m = (y1 - y0) / (x1 - x0);
    return y1 + (targetValue - x1) * m;
  }

  // Interpolate within Range
  for (let i = 0; i < virtualData.length - 1; i++) {
    if (targetValue >= virtualData[i].val && targetValue <= virtualData[i + 1].val) {
      const x0 = virtualData[i].val;
      const x1 = virtualData[i + 1].val;
      const y0 = virtualData[i].week;
      const y1 = virtualData[i + 1].week;

      if (x1 === x0) return y0;

      return y0 + (targetValue - x0) * ((y1 - y0) / (x1 - x0));
    }
  }
  return null;
}

/**
 * Helper to convert decimal weeks (e.g., 20.14) to { weeks: 20, days: 1 }
 */
function decimalWeeksToTime(decimalWeeks: number | null): { weeks: number; days: number } | null {
  if (decimalWeeks === null) return null;

  const w = Math.floor(decimalWeeks);
  const d = Math.round((decimalWeeks - w) * 7);

  // Handle rounding edge case (e.g. 19 weeks + 7 days -> 20 weeks + 0 days)
  if (d === 7) {
    return { weeks: w + 1, days: 0 };
  }
  return { weeks: w, days: d };
}


// --- Main Exported Functions ---

/**
 * FEATURE 1: Get Head Circumference Percentile
 * Calculates the exact percentile for a fetus given its age and HC measurement.
 */
export function getHcPercentile(weeks: number, days: number, hc_mm: number): number | null {
  // 1. Convert input to decimal gestational age
  const ga_weeks = weeks + days / 7;

  // 2. Get the expected Mean (mu) and SD for this exact age
  const mu_hat = interpolate(ga_weeks, referenceTable, 'pregweek', 'mu');
  const sd_hat = interpolate(ga_weeks, referenceTable, 'pregweek', 'sd');

  if (mu_hat === null || sd_hat === null) {
    // Age is outside the reference table range (e.g. before week 14 or after 40)
    return null;
  }

  // 3. Calculate Z-Score: (Value - Mean) / SD
  const z = (hc_mm - mu_hat) / sd_hat;

  // 4. Convert Z-Score to Percentile (0-100)
  const percentile = pnorm(z) * 100;

  return Math.round(percentile);
}

/**
 * FEATURE 2: Estimate Gestational Age (Dating by Biometry)
 * Calculates the estimated age based on HC, including a Confidence Interval.
 * * Logic for Confidence Interval:
 * - We find the age where the measured HC would be the Mean (50th percentile).
 * - We find the age where the measured HC would be the +2SD limit (97.7th percentile). This gives the YOUNGEST possible age.
 * - We find the age where the measured HC would be the -2SD limit (2.3th percentile). This gives the OLDEST possible age.
 */
export function estimateGestationalAge(hc_mm: number): GestationalAgeResult {

  // A. Point Estimate (Best Guess): Intersection with Mean curve
  const exactWeekMean = findWeekForMetric(hc_mm, (row) => row.mu);

  let estimatedAgeResult: { weeks: number; days: number } | string | null = null;

  if (exactWeekMean !== null) {
    if (exactWeekMean > 40) {
      estimatedAgeResult = "More than 40 weeks";
    } else if (exactWeekMean < 14) {
      estimatedAgeResult = "Less than 14 weeks";
    } else {
      estimatedAgeResult = decimalWeeksToTime(exactWeekMean);
    }
  }

  // B. Confidence Interval Bounds (95% CI roughly corresponds to ±2 SD)

  // Lower Bound of Age:
  // If the fetus has a large head (e.g., +2SD curve), they are actually younger than the mean estimate.
  // So we look for where HC matches (Mean + 2*SD).
  const minWeek = findWeekForMetric(hc_mm, (row) => row.mu + 2 * row.sd);

  // Upper Bound of Age:
  // If the fetus has a small head (e.g., -2SD curve), they are actually older than the mean estimate.
  // So we look for where HC matches (Mean - 2*SD).
  const maxWeek = findWeekForMetric(hc_mm, (row) => row.mu - 2 * row.sd);

  return {
    estimatedAge: estimatedAgeResult,
    confidenceInterval: {
      min: decimalWeeksToTime(minWeek), // "Youngest" plausible age
      max: decimalWeeksToTime(maxWeek), // "Oldest" plausible age
    },
  };
}