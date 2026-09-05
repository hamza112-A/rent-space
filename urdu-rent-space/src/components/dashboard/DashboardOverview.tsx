import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { userApi } from '@/lib/api';
import {
  Package,
  Calendar,
  DollarSign,
  TrendingUp,
  Eye,
  AlertCircle,
  MessageSquare,
  AlertTriangle,
  ShieldCheck,
  Crown,
  Sparkles,
  Star,
  Wallet,
  ArrowRight,
  Heart,
} from 'lucide-react';

interface OwnerOverview {
  actionNeeded: {
    pendingBookings: number;
    unreadMessages: number;
    openDisputes: number;
    expiringListings: number;
    verificationLevel: 'Unverified' | 'Basic' | 'Verified' | 'Fully Verified';
  };
  thisMonth: {
    earnings: number;
    bookingsCompleted: number;
    newInquiries: number;
    conversionRate: number;
  };
  plan: {
    id: string;
    name: string;
    listingsUsed: number;
    maxListings: number;
    atListingLimit: boolean;
    featuredCredits: { total: number; used: number };
    commissionRate: number;
    upgradeNudge: { nextPlan: string; nextPlanName: string; estimatedMonthlySavings: number } | null;
  };
  recentActivity: { type: string; message: string; date: string }[];
}

interface BorrowerBooking {
  _id: string;
  startDate: string;
  endDate: string;
  status: string;
  listing?: { title: string; images?: { url: string }[] };
}

interface SavedListing {
  _id: string;
  title: string;
  images?: { url: string }[];
  pricing?: { daily?: number; hourly?: number; weekly?: number; monthly?: number };
  status: string;
}

interface BorrowerOverview {
  upcomingBookings: BorrowerBooking[];
  activeConversationsNeedingReply: number;
  savedListings: SavedListing[];
}

interface DashboardOverviewData {
  owner?: OwnerOverview;
  borrower?: BorrowerOverview;
}

interface DashboardOverviewProps {
  // Which dashboard this overview renders inside — a 'both' user's overview
  // data includes both blocks, but each dashboard only shows its own half.
  perspective: 'owner' | 'buyer';
  onNavigateTab?: (tab: string) => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ perspective, onNavigateTab }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await userApi.getDashboardOverview();
        setData(res.data?.data || null);
      } catch (err) {
        console.error('Dashboard overview fetch error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const goTo = (tab: string) => onNavigateTab?.(tab);

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

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive">{error || 'Failed to load dashboard data'}</p>
        </CardContent>
      </Card>
    );
  }

  const owner = perspective === 'owner' ? data.owner : undefined;
  const borrower = perspective === 'buyer' ? data.borrower : undefined;

  const actionItems = owner
    ? [
        owner.actionNeeded.pendingBookings > 0 && {
          icon: Calendar,
          label: `${owner.actionNeeded.pendingBookings} booking request${owner.actionNeeded.pendingBookings > 1 ? 's' : ''} awaiting your response`,
          tab: 'bookings',
        },
        owner.actionNeeded.unreadMessages > 0 && {
          icon: MessageSquare,
          label: `${owner.actionNeeded.unreadMessages} unread message${owner.actionNeeded.unreadMessages > 1 ? 's' : ''}`,
          tab: 'messages',
        },
        owner.actionNeeded.openDisputes > 0 && {
          icon: AlertTriangle,
          label: `${owner.actionNeeded.openDisputes} open dispute${owner.actionNeeded.openDisputes > 1 ? 's' : ''} needing a response`,
          tab: 'disputes',
        },
        owner.actionNeeded.expiringListings > 0 && {
          icon: Package,
          label: `${owner.actionNeeded.expiringListings} listing${owner.actionNeeded.expiringListings > 1 ? 's' : ''} expiring within 7 days`,
          tab: 'listings',
        },
        (owner.actionNeeded.verificationLevel === 'Unverified' || owner.actionNeeded.verificationLevel === 'Basic') && {
          icon: ShieldCheck,
          label: 'Verify your identity to build trust with renters',
          tab: 'verification',
        },
      ].filter(Boolean as unknown as (v: unknown) => v is { icon: typeof Calendar; label: string; tab: string })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t.dashboard.welcome}, {user?.fullName?.split(' ')[0] || 'User'}!
        </h1>
        <p className="text-muted-foreground">Here's what needs your attention today.</p>
      </div>

      {/* Action-needed strip */}
      {actionItems.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="space-y-2">
              {actionItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => goTo(item.tab)}
                    className="w-full flex items-center justify-between gap-3 p-2 rounded-md hover:bg-amber-500/10 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-amber-500/10 text-amber-600">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {owner && (
        <>
          {/* This month at a glance */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">This Month at a Glance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Net Earnings</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(owner.thisMonth.earnings)}</p>
                    </div>
                    <div className="p-3 rounded-full bg-muted text-amber-500">
                      <DollarSign className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Bookings Completed</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{owner.thisMonth.bookingsCompleted}</p>
                    </div>
                    <div className="p-3 rounded-full bg-muted text-green-500">
                      <Calendar className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">New Inquiries</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{owner.thisMonth.newInquiries}</p>
                    </div>
                    <div className="p-3 rounded-full bg-muted text-blue-500">
                      <Eye className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">View-to-Booking Rate</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{owner.thisMonth.conversionRate}%</p>
                    </div>
                    <div className="p-3 rounded-full bg-muted text-purple-500">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plan status card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  Your Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary/10 text-primary border-primary/20 capitalize">{owner.plan.name}</Badge>
                  <span className="text-sm text-muted-foreground">{(owner.plan.commissionRate * 100).toFixed(0)}% commission</span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Listings used</span>
                    <span className="font-medium text-foreground">
                      {owner.plan.listingsUsed}
                      {owner.plan.maxListings === -1 ? '' : ` / ${owner.plan.maxListings}`}
                    </span>
                  </div>
                  {owner.plan.maxListings !== -1 && (
                    <Progress value={(owner.plan.listingsUsed / owner.plan.maxListings) * 100} />
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Featured credits remaining</span>
                  <span className="font-medium text-foreground">
                    {Math.max(0, owner.plan.featuredCredits.total - owner.plan.featuredCredits.used)} / {owner.plan.featuredCredits.total}
                  </span>
                </div>

                {owner.plan.atListingLimit && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-700 text-sm">
                    <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>You're at {owner.plan.listingsUsed}/{owner.plan.maxListings} listings. Upgrade for more room to grow.</span>
                  </div>
                )}
                {!owner.plan.atListingLimit && owner.plan.upgradeNudge && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-700 text-sm">
                    <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      You'd have saved ~{formatCurrency(owner.plan.upgradeNudge.estimatedMonthlySavings)} this month on {owner.plan.upgradeNudge.nextPlanName}.
                    </span>
                  </div>
                )}

                <Button variant="outline" className="w-full" onClick={() => navigate('/subscription')}>
                  {owner.plan.atListingLimit || owner.plan.upgradeNudge ? 'Upgrade Plan' : 'Manage Plan'}
                </Button>
              </CardContent>
            </Card>

            {/* Recent activity feed */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {owner.recentActivity.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t.common.noResults}</p>
                ) : (
                  <div className="space-y-3">
                    {owner.recentActivity.map((event, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-muted text-muted-foreground">
                            {event.type === 'payout' && <Wallet className="h-4 w-4" />}
                            {event.type === 'booking' && <Calendar className="h-4 w-4" />}
                            {event.type === 'review' && <Star className="h-4 w-4" />}
                          </div>
                          <p className="text-sm text-foreground">{event.message}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(event.date)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Borrower view */}
      {borrower && (
        <div className={owner ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-6'}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {borrower.upcomingBookings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t.common.noResults}</p>
              ) : (
                <div className="space-y-3">
                  {borrower.upcomingBookings.map((booking) => (
                    <button
                      key={booking._id}
                      onClick={() => goTo('bookings')}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                    >
                      <div>
                        <p className="font-medium text-foreground">{booking.listing?.title || 'Listing'}</p>
                        <p className="text-sm text-muted-foreground">Starts {formatDate(booking.startDate)}</p>
                      </div>
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">{booking.status}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {!owner && (
            <Card>
              <CardContent className="p-6">
                <button
                  onClick={() => goTo('messages')}
                  className="w-full flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-500/10 text-blue-600">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-foreground">Conversations Needing a Reply</h3>
                      <p className="text-sm text-muted-foreground">
                        {borrower.activeConversationsNeedingReply} conversation{borrower.activeConversationsNeedingReply !== 1 ? 's' : ''} waiting on you
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Saved listings */}
      {borrower && borrower.savedListings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500" />
              Saved Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {borrower.savedListings.map((listing) => {
                const price = listing.pricing?.daily ?? listing.pricing?.hourly ?? listing.pricing?.weekly ?? listing.pricing?.monthly;
                return (
                  <button
                    key={listing._id}
                    onClick={() => navigate(`/listing/${listing._id}`)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div className="w-14 h-14 rounded-md bg-muted overflow-hidden flex-shrink-0">
                      {listing.images?.[0]?.url && (
                        <img src={listing.images[0].url} alt={listing.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{listing.title}</p>
                      {price != null && (
                        <p className="text-xs text-muted-foreground">{formatCurrency(price)}</p>
                      )}
                      {listing.status !== 'active' && (
                        <Badge variant="outline" className="mt-1 text-xs">{listing.status}</Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardOverview;
