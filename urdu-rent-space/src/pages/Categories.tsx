import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { categories } from '@/lib/categories';

const Categories: React.FC = () => {
  const { t } = useLanguage();

  return (
    <Layout>
      <div className="pt-24 min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t.categories.title}</h1>
            <p className="text-muted-foreground text-lg">{t.categories.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.id} className="p-6 hover:shadow-lg transition-shadow">
                  <Link to={`/category/${category.id}`} className="flex items-center gap-4 mb-4 group">
                    <div className={`w-14 h-14 rounded-2xl ${category.colorClass} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
                      <Icon className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                        {t.categories[category.nameKey as keyof typeof t.categories]}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {category.listingsCount?.toLocaleString()} {t.categories.listings}
                      </p>
                    </div>
                  </Link>
                  <div className="flex flex-wrap gap-2">
                    {category.subcategories.map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/category/${category.id}?subcategory=${sub.id}`}
                        className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors text-muted-foreground"
                      >
                        {t.subcategories[sub.nameKey as keyof typeof t.subcategories]}
                      </Link>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Categories;
