import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { categories } from '@/lib/categories';
import { useLanguage } from '@/contexts/LanguageContext';

interface SiteSearchProps {
  // Called after a successful navigation, so the caller can close its dialog/sheet.
  onNavigate?: () => void;
  showPopularCategories?: boolean;
  autoFocus?: boolean;
}

const SiteSearch: React.FC<SiteSearchProps> = ({ onNavigate, showPopularCategories = false, autoFocus = false }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() && !locationQuery.trim()) return;
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (locationQuery.trim()) params.set('location', locationQuery.trim());
    navigate(`/listings?${params.toString()}`);
    setQuery('');
    setLocationQuery('');
    onNavigate?.();
  };

  const handleQuickCategory = (categoryId: string) => {
    navigate(`/category/${categoryId}`);
    onNavigate?.();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t.hero.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            autoFocus={autoFocus}
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t.hero.locationPlaceholder}
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" className="w-full gap-2">
          <Search className="w-4 h-4" />
          {t.hero.searchButton}
        </Button>
      </form>

      {showPopularCategories && (
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Popular Categories
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 6).map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleQuickCategory(category.id)}
                >
                  <Icon className="w-4 h-4" />
                  {t.categories[category.nameKey as keyof typeof t.categories]}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteSearch;
