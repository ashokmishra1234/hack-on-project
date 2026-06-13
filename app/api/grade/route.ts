import { NextRequest, NextResponse } from 'next/server';
import { gradePhotos } from '@/lib/grader';

// Thin HTTP wrapper around lib/grader — other server code calls gradePhotos() directly.
export async function POST(req: NextRequest) {
  try {
    const { photos } = await req.json();
    if (!Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json({ error: 'photos array required' }, { status: 400 });
    }
    const grade = await gradePhotos(photos);
    return NextResponse.json({ grade });
  } catch (err) {
    console.error('[grade] error:', err);
    return NextResponse.json({ error: 'Grading failed' }, { status: 500 });
  }
}
