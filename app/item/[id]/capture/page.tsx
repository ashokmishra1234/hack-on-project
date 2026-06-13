import { getItem } from '@/lib/store';
import { notFound } from 'next/navigation';
import CaptureFlow from '@/components/CaptureFlow';

export default async function CapturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = getItem(id);
  if (!item) notFound();
  return <CaptureFlow item={item} />;
}
