import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  Package, 
  Calendar, 
  DollarSign, 
  Shield, 
  Settings,
  Menu,
  Crown,
  Plus,
  BarChart3,
  Users,
  Building2,
  CheckCircle,
  CalendarDays,
  TrendingUp,
  Tag,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import MyListings from '@/components/dashboard/MyListings';
import MyBookings from '@/components/dashboard/MyBookings';
import Earnings from '@/components/dashboard/Earnings';
import Verification from '@/components/dashboard/Verification';
import AccountSettings from '@/components/dashboard/AccountSettings';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import Messages from '@/components/dashboard/Messages';
// Admin components
import AdminDashboard from '@/components/dashboard/admin/AdminDashboard';
import AdminUsers from '@/components/dashboard/admin/AdminUsers';
import AdminListings from '@/components/dashboard/admin/AdminListings';
import AdminVerifications from '@/components/dashboard/admin/AdminVerifications';
import AdminBookings from '@/components/dashboard/admin/AdminBookings';
import AdminAnalytics from '@/components/dashboard/admin/AdminAnalytics';
import AdminCategories from '@/components/dashboard/admin/AdminCategories';

const Dashboard: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const baseTabs = [
    { id: 'overview', label: t.dashboard.overview, icon: LayoutDashboard },
    { id: 'listings', label: t.dashboard.myListings, icon: Package },
    { id: 'bookings', label: t.dashboard.myBookings, icon: Calendar },
    { id: 'messages', label: t.dashboard.messages, icon: MessageSquare },
    { id: 'earnings', label: t.dashboard.earnings, icon: DollarSign },
    { id: 'verification', label: t.dashboard.verification, icon: Shield },
    { id: 'settings', label: t.dashboard.settings, icon: Settings },
  ];

  const adminTabs = [
    { id: 'admin-dashboard', label: t.admin?.dashboard || 'Admin Dashboard', icon: BarChart3 },
    { id: 'admin-users', label: t.admin?.users || 'User Management', icon: Users },
    { id: 'admin-listings', label: t.admin?.listings || 'Listing Management', icon: Building2 },
    { id: 'admin-verifications', label: t.admin?.verifications || 'Verifications', icon: CheckCircle },
    { id: 'admin-bookings', label: t.admin?.bookings || 'All Bookings', icon: CalendarDays },
    { id: 'admin-analytics', label: t.dashboard.analytics, icon: TrendingUp },
    { id: 'admin-categories', label: t.admin?.categories || 'Categories', icon: Tag },
  ];

  const tabs = user?.isSuperAdmin ? [...baseTabs, ...adminTabs] : baseTabs;

  const SidebarContent = () => (
    <nav className="space-y-1">
      {/* Base tabs */}
      {baseTabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{tab.label}</span>
          </button>
        );
      })}

      {/* Super Admin Section */}
      {user?.isSuperAdmin && (
        <>
          <div className="mt-6 pt-6 border-t border-border">
            <p className="px-4 py-2 text-xs font-semibold text-purple-600 uppercase tracking-wider">{t.admin?.title || 'Super Admin'}</p>
          </div>
          {adminTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-muted-foreground hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </>
      )}
      
      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-border space-y-2">
        <Link to="/create-listing">
          <Button variant="outline" className="w-full gap-2 justify-start">
            <Plus className="h-4 w-4" />
            {t.nav.createListing}
          </Button>
        </Link>
        <Link to="/subscription">
          <Button variant="outline" className="w-full gap-2 justify-start text-amber-600 border-amber-200 hover:bg-amber-50">
            <Crown className="h-4 w-4" />
            {t.subscription.subscribe}
          </Button>
        </Link>
      </div>
    </nav>
  );

  return (
    <Layout hideFooter>
      <div className="min-h-screen bg-background">
        <div className="flex pt-16">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 border-r border-border bg-card min-h-[calc(100vh-4rem)] p-4 sticky top-16 self-start">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground">{t.dashboard.title}</h2>
              <p className="text-sm text-muted-foreground">{t.dashboard.welcome}</p>
            </div>
            <SidebarContent />
          </aside>

          {/* Mobile Header */}
          <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-background border-b border-border p-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Menu className="h-4 w-4" />
                  {tabs.find(t => t.id === activeTab)?.label}
                </Button>
              </SheetTrigger>
              <SheetContent side={isRTL ? 'right' : 'left'} className="w-64 p-4">
                <div className="mb-6 mt-4">
                  <h2 className="text-lg font-semibold text-foreground">{t.dashboard.title}</h2>
                  <p className="text-sm text-muted-foreground">{t.dashboard.welcome}</p>
                </div>
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-8 mt-14 lg:mt-0">
            <div className="max-w-6xl mx-auto">
              {activeTab === 'overview' && <DashboardOverview />}
              {activeTab === 'listings' && <MyListings />}
              {activeTab === 'bookings' && <MyBookings />}
              {activeTab === 'messages' && <Messages />}
              {activeTab === 'earnings' && <Earnings />}
              {activeTab === 'verification' && <Verification />}
              {activeTab === 'settings' && <AccountSettings />}
              {/* Admin tabs - only rendered for super admins */}
              {user?.isSuperAdmin && (
                <>
                  {activeTab === 'admin-dashboard' && <AdminDashboard />}
                  {activeTab === 'admin-users' && <AdminUsers />}
                  {activeTab === 'admin-listings' && <AdminListings />}
                  {activeTab === 'admin-verifications' && <AdminVerifications />}
                  {activeTab === 'admin-bookings' && <AdminBookings />}
                  {activeTab === 'admin-analytics' && <AdminAnalytics />}
                  {activeTab === 'admin-categories' && <AdminCategories />}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
