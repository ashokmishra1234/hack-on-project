import fs from 'fs';
import path from 'path';
import type { Item, Buyer, LedgerEntry } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

function readJSON<T>(filename: string): T {
  const file = path.join(DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
}

function writeJSON<T>(filename: string, data: T): void {
  const file = path.join(DATA_DIR, filename);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

// Items
export function getItems(): Item[] {
  return readJSON<Item[]>('items.json');
}

export function getItem(id: string): Item | undefined {
  return getItems().find((i) => i.id === id);
}

export function saveItem(item: Item): void {
  const items = getItems();
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    items[idx] = item;
  } else {
    items.push(item);
  }
  writeJSON('items.json', items);
}

// Buyers
export function getBuyers(): Buyer[] {
  return readJSON<Buyer[]>('buyers.json');
}

export function getBuyer(id: string): Buyer | undefined {
  return getBuyers().find((b) => b.id === id);
}

// Ledger (scaffolded — file created on first write)
const LEDGER_FILE = 'ledger.json';

export function getLedger(): LedgerEntry[] {
  const file = path.join(DATA_DIR, LEDGER_FILE);
  if (!fs.existsSync(file)) return [];
  return readJSON<LedgerEntry[]>(LEDGER_FILE);
}

export function appendLedger(entry: LedgerEntry): void {
  const ledger = getLedger();
  ledger.push(entry);
  writeJSON(LEDGER_FILE, ledger);
}
