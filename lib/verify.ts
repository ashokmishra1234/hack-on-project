import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import type { VerificationResult, VerificationStatus } from './types';

// ─── Prompt (verbatim from spec) ──────────────────────────────────────────────

const SYSTEM_PROMPT =
  'You are verifying that a customer is reselling the correct product from their order. ' +
  'You are given the expected product details and, when available, a reference catalog image. ' +
  'Look at the customer\'s photos and decide whether they show the SAME product. ' +
  'Same product type, brand, and model is what matters — differences in wear, dirt, colour variant, ' +
  'lighting, or angle are EXPECTED and must NOT count as a mismatch. ' +
  'A mismatch means a fundamentally different product (for example, shoes when a phone was expected, ' +
  'or a clearly different brand/model). ' +
  'Also read any visible brand or model text on the label. ' +
  'Return ONLY a JSON object (no prose, no fences) with keys: ' +
  'isMatch (boolean), observedProduct (short description of what you actually see), ' +
  'brandMatch (boolean), categoryMatch (boolean), confidence (0 to 1), ' +
  'reason (one short sentence). ' +
  'Be lenient on condition, strict on identity.';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractInlineData(dataUrl: string): { mimeType: string; data: string } {
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return { mimeType: 'image/jpeg', data: dataUrl };
  const header = dataUrl.slice(0, comma);
  const data = dataUrl.slice(comma + 1);
  const mime = header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg';
  return { mimeType: mime, data };
}

function readReferenceImage(
  refPath: string,
): { mimeType: string; data: string } | null {
  // refPath is relative to /public e.g. "/reference/item-001.jpg"
  const abs = path.join(process.cwd(), 'public', refPath);
  if (!fs.existsSync(abs)) return null;
  const buffer = fs.readFileSync(abs);
  const ext = path.extname(abs).slice(1).toLowerCase();
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', webp: 'image/webp',
  };
  return { mimeType: mimeMap[ext] ?? 'image/jpeg', data: buffer.toString('base64') };
}

function parseVerificationResult(raw: string): VerificationResult {
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No JSON in verification response: ${text.slice(0, 200)}`);
  const p = JSON.parse(match[0]);
  return {
    isMatch:         typeof p.isMatch === 'boolean'         ? p.isMatch         : false,
    observedProduct: typeof p.observedProduct === 'string'  ? p.observedProduct : 'Unable to determine',
    brandMatch:      typeof p.brandMatch === 'boolean'      ? p.brandMatch      : false,
    categoryMatch:   typeof p.categoryMatch === 'boolean'   ? p.categoryMatch   : false,
    confidence:      typeof p.confidence === 'number'
      ? Math.min(1, Math.max(0, p.confidence)) : 0,
    reason:          typeof p.reason === 'string'           ? p.reason          : 'Product identity could not be confirmed.',
  };
}

// ─── Threshold decision ───────────────────────────────────────────────────────

export function getVerificationStatus(result: VerificationResult): VerificationStatus {
  if (result.isMatch && result.confidence >= 0.6) return 'pass';
  if (!result.isMatch || result.confidence < 0.4) return 'fail';
  return 'needs_review'; // 0.4–0.6 borderline: pass with caution flag
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function verifyProduct(params: {
  photos: string[];         // base64 data URLs from customer capture
  title: string;
  brand: string;
  category: string;
  referenceImage?: string;  // path under /public e.g. "/reference/item-001.jpg"
}): Promise<VerificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  if (params.photos.length === 0) throw new Error('No photos to verify');

  const ai = new GoogleGenAI({ apiKey });

  // Build text description of expected product
  const hasRef = !!params.referenceImage;
  const textPart = {
    text:
      `Expected product: "${params.title}" by ${params.brand} (category: ${params.category}).` +
      (hasRef
        ? ' A catalog reference image is included as the FIRST image below.'
        : ' No catalog reference image is available — match on product type, brand, and visible model text only.') +
      ' Customer photos follow.',
  };

  // Assemble parts: text → optional reference image → customer photos
  const parts: object[] = [textPart];

  if (params.referenceImage) {
    const refData = readReferenceImage(params.referenceImage);
    if (refData) {
      parts.push({ inlineData: refData });
    }
  }

  for (const photo of params.photos) {
    parts.push({ inlineData: extractInlineData(photo) });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    config: { systemInstruction: SYSTEM_PROMPT },
    contents: [{ role: 'user', parts }],
  });

  return parseVerificationResult(response.text ?? '');
}
