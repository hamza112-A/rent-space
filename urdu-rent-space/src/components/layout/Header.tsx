import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useScrolledHeaderStyles } from '@/hooks/useScrolledHeaderStyles';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import SiteSearch from '@/components/search/SiteSearch';
import AccountModeSwitcher from '@/components/layout/AccountModeSwitcher';
import {
  Menu,
  Search,
  Globe,
  User,
  Plus,
  LayoutDashboard,
  ChevronDown,
  LogOut,
  Settings,
} from 'lucide-react';
import { categories } from '@/lib/categories';

const Header: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const styles = useScrolledHeaderStyles();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Shown to visitors (funnel to signup) and to owners — but for a 'both'
  // user, only while they're actually in Owner mode, so it matches what the
  // sidebar already does instead of offering listing creation while they're
  // browsing as a buyer.
  const showCreateListing = !isAuthenticated
    || user?.role === 'owner'
    || (user?.role === 'both' && user.activeMode !== 'borrower');

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${styles.headerClassName}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">M</span>
            </div>
            <span className={`text-xl font-bold ${styles.textClassName}`}>MyRental</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {/* Categories Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary ${styles.textClassName}`}>
                  {t.nav.categories}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 p-2">
                {categories.map((category) => {
                  const Icon = category.icon;
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
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/categories" className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm font-medium text-primary">
                    {t.categories.viewAll}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/listings" className={`text-sm font-medium transition-colors hover:text-primary ${styles.textClassName}`}>
              {t.nav.listings}
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Search */}
            <Button
              variant="ghost"
              size="icon"
              className={styles.iconButtonClassName}
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={styles.iconButtonClassName}>
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
                <Button variant={styles.outlineButtonVariant} size="sm" className="gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  {t.nav.dashboard}
                </Button>
              </Link>
            )}

            {/* Owner/Buyer mode switcher — only rendered for accounts with both roles */}
            {isAuthenticated && <AccountModeSwitcher />}

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={styles.outlineButtonVariant} size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    {user?.fullName?.split(' ')[0] || 'Account'}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="w-4 h-4" />
                      {t.nav.dashboard}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard?tab=settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" />
                      {t.dashboard.settings}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4" />
                    {t.nav.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login">
                  <Button variant={styles.outlineButtonVariant} size="sm">
                    {t.nav.login}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant={styles.primaryButtonVariant} size="sm">
                    {t.nav.register}
                  </Button>
                </Link>
              </>
            )}

            {/* Create Listing - Only for owners (and 'both' users in Owner mode) */}
            {showCreateListing && (
              <Link to="/create-listing">
                <Button variant="secondary" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t.nav.createListing}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <button className={`lg:hidden p-2 rounded-lg transition-colors ${styles.textClassName}`}>
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>MyRental</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                {/* Search */}
                <SiteSearch onNavigate={() => setIsMenuOpen(false)} />

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
                      {t.nav.dashboard}
                    </Link>
                  )}
                </div>

                {isAuthenticated && <AccountModeSwitcher className="w-full" />}

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
                      <p className="text-sm text-muted-foreground">{t.auth.signIn}</p>
                      <p className="font-medium">{user?.fullName}</p>
                    </div>
                    <Button variant="outline" className="w-full gap-2" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>
                      <LogOut className="w-4 h-4" />
                      {t.nav.logout}
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

                {/* Create Listing - Only for owners (and 'both' users in Owner mode) */}
                {showCreateListing && (
                  <Link to="/create-listing" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="secondary" className="w-full gap-2">
                      <Plus className="w-4 h-4" />
                      {t.nav.createListing}
                    </Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Search Dialog */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              {t.nav.search}
            </DialogTitle>
          </DialogHeader>
          <SiteSearch onNavigate={() => setIsSearchOpen(false)} showPopularCategories autoFocus />
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
