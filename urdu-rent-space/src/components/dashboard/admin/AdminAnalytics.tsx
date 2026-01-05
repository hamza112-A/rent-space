import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Users, Building, DollarSign } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';

const AdminAnalytics: React.FC = () => {
  const { t } = useLanguage();
  const [period, setPeriod] = useState('30');
  const [revenueData, setRevenueData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [listingData, setListingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [revenue, users, listings] = await Promise.all([
        adminApi.getRevenueAnalytics(parseInt(period)),
        adminApi.getUserAnalytics(parseInt(period)),
        adminApi.getListingAnalytics(),
      ]);
      setRevenueData(revenue.data?.data);
      setUserData(users.data?.data);
      setListingData(listings.data?.data);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoading(false); }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t.dashboard.analytics}</h1>
          <p className="text-muted-foreground">{t.dashboard.totalEarnings}</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="90">90 days</SelectItem>
            <SelectItem value="365">365 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.admin.totalRevenue}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenueData?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">{period} {t.dashboard.thisMonth.toLowerCase()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.admin.newUsers}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData?.newUsers || 0}</div>
            <p className="text-xs text-muted-foreground">{period} {t.dashboard.thisMonth.toLowerCase()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.admin.totalListings}</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listingData?.newListings || 0}</div>
            <p className="text-xs text-muted-foreground">{period} {t.dashboard.thisMonth.toLowerCase()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.admin.totalBookings}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenueData?.totalBookings || 0}</div>
            <p className="text-xs text-muted-foreground">{period} {t.dashboard.thisMonth.toLowerCase()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{t.admin.users}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userData?.roleDistribution?.map((role: any) => (
                <div key={role._id} className="flex items-center justify-between">
                  <span className="capitalize">{role._id}</span>
                  <span className="font-medium">{role.count}</span>
                </div>
              )) || <p className="text-muted-foreground">{t.common.noResults}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t.admin.categories}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {listingData?.categoryDistribution?.map((cat: any) => (
                <div key={cat._id} className="flex items-center justify-between">
                  <span className="capitalize">{cat._id}</span>
                  <span className="font-medium">{cat.count}</span>
                </div>
              )) || <p className="text-muted-foreground">{t.common.noResults}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
