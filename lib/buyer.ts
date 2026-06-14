import fs from 'fs';
import path from 'path';
import type { Buyer, Item } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SizeProfile = {
  shoeSize?: string;
  clothingSize?: string;
};

export type NotifyEntry = {
  category: string;
  maxPrice: number;
};

export type ExtendedBuyer = Buyer & {
  purchaseHistory: { category: string; brand: string }[];
  recentlyViewed: string[];
  sizeProfile: SizeProfile;
  priceSensitivity: 'deal' | 'mid' | 'premium';
  notifyList: NotifyEntry[];
};

export type CategoryScore = {
  category: string;
  score: number; // 0–1 normalised
};

export type DemandProfile = {
  topCategories: CategoryScore[];
  affineBrands: string[];
  sizeProfile: SizeProfile;
  priceSensitivity: 'deal' | 'mid' | 'premium';
  location: { lat: number; lng: number; city: string };
};

// ─── Geography ────────────────────────────────────────────────────────────────

export function distanceKm(
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

// ─── Demand profile ───────────────────────────────────────────────────────────

export function buildDemandProfile(buyer: ExtendedBuyer): DemandProfile {
  const signals: Record<string, number> = {};

  // Wishlist carries the strongest signal (user explicitly wants this)
  buyer.wishlist.forEach((cat) => {
    signals[cat] = (signals[cat] ?? 0) + 3;
  });

  // Purchase history: high signal (revealed preference)
  buyer.purchaseHistory.forEach(({ category }) => {
    signals[category] = (signals[category] ?? 0) + 2;
  });

  // Recently viewed: passive interest
  buyer.recentlyViewed.forEach((cat) => {
    signals[cat] = (signals[cat] ?? 0) + 1;
  });

  const maxScore = Math.max(...Object.values(signals), 1);

  const topCategories: CategoryScore[] = Object.entries(signals)
    .map(([category, score]) => ({ category, score: score / maxScore }))
    .sort((a, b) => b.score - a.score);

  const affineBrands = [...new Set(buyer.purchaseHistory.map((h) => h.brand))];

  return {
    topCategories,
    affineBrands,
    sizeProfile: buyer.sizeProfile,
    priceSensitivity: buyer.priceSensitivity,
    location: buyer.location,
  };
}

// ─── Ranking ──────────────────────────────────────────────────────────────────

export type ItemScore = {
  item: Item;
  score: number;           // 0–1
  distanceKm: number;
  reasons: string[];       // up to 2 human-readable tags
};

const GRADE_SCORE: Record<string, number> = {
  like_new: 1.0, good: 0.75, fair: 0.45, damaged: 0.1,
};

const MAX_DIST_KM = 800; // normalisation ceiling for distance score

export function scoreItems(items: Item[], buyer: ExtendedBuyer): ItemScore[] {
  const profile      = buildDemandProfile(buyer);
  const categoryMap  = Object.fromEntries(profile.topCategories.map(({ category, score }) => [category, score]));
  const brandSet     = new Set(profile.affineBrands.map((b) => b.toLowerCase()));
  const wishlistSet  = new Set(buyer.wishlist);

  const scored = items.map((item) => {
    const km    = distanceKm(buyer.location.lat, buyer.location.lng, item.location.lat, item.location.lng);
    const grade = item.assessment?.grade?.condition ?? 'fair';
    const price = item.assessment?.price ?? 0;
    const savings = price > 0 && item.originalPrice > 0
      ? (item.originalPrice - price) / item.originalPrice
      : 0;

    const categoryScore = categoryMap[item.category] ?? 0;
    const distScore     = Math.max(0, 1 - km / MAX_DIST_KM);
    const gradeScore    = GRADE_SCORE[grade] ?? 0.45;
    const brandScore    = brandSet.has(item.brand.toLowerCase()) ? 1 : 0;

    // Size match: check if title contains buyer's relevant size string
    let sizeScore = 0;
    if (item.category === 'footwear' && buyer.sizeProfile.shoeSize) {
      const sz = buyer.sizeProfile.shoeSize.toLowerCase();
      sizeScore = item.title.toLowerCase().includes(sz) ? 1 : 0;
    } else if (item.category === 'clothing' && buyer.sizeProfile.clothingSize) {
      const sz = buyer.sizeProfile.clothingSize.toLowerCase();
      sizeScore = item.title.toLowerCase().includes(`(${sz})`) || item.title.toLowerCase().endsWith(` ${sz}`) ? 1 : 0;
    }

    // Price sensitivity score
    let priceScore: number;
    if (buyer.priceSensitivity === 'deal')    priceScore = savings;
    else if (buyer.priceSensitivity === 'premium') priceScore = gradeScore;
    else priceScore = (savings + gradeScore) / 2;

    // Weighted total
    const score =
      categoryScore * 0.35 +
      distScore     * 0.25 +
      priceScore    * 0.20 +
      gradeScore    * 0.10 +
      brandScore    * 0.05 +
      sizeScore     * 0.05;

    // Reason tags — build in priority order, take top 2
    const reasons: string[] = [];
    if (wishlistSet.has(item.category))                      reasons.push('on your wishlist');
    if (brandScore > 0)                                      reasons.push('brand you know');
    if (sizeScore > 0)                                       reasons.push('your size');
    if (savings > 0.35 && buyer.priceSensitivity !== 'premium') reasons.push('great price');
    if (grade === 'like_new' && buyer.priceSensitivity === 'premium') reasons.push('like new');
    if (km < 5)                                              reasons.push('right nearby');
    else if (km < 25)                                        reasons.push(`${Math.round(km)} km away`);

    return { item, score, distanceKm: km, reasons: reasons.slice(0, 2) };
  });

  return scored.sort((a, b) => b.score - a.score);
}

// ─── Proactive offers ─────────────────────────────────────────────────────────

export type ProactiveOffer = {
  item: Item;
  distanceKm: number;
  saving: number;
  notifyEntry: NotifyEntry;
};

const NOTIFY_RADIUS_KM = 25;

export function findProactiveOffers(items: Item[], buyer: ExtendedBuyer): ProactiveOffer[] {
  const offers: ProactiveOffer[] = [];

  for (const item of items) {
    const price = item.assessment?.price ?? Infinity;
    const km    = distanceKm(buyer.location.lat, buyer.location.lng, item.location.lat, item.location.lng);
    if (km > NOTIFY_RADIUS_KM) continue;

    for (const entry of buyer.notifyList) {
      if (entry.category === item.category && price <= entry.maxPrice) {
        offers.push({
          item,
          distanceKm: km,
          saving: item.originalPrice - price,
          notifyEntry: entry,
        });
        break;
      }
    }
  }

  return offers;
}

// ─── Data access ──────────────────────────────────────────────────────────────

export function getExtendedBuyers(): ExtendedBuyer[] {
  const file = path.join(process.cwd(), 'data', 'buyers.json');
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as ExtendedBuyer[];
}

export function getExtendedBuyer(id: string): ExtendedBuyer | undefined {
  return getExtendedBuyers().find((b) => b.id === id);
}

export function saveExtendedBuyer(buyer: ExtendedBuyer): void {
  const buyers = getExtendedBuyers();
  const idx = buyers.findIndex((b) => b.id === buyer.id);
  if (idx >= 0) buyers[idx] = buyer;
  else buyers.push(buyer);
  const file = path.join(process.cwd(), 'data', 'buyers.json');
  fs.writeFileSync(file, JSON.stringify(buyers, null, 2), 'utf-8');
}
