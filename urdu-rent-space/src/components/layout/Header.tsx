import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Menu, 
  X, 
  Search, 
  Globe, 
  User, 
  Plus,
  LayoutDashboard,
  ChevronDown,
  Building2,
  Car,
  Shirt,
  Wrench,
  Users,
  Dog,
  Ship,
  Plane,
  LogOut,
  Settings
} from 'lucide-react';
import { categories } from '@/lib/categories';

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

const Header: React.FC = () => {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || !isHome
          ? 'bg-card/95 backdrop-blur-md shadow-md'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">M</span>
            </div>
            <span className={`text-xl font-bold ${isScrolled || !isHome ? 'text-foreground' : 'text-card'}`}>
              MyRental
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {/* Categories Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary ${
                    isScrolled || !isHome ? 'text-foreground' : 'text-card'
                  }`}
                >
                  {t.nav.categories}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 p-2">
                {categories.map((category) => {
                  const Icon = categoryIcons[category.id] || Building2;
                  return (
                    <DropdownMenuItem key={category.id} asChild>
                      <Link
                        to={`/category/${category.id}`}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer"
                      >
                        <div className={`p-2 rounded-lg ${category.colorClass} text-primary-foreground`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span>{t.categories[category.nameKey as keyof typeof t.categories]}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              to="/listings"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isScrolled || !isHome ? 'text-foreground' : 'text-card'
              }`}
            >
              {t.nav.listings}
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Search */}
            <Button variant="ghost" size="icon" className={isScrolled || !isHome ? '' : 'text-card hover:bg-card/10'}>
              <Search className="w-5 h-5" />
            </Button>

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={isScrolled || !isHome ? '' : 'text-card hover:bg-card/10'}>
                  <Globe className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage('en')} className={language === 'en' ? 'bg-accent' : ''}>
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('ur')} className={language === 'ur' ? 'bg-accent' : ''}>
                  اردو
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Dashboard Link */}
            {isAuthenticated && (
              <Link to="/dashboard">
                <Button variant={isScrolled || !isHome ? 'ghost' : 'heroOutline'} size="sm" className="gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
            )}

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={isScrolled || !isHome ? 'ghost' : 'heroOutline'} size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    {user?.fullName?.split(' ')[0] || 'Account'}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard?tab=settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login">
                  <Button variant={isScrolled || !isHome ? 'ghost' : 'heroOutline'} size="sm">
                    {t.nav.login}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant={isScrolled || !isHome ? 'default' : 'hero'} size="sm">
                    {t.nav.register}
                  </Button>
                </Link>
              </>
            )}

            {/* Create Listing */}
            <Link to="/create-listing">
              <Button variant="secondary" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                {t.nav.createListing}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              isScrolled || !isHome ? 'text-foreground' : 'text-card'
            }`}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-card border-t border-border animate-slide-down">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t.nav.search}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Navigation Links */}
              <div className="flex flex-col gap-2">
                <Link
                  to="/categories"
                  className="px-4 py-3 rounded-xl hover:bg-muted transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t.nav.categories}
                </Link>
                <Link
                  to="/listings"
                  className="px-4 py-3 rounded-xl hover:bg-muted transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t.nav.listings}
                </Link>
                {isAuthenticated && (
                  <Link
                    to="/dashboard"
                    className="px-4 py-3 rounded-xl hover:bg-muted transition-colors flex items-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                )}
              </div>

              {/* Language Switcher */}
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage('en')}
                  className={`flex-1 px-4 py-3 rounded-xl border transition-colors ${
                    language === 'en' ? 'border-primary bg-primary-light' : 'border-border'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('ur')}
                  className={`flex-1 px-4 py-3 rounded-xl border transition-colors ${
                    language === 'ur' ? 'border-primary bg-primary-light' : 'border-border'
                  }`}
                >
                  اردو
                </button>
              </div>

              {/* Auth Buttons */}
              {isAuthenticated ? (
                <div className="flex flex-col gap-2">
                  <div className="px-4 py-3 rounded-xl bg-muted">
                    <p className="text-sm text-muted-foreground">Logged in as</p>
                    <p className="font-medium">{user?.fullName}</p>
                  </div>
                  <Button variant="outline" className="w-full gap-2" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      {t.nav.login}
                    </Button>
                  </Link>
                  <Link to="/register" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="default" className="w-full">
                      {t.nav.register}
                    </Button>
                  </Link>
                </div>
              )}

              {/* Create Listing */}
              <Link to="/create-listing" onClick={() => setIsMenuOpen(false)}>
                <Button variant="secondary" className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  {t.nav.createListing}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
