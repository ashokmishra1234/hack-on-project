// Tunable constants — adjust between experiments without touching business logic.

export const CONDITION_RESALE_FACTORS: Record<string, number> = {
  like_new: 0.75,
  good: 0.55,
  fair: 0.35,
  damaged: 0.15,
};

// Demand multiplier range — scales linearly with nearbyDemand (0–1)
export const DEMAND_FACTOR_MIN = 0.90;
export const DEMAND_FACTOR_MAX = 1.15;

// INR per kilometre for direct peer-to-peer shipping
export const COST_PER_KM = 2.5;

// Fixed INR handling charge per shipment (pickup + packaging)
export const BASE_HANDLING_COST = 80;

// kg CO₂ per kilometre for road freight (used for carbon savings calc)
export const CARBON_KG_PER_KM = 0.00021;

// Minimum trust score a buyer must have to qualify for ship_direct route
export const MIN_TRUST_SCORE_DIRECT = 0.70;

// Age threshold (months) above which an item is flagged for repair check
export const REPAIR_CHECK_AGE_MONTHS = 24;

// Demand score below which we prefer list_hold over active routing
export const MIN_DEMAND_TO_ROUTE = 0.20;

// Weights for scoring route options (must sum to 1)
export const ROUTE_WEIGHTS = {
  cost: 0.40,
  carbon: 0.35,
  speed: 0.25,
};
