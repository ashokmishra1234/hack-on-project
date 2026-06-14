import fs from 'fs';
import path from 'path';

export type GreenAction =
  | 'prevent_a_return'
  | 'resell'
  | 'buy_refurbished'
  | 'donate'
  | 'recycle';

export type GreenEntry = {
  id: string;
  userId: string;
  itemId: string;
  action: GreenAction;
  credits: number;
  co2KgAvoided: number;
  description: string;
  createdAt: string;
};

export type GreenRecord = {
  userId: string;
  totalCredits: number;
  totalCo2Kg: number;
  entries: GreenEntry[];
};

type GreenDB = Record<string, GreenRecord>;

export const ACTION_CREDITS: Record<GreenAction, number> = {
  prevent_a_return: 50,
  resell:           30,
  buy_refurbished:  25,
  donate:           20,
  recycle:          15,
};

const CO2_CREDIT_PER_KG = 1;

const GREEN_FILE = path.join(process.cwd(), 'data', 'green.json');

function readDB(): GreenDB {
  try {
    return JSON.parse(fs.readFileSync(GREEN_FILE, 'utf-8')) as GreenDB;
  } catch {
    return {};
  }
}

function writeDB(db: GreenDB): void {
  fs.writeFileSync(GREEN_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export function getGreenRecord(userId: string): GreenRecord {
  const db = readDB();
  return db[userId] ?? { userId, totalCredits: 0, totalCo2Kg: 0, entries: [] };
}

export function awardCredits(params: {
  userId: string;
  itemId: string;
  action: GreenAction;
  co2KgAvoided: number;
  description: string;
}): { entry: GreenEntry; record: GreenRecord } {
  const { userId, itemId, action, co2KgAvoided, description } = params;
  const baseCredits = ACTION_CREDITS[action];
  const co2Credits = Math.round(Math.max(0, co2KgAvoided) * CO2_CREDIT_PER_KG);
  const totalCredits = baseCredits + co2Credits;

  const entry: GreenEntry = {
    id: `g-${Date.now()}`,
    userId,
    itemId,
    action,
    credits: totalCredits,
    co2KgAvoided: Math.max(0, co2KgAvoided),
    description,
    createdAt: new Date().toISOString(),
  };

  const db = readDB();
  const existing = db[userId] ?? { userId, totalCredits: 0, totalCo2Kg: 0, entries: [] };
  const updated: GreenRecord = {
    ...existing,
    totalCredits: existing.totalCredits + totalCredits,
    totalCo2Kg: existing.totalCo2Kg + Math.max(0, co2KgAvoided),
    entries: [entry, ...existing.entries],
  };
  db[userId] = updated;
  writeDB(db);

  return { entry, record: updated };
}
