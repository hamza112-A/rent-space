import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { categories } from '@/lib/categories';
import { listingApi } from '@/lib/api';
import { 
  Search, 
  MapPin, 
  Star, 
  Shield, 
  Clock, 
  ArrowRight,
  Building2,
  Car,
  Shirt,
  Wrench,
  Users,
  Dog,
  Ship,
  Plane,
  CheckCircle2,
  SearchCheck,
  CalendarCheck,
  PartyPopper,
  Plus
} from 'lucide-react';

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
  category: { name: string } | string;
  pricing: { basePrice: number; priceType: string };
  location: { city: string; area: string };
  images: { url: string }[];
  averageRating?: number;
  reviewCount?: number;
  owner?: { isVerified?: boolean };
}

const Index: React.FC = () => {
  const { t } = useLanguage();
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await listingApi.search({ limit: 8, sort: 'newest' });
        setFeaturedListings(response.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch listings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  const popularSearchLinks = [
    { labelKey: 'apartments' as const, to: '/category/property' },
    { labelKey: 'cars' as const, to: '/category/vehicles' },
    { labelKey: 'weddingDresses' as const, to: '/category/clothes' },
    { labelKey: 'cameras' as const, to: '/category/equipment' },
  ];

  return (
    <Layout>
      {/* Hero Section - Reduced Height */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        
        <div className="relative z-10 container mx-auto px-4 pt-24 pb-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-card mb-6 animate-fade-in leading-relaxed">
              {t.hero.title}
            </h1>
            <p className="text-lg md:text-xl text-card/80 mb-8 max-w-2xl mx-auto animate-fade-in leading-relaxed">
              {t.hero.subtitle}
            </p>
            
            <div className="bg-card rounded-2xl p-3 shadow-xl max-w-3xl mx-auto animate-fade-in">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input type="text" placeholder={t.hero.searchPlaceholder} className="w-full pl-12 pr-4 py-4 rounded-xl bg-muted/50 border-0 focus:outline-none focus:ring-2 focus:ring-primary text-foreground" />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input type="text" placeholder={t.hero.locationPlaceholder} className="w-full pl-12 pr-4 py-4 rounded-xl bg-muted/50 border-0 focus:outline-none focus:ring-2 focus:ring-primary text-foreground" />
                </div>
                <Button size="lg" className="px-8">
                  <Search className="w-5 h-5 mr-2" />
                  {t.hero.searchButton}
                </Button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3 animate-fade-in">
              <span className="text-card/70">{t.hero.popularSearches}</span>
              {popularSearchLinks.map(({ labelKey, to }) => (
                <Link key={labelKey} to={to} aria-label={`${t.hero.searchButton} ${t.hero[labelKey]}`} className="inline-flex">
                  <Badge variant="secondary" className="bg-card/20 text-card border-card/30 hover:bg-card/30">
                    {t.hero[labelKey]}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Categories Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t.categories.title}</h2>
            <p className="text-muted-foreground text-lg">{t.categories.subtitle}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category) => {
              const Icon = categoryIcons[category.id] || Building2;
              return (
                <Link key={category.id} to={`/category/${category.id}`}>
                  <Card className="p-6 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer group">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${category.colorClass} flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <Icon className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{t.categories[category.nameKey as keyof typeof t.categories]}</h3>
                    <p className="text-sm text-muted-foreground">{category.listingsCount?.toLocaleString()} {t.categories.listings}</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">{t.hero.featuredListings}</h2>
              <p className="text-muted-foreground">{t.hero.featuredSubtitle}</p>
            </div>
            <Link to="/listings">
              <Button variant="outline" className="gap-2">{t.categories.viewAll} <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              // Loading skeletons
              [1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-1/3" />
                  </div>
                </Card>
              ))
            ) : featuredListings.length > 0 ? (
              featuredListings.map((listing) => (
                <Link key={listing._id} to={`/listing/${listing._id}`}>
                  <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="relative h-48 bg-muted">
                      {listing.images?.[0]?.url ? (
                        <img src={listing.images[0].url} alt={listing.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No Image
                        </div>
                      )}
                      {listing.owner?.isVerified && (
                        <Badge className="absolute top-3 left-3 gap-1 bg-gradient-to-r from-amber-400 to-orange-400">
                          <CheckCircle2 className="w-3 h-3" /> {t.listing.verified}
                        </Badge>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground mb-2 line-clamp-1">{listing.title}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                        <MapPin className="w-4 h-4" /> {listing.location?.city || 'Pakistan'}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-primary">
                            {t.common.pkr} {(listing.pricing?.basePrice || 0).toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground">/{listing.pricing?.priceType || 'day'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="font-medium">{listing.averageRating?.toFixed(1) || '5.0'}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-4 text-center py-12">
                <p className="text-muted-foreground">No listings available yet. Be the first to create one!</p>
                <Link to="/create-listing">
                  <Button className="mt-4 gap-2">
                    <Plus className="w-4 h-4" />
                    Create Listing
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">{t.hero.whyChoose}</h2>
            <p className="text-muted-foreground">{t.hero.whyChooseSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: t.hero.verifiedUsers, desc: t.hero.verifiedUsersDesc },
              { icon: Star, title: t.hero.qualityAssured, desc: t.hero.qualityAssuredDesc },
              { icon: Clock, title: t.hero.instantBooking, desc: t.hero.instantBookingDesc },
            ].map((item) => (
              <Card key={item.title} className="p-8 text-center transition-all duration-300 hover:shadow-lg">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">{t.hero.howItWorks}</h2>
            <p className="text-muted-foreground">{t.hero.howItWorksSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection lines for desktop */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent" />
            
            {[
              { icon: SearchCheck, step: '1', title: t.hero.stepSearch, desc: t.hero.stepSearchDesc, color: 'bg-primary' },
              { icon: CalendarCheck, step: '2', title: t.hero.stepBook, desc: t.hero.stepBookDesc, color: 'bg-secondary' },
              { icon: PartyPopper, step: '3', title: t.hero.stepEnjoy, desc: t.hero.stepEnjoyDesc, color: 'bg-accent' },
            ].map((item) => (
              <div key={item.step} className="text-center relative">
                <div className={`w-20 h-20 mx-auto mb-6 rounded-full ${item.color} flex items-center justify-center shadow-lg relative z-10`}>
                  <item.icon className="w-10 h-10 text-primary-foreground" />
                </div>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-card border-2 border-primary flex items-center justify-center font-bold text-primary text-sm z-20">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920')] bg-cover bg-center opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-card mb-4">{t.hero.ctaTitle}</h2>
            <p className="text-lg text-card/80 mb-8 max-w-2xl mx-auto">{t.hero.ctaSubtitle}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/create-listing">
                <Button size="lg" variant="secondary" className="gap-2 px-8">
                  <Plus className="w-5 h-5" />
                  {t.hero.ctaButton}
                </Button>
              </Link>
              <Link to="/listings">
                <Button size="lg" variant="outline" className="gap-2 px-8 bg-card/10 text-card border-card/30 hover:bg-card/20">
                  {t.hero.ctaSecondary}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
