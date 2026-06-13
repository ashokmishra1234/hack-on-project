import { getItems } from '@/lib/store';
import ItemCard from '@/components/ItemCard';

export default function HomePage() {
  const items = getItems();

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          My Items
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {items.length} item{items.length !== 1 ? 's' : ''} · tap one to give it a second life
        </p>
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
