import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LayoutDashboard,
  Package,
  Calendar,
  DollarSign,
  Shield,
  Settings,
  Crown,
  Plus,
  UserSquare2,
  Store,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardShell, { type DashboardTab } from '@/components/dashboard/DashboardShell';
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

const OwnerDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  // Supports deep-linking into a tab (e.g. `/dashboard/owner?tab=earnings`),
  // used by the Stripe Connect onboarding return redirect.
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  const tabs: DashboardTab[] = [
    { id: 'overview', label: t.dashboard.overview, icon: LayoutDashboard, content: <DashboardOverview perspective="owner" onNavigateTab={setActiveTab} /> },
    { id: 'listings', label: t.dashboard.myListings, icon: Package, content: <MyListings /> },
    { id: 'bookings', label: t.dashboard.myBookings, icon: Calendar, content: <MyBookings perspective="owner" onNavigateTab={setActiveTab} /> },
    { id: 'messages', label: t.dashboard.messages, icon: MessageSquare, content: <Messages onNavigateTab={setActiveTab} /> },
    { id: 'disputes', label: 'Disputes', icon: AlertTriangle, content: <Disputes /> },
    { id: 'earnings', label: t.dashboard.earnings, icon: DollarSign, content: <Earnings /> },
    { id: 'team', label: 'Team', icon: UserSquare2, content: <Team /> },
    { id: 'storefront', label: 'Storefront', icon: Store, content: <StorefrontSettings /> },
    { id: 'verification', label: t.dashboard.verification, icon: Shield, content: <Verification /> },
    { id: 'settings', label: t.dashboard.settings, icon: Settings, content: <AccountSettings /> },
  ];

  return (
    <DashboardShell
      title={t.dashboard.title}
      subtitle={t.dashboard.welcome}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      sidebarExtra={
        <>
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
        </>
      }
    />
  );
};

export default OwnerDashboard;
