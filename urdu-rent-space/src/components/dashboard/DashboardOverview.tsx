import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Star,
  Eye,
  CheckCircle,
  Clock
} from 'lucide-react';

const DashboardOverview: React.FC = () => {
  const stats = [
    { 
      label: 'Active Listings', 
      value: '12', 
      change: '+2 this month',
      icon: Package,
      color: 'text-blue-500'
    },
    { 
      label: 'Total Bookings', 
      value: '48', 
      change: '+8 this month',
      icon: Calendar,
      color: 'text-green-500'
    },
    { 
      label: 'Total Earnings', 
      value: 'PKR 125,000', 
      change: '+15% vs last month',
      icon: DollarSign,
      color: 'text-amber-500'
    },
    { 
      label: 'Profile Views', 
      value: '1,240', 
      change: '+120 this week',
      icon: Eye,
      color: 'text-purple-500'
    },
  ];

  const recentBookings = [
    { id: 1, item: 'Honda Civic 2022', customer: 'Ahmed Khan', date: 'Jan 3, 2026', status: 'confirmed', amount: 'PKR 5,000' },
    { id: 2, item: '3 Bedroom Apartment', customer: 'Sara Ali', date: 'Jan 2, 2026', status: 'pending', amount: 'PKR 45,000' },
    { id: 3, item: 'Wedding Dress', customer: 'Fatima Hassan', date: 'Jan 1, 2026', status: 'completed', amount: 'PKR 8,000' },
  ];

  const recentListings = [
    { id: 1, title: 'Honda Civic 2022', views: 234, inquiries: 12, status: 'active' },
    { id: 2, title: 'Luxury Villa - DHA Phase 5', views: 456, inquiries: 28, status: 'active' },
    { id: 3, title: 'Photography Equipment Set', views: 89, inquiries: 5, status: 'paused' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'active':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'paused':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back, Muhammad!</h1>
        <p className="text-muted-foreground">Here's what's happening with your rentals</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      {stat.change}
                    </p>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Verification Status</h3>
                <p className="text-sm text-muted-foreground">Your account is 80% verified</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Email Verified</Badge>
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Phone Verified</Badge>
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">ID Pending</Badge>
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
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground">{booking.item}</p>
                    <p className="text-sm text-muted-foreground">{booking.customer} • {booking.date}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                    <p className="text-sm font-medium text-foreground mt-1">{booking.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Listings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Your Top Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentListings.map((listing) => (
                <div 
                  key={listing.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground">{listing.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {listing.views} views • {listing.inquiries} inquiries
                    </p>
                  </div>
                  <Badge className={getStatusColor(listing.status)}>
                    {listing.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Star className="h-8 w-8 text-amber-500 fill-amber-500" />
              <div>
                <p className="text-3xl font-bold text-foreground">4.8</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div>
              <p className="text-2xl font-bold text-foreground">156</p>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div>
              <p className="text-2xl font-bold text-foreground">98%</p>
              <p className="text-sm text-muted-foreground">Response Rate</p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div>
              <p className="text-2xl font-bold text-foreground">&lt;1hr</p>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
