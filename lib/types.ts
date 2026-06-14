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

// ─── Product identity verification ───────────────────────────────────────────

export type VerificationResult = {
  isMatch: boolean;
  observedProduct: string;  // short description of what Gemini actually saw
  brandMatch: boolean;
  categoryMatch: boolean;
  confidence: number;       // 0–1
  reason: string;           // one-sentence explanation
};

export type VerificationStatus = 'pass' | 'fail' | 'needs_review';

export type VerificationRecord = {
  status: VerificationStatus;
  result: VerificationResult;
  consecutiveFailures: number; // resets to 0 on pass
  flaggedForReview: boolean;   // true after 2+ consecutive failures
  identityVerified: boolean;   // true when status === 'pass'
  verifiedAt: string;          // ISO timestamp
};

// ─── Core item ────────────────────────────────────────────────────────────────

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
  referenceImage?: string;       // path under /public/reference/ e.g. "/reference/item-001.jpg"
  verification?: VerificationRecord;
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
