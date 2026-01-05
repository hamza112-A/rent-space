import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { categories } from '@/lib/categories';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin 
} from 'lucide-react';

const Footer: React.FC = () => {
  const { t, isRTL } = useLanguage();

  return (
    <footer className="bg-foreground text-background">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">M</span>
              </div>
              <span className="text-xl font-bold">MyRental</span>
            </div>
            <p className="text-background/70 text-sm leading-relaxed">
              {t.footer.tagline}
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 rounded-lg bg-background/10 hover:bg-background/20 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-background/10 hover:bg-background/20 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-background/10 hover:bg-background/20 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-background/10 hover:bg-background/20 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Categories Column */}
          <div>
            <h4 className="font-semibold text-lg mb-6">{t.nav.categories}</h4>
            <ul className="space-y-3">
              {categories.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <Link
                    to={`/category/${category.id}`}
                    className="text-background/70 hover:text-background transition-colors text-sm"
                  >
                    {t.categories[category.nameKey as keyof typeof t.categories]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-semibold text-lg mb-6">{t.footer.about}</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-background/70 hover:text-background transition-colors text-sm">
                  {t.footer.about}
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-background/70 hover:text-background transition-colors text-sm">
                  {t.footer.howItWorks}
                </Link>
              </li>
              <li>
                <Link to="/safety" className="text-background/70 hover:text-background transition-colors text-sm">
                  {t.footer.safety}
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-background/70 hover:text-background transition-colors text-sm">
                  {t.footer.careers}
                </Link>
              </li>
              <li>
                <Link to="/press" className="text-background/70 hover:text-background transition-colors text-sm">
                  {t.footer.press}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="font-semibold text-lg mb-6">{t.footer.contact}</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-secondary mt-0.5" />
                <span className="text-background/70 text-sm">
                  123 Business District, Karachi, Pakistan
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-secondary" />
                <span className="text-background/70 text-sm">+92 300 1234567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-secondary" />
                <span className="text-background/70 text-sm">support@myrental.pk</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-background/50 text-sm">
              {t.footer.copyright}
            </p>
            <div className="flex gap-6">
              <Link to="/terms" className="text-background/50 hover:text-background text-sm transition-colors">
                {t.footer.terms}
              </Link>
              <Link to="/privacy" className="text-background/50 hover:text-background text-sm transition-colors">
                {t.footer.privacy}
              </Link>
              <Link to="/help" className="text-background/50 hover:text-background text-sm transition-colors">
                {t.footer.help}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
