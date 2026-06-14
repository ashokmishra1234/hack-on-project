import fs from 'fs';
import path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrustRecord = {
  userId: string;
  score: number;          // 0–100
  totalDeals: number;
  acceptedDeals: number;
  disputeCount: number;
  mismatchCount?: number; // identity verification failures (each -5 pts)
  lastUpdated: string;    // ISO timestamp
};

type TrustDB = Record<string, TrustRecord>;

// ─── Persistence ──────────────────────────────────────────────────────────────

const TRUST_FILE = path.join(process.cwd(), 'data', 'trust.json');

function readDB(): TrustDB {
  if (!fs.existsSync(TRUST_FILE)) return {};
  return JSON.parse(fs.readFileSync(TRUST_FILE, 'utf-8')) as TrustDB;
}

function writeDB(db: TrustDB): void {
  fs.writeFileSync(TRUST_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

// ─── Scoring formula ──────────────────────────────────────────────────────────
//
//  Base:         50   (new-seller baseline)
//  Deal bonus:   +5 per completed deal, capped at 5 deals (max +25)
//  Accuracy:     acceptedDeals / totalDeals × 20  (max +20)
//  Dispute:      -10 per dispute
//  Range:        0–100
//
export function computeScore(
  totalDeals: number,
  acceptedDeals: number,
  disputeCount: number,
  mismatchCount = 0,
): number {
  const base = 50;
  const dealBonus = Math.min(totalDeals * 5, 25);
  const accuracyRatio = totalDeals > 0 ? acceptedDeals / totalDeals : 1;
  const accuracyBonus = Math.round(accuracyRatio * 20);
  const penalty = disputeCount * 10 + mismatchCount * 5;
  return Math.max(0, Math.min(100, base + dealBonus + accuracyBonus - penalty));
}

// ─── Public API ───────────────────────────────────────────────────────────────

const NEW_SELLER: Omit<TrustRecord, 'userId'> = {
  score: 50,
  totalDeals: 0,
  acceptedDeals: 0,
  disputeCount: 0,
  lastUpdated: new Date().toISOString(),
};

export function getTrustRecord(userId: string): TrustRecord {
  const db = readDB();
  return db[userId] ?? { userId, ...NEW_SELLER };
}

/**
 * Records the outcome of a completed deal, recomputes the score, persists it,
 * and returns the updated record plus the score delta.
 */
export function recordDeal(
  userId: string,
  outcome: 'accept' | 'dispute',
): { record: TrustRecord; delta: number } {
  const db = readDB();
  const existing: TrustRecord = db[userId] ?? { userId, ...NEW_SELLER };

  const totalDeals   = existing.totalDeals + 1;
  const acceptedDeals = outcome === 'accept' ? existing.acceptedDeals + 1 : existing.acceptedDeals;
  const disputeCount  = outcome === 'dispute' ? existing.disputeCount + 1  : existing.disputeCount;
  const newScore      = computeScore(totalDeals, acceptedDeals, disputeCount, existing.mismatchCount ?? 0);

  const updated: TrustRecord = {
    userId,
    score: newScore,
    totalDeals,
    acceptedDeals,
    disputeCount,
    lastUpdated: new Date().toISOString(),
  };

  db[userId] = updated;
  writeDB(db);

  return { record: updated, delta: newScore - existing.score };
}

export function isTrustedSeller(score: number): boolean {
  return score >= 75;
}

/**
 * Records one identity-verification mismatch (-5 pts per incident).
 * Call only when an item is newly flagged for review (2+ consecutive failures).
 */
export function recordMismatch(userId: string): { record: TrustRecord; delta: number } {
  const db = readDB();
  const existing: TrustRecord = db[userId] ?? { userId, ...NEW_SELLER };
  const mismatchCount = (existing.mismatchCount ?? 0) + 1;
  const newScore = computeScore(
    existing.totalDeals,
    existing.acceptedDeals,
    existing.disputeCount,
    mismatchCount,
  );
  const updated: TrustRecord = {
    ...existing,
    mismatchCount,
    score: newScore,
    lastUpdated: new Date().toISOString(),
  };
  db[userId] = updated;
  writeDB(db);
  return { record: updated, delta: newScore - existing.score };
}
