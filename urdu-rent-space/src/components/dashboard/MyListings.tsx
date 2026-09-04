import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Pause,
  Play,
  MapPin,
  AlertCircle,
  Sparkles,
  Loader2,
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  MessageCircle,
} from 'lucide-react';
import { listingApi, subscriptionApi } from '@/lib/api';
import { toast } from 'sonner';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

// Mirrors FEATURED_BOOST in the backend's config/subscriptionPlans.js — used
// for display copy only; the actual charge always comes from the server's
// create-payment response.
const FEATURED_BOOST = { price: 199, days: 3, currency: 'PKR' };

interface Listing {
  _id: string;
  title: string;
  category: { name: string } | string;
  pricing: { basePrice: number; priceType: string };
  location: { city: string; area: string };
  status: string;
  views: number;
  images: { url: string }[];
  createdAt: string;
  featured?: boolean;
  featuredUntil?: string | null;
  expiresAt?: string | null;
  rejectionReason?: string;
  stats?: { views?: number; inquiries?: number };
}

// Boost payment form — mirrors the subscription checkout in Subscription.tsx.
const BoostPaymentForm: React.FC<{
  listingId: string;
  amount: number;
  days: number;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ listingId, amount, days, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    listingApi.featureCreatePayment(listingId).then((res) => {
      setClientSecret(res.data.data.clientSecret);
    }).catch((err: any) => {
      toast.error(err.response?.data?.message || 'Failed to initialize payment');
    });
  }, [listingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setLoading(true);
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setLoading(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) {
        toast.error(error.message || 'Payment failed. Please try again.');
        setLoading(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        await listingApi.featureConfirm(listingId, { paymentIntentId: paymentIntent.id });
        toast.success(`Listing featured for ${days} days!`);
        onSuccess();
      } else {
        toast.error(`Payment status: ${paymentIntent?.status}. Please try again.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement options={{
          style: {
            base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
            invalid: { color: '#9e2146' }
          }
        }} />
      </div>
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-medium text-blue-900 mb-1">🧪 Test Mode - Use Test Card:</p>
        <p className="text-xs text-blue-700 font-mono">
          Card: 4242 4242 4242 4242<br />
          Expiry: 12/34 | CVC: 123 | ZIP: 12345
        </p>
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || !clientSecret || loading} className="flex-1">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Pay PKR {amount.toLocaleString()}
        </Button>
      </div>
    </form>
  );
};

const MyListings: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featureListing, setFeatureListing] = useState<Listing | null>(null);
  const [featuredCredits, setFeaturedCredits] = useState<{ total: number; used: number } | null>(null);
  const [showBoostPayment, setShowBoostPayment] = useState(false);
  const [usingCredit, setUsingCredit] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [maxListings, setMaxListings] = useState<number | null>(null);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; errors: { row: number; title: string; errors: string[] }[] } | null>(null);

  useEffect(() => {
    fetchListings();
    subscriptionApi.getCurrentPlan().then((res) => {
      setCurrentPlan(res.data?.data?.plan || null);
      const limit = res.data?.data?.maxListings;
      setMaxListings(limit === 'Unlimited' ? -1 : limit ?? null);
    }).catch(() => setCurrentPlan(null));
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listingApi.getMyListings({});
      setListings(response.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      setError('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      setActioningId(listingId);
      await listingApi.delete(listingId);
      setListings(listings.filter(l => l._id !== listingId));
      toast.success('Listing deleted successfully');
    } catch (err) {
      toast.error('Failed to delete listing');
    } finally {
      setActioningId(null);
    }
  };

  const handleStatusChange = async (listingId: string, newStatus: string) => {
    try {
      setActioningId(listingId);
      await listingApi.update(listingId, { status: newStatus } as any);
      setListings(listings.map(l =>
        l._id === listingId ? { ...l, status: newStatus } : l
      ));
      toast.success(`Listing ${newStatus === 'active' ? 'activated' : 'paused'} successfully`);
    } catch (err) {
      toast.error('Failed to update listing status');
    } finally {
      setActioningId(null);
    }
  };

  const openFeatureDialog = async (listing: Listing) => {
    setFeatureListing(listing);
    setShowBoostPayment(false);
    try {
      const res = await subscriptionApi.getCurrentPlan();
      setFeaturedCredits(res.data?.data?.featuredCredits || { total: 0, used: 0 });
    } catch {
      setFeaturedCredits({ total: 0, used: 0 });
    }
  };

  const onListingFeatured = (listingId: string) => {
    setListings(listings.map(l => (l._id === listingId ? { ...l, featured: true } : l)));
    setFeatureListing(null);
  };

  const handleUseCredit = async () => {
    if (!featureListing) return;
    setUsingCredit(true);
    try {
      await listingApi.featureWithCredit(featureListing._id);
      toast.success('Listing featured!');
      onListingFeatured(featureListing._id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to feature listing');
    } finally {
      setUsingCredit(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await listingApi.getBulkUploadTemplate();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'listing-bulk-upload-template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to download template');
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setBulkUploading(true);
    setBulkResult(null);
    try {
      const formData = new FormData();
      formData.append('file', bulkFile);
      const res = await listingApi.bulkUpload(formData);
      setBulkResult(res.data.data);
      if (res.data.data.created > 0) {
        toast.success(`${res.data.data.created} listing(s) created`);
        fetchListings();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk upload failed');
    } finally {
      setBulkUploading(false);
    }
  };

  const getDaysUntilExpiry = (listing: Listing): number | null => {
    if (!listing.expiresAt) return null;
    const diffMs = new Date(listing.expiresAt).getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const handleRenew = async (listingId: string) => {
    setRenewingId(listingId);
    try {
      const res = await listingApi.renew(listingId);
      const updated = res.data?.data;
      setListings((prev) => prev.map((l) => (l._id === listingId ? { ...l, ...updated } : l)));
      toast.success('Listing renewed');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to renew listing');
    } finally {
      setRenewingId(null);
    }
  };

  const activeListingCount = listings.filter((l) => ['active', 'pending'].includes(l.status)).length;
  const atListingCap = maxListings != null && maxListings !== -1 && activeListingCount >= maxListings;

  const handleCreateListingClick = (e: React.MouseEvent) => {
    if (atListingCap) {
      e.preventDefault();
      toast.error(
        `You're at your plan's limit of ${maxListings} listing${maxListings === 1 ? '' : 's'}. Upgrade to add more.`,
        { action: { label: 'Upgrade', onClick: () => navigate('/subscription') } }
      );
    }
  };

  const closeBulkUploadDialog = () => {
    setShowBulkUpload(false);
    setBulkFile(null);
    setBulkResult(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'paused':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'expired':
      case 'rejected':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const formatPrice = (listing: Listing) => {
    const price = listing.pricing?.basePrice || 0;
    const type = listing.pricing?.priceType || 'day';
    return `PKR ${price.toLocaleString()}/${type}`;
  };

  const getCategoryName = (category: { name: string } | string) => {
    if (typeof category === 'string') return category;
    return category?.name || 'Uncategorized';
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
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
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchListings}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.dashboard.myListings}</h1>
          <p className="text-muted-foreground">{t.listing.description}</p>
        </div>
        <div className="flex gap-2">
          {currentPlan === 'business' && (
            <Button variant="outline" className="gap-2" onClick={() => setShowBulkUpload(true)}>
              <Upload className="h-4 w-4" />
              Bulk Upload
            </Button>
          )}
          <Link to="/create-listing" onClick={handleCreateListingClick}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t.nav.createListing}
            </Button>
          </Link>
        </div>
      </div>

      {atListingCap && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <p className="text-sm text-amber-700">
              You're at {activeListingCount}/{maxListings} listings on your current plan. Upgrade to add more.
            </p>
            <Button size="sm" variant="outline" onClick={() => navigate('/subscription')}>Upgrade</Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.nav.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={t.filters.title} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.common.all}</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending review</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Listings Grid */}
      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredListings.map((listing) => (
            <Card key={listing._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="flex">
                <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 bg-muted">
                  {listing.images?.[0]?.url ? (
                    <img
                      src={listing.images[0].url}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>
                <CardContent className="flex-1 p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryName(listing.category)}
                        </Badge>
                        <Badge className={getStatusColor(listing.status)}>
                          {listing.status}
                        </Badge>
                        {listing.featured && (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
                            <Sparkles className="h-3 w-3" /> Featured
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground truncate">{listing.title}</h3>
                      <p className="text-primary font-bold mt-1">{formatPrice(listing)}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">
                          {listing.location?.area}, {listing.location?.city}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {listing.stats?.views ?? listing.views ?? 0} views
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" /> {listing.stats?.inquiries ?? 0} inquiries
                        </span>
                      </div>

                      {listing.status === 'rejected' && listing.rejectionReason && (
                        <div className="mt-2 p-2 rounded-md bg-red-500/10 text-red-700 text-xs">
                          Rejected: {listing.rejectionReason}
                        </div>
                      )}

                      {listing.status === 'active' && (() => {
                        const daysLeft = getDaysUntilExpiry(listing);
                        if (daysLeft === null || daysLeft > 7) return null;
                        return (
                          <div className="mt-2 flex items-center gap-2 p-2 rounded-md bg-amber-500/10 text-amber-700 text-xs">
                            <Clock className="h-3 w-3" />
                            <span>
                              {daysLeft <= 0 ? 'Expires today' : `Expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 gap-1 ml-auto"
                              onClick={() => handleRenew(listing._id)}
                              disabled={renewingId === listing._id}
                            >
                              <RefreshCw className={`h-3 w-3 ${renewingId === listing._id ? 'animate-spin' : ''}`} /> Renew
                            </Button>
                          </div>
                        );
                      })()}

                      {listing.status === 'expired' && (
                        <div className="mt-2 flex items-center gap-2 p-2 rounded-md bg-muted text-xs">
                          <span className="text-muted-foreground">This listing has expired.</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 gap-1 ml-auto"
                            onClick={() => handleRenew(listing._id)}
                            disabled={renewingId === listing._id}
                          >
                            <RefreshCw className={`h-3 w-3 ${renewingId === listing._id ? 'animate-spin' : ''}`} /> Renew
                          </Button>
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={actioningId === listing._id}>
                          {actioningId === listing._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/listing/${listing._id}`)}>
                          <Eye className="h-4 w-4 mr-2" /> {t.listing.viewDetails}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/edit-listing/${listing._id}`)}>
                          <Edit className="h-4 w-4 mr-2" /> {t.common.edit}
                        </DropdownMenuItem>
                        {!listing.featured && (
                          <DropdownMenuItem onClick={() => openFeatureDialog(listing)}>
                            <Sparkles className="h-4 w-4 mr-2" /> Feature this listing
                          </DropdownMenuItem>
                        )}
                        {listing.status === 'active' ? (
                          <DropdownMenuItem onClick={() => handleStatusChange(listing._id, 'paused')}>
                            <Pause className="h-4 w-4 mr-2" /> {t.booking.pending}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleStatusChange(listing._id, 'active')}>
                            <Play className="h-4 w-4 mr-2" /> {t.listing.available}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(listing._id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> {t.common.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              {listings.length === 0 
                ? t.common.noResults
                : t.common.noResults}
            </p>
            <Link to="/create-listing">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t.nav.createListing}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Feature Listing Dialog */}
      <Dialog open={!!featureListing} onOpenChange={(open) => !open && setFeatureListing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Feature "{featureListing?.title}"</DialogTitle>
            <DialogDescription>
              Boosted listings show at the top of search results for {FEATURED_BOOST.days} days.
            </DialogDescription>
          </DialogHeader>

          {!showBoostPayment ? (
            <div className="space-y-4">
              {featuredCredits && featuredCredits.total - featuredCredits.used > 0 ? (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                  <p className="text-sm text-foreground">
                    You have <span className="font-semibold">{featuredCredits.total - featuredCredits.used}</span> featured-listing
                    {featuredCredits.total - featuredCredits.used === 1 ? ' credit' : ' credits'} left this month.
                  </p>
                  <Button onClick={handleUseCredit} disabled={usingCredit} className="w-full gap-2">
                    {usingCredit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Use 1 credit
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {featuredCredits
                    ? "You're out of featured-listing credits this month."
                    : 'Loading your plan...'}
                </p>
              )}

              <Button
                variant={featuredCredits && featuredCredits.total - featuredCredits.used > 0 ? 'outline' : 'default'}
                className="w-full"
                onClick={() => setShowBoostPayment(true)}
              >
                Boost for PKR {FEATURED_BOOST.price} ({FEATURED_BOOST.days} days)
              </Button>
            </div>
          ) : featureListing ? (
            <Elements stripe={stripePromise}>
              <BoostPaymentForm
                listingId={featureListing._id}
                amount={FEATURED_BOOST.price}
                days={FEATURED_BOOST.days}
                onSuccess={() => onListingFeatured(featureListing._id)}
                onCancel={() => setShowBoostPayment(false)}
              />
            </Elements>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog (Business plan only) */}
      <Dialog open={showBulkUpload} onOpenChange={(open) => !open && closeBulkUploadDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Upload Listings</DialogTitle>
            <DialogDescription>
              Import multiple listings at once from a CSV file.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Button variant="outline" className="w-full gap-2" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4" />
              Download CSV template
            </Button>

            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
            />

            <Button
              className="w-full gap-2"
              onClick={handleBulkUpload}
              disabled={!bulkFile || bulkUploading}
            >
              {bulkUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload
            </Button>

            {bulkResult && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {bulkResult.created} listing(s) created
                </div>
                {bulkResult.errors.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-destructive flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      {bulkResult.errors.length} row(s) skipped
                    </p>
                    {bulkResult.errors.map((e, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground pl-6">
                        Row {e.row} ({e.title}): {e.errors.join('; ')}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyListings;
