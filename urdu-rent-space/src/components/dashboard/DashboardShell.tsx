import React, { useState, type LucideIcon } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import AccountModeSwitcher from '@/components/layout/AccountModeSwitcher';
import {
  Menu,
  BarChart3,
  Users,
  Building2,
  CheckCircle,
  CalendarDays,
  TrendingUp,
  Tag,
  AlertTriangle,
  DollarSign,
  Flag,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
// Admin components — orthogonal to the owner/buyer split (gated on
// adminRole, not role), so the same admin section is available from
// whichever dashboard the admin is currently viewing.
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

export interface DashboardTab {
  id: string;
  label: string;
  icon: LucideIcon;
  content: React.ReactNode;
}

interface DashboardShellProps {
  title: string;
  subtitle: string;
  tabs: DashboardTab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  // Extra sidebar links below the tab list (e.g. a role-specific "Create
  // Listing" quick action) — rendered above the admin section.
  sidebarExtra?: React.ReactNode;
}

// Which granular admin role(s) can see each admin tab — see
// docs/redesign/11-admin-panel.md. 'superadmin' can always see everything
// regardless of what's listed here (filtered below).
const ADMIN_TABS_ALL = [
  { id: 'admin-dashboard', label: 'Admin Dashboard', icon: BarChart3, adminRoles: ['support', 'finance'] },
  { id: 'admin-users', label: 'User Management', icon: Users, adminRoles: ['support'] },
  { id: 'admin-listings', label: 'Listing Management', icon: Building2, adminRoles: ['support'] },
  { id: 'admin-verifications', label: 'Verifications', icon: CheckCircle, adminRoles: ['support'] },
  { id: 'admin-bookings', label: 'All Bookings', icon: CalendarDays, adminRoles: ['support'] },
  { id: 'admin-disputes', label: 'Dispute Management', icon: AlertTriangle, adminRoles: ['support'] },
  { id: 'admin-payouts', label: 'Payout Oversight', icon: DollarSign, adminRoles: ['finance'] },
  { id: 'admin-reports', label: 'Report Queue', icon: Flag, adminRoles: ['support'] },
  { id: 'admin-analytics', label: 'Analytics', icon: TrendingUp, adminRoles: ['support', 'finance'] },
  { id: 'admin-categories', label: 'Categories', icon: Tag, adminRoles: [] as string[] },
  { id: 'admin-audit-log', label: 'Audit Log', icon: ClipboardList, adminRoles: [] as string[] },
];

const ADMIN_CONTENT: Record<string, React.ReactNode> = {
  'admin-dashboard': <AdminDashboard />,
  'admin-users': <AdminUsers />,
  'admin-listings': <AdminListings />,
  'admin-verifications': <AdminVerifications />,
  'admin-bookings': <AdminBookings />,
  'admin-disputes': <AdminDisputes />,
  'admin-payouts': <AdminPayouts />,
  'admin-reports': <AdminReports />,
  'admin-analytics': <AdminAnalytics />,
  'admin-categories': <AdminCategories />,
  'admin-audit-log': <AdminAuditLog />,
};

const DashboardShell: React.FC<DashboardShellProps> = ({ title, subtitle, tabs, activeTab, onTabChange, sidebarExtra }) => {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAnyAdmin = user?.isSuperAdmin || (!!user?.adminRole && user.adminRole !== 'none');
  const adminTabs = ADMIN_TABS_ALL.filter(
    (tab) => user?.isSuperAdmin || (user?.adminRole && tab.adminRoles.includes(user.adminRole))
  );

  const allTabs = isAnyAdmin ? [...tabs, ...adminTabs] : tabs;
  const activeLabel = allTabs.find((t) => t.id === activeTab)?.label;

  const SidebarContent = () => (
    <nav className="space-y-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => {
              onTabChange(tab.id);
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

      {isAnyAdmin && (
        <>
          <div className="mt-6 pt-6 border-t border-border">
            <p className="px-4 py-2 text-xs font-semibold text-purple-600 uppercase tracking-wider">
              {user?.isSuperAdmin ? 'Super Admin' : `Admin (${user?.adminRole})`}
            </p>
          </div>
          {adminTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
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

      {sidebarExtra && (
        <div className="mt-6 pt-6 border-t border-border space-y-2">
          {sidebarExtra}
        </div>
      )}
    </nav>
  );

  return (
    <Layout hideFooter>
      <div className="min-h-screen bg-background">
        <div className="flex pt-16">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 border-r border-border bg-card min-h-[calc(100vh-4rem)] p-4 sticky top-16 self-start">
            <div className="mb-6 space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              </div>
              <AccountModeSwitcher className="w-full" />
            </div>
            <SidebarContent />
          </aside>

          {/* Mobile Header */}
          <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-background border-b border-border p-4 flex items-center gap-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Menu className="h-4 w-4" />
                  {activeLabel}
                </Button>
              </SheetTrigger>
              <SheetContent side={isRTL ? 'right' : 'left'} className="w-64 p-4">
                <div className="mb-6 mt-4 space-y-3">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                  </div>
                  <AccountModeSwitcher className="w-full" />
                </div>
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <AccountModeSwitcher />
          </div>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-8 mt-14 lg:mt-0">
            <div className="max-w-6xl mx-auto">
              {tabs.find((t) => t.id === activeTab)?.content}
              {isAnyAdmin && ADMIN_CONTENT[activeTab]}
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardShell;
