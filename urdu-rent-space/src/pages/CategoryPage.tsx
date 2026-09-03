import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
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
import ListingCard from '@/components/listings/ListingCard';
import EmptyState from '@/components/common/EmptyState';
import FilterBar, { ActiveFilter } from '@/components/filters/FilterBar';
import { useFilterState } from '@/hooks/useFilterState';
import {
  Search,
  MapPin,
  Star,
  Filter,
  Grid3X3,
  List,
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

// Debounce hook — smooths API calls triggered by fast typing/dragging
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

const PRICE_MIN = 0;
const PRICE_MAX = 200000;

// Module-level so useFilterState's memoized deps stay stable across renders.
const FILTER_DEFAULTS = {
  subcategory: '',
  minPrice: PRICE_MIN,
  maxPrice: PRICE_MAX,
  verified: false,
  instantBook: false,
  rating: 0,
  sort: 'newest',
  q: '',
  location: '',
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

const RATING_OPTIONS = [4, 4.5, 5];

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [listings, setListings] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const filters = useFilterState(FILTER_DEFAULTS);

  // Debounce URL-driven values that change rapidly (typing, slider drag)
  // before they trigger a fetch — the URL itself updates immediately.
  const debouncedSearch = useDebounce(filters.values.q, 300);
  const debouncedLocation = useDebounce(filters.values.location, 300);
  const debouncedMinPrice = useDebounce(filters.values.minPrice, 200);
  const debouncedMaxPrice = useDebounce(filters.values.maxPrice, 200);

  const category = categoryId ? getCategoryById(categoryId) : null;
  const CategoryIcon = category ? categoryIcons[category.id] || Building2 : Building2;

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      if (categoryId) params.category = categoryId;
      if (filters.values.subcategory) params.subcategory = filters.values.subcategory;
      if (filters.values.sort) params.sort = filters.values.sort;
      if (debouncedSearch) params.query = debouncedSearch;
      if (debouncedLocation) params.location = debouncedLocation;
      if (debouncedMinPrice > PRICE_MIN) params.minPrice = debouncedMinPrice;
      if (debouncedMaxPrice < PRICE_MAX) params.maxPrice = debouncedMaxPrice;
      if (filters.values.verified) params.verified = true;
      if (filters.values.instantBook) params.instantBook = true;
      if (filters.values.rating > 0) params.minRating = filters.values.rating;

      const response = await listingApi.search(params);
      setListings(response.data?.data || []);
      setTotalCount(response.data?.pagination?.total ?? response.data?.data?.length ?? 0);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
    } finally {
      setLoading(false);
    }
  }, [
    categoryId,
    filters.values.subcategory,
    filters.values.sort,
    filters.values.verified,
    filters.values.instantBook,
    filters.values.rating,
    debouncedSearch,
    debouncedLocation,
    debouncedMinPrice,
    debouncedMaxPrice,
  ]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Filters shown in the sidebar/sheet panel (excludes search/location/sort,
  // which live in the hero search bar and toolbar respectively).
  const panelFilterCount = [
    !!filters.values.subcategory,
    filters.values.minPrice > PRICE_MIN || filters.values.maxPrice < PRICE_MAX,
    filters.values.verified,
    filters.values.instantBook,
    filters.values.rating > 0,
  ].filter(Boolean).length;

  const resetPanelFilters = () => {
    filters.setValues({
      subcategory: '',
      minPrice: PRICE_MIN,
      maxPrice: PRICE_MAX,
      verified: false,
      instantBook: false,
      rating: 0,
    });
  };

  const subcategoryLabel = category?.subcategories.find((s) => s.id === filters.values.subcategory);

  // All active filters/search terms, shown as chips in the main toolbar.
  const activeChips = useMemo<ActiveFilter[]>(() => {
    const chips: ActiveFilter[] = [];
    if (filters.values.subcategory) {
      chips.push({
        key: 'subcategory',
        label: subcategoryLabel ? t.subcategories[subcategoryLabel.nameKey as keyof typeof t.subcategories] : filters.values.subcategory,
        onRemove: () => filters.setValue('subcategory', ''),
      });
    }
    if (filters.values.minPrice > PRICE_MIN || filters.values.maxPrice < PRICE_MAX) {
      chips.push({
        key: 'price',
        label: `PKR ${filters.values.minPrice.toLocaleString()} - ${filters.values.maxPrice.toLocaleString()}`,
        onRemove: () => filters.setValues({ minPrice: PRICE_MIN, maxPrice: PRICE_MAX }),
      });
    }
    if (filters.values.verified) {
      chips.push({ key: 'verified', label: t.filters.verified, onRemove: () => filters.setValue('verified', false) });
    }
    if (filters.values.instantBook) {
      chips.push({ key: 'instantBook', label: t.filters.instantBook, onRemove: () => filters.setValue('instantBook', false) });
    }
    if (filters.values.rating > 0) {
      chips.push({ key: 'rating', label: `${filters.values.rating}+ ★`, onRemove: () => filters.setValue('rating', 0) });
    }
    if (filters.values.q) {
      chips.push({ key: 'q', label: `"${filters.values.q}"`, onRemove: () => filters.setValue('q', '') });
    }
    if (filters.values.location) {
      chips.push({ key: 'location', label: filters.values.location, onRemove: () => filters.setValue('location', '') });
    }
    return chips;
  }, [filters, subcategoryLabel, t]);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Active Filters Count */}
      {panelFilterCount > 0 && (
        <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg">
          <span className="text-sm text-primary font-medium">
            {panelFilterCount} filter{panelFilterCount > 1 ? 's' : ''} active
          </span>
          <Button variant="ghost" size="sm" onClick={resetPanelFilters} className="h-7 text-xs">
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
                  checked={filters.values.subcategory === sub.id}
                  onCheckedChange={(checked) => filters.setValue('subcategory', checked ? sub.id : '')}
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
          {(filters.values.minPrice > PRICE_MIN || filters.values.maxPrice < PRICE_MAX) && (
            <Badge variant="secondary" className="text-xs">Active</Badge>
          )}
        </h4>
        <PriceRangeSlider
          value={[filters.values.minPrice, filters.values.maxPrice]}
          onChange={([min, max]) => filters.setValues({ minPrice: min, maxPrice: max }, { replace: true })}
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={1000}
        />
      </div>

      {/* Verified Only */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={filters.values.verified}
            onCheckedChange={(checked) => filters.setValue('verified', checked === true)}
          />
          <span className="text-sm">{t.filters.verified}</span>
        </label>
      </div>

      {/* Instant Book */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={filters.values.instantBook}
            onCheckedChange={(checked) => filters.setValue('instantBook', checked === true)}
          />
          <span className="text-sm">{t.filters.instantBook}</span>
        </label>
      </div>

      {/* Rating */}
      <div>
        <h4 className="font-semibold mb-3">{t.filters.rating}</h4>
        <div className="flex gap-2">
          {RATING_OPTIONS.map((rating) => {
            const isActive = filters.values.rating === rating;
            return (
              <Button
                key={rating}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className="flex items-center gap-1"
                onClick={() => filters.setValue('rating', isActive ? 0 : rating)}
              >
                <Star className={`w-3 h-3 ${isActive ? 'fill-primary-foreground' : 'fill-amber-400'} text-amber-400`} />
                {rating}+
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button variant="outline" className="flex-1" onClick={resetPanelFilters}>
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
                  {totalCount} {t.categories.listings} available
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
                    value={filters.values.q}
                    onChange={(e) => filters.setValue('q', e.target.value, { replace: true })}
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder={t.hero.locationPlaceholder}
                    className="pl-10 border border-input bg-background text-foreground w-40"
                    value={filters.values.location}
                    onChange={(e) => filters.setValue('location', e.target.value, { replace: true })}
                  />
                </div>
                {(filters.values.q || filters.values.location) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => filters.setValues({ q: '', location: '' })}
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
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* Mobile Filter Button */}
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" className="lg:hidden gap-2 relative">
                          <Filter className="w-4 h-4" />
                          {t.filters.title}
                          {panelFilterCount > 0 && (
                            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">
                              {panelFilterCount}
                            </Badge>
                          )}
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

                    <Select value={filters.values.sort} onValueChange={(v) => filters.setValue('sort', v)}>
                      <SelectTrigger className="w-36 sm:w-44">
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

                <FilterBar activeFilters={activeChips} onClearAll={filters.resetAll} />
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
                  {listings.map((listing) => (
                    <ListingCard key={listing._id} listing={listing} variant={viewMode} />
                  ))}
                </div>
              )}

              {!loading && listings.length === 0 && (
                <EmptyState title={t.common.noResults} />
              )}
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CategoryPage;
