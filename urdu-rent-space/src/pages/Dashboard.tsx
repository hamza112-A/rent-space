import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  MessageSquare,
  AlertTriangle,
  UserSquare2,
  Store,
  Flag,
  ClipboardList,
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
import Disputes from '@/components/dashboard/Disputes';
import Team from '@/components/dashboard/Team';
import StorefrontSettings from '@/components/dashboard/StorefrontSettings';
// Admin components
import AdminDashboard from '@/components/dashboard/admin/AdminDashboard';
import AdminUsers from '@/components/dashboard/admin/AdminUsers';
import AdminListings from '@/components/dashboard/admin/AdminListings';
import AdminVerifications from '@/components/dashboard/admin/AdminVerifications';
import AdminBookings from '@/components/dashboard/admin/AdminBookings';
import AdminAnalytics from '@/components/dashboard/admin/AdminAnalytics';
import AdminCategories from '@/components/dashboard/admin/AdminCategories';
import AdminDisputes from '@/components/dashboard/admin/AdminDisputes';
import AdminPayouts from '@/components/dashboard/admin/AdminPayouts';
import AdminReports from '@/components/dashboard/admin/AdminReports';
import AdminAuditLog from '@/components/dashboard/admin/AdminAuditLog';

const Dashboard: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  // Supports deep-linking into a tab (e.g. `/dashboard?tab=earnings`), used by
  // the Stripe Connect onboarding return redirect.
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check user role
  const isOwner = user?.role === 'owner' || user?.role === 'both';
  const isBorrower = user?.role === 'borrower' || user?.role === 'both';

  // Build tabs based on user role
  const baseTabs = [
    { id: 'overview', label: t.dashboard.overview, icon: LayoutDashboard, roles: ['owner', 'borrower', 'both'] },
    { id: 'listings', label: t.dashboard.myListings, icon: Package, roles: ['owner', 'both'] },
    { id: 'bookings', label: t.dashboard.myBookings, icon: Calendar, roles: ['owner', 'borrower', 'both'] },
    { id: 'messages', label: t.dashboard.messages, icon: MessageSquare, roles: ['owner', 'borrower', 'both'] },
    { id: 'disputes', label: 'Disputes', icon: AlertTriangle, roles: ['owner', 'borrower', 'both'] },
    { id: 'earnings', label: t.dashboard.earnings, icon: DollarSign, roles: ['owner', 'both'] },
    { id: 'team', label: 'Team', icon: UserSquare2, roles: ['owner', 'both'] },
    { id: 'storefront', label: 'Storefront', icon: Store, roles: ['owner', 'both'] },
    { id: 'verification', label: t.dashboard.verification, icon: Shield, roles: ['owner', 'borrower', 'both'] },
    { id: 'settings', label: t.dashboard.settings, icon: Settings, roles: ['owner', 'borrower', 'both'] },
  ].filter(tab => tab.roles.includes(user?.role || 'borrower'));

  // Which granular admin role(s) can see each admin tab — see
  // docs/redesign/11-admin-panel.md. 'superadmin' can always see everything
  // regardless of what's listed here (filtered below).
  const adminTabsAll = [
    { id: 'admin-dashboard', label: t.admin?.dashboard || 'Admin Dashboard', icon: BarChart3, adminRoles: ['support', 'finance'] },
    { id: 'admin-users', label: t.admin?.users || 'User Management', icon: Users, adminRoles: ['support'] },
    { id: 'admin-listings', label: t.admin?.listings || 'Listing Management', icon: Building2, adminRoles: ['support'] },
    { id: 'admin-verifications', label: t.admin?.verifications || 'Verifications', icon: CheckCircle, adminRoles: ['support'] },
    { id: 'admin-bookings', label: t.admin?.bookings || 'All Bookings', icon: CalendarDays, adminRoles: ['support'] },
    { id: 'admin-disputes', label: 'Dispute Management', icon: AlertTriangle, adminRoles: ['support'] },
    { id: 'admin-payouts', label: 'Payout Oversight', icon: DollarSign, adminRoles: ['finance'] },
    { id: 'admin-reports', label: 'Report Queue', icon: Flag, adminRoles: ['support'] },
    { id: 'admin-analytics', label: t.dashboard.analytics, icon: TrendingUp, adminRoles: ['support', 'finance'] },
    { id: 'admin-categories', label: t.admin?.categories || 'Categories', icon: Tag, adminRoles: [] },
    { id: 'admin-audit-log', label: 'Audit Log', icon: ClipboardList, adminRoles: [] },
  ];

  const isAnyAdmin = user?.isSuperAdmin || (!!user?.adminRole && user.adminRole !== 'none');
  const adminTabs = adminTabsAll.filter(
    (tab) => user?.isSuperAdmin || (user?.adminRole && tab.adminRoles.includes(user.adminRole))
  );

  const tabs = isAnyAdmin ? [...baseTabs, ...adminTabs] : baseTabs;

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

      {/* Admin Section */}
      {isAnyAdmin && (
        <>
          <div className="mt-6 pt-6 border-t border-border">
            <p className="px-4 py-2 text-xs font-semibold text-purple-600 uppercase tracking-wider">
              {user?.isSuperAdmin ? (t.admin?.title || 'Super Admin') : `Admin (${user?.adminRole})`}
            </p>
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
        {isOwner && (
          <Link to="/create-listing">
            <Button variant="outline" className="w-full gap-2 justify-start">
              <Plus className="h-4 w-4" />
              {t.nav.createListing}
            </Button>
          </Link>
        )}
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
              {activeTab === 'overview' && <DashboardOverview onNavigateTab={setActiveTab} />}
              {activeTab === 'listings' && isOwner && <MyListings />}
              {activeTab === 'bookings' && <MyBookings onNavigateTab={setActiveTab} />}
              {activeTab === 'messages' && <Messages onNavigateTab={setActiveTab} />}
              {activeTab === 'disputes' && <Disputes />}
              {activeTab === 'earnings' && isOwner && <Earnings />}
              {activeTab === 'team' && isOwner && <Team />}
              {activeTab === 'storefront' && isOwner && <StorefrontSettings />}
              {activeTab === 'verification' && <Verification />}
              {activeTab === 'settings' && <AccountSettings />}
              {/* Admin tabs - only rendered for a role that's allowed to see them */}
              {isAnyAdmin && adminTabs.some((t) => t.id === activeTab) && (
                <>
                  {activeTab === 'admin-dashboard' && <AdminDashboard />}
                  {activeTab === 'admin-users' && <AdminUsers />}
                  {activeTab === 'admin-listings' && <AdminListings />}
                  {activeTab === 'admin-verifications' && <AdminVerifications />}
                  {activeTab === 'admin-bookings' && <AdminBookings />}
                  {activeTab === 'admin-disputes' && <AdminDisputes />}
                  {activeTab === 'admin-payouts' && <AdminPayouts />}
                  {activeTab === 'admin-reports' && <AdminReports />}
                  {activeTab === 'admin-analytics' && <AdminAnalytics />}
                  {activeTab === 'admin-categories' && <AdminCategories />}
                  {activeTab === 'admin-audit-log' && <AdminAuditLog />}
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
