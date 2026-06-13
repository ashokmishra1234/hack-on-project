import type { Item, Buyer, Assessment, RouteDecision } from './types';
import {
  LOCAL_HANDLING_COST,
  LOCAL_COST_PER_KM,
  BASE_WAREHOUSE_HANDLING,
  WAREHOUSE_COST_PER_KM,
  WAREHOUSE_DISTANCE_KM,
  ROUTE_CARBON_PER_KM,
} from './config';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

/**
 * Pure routing rule engine. Takes an assessed item + buyer list and returns
 * the single cheapest, trustworthy path to the next owner.
 *
 * Decision tree (evaluated in order):
 *  1. block_resale flag  → recycle
 *  2. price < shipDirect → donate (not worth moving)
 *  3. condition damaged  → repair (breakage) or refurbish (cosmetic)
 *  4. nearbyDemand > 0  → ship_direct
 *  5. fallback           → list_hold
 */
export function computeRoute(item: Item, assessment: Assessment, buyers: Buyer[]): RouteDecision {
  const { grade, price, matchedBuyerId, nearbyDemand, riskFlags } = assessment;

  const matchedBuyer = matchedBuyerId
    ? (buyers.find((b) => b.id === matchedBuyerId) ?? null)
    : null;

  // Distance from seller to best buyer (fallback = warehouse distance for cost calc)
  const localKm = matchedBuyer
    ? haversineKm(
        item.location.lat, item.location.lng,
        matchedBuyer.location.lat, matchedBuyer.location.lng,
      )
    : WAREHOUSE_DISTANCE_KM;

  const shipDirect = Math.round(LOCAL_HANDLING_COST + localKm * LOCAL_COST_PER_KM);
  const warehouseAlt = Math.round(BASE_WAREHOUSE_HANDLING + WAREHOUSE_DISTANCE_KM * WAREHOUSE_COST_PER_KM);
  const carbonKgSaved = parseFloat(
    Math.max(0, (WAREHOUSE_DISTANCE_KM - localKm) * ROUTE_CARBON_PER_KM).toFixed(1),
  );

  const cost: RouteDecision['cost'] = { shipDirect, warehouseAlt, carbonKgSaved };

  // ── 1. Safety block ───────────────────────────────────────────────────────
  if (riskFlags.includes('block_resale')) {
    return {
      path: 'recycle',
      cost,
      reason: 'Item is recalled or hazardous — routed to certified recycler, cannot be resold.',
    };
  }

  // ── 2. Economics: not worth moving ───────────────────────────────────────
  if (price < shipDirect) {
    return {
      path: 'donate',
      cost,
      reason: `Resale value (${fmt(price)}) is less than logistics cost (${fmt(shipDirect)}) — donating maximises social impact.`,
    };
  }

  // ── 3. Condition: damaged but resellable ─────────────────────────────────
  if (grade.condition === 'damaged') {
    const hasBreakage = grade.defects.some((d) =>
      /missing|broken|cracked|shattered|snapped|bust/i.test(d),
    );
    return {
      path: hasBreakage ? 'repair' : 'refurbish',
      matchedBuyerId: matchedBuyerId,
      cost,
      reason: hasBreakage
        ? 'Broken or missing parts detected — professional repair needed to restore resale value.'
        : 'Cosmetic damage only — a refurbishment pass upgrades the grade and unlocks full resale price.',
    };
  }

  // ── 4. Best case: direct to nearby wishlist-matching buyer ───────────────
  if (nearbyDemand > 0 && matchedBuyerId && matchedBuyer) {
    const saved = warehouseAlt - shipDirect;
    return {
      path: 'ship_direct',
      matchedBuyerId,
      cost,
      reason: `Ship directly to ${matchedBuyer.name} in ${matchedBuyer.location.city} — saves ${fmt(saved)} and ${carbonKgSaved} kg CO₂ vs. routing via warehouse.`,
    };
  }

  // ── 5. No nearby match — hold for the right buyer ────────────────────────
  return {
    path: 'list_hold',
    cost,
    reason: 'No nearby wishlist-matching buyer right now — listing in marketplace while we scout the right match.',
  };
}

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}
