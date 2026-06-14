import { getItems } from '@/lib/store';
import { estimateCurrentValue } from '@/lib/pricing';
import ItemCard from '@/components/ItemCard';

export default function HomePage() {
  const allItems  = getItems();
  const myItems   = allItems.filter((i) => i.ownerId === 'user-current');
  const loopItems = allItems.filter((i) => i.ownerId !== 'user-current');

  return (
    <div className="flex flex-col gap-10">
      {/* My Items */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            My Items
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {myItems.length} item{myItems.length !== 1 ? 's' : ''} · tap one to give it a second life
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myItems.map((item) => {
            const { value, condition, actNow } = estimateCurrentValue(
              item.originalPrice,
              item.ageMonths,
              item.category,
            );
            return (
              <ItemCard
                key={item.id}
                item={item}
                estimatedValue={value}
                estimatedCondition={condition}
                actNow={actNow}
              />
            );
          })}
        </div>
      </section>

      {/* Circular loop — buyer-owned pre-enrolled items */}
      {loopItems.length > 0 && (
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg">♻</span>
            <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
              The Loop
            </h2>
          </div>
          <p className="text-sm -mt-4" style={{ color: 'var(--muted)' }}>
            Items pre-enrolled for their next second life — ready to sell in one tap
          </p>

          <div
            className="rounded-2xl border p-4"
            style={{ background: 'rgba(74,222,128,0.04)', borderColor: 'rgba(74,222,128,0.2)' }}
          >
            <p className="text-xs" style={{ color: '#4ade80' }}>
              ✓ Bridge-graded health record travels with each item — no re-capture needed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loopItems.map((item) => {
              const { value, condition, actNow } = estimateCurrentValue(
                item.originalPrice,
                item.ageMonths,
                item.category,
              );
              return (
                <ItemCard
                  key={item.id}
                  item={item}
                  estimatedValue={value}
                  estimatedCondition={condition}
                  actNow={actNow}
                  preEnrolled
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
