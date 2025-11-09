import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { categories, getCategoryById } from '@/lib/categories';
import {
  Search,
  MapPin,
  Star,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
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

// Mock listings data
const mockListings = [
  { id: '1', title: 'Luxury Apartment in DHA Phase 5', category: 'property', subcategory: 'apartments', price: 85000, priceType: 'month', location: 'Karachi', rating: 4.9, reviews: 47, image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400', verified: true, instantBook: true },
  { id: '2', title: 'Modern 3BR House with Garden', category: 'property', subcategory: 'houses', price: 120000, priceType: 'month', location: 'Lahore', rating: 4.8, reviews: 32, image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400', verified: true, instantBook: false },
  { id: '3', title: 'Toyota Corolla GLI 2023', category: 'vehicles', subcategory: 'cars', price: 8500, priceType: 'day', location: 'Islamabad', rating: 5.0, reviews: 18, image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=400', verified: true, instantBook: true },
  { id: '4', title: 'Honda Civic RS Turbo', category: 'vehicles', subcategory: 'cars', price: 12000, priceType: 'day', location: 'Karachi', rating: 4.7, reviews: 56, image: 'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=400', verified: false, instantBook: true },
  { id: '5', title: 'Wedding Sherwani Premium', category: 'clothes', subcategory: 'wedding', price: 15000, priceType: 'day', location: 'Lahore', rating: 4.9, reviews: 23, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400', verified: true, instantBook: false },
  { id: '6', title: 'Designer Bridal Lehnga', category: 'clothes', subcategory: 'wedding', price: 25000, priceType: 'day', location: 'Karachi', rating: 5.0, reviews: 41, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400', verified: true, instantBook: true },
  { id: '7', title: 'Professional Camera Kit Sony A7', category: 'equipment', subcategory: 'electronics', price: 5000, priceType: 'day', location: 'Islamabad', rating: 4.8, reviews: 67, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400', verified: true, instantBook: true },
  { id: '8', title: 'DJ Sound System Complete', category: 'equipment', subcategory: 'electronics', price: 15000, priceType: 'day', location: 'Lahore', rating: 4.6, reviews: 29, image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', verified: false, instantBook: false },
];

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  const category = categoryId ? getCategoryById(categoryId) : null;
  const CategoryIcon = category ? categoryIcons[category.id] || Building2 : Building2;

  // Filter listings by category
  const filteredListings = mockListings.filter((listing) => {
    if (categoryId && listing.category !== categoryId) return false;
    if (selectedSubcategory && listing.subcategory !== selectedSubcategory) return false;
    if (listing.price < priceRange[0] || listing.price > priceRange[1]) return false;
    return true;
  });

  const FilterContent = () => (
    <div className="space-y-6">
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

      {/* Price Range */}
      <div>
        <h4 className="font-semibold mb-3">{t.filters.priceRange}</h4>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={200000}
          step={1000}
          className="mb-4"
        />
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
            className="w-24"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 200000])}
            className="w-24"
          />
        </div>
      </div>

      {/* Verified Only */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox />
          <span className="text-sm">{t.filters.verified}</span>
        </label>
      </div>

      {/* Instant Book */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox />
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
        <Button variant="outline" className="flex-1" onClick={() => {
          setPriceRange([0, 200000]);
          setSelectedSubcategory(null);
        }}>
          {t.filters.reset}
        </Button>
        <Button className="flex-1">{t.filters.apply}</Button>
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
            <div className="bg-card rounded-xl p-2 max-w-2xl">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input placeholder={t.hero.searchPlaceholder} className="pl-10 border-0 bg-muted/50" />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input placeholder={t.hero.locationPlaceholder} className="pl-10 border-0 bg-muted/50 w-40" />
                </div>
                <Button>{t.hero.searchButton}</Button>
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

                  <Select defaultValue="relevance">
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder={t.filters.sortBy} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">{t.filters.relevance}</SelectItem>
                      <SelectItem value="price_asc">{t.filters.priceLowHigh}</SelectItem>
                      <SelectItem value="price_desc">{t.filters.priceHighLow}</SelectItem>
                      <SelectItem value="newest">{t.filters.newest}</SelectItem>
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
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
                {filteredListings.map((listing) => (
                  <Link key={listing.id} to={`/listing/${listing.id}`}>
                    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${viewMode === 'list' ? 'flex' : ''}`}>
                      <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'h-48'}`}>
                        <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
                        {listing.verified && (
                          <Badge className="absolute top-3 left-3 gap-1 bg-gradient-to-r from-amber-400 to-orange-400">
                            <CheckCircle2 className="w-3 h-3" /> {t.listing.verified}
                          </Badge>
                        )}
                        {listing.instantBook && (
                          <Badge variant="secondary" className="absolute top-3 right-3">
                            {t.listing.instantBook}
                          </Badge>
                        )}
                      </div>
                      <div className="p-4 flex-1">
                        <h3 className="font-semibold text-foreground mb-2 line-clamp-1">{listing.title}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                          <MapPin className="w-4 h-4" /> {listing.location}
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-bold text-primary">PKR {listing.price.toLocaleString()}</span>
                            <span className="text-sm text-muted-foreground">/{listing.priceType}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="font-medium">{listing.rating}</span>
                            <span className="text-muted-foreground text-sm">({listing.reviews})</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>

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
