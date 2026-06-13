import { getItem } from '@/lib/store';
import { notFound } from 'next/navigation';
import AssessmentView from '@/components/AssessmentView';

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = getItem(id);
  if (!item) notFound();

  return (
    <AssessmentView
      itemId={item.id}
      itemTitle={item.title}
      initialAssessment={item.assessment}
    />
  );
}
