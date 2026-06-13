import type { Item } from './types';

const ELECTRONICS_CATEGORIES = new Set(['electronics', 'phones']);
const BODY_CONTACT_CATEGORIES = new Set(['footwear', 'clothing', 'apparel', 'baby', 'kids']);

// Hardcoded examples of recalled / hazardous products (title substring match, lowercase)
const BLOCKED_TITLE_KEYWORDS = [
  'samsung galaxy note 7',
  'note7',
  'hoverboard',
  'takata airbag',
  'philips dreamstation',   // recalled CPAP
  'peloton tread+',
];

export function getRiskFlags(item: Item): string[] {
  const flags: string[] = [];
  const cat = item.category.toLowerCase();
  const title = item.title.toLowerCase();

  if (ELECTRONICS_CATEGORIES.has(cat)) {
    flags.push('needs_data_wipe');
  }

  if (BODY_CONTACT_CATEGORIES.has(cat)) {
    flags.push('needs_sanitization');
  }

  if (BLOCKED_TITLE_KEYWORDS.some((kw) => title.includes(kw))) {
    flags.push('block_resale');
  }

  return flags;
}
