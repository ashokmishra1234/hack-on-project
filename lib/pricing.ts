import { CONDITION_RESALE_FACTORS, DEMAND_FACTOR_MIN, DEMAND_FACTOR_MAX } from './config';
import type { Grade } from './types';

/**
 * price = originalPrice × conditionFactor × demandFactor
 * demandFactor scales linearly from DEMAND_FACTOR_MIN (no demand) to DEMAND_FACTOR_MAX (full demand)
 * Result rounded to nearest ₹10.
 */
export function computePrice(
  originalPrice: number,
  condition: Grade['condition'],
  nearbyDemand: number, // 0–1
): number {
  const conditionFactor = CONDITION_RESALE_FACTORS[condition] ?? 0.30;
  const demandFactor = DEMAND_FACTOR_MIN + nearbyDemand * (DEMAND_FACTOR_MAX - DEMAND_FACTOR_MIN);
  const raw = originalPrice * conditionFactor * demandFactor;
  return Math.round(raw / 10) * 10;
}
