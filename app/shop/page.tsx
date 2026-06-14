import { cookies } from 'next/headers';
import { getListings } from '@/lib/store';
import { getItems } from '@/lib/store';
import { getExtendedBuyers, buildDemandProfile, distanceKm } from '@/lib/buyer';
import ShopItemCard from '@/components/ShopItemCard';
import type { Item } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const cookieStore = await cookies();
  const activeBuyerId = decodeURIComponent(
    cookieStore.get('bridge-buyer-id')?.value ?? '',
  );

  const buyers    = getExtendedBuyers();
  const activeBuyer = activeBuyerId ? buyers.find((b) => b.id === activeBuyerId) : undefined;
  const demandProfile = activeBuyer ? buildDemandProfile(activeBuyer) : null;

  // Aggregate available items: pre-seeded listings + graded user items with route set
  const listings = getListings();
  const userItems = getItems().filter(
    (i) =>
      i.route?.path === 'ship_direct' || i.route?.path === 'list_hold',
  );

  // Merge, deduplicate by id (listings take precedence)
  const listingIds = new Set(listings.map((l) => l.id));
  const allItems: Item[] = [
    ...listings,
    ...userItems.filter((i) => !listingIds.has(i.id)),
  ];

  // Attach distance from active buyer
  const itemsWithMeta = allItems.map((item) => {
    const km =
      activeBuyer
        ? distanceKm(
            activeBuyer.location.lat,
            activeBuyer.location.lng,
            item.location.lat,
            item.location.lng,
          )
        : null;
    return { item, distanceKm: km };
  });

  const hasBuyer = !!activeBuyer;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-black tracking-tight"
          style={{ color: 'var(--foreground)' }}
        >
          Second Life Storefront
        </h1>

        {hasBuyer && demandProfile ? (
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Browsing as{' '}
            <span style={{ color: 'var(--foreground)' }}>{activeBuyer!.name}</span>
            {' · '}{activeBuyer!.location.city}
            {' · '}
            <span style={{ color: 'var(--accent)' }}>
              {demandProfile.priceSensitivity === 'deal'
                ? 'deal hunter'
                : demandProfile.priceSensitivity === 'premium'
                ? 'premium buyer'
                : 'balanced buyer'}
            </span>
          </p>
        ) : (
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Switch to a buyer using the{' '}
            <span style={{ color: 'var(--accent)' }}>Browse</span> button above
            to see distances and personalised context.
          </p>
        )}

        {hasBuyer && demandProfile && demandProfile.topCategories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {demandProfile.topCategories.slice(0, 4).map(({ category, score }) => (
              <span
                key={category}
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  background:
                    score > 0.75
                      ? 'rgba(249,115,22,0.15)'
                      : 'var(--surface-raised)',
                  color:
                    score > 0.75 ? 'var(--accent)' : 'var(--muted)',
                  border: `1px solid ${score > 0.75 ? 'rgba(249,115,22,0.3)' : 'var(--border)'}`,
                }}
              >
                {category}
              </span>
            ))}
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ color: 'var(--muted)' }}
            >
              top interests
            </span>
          </div>
        )}
      </div>

      {/* Grid */}
      {itemsWithMeta.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-3xl mb-3">🛍</p>
          <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
            Nothing listed yet
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Graded items from sellers will appear here once routed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {itemsWithMeta.map(({ item, distanceKm: km }) => (
            <ShopItemCard key={item.id} item={item} distanceKm={km} />
          ))}
        </div>
      )}

      {/* Summary bar */}
      {itemsWithMeta.length > 0 && (
        <p
          className="mt-6 text-xs text-center"
          style={{ color: 'var(--muted)' }}
        >
          {itemsWithMeta.length} item{itemsWithMeta.length !== 1 ? 's' : ''} available
          {hasBuyer && ' · buy flow coming next'}
        </p>
      )}
    </main>
  );
}
