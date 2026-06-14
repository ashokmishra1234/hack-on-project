import fs from 'fs';
import path from 'path';
import type { Buyer } from './types';

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

// ─── Data access ──────────────────────────────────────────────────────────────

export function getExtendedBuyers(): ExtendedBuyer[] {
  const file = path.join(process.cwd(), 'data', 'buyers.json');
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as ExtendedBuyer[];
}

export function getExtendedBuyer(id: string): ExtendedBuyer | undefined {
  return getExtendedBuyers().find((b) => b.id === id);
}
