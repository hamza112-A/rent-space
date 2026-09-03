import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { storefrontApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Star, Building2 } from 'lucide-react';
import ListingCard from '@/components/listings/ListingCard';
import EmptyState from '@/components/common/EmptyState';

interface Listing {
  _id: string;
  title: string;
  images: { url: string }[];
  pricing: { daily?: number; hourly?: number; weekly?: number; monthly?: number };
  location: { city: string; area?: string };
  featured?: boolean;
}

interface StorefrontData {
  storefront: {
    name?: string;
    tagline?: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
  };
  owner: { fullName: string; rating?: { average: number; count: number }; memberSince: string };
  listings: Listing[];
}

const Storefront: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<StorefrontData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    setFetchError(false);
    storefrontApi.getPublic(slug)
      .then((res) => setData(res.data.data))
      .catch((err) => {
        if (err?.response?.status === 404) setNotFound(true);
        else setFetchError(true);
      })
      .finally(() => setLoading(false));
  }, [slug, retryCount]);

  if (loading) {
    return (
      <Layout>
        <div className="pt-20 container mx-auto px-4 py-12 max-w-5xl space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-56 w-full" />)}
          </div>
        </div>
      </Layout>
    );
  }

  if (notFound || fetchError || !data) {
    return (
      <Layout>
        <div className="pt-32 container mx-auto px-4 py-12 text-center">
          <EmptyState
            icon={Building2}
            title={fetchError ? 'Failed to load storefront' : 'Storefront not found'}
            description={fetchError ? undefined : "This page doesn't exist or isn't published."}
          />
          {fetchError && (
            <Button variant="outline" onClick={() => setRetryCount((c) => c + 1)}>
              Try Again
            </Button>
          )}
        </div>
      </Layout>
    );
  }

  const { storefront, owner, listings } = data;

  return (
    <Layout>
      <div className="pt-16 min-h-screen bg-background">
        {storefront.bannerUrl ? (
          <div
            className="h-48 md:h-64 w-full bg-cover bg-center bg-muted"
            style={{ backgroundImage: `url(${storefront.bannerUrl})` }}
          />
        ) : (
          <div className="h-32 w-full bg-gradient-to-r from-primary/20 to-primary/5" />
        )}

        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 mb-8">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={storefront.logoUrl} alt={storefront.name} />
              <AvatarFallback className="text-2xl">
                {(storefront.name || owner.fullName).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{storefront.name || owner.fullName}</h1>
              {storefront.tagline && <p className="text-muted-foreground">{storefront.tagline}</p>}
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                {owner.rating && owner.rating.count > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {owner.rating.average.toFixed(1)} ({owner.rating.count})
                  </span>
                )}
                <span>Member since {new Date(owner.memberSince).getFullYear()}</span>
              </div>
            </div>
          </div>

          {storefront.description && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <p className="text-foreground whitespace-pre-line">{storefront.description}</p>
              </CardContent>
            </Card>
          )}

          <h2 className="text-xl font-semibold text-foreground mb-4">
            Listings ({listings.length})
          </h2>

          {listings.length === 0 ? (
            <EmptyState title="No active listings right now" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-16">
              {listings.map((listing) => (
                <ListingCard
                  key={listing._id}
                  listing={listing}
                  showRating={false}
                  locationFormat="area-city"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Storefront;
