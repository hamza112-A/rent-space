import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LayoutDashboard, Calendar, Shield, Settings, Crown, MessageSquare, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardShell, { type DashboardTab } from '@/components/dashboard/DashboardShell';
import MyBookings from '@/components/dashboard/MyBookings';
import Verification from '@/components/dashboard/Verification';
import AccountSettings from '@/components/dashboard/AccountSettings';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import Messages from '@/components/dashboard/Messages';
import Disputes from '@/components/dashboard/Disputes';

const BuyerDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  const tabs: DashboardTab[] = [
    { id: 'overview', label: t.dashboard.overview, icon: LayoutDashboard, content: <DashboardOverview perspective="buyer" onNavigateTab={setActiveTab} /> },
    { id: 'bookings', label: t.dashboard.myBookings, icon: Calendar, content: <MyBookings perspective="buyer" onNavigateTab={setActiveTab} /> },
    { id: 'messages', label: t.dashboard.messages, icon: MessageSquare, content: <Messages onNavigateTab={setActiveTab} /> },
    { id: 'disputes', label: 'Disputes', icon: AlertTriangle, content: <Disputes /> },
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
        <Link to="/subscription">
          <Button variant="outline" className="w-full gap-2 justify-start text-amber-600 border-amber-200 hover:bg-amber-50">
            <Crown className="h-4 w-4" />
            {t.subscription.subscribe}
          </Button>
        </Link>
      }
    />
  );
};

export default BuyerDashboard;
