export type Grade = {
  condition: 'like_new' | 'good' | 'fair' | 'damaged';
  defects: string[];
  summary: string;
  confidence: number; // 0–1
};

export type Assessment = {
  grade: Grade;
  price: number; // INR resale estimate
  matchedBuyerId?: string;
  nearbyDemand: number; // 0–1 demand score in the seller's city
  riskFlags: string[];
};

export type RouteDecision = {
  path: 'ship_direct' | 'refurbish' | 'repair' | 'donate' | 'recycle' | 'list_hold';
  matchedBuyerId?: string;
  cost: {
    shipDirect: number;     // INR logistics cost
    warehouseAlt: number;   // INR cost if routed via warehouse
    carbonKgSaved: number;  // kg CO₂ saved vs. landfill baseline
  };
  reason: string;
};

export type Item = {
  id: string;
  title: string;
  category: string;
  brand: string;
  originalPrice: number; // INR
  ageMonths: number;
  location: {
    lat: number;
    lng: number;
    city: string;
  };
  ownerId: string;
  photos: string[];
  assessment?: Assessment;
  route?: RouteDecision;
};

export type Buyer = {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    city: string;
  };
  wishlist: string[]; // categories they want
  trustScore: number; // 0–1
};

// Ledger entries for future credit/reward tracking (scaffolded, not wired yet)
export type LedgerEntryType = 'credit_earned' | 'credit_redeemed' | 'route_completed' | 'item_listed';

export type LedgerEntry = {
  id: string;
  userId: string;
  itemId: string;
  type: LedgerEntryType;
  amount: number; // INR equivalent or credit points
  description: string;
  createdAt: string; // ISO timestamp
};
