import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Building, Calendar, DollarSign, Shield, TrendingUp, UserPlus, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';

interface DashboardStats {
  totalUsers: number;
  newUsersThisMonth: number;
  totalListings: number;
  activeListings: number;
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalRevenue: number;
  pendingVerifications: number;
}

const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDashboard();
      const data = response.data?.data;
      if (data) {
        setStats(data.stats);
        setRecentUsers(data.recentUsers || []);
        setRecentBookings(data.recentBookings || []);
      }
    } catch (err: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-600',
      confirmed: 'bg-blue-500/10 text-blue-600',
      completed: 'bg-green-500/10 text-green-600',
      cancelled: 'bg-red-500/10 text-red-600',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-600';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.admin.dashboard}</h1>
        <p className="text-muted-foreground">{t.admin.title}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.admin.totalUsers}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{stats?.newUsersThisMonth} {t.dashboard.thisMonth.toLowerCase()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.admin.totalListings}</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalListings?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats?.activeListings} {t.admin.activeListings.toLowerCase()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.admin.totalBookings}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBookings?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats?.pendingBookings} {t.admin.pendingBookings.toLowerCase()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.admin.totalRevenue}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">{t.dashboard.totalEarnings}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.admin.pendingVerifications}</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingVerifications}</div>
            <p className="text-xs text-muted-foreground">{t.verification.pending}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.booking.completed}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedBookings?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{t.booking.completed}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.admin.activeListings}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeListings?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{t.listing.available}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.admin.newUsers}</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.newUsersThisMonth}</div>
            <p className="text-xs text-muted-foreground">{t.dashboard.thisMonth}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{t.admin.recentUsers}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">{t.common.noResults}</p>
              ) : (
                recentUsers.map((user) => (
                  <div key={user._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t.admin.recentBookings}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">{t.common.noResults}</p>
              ) : (
                recentBookings.map((booking) => (
                  <div key={booking._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{booking.listing?.title}</p>
                      <p className="text-sm text-muted-foreground">by {booking.renter?.fullName}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                      <p className="text-sm text-muted-foreground mt-1">{formatDate(booking.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
