import { CONDITION_RESALE_FACTORS, DEMAND_FACTOR_MIN, DEMAND_FACTOR_MAX } from './config';
import type { Grade } from './types';

export function computePrice(
  originalPrice: number,
  condition: Grade['condition'],
  nearbyDemand: number,
): number {
  const conditionFactor = CONDITION_RESALE_FACTORS[condition] ?? 0.30;
  const demandFactor = DEMAND_FACTOR_MIN + nearbyDemand * (DEMAND_FACTOR_MAX - DEMAND_FACTOR_MIN);
  const raw = originalPrice * conditionFactor * demandFactor;
  return Math.round(raw / 10) * 10;
}

// ─── Value tracker ─────────────────────────────────────────────────────────────

const FAST_DEPRECIATION = new Set(['electronics', 'phones']);
const MEDIUM_DEPRECIATION = new Set(['clothing', 'footwear', 'baby']);

function inferCondition(ageMonths: number, category: string): Grade['condition'] {
  if (FAST_DEPRECIATION.has(category)) {
    if (ageMonths < 6)  return 'like_new';
    if (ageMonths < 18) return 'good';
    if (ageMonths < 36) return 'fair';
    return 'damaged';
  }
  if (MEDIUM_DEPRECIATION.has(category)) {
    if (ageMonths < 12) return 'like_new';
    if (ageMonths < 30) return 'good';
    if (ageMonths < 60) return 'fair';
    return 'damaged';
  }
  // slow: kitchen, appliances, other
  if (ageMonths < 18) return 'like_new';
  if (ageMonths < 48) return 'good';
  if (ageMonths < 84) return 'fair';
  return 'damaged';
}

export function estimateCurrentValue(
  originalPrice: number,
  ageMonths: number,
  category: string,
): { value: number; condition: Grade['condition']; actNow: boolean } {
  const condition = inferCondition(ageMonths, category);
  const value = computePrice(originalPrice, condition, 0.5);
  const actNow = FAST_DEPRECIATION.has(category) && condition === 'good';
  return { value, condition, actNow };
}
