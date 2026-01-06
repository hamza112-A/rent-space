import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { getCategoryById } from '@/lib/categories';
import { listingApi } from '@/lib/api';
import {
  Search,
  MapPin,
  Star,
  Filter,
  Grid3X3,
  List,
  CheckCircle2,
  SlidersHorizontal,
  X,
  Building2,
  Car,
  Shirt,
  Wrench,
  Users,
  Dog,
  Ship,
  Plane,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const categoryIcons: Record<string, React.ElementType> = {
  property: Building2,
  vehicles: Car,
  clothes: Shirt,
  equipment: Wrench,
  services: Users,
  animals: Dog,
  boats: Ship,
  air: Plane,
};

interface Listing {
  _id: string;
  title: string;
  category: string;
  subcategory: string;
  pricing: { daily?: number; hourly?: number; weekly?: number; monthly?: number };
  location: { city: string; area?: string };
  images: { url: string }[];
  rating?: { average: number; count: number };
  verified?: boolean;
  availability?: { instantBook?: boolean };
}

// Debounce hook for live search
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Price Range Slider Component with live preview
interface PriceRangeSliderProps {
  value: number[];
  onChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
}

const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 200000,
  step = 1000,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);

  // Sync local value with prop when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  const handleSliderChange = (newValue: number[]) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleInputChange = (index: number, inputValue: string) => {
    const numValue = parseInt(inputValue) || 0;
    const newValue = [...localValue];
    newValue[index] = Math.max(min, Math.min(max, numValue));
    
    // Ensure min <= max
    if (index === 0 && newValue[0] > newValue[1]) {
      newValue[0] = newValue[1];
    } else if (index === 1 && newValue[1] < newValue[0]) {
      newValue[1] = newValue[0];
    }
    
    setLocalValue(newValue);
    onChange(newValue);
  };

  const formatPrice = (price: number) => {
    if (price >= 100000) {
      return `${(price / 100000).toFixed(1)}L`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K`;
    }
    return price.toString();
  };

  // Quick select presets
  const presets = [
    { label: 'Under 10K', range: [0, 10000] },
    { label: '10K - 50K', range: [10000, 50000] },
    { label: '50K - 1L', range: [50000, 100000] },
    { label: '1L+', range: [100000, 200000] },
  ];

  return (
    <div className="space-y-4">
      {/* Live Price Display */}
      <div className="flex items-center justify-between">
        <div className="text-center">
          <span className="text-xs text-muted-foreground block">Min</span>
          <span className={`text-lg font-bold transition-colors ${isDragging ? 'text-primary' : 'text-foreground'}`}>
            PKR {localValue[0].toLocaleString()}
          </span>
        </div>
        <div className="flex-1 mx-4 border-t border-dashed border-muted-foreground/30" />
        <div className="text-center">
          <span className="text-xs text-muted-foreground block">Max</span>
          <span className={`text-lg font-bold transition-colors ${isDragging ? 'text-primary' : 'text-foreground'}`}>
            PKR {localValue[1].toLocaleString()}
          </span>
        </div>
      </div>

      {/* Dual Range Slider */}
      <div className="relative pt-2 pb-4">
        <Slider
          value={localValue}
          onValueChange={handleSliderChange}
          onPointerDown={() => setIsDragging(true)}
          onPointerUp={() => setIsDragging(false)}
          min={min}
          max={max}
          step={step}
          className="cursor-pointer"
        />
        {/* Scale markers */}
        <div className="flex justify-between mt-1 px-1">
          <span className="text-[10px] text-muted-foreground">0</span>
          <span className="text-[10px] text-muted-foreground">50K</span>
          <span className="text-[10px] text-muted-foreground">1L</span>
          <span className="text-[10px] text-muted-foreground">1.5L</span>
          <span className="text-[10px] text-muted-foreground">2L</span>
        </div>
      </div>

      {/* Manual Input Fields */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            type="number"
            value={localValue[0]}
            onChange={(e) => handleInputChange(0, e.target.value)}
            className="text-center text-sm"
            placeholder="Min"
          />
        </div>
        <span className="text-muted-foreground font-medium">—</span>
        <div className="flex-1">
          <Input
            type="number"
            value={localValue[1]}
            onChange={(e) => handleInputChange(1, e.target.value)}
            className="text-center text-sm"
            placeholder="Max"
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const isActive = localValue[0] === preset.range[0] && localValue[1] === preset.range[1];
          return (
            <Button
              key={preset.label}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => onChange(preset.range)}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [instantBookOnly, setInstantBookOnly] = useState(false);

  // Debounce search inputs (300ms delay)
  const debouncedSearch = useDebounce(searchQuery, 300);
  const debouncedLocation = useDebounce(locationQuery, 300);
  // Debounce price range (200ms for smoother slider experience)
  const debouncedPriceRange = useDebounce(priceRange, 200);

  const category = categoryId ? getCategoryById(categoryId) : null;
  const CategoryIcon = category ? categoryIcons[category.id] || Building2 : Building2;

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      if (categoryId) params.category = categoryId;
      if (selectedSubcategory) params.subcategory = selectedSubcategory;
      if (sortBy) params.sort = sortBy;
      if (debouncedSearch) params.query = debouncedSearch;
      if (debouncedLocation) params.location = debouncedLocation;
      
      const response = await listingApi.search(params);
      setListings(response.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryId, selectedSubcategory, sortBy, debouncedSearch, debouncedLocation]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Filter listings by price range, verified, instant book (client-side with debounced values)
  const filteredListings = listings.filter((listing) => {
    const price = listing.pricing?.daily || listing.pricing?.hourly || 0;
    if (price < debouncedPriceRange[0] || price > debouncedPriceRange[1]) return false;
    if (verifiedOnly && !listing.verified) return false;
    if (instantBookOnly && !listing.availability?.instantBook) return false;
    return true;
  });

  // Check if any filters are active
  const hasActiveFilters = priceRange[0] > 0 || priceRange[1] < 200000 || selectedSubcategory || verifiedOnly || instantBookOnly;

  const resetFilters = () => {
    setPriceRange([0, 200000]);
    setSelectedSubcategory(null);
    setVerifiedOnly(false);
    setInstantBookOnly(false);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Active Filters Count */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg">
          <span className="text-sm text-primary font-medium">
            Filters active
          </span>
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-6 text-xs">
            Clear all
          </Button>
        </div>
      )}

      {/* Subcategories */}
      {category && (
        <div>
          <h4 className="font-semibold mb-3">Subcategories</h4>
          <div className="space-y-2">
            {category.subcategories.map((sub) => (
              <label key={sub.id} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedSubcategory === sub.id}
                  onCheckedChange={(checked) => setSelectedSubcategory(checked ? sub.id : null)}
                />
                <span className="text-sm">{t.subcategories[sub.nameKey as keyof typeof t.subcategories]}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range - Enhanced Slider */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          {t.filters.priceRange}
          {(priceRange[0] > 0 || priceRange[1] < 200000) && (
            <Badge variant="secondary" className="text-xs">Active</Badge>
          )}
        </h4>
        <PriceRangeSlider
          value={priceRange}
          onChange={setPriceRange}
          min={0}
          max={200000}
          step={1000}
        />
      </div>

      {/* Verified Only */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox 
            checked={verifiedOnly}
            onCheckedChange={(checked) => setVerifiedOnly(checked === true)}
          />
          <span className="text-sm">{t.filters.verified}</span>
        </label>
      </div>

      {/* Instant Book */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox 
            checked={instantBookOnly}
            onCheckedChange={(checked) => setInstantBookOnly(checked === true)}
          />
          <span className="text-sm">{t.filters.instantBook}</span>
        </label>
      </div>

      {/* Rating */}
      <div>
        <h4 className="font-semibold mb-3">{t.filters.rating}</h4>
        <div className="flex gap-2">
          {[4, 4.5, 5].map((rating) => (
            <Button key={rating} variant="outline" size="sm" className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {rating}+
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button variant="outline" className="flex-1" onClick={resetFilters}>
          {t.filters.reset}
        </Button>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="pt-20 min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-hero text-primary-foreground py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 mb-4">
              {category && (
                <div className={`p-3 rounded-xl ${category.colorClass}`}>
                  <CategoryIcon className="w-8 h-8" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold">
                  {category ? t.categories[category.nameKey as keyof typeof t.categories] : 'All Listings'}
                </h1>
                <p className="text-primary-foreground/80">
                  {filteredListings.length} {t.categories.listings} available
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="bg-card rounded-xl p-2 max-w-2xl shadow-lg">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input 
                    placeholder={t.hero.searchPlaceholder} 
                    className="pl-10 border border-input bg-background text-foreground"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input 
                    placeholder={t.hero.locationPlaceholder} 
                    className="pl-10 border border-input bg-background text-foreground w-40"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                  />
                </div>
                {(searchQuery || locationQuery) && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => { setSearchQuery(''); setLocationQuery(''); }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Desktop Filters */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <Card className="p-6 sticky top-24">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  {t.filters.title}
                </h3>
                <FilterContent />
              </Card>
            </aside>

            {/* Listings */}
            <main className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  {/* Mobile Filter Button */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden gap-2">
                        <Filter className="w-4 h-4" />
                        {t.filters.title}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                      <SheetHeader>
                        <SheetTitle>{t.filters.title}</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <FilterContent />
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder={t.filters.sortBy} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">{t.filters.newest}</SelectItem>
                      <SelectItem value="price_low">{t.filters.priceLowHigh}</SelectItem>
                      <SelectItem value="price_high">{t.filters.priceHighLow}</SelectItem>
                      <SelectItem value="rating">{t.filters.topRated}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Listings Grid */}
              {loading ? (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <Skeleton className="h-48 w-full" />
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-6 w-1/3" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
                  {filteredListings.map((listing) => {
                    const price = listing.pricing?.daily || listing.pricing?.hourly || 0;
                    const priceType = listing.pricing?.daily ? 'day' : 'hour';
                    return (
                      <Link key={listing._id} to={`/listing/${listing._id}`}>
                        <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${viewMode === 'list' ? 'flex' : ''}`}>
                          <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'h-48'}`}>
                            {listing.images?.[0]?.url ? (
                              <img src={listing.images[0].url} alt={listing.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                                No Image
                              </div>
                            )}
                            {listing.verified && (
                              <Badge className="absolute top-3 left-3 gap-1 bg-gradient-to-r from-amber-400 to-orange-400">
                                <CheckCircle2 className="w-3 h-3" /> {t.listing.verified}
                              </Badge>
                            )}
                            {listing.availability?.instantBook && (
                              <Badge variant="secondary" className="absolute top-3 right-3">
                                {t.listing.instantBook}
                              </Badge>
                            )}
                          </div>
                          <div className="p-4 flex-1">
                            <h3 className="font-semibold text-foreground mb-2 line-clamp-1">{listing.title}</h3>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                              <MapPin className="w-4 h-4" /> {listing.location?.city || 'Pakistan'}
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-lg font-bold text-primary">PKR {price.toLocaleString()}</span>
                                <span className="text-sm text-muted-foreground">/{priceType}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                <span className="font-medium">{listing.rating?.average?.toFixed(1) || '5.0'}</span>
                                {listing.rating?.count && (
                                  <span className="text-muted-foreground text-sm">({listing.rating.count})</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              )}

              {filteredListings.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-lg">{t.common.noResults}</p>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CategoryPage;
