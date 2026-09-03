import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, CheckCircle2, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ListingCardData {
  _id: string;
  title: string;
  images: { url: string }[];
  pricing: { daily?: number; hourly?: number; weekly?: number; monthly?: number };
  location: { city: string; area?: string };
  rating?: { average: number; count: number };
  verified?: boolean;
  featured?: boolean;
  availability?: { instantBook?: boolean };
}

interface ListingCardProps {
  listing: ListingCardData;
  variant?: 'grid' | 'list';
  showRating?: boolean;
  locationFormat?: 'city' | 'area-city';
}

const getPrice = (listing: ListingCardData) => {
  const price = listing.pricing?.daily ?? listing.pricing?.hourly ?? listing.pricing?.weekly ?? listing.pricing?.monthly ?? 0;
  const unit = listing.pricing?.daily ? 'day' : listing.pricing?.hourly ? 'hour' : listing.pricing?.weekly ? 'week' : 'month';
  return { price, unit };
};

const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  variant = 'grid',
  showRating = true,
  locationFormat = 'city',
}) => {
  const { t } = useLanguage();
  const { price, unit } = getPrice(listing);
  const isList = variant === 'list';

  const location = locationFormat === 'area-city'
    ? [listing.location?.area, listing.location?.city].filter(Boolean).join(', ')
    : (listing.location?.city || 'Pakistan');

  return (
    <Link to={`/listing/${listing._id}`}>
      <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full ${isList ? 'flex' : ''}`}>
        <div className={`relative bg-muted ${isList ? 'w-48 flex-shrink-0' : 'h-48'}`}>
          {listing.images?.[0]?.url ? (
            <img src={listing.images[0].url} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              No Image
            </div>
          )}
          {listing.verified && (
            <Badge className="absolute top-3 left-3 gap-1 bg-gradient-to-r from-amber-400 to-orange-400">
              <CheckCircle2 className="w-3 h-3" /> {t.listing.verified}
            </Badge>
          )}
          {listing.featured && !listing.verified && (
            <Badge className="absolute top-3 right-3 gap-1 bg-amber-500/90 text-white">
              <Sparkles className="w-3 h-3" /> Featured
            </Badge>
          )}
          {listing.availability?.instantBook && (
            <Badge variant="secondary" className="absolute top-3 right-3">
              {t.listing.instantBook}
            </Badge>
          )}
        </div>
        <CardContent className={isList ? 'p-4 flex-1' : 'p-4'}>
          <h3 className="font-semibold text-foreground mb-2 line-clamp-1">{listing.title}</h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-primary">{t.common.pkr} {price.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">/{unit}</span>
            </div>
            {showRating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="font-medium">{listing.rating?.average?.toFixed(1) || '5.0'}</span>
                {!!listing.rating?.count && (
                  <span className="text-muted-foreground text-sm">({listing.rating.count})</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ListingCard;
