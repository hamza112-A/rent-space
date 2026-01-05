import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { listingApi, bookingApi, userApi } from '@/lib/api';
import { 
  Package, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Star,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Stats {
  activeListings: number;
  totalBookings: number;
  totalEarnings: number;
  profileViews: number;
}

interface Booking {
  _id: string;
  listing: { title: string };
  renter: { fullName: string };
  startDate: string;
  status: string;
  totalPrice: number;
}

interface Listing {
  _id: string;
  title: string;
  stats?: { views: number };
  status: string;
}

const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [listingsRes, bookingsRes, statsRes] = await Promise.all([
          listingApi.getMyListings({ limit: 5 }).catch(() => ({ data: { data: [] } })),
          bookingApi.getMyBookings({ limit: 5 }).catch(() => ({ data: { data: [] } })),
          userApi.getUserStats().catch(() => ({ data: { data: null } }))
        ]);

        const listings = listingsRes.data?.data || [];
        const bookings = bookingsRes.data?.data || [];
        const userStats = statsRes.data?.data;

        setRecentListings(listings);
        setRecentBookings(bookings);
        
        // Calculate stats from data or use API stats
        setStats({
          activeListings: userStats?.activeListings ?? listings.length,
          totalBookings: userStats?.totalBookings || bookings.length,
          totalEarnings: userStats?.totalEarnings || 0,
          profileViews: userStats?.profileViews || 0
        });

      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'approved':
      case 'active':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'paused':
      case 'cancelled':
      case 'rejected':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const statsData = [
    { 
      label: 'Total Listings', 
      value: stats?.activeListings || 0,
      icon: Package,
      color: 'text-blue-500'
    },
    { 
      label: 'Total Bookings', 
      value: stats?.totalBookings || 0,
      icon: Calendar,
      color: 'text-green-500'
    },
    { 
      label: 'Total Earnings', 
      value: formatCurrency(stats?.totalEarnings || 0),
      icon: DollarSign,
      color: 'text-amber-500'
    },
    { 
      label: 'Profile Views', 
      value: stats?.profileViews || 0,
      icon: Eye,
      color: 'text-purple-500'
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.fullName?.split(' ')[0] || 'User'}!
        </h1>
        <p className="text-muted-foreground">Here's what's happening with your rentals</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-muted ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Verification Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Verification Status</h3>
                <p className="text-sm text-muted-foreground">Complete verification to build trust</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={user?.isEmailVerified ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}>
                {user?.isEmailVerified ? 'Email Verified' : 'Email Pending'}
              </Badge>
              <Badge className={user?.isPhoneVerified ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}>
                {user?.isPhoneVerified ? 'Phone Verified' : 'Phone Pending'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No bookings yet</p>
            ) : (
              <div className="space-y-4">
                {recentBookings.slice(0, 5).map((booking) => (
                  <div 
                    key={booking._id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground">{booking.listing?.title || 'Listing'}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.renter?.fullName || 'Customer'} • {formatDate(booking.startDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                      <p className="text-sm font-medium text-foreground mt-1">
                        {formatCurrency(booking.totalPrice || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Listings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Your Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentListings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No listings yet</p>
            ) : (
              <div className="space-y-4">
                {recentListings.slice(0, 5).map((listing) => (
                  <div 
                    key={listing._id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground">{listing.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {listing.stats?.views || 0} views
                      </p>
                    </div>
                    <Badge className={getStatusColor(listing.status)}>
                      {listing.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
