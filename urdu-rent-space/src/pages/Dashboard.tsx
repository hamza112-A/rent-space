import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
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
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import MyListings from '@/components/dashboard/MyListings';
import MyBookings from '@/components/dashboard/MyBookings';
import Earnings from '@/components/dashboard/Earnings';
import Verification from '@/components/dashboard/Verification';
import AccountSettings from '@/components/dashboard/AccountSettings';
import DashboardOverview from '@/components/dashboard/DashboardOverview';

const Dashboard: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'listings', label: 'My Listings', icon: Package },
    { id: 'bookings', label: 'My Bookings', icon: Calendar },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'verification', label: 'Verification', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const SidebarContent = () => (
    <nav className="space-y-1">
      {tabs.map((tab) => {
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
      
      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-border space-y-2">
        <Link to="/create-listing">
          <Button variant="outline" className="w-full gap-2 justify-start">
            <Plus className="h-4 w-4" />
            Create Listing
          </Button>
        </Link>
        <Link to="/subscription">
          <Button variant="outline" className="w-full gap-2 justify-start text-amber-600 border-amber-200 hover:bg-amber-50">
            <Crown className="h-4 w-4" />
            Upgrade to Premium
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
              <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
              <p className="text-sm text-muted-foreground">Manage your account</p>
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
                  <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
                  <p className="text-sm text-muted-foreground">Manage your account</p>
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
              {activeTab === 'earnings' && <Earnings />}
              {activeTab === 'verification' && <Verification />}
              {activeTab === 'settings' && <AccountSettings />}
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
