import { getItem, getBuyers } from '@/lib/store';
import { getTrustRecord } from '@/lib/trust';
import { notFound } from 'next/navigation';
import EscrowStepper from '@/components/EscrowStepper';

export default async function ConfirmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = getItem(id);
  if (!item) notFound();

  if (!item.assessment || !item.route) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center max-w-sm mx-auto">
        <span className="text-4xl">⚠</span>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          This item hasn&apos;t been assessed yet. Complete the capture flow first.
        </p>
      </div>
    );
  }

  const trustRecord = getTrustRecord('user-current');
  const buyers      = getBuyers();
  const buyer       = item.assessment.matchedBuyerId
    ? (buyers.find((b) => b.id === item.assessment!.matchedBuyerId) ?? null)
    : null;

  return (
    <EscrowStepper item={item} trustRecord={trustRecord} buyer={buyer} />
  );
}
