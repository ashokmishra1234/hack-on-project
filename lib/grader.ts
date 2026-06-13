import { GoogleGenAI } from '@google/genai';
import type { Grade } from './types';

const SYSTEM_PROMPT =
  "You are an expert product-condition grader for a resale marketplace. " +
  "Look at the photos of a used product and return ONLY a JSON object " +
  "(no prose, no markdown fences) with these keys: " +
  "condition (one of 'like_new','good','fair','damaged'), " +
  "defects (array of short strings), " +
  "summary (one plain-language sentence), " +
  "confidence (a number 0 to 1). " +
  "Grade only from what is visible. " +
  "If the photos are insufficient, lower the confidence.";

const VALID_CONDITIONS = ['like_new', 'good', 'fair', 'damaged'] as const;

function extractInlineData(dataUrl: string): { mimeType: string; data: string } {
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return { mimeType: 'image/jpeg', data: dataUrl };
  const header = dataUrl.slice(0, comma);
  const data = dataUrl.slice(comma + 1);
  const mime = header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg';
  return { mimeType: mime, data };
}

function parseGrade(raw: string): Grade {
  let text = raw.trim();
  // Strip markdown fences
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  // Extract first JSON object
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No JSON object in Gemini response: ${text.slice(0, 300)}`);

  const p = JSON.parse(match[0]);
  return {
    condition: VALID_CONDITIONS.includes(p.condition) ? p.condition : 'fair',
    defects: Array.isArray(p.defects) ? p.defects.map(String) : [],
    summary: typeof p.summary === 'string' ? p.summary : 'Condition assessed from photos.',
    confidence: typeof p.confidence === 'number' ? Math.min(1, Math.max(0, p.confidence)) : 0.5,
  };
}

export async function gradePhotos(photos: string[]): Promise<Grade> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  if (photos.length === 0) throw new Error('No photos to grade');

  const ai = new GoogleGenAI({ apiKey });

  const imageParts = photos.map((p) => ({ inlineData: extractInlineData(p) }));

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    config: { systemInstruction: SYSTEM_PROMPT },
    contents: [{ role: 'user', parts: imageParts }],
  });

  const text = response.text ?? '';
  return parseGrade(text);
}
