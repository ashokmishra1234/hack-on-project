import type { Item, Buyer } from './types';

const NEARBY_RADIUS_KM = 25;
const DEMAND_NORMALIZER = 5; // 5+ matching buyers within radius = demand score of 1.0

function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export type MatchResult = {
  matchedBuyerId: string | undefined;
  nearbyDemand: number; // 0–1 normalised score
};

/**
 * Returns the best-matched buyer and a normalised nearby demand score.
 * Ranks: (1) category in wishlist, then (2) nearest distance.
 * nearbyDemand = # wishlist-matching buyers within NEARBY_RADIUS_KM, normalised to 0–1.
 */
export function matchBuyer(item: Item, buyers: Buyer[]): MatchResult {
  const { lat, lng } = item.location;
  const category = item.category.toLowerCase();

  // Annotate each buyer with wishlist match + distance
  const scored = buyers.map((b) => {
    const distance = haversineKm(lat, lng, b.location.lat, b.location.lng);
    const wantsList = b.wishlist.map((w) => w.toLowerCase());
    const matches = wantsList.includes(category);
    return { buyer: b, distance, matches };
  });

  // Wishlist-matching buyers anywhere (for best match ranking by distance)
  const wishlistMatches = scored
    .filter((s) => s.matches)
    .sort((a, b) => a.distance - b.distance);

  // Wishlist-matching buyers within radius (for demand score)
  const nearbyCount = wishlistMatches.filter((s) => s.distance <= NEARBY_RADIUS_KM).length;

  const bestMatch = wishlistMatches[0];

  return {
    matchedBuyerId: bestMatch?.buyer.id,
    nearbyDemand: Math.min(nearbyCount / DEMAND_NORMALIZER, 1),
  };
}
