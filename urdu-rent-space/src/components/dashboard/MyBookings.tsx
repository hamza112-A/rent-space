import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Calendar,
  User,
  MessageSquare,
  Check,
  X,
  Clock,
  ChevronRight,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Building,
  Star
} from 'lucide-react';
import { bookingApi } from '@/lib/api';
import { toast } from 'sonner';

interface Booking {
  _id: string;
  listing: {
    _id: string;
    title: string;
    images?: { url: string }[];
    location?: { address?: string; city?: string };
  };
  renter?: {
    _id: string;
    fullName: string;
    phone?: string;
    email?: string;
  };
  owner?: {
    _id: string;
    fullName: string;
    phone?: string;
    email?: string;
  };
  startDate: string;
  endDate: string;
  totalPrice?: number;
  pricing?: {
    totalAmount: number;
    subtotal?: number;
    serviceFee?: number;
    deposit?: number;
  };
  status: string;
  paymentStatus?: string;
  message?: string;
  createdAt: string;
  reviews?: {
    renterReview?: {
      rating: number;
      comment: string;
      submittedAt: string;
    };
    ownerReview?: {
      rating: number;
      comment: string;
      submittedAt: string;
    };
  };
}

const MyBookings: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('incoming');
  const [incomingBookings, setIncomingBookings] = useState<Booking[]>([]);
  const [outgoingBookings, setOutgoingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const [incomingRes, outgoingRes] = await Promise.all([
        bookingApi.getMyBookings({ type: 'owner' }).catch(() => ({ data: { data: [] } })),
        bookingApi.getMyBookings({ type: 'renter' }).catch(() => ({ data: { data: [] } }))
      ]);

      setIncomingBookings(incomingRes.data?.data || []);
      setOutgoingBookings(outgoingRes.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId: string) => {
    try {
      await bookingApi.approve(bookingId);
      toast.success('Booking approved');
      fetchBookings();
    } catch (err) {
      toast.error('Failed to approve booking');
    }
  };

  const handleReject = async (bookingId: string) => {
    try {
      await bookingApi.reject(bookingId, {});
      toast.success('Booking rejected');
      fetchBookings();
    } catch (err) {
      toast.error('Failed to reject booking');
    }
  };

  const handleOpenReviewDialog = (booking: Booking) => {
    setReviewBooking(booking);
    setReviewRating(0);
    setReviewComment('');
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewBooking) return;
    
    if (reviewRating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    if (!reviewComment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    try {
      setReviewSubmitting(true);
      await bookingApi.addReview(reviewBooking._id, {
        rating: reviewRating,
        comment: reviewComment.trim()
      });
      
      toast.success('Review submitted successfully!');
      setReviewDialogOpen(false);
      setReviewBooking(null);
      setReviewRating(0);
      setReviewComment('');
      
      // Refresh bookings to update review status
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const canLeaveReview = (booking: Booking, isRenter: boolean): boolean => {
    // Can only review completed bookings with paid status
    if (booking.status !== 'completed' || booking.paymentStatus !== 'paid') {
      return false;
    }
    
    // Check if user has already reviewed
    if (isRenter && booking.reviews?.renterReview) {
      return false;
    }
    
    if (!isRenter && booking.reviews?.ownerReview) {
      return false;
    }
    
    return true;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'approved':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `PKR ${(amount || 0).toLocaleString()}`;
  };

  const getTotalPrice = (booking: Booking) => {
    return booking.pricing?.totalAmount || booking.totalPrice || 0;
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full max-w-md" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
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
          <Button onClick={fetchBookings}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  const pendingCount = incomingBookings.filter(b => b.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.dashboard.myBookings}</h1>
        <p className="text-muted-foreground">{t.booking.receivedBookings}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="incoming" className="gap-2">
            <span>{t.booking.receivedBookings}</span>
            {pendingCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outgoing">{t.booking.myBookings}</TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="mt-6 space-y-4">
          {incomingBookings.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">{t.common.noResults}</p>
              </CardContent>
            </Card>
          ) : (
            incomingBookings.map((booking) => (
              <Card key={booking._id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-48 h-40 sm:h-auto flex-shrink-0 bg-muted">
                      {booking.listing?.images?.[0]?.url ? (
                        <img
                          src={booking.listing.images[0].url}
                          alt={booking.listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {getTimeAgo(booking.createdAt)}
                            </span>
                          </div>
                          <h3 className="font-semibold text-foreground">
                            {booking.listing?.title || 'Listing'}
                          </h3>
                          
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                                {booking.renter?.fullName?.charAt(0) || 'U'}
                              </div>
                              <span className="text-foreground">
                                {booking.renter?.fullName || 'Customer'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                              </span>
                              <span className="text-xs">
                                ({getDuration(booking.startDate, booking.endDate)})
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end justify-between">
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">
                              {formatCurrency(getTotalPrice(booking))}
                            </p>
                            <p className="text-xs text-muted-foreground">Total</p>
                          </div>
                          
                          {booking.status === 'pending' && (
                            <div className="flex gap-2 mt-4">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="gap-1"
                                onClick={() => handleReject(booking._id)}
                              >
                                <X className="h-4 w-4" /> {t.common.cancel}
                              </Button>
                              <Button 
                                size="sm" 
                                className="gap-1"
                                onClick={() => handleApprove(booking._id)}
                              >
                                <Check className="h-4 w-4" /> {t.common.confirm}
                              </Button>
                            </div>
                          )}
                          
                          {(booking.status === 'approved' || booking.status === 'confirmed') && (
                            <Button size="sm" variant="outline" className="gap-1 mt-4">
                              <MessageSquare className="h-4 w-4" /> {t.dashboard.messages}
                            </Button>
                          )}
                          
                          {canLeaveReview(booking, false) && (
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="gap-1 mt-4"
                              onClick={() => handleOpenReviewDialog(booking)}
                            >
                              <Star className="h-4 w-4" /> Leave Review
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="mt-6 space-y-4">
          {outgoingBookings.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">{t.common.noResults}</p>
              </CardContent>
            </Card>
          ) : (
            outgoingBookings.map((booking) => (
              <Card key={booking._id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-48 h-40 sm:h-auto flex-shrink-0 bg-muted">
                      {booking.listing?.images?.[0]?.url ? (
                        <img
                          src={booking.listing.images[0].url}
                          alt={booking.listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-foreground">
                            {booking.listing?.title || 'Listing'}
                          </h3>
                          
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                                {booking.owner?.fullName?.charAt(0) || 'O'}
                              </div>
                              <span className="text-foreground">
                                {booking.owner?.fullName || 'Owner'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                              </span>
                              <span className="text-xs">
                                ({getDuration(booking.startDate, booking.endDate)})
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end justify-between">
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">
                              {formatCurrency(getTotalPrice(booking))}
                            </p>
                            <p className="text-xs text-muted-foreground">Total</p>
                          </div>
                          
                          <div className="flex gap-2 mt-4">
                            {canLeaveReview(booking, true) && (
                              <Button 
                                size="sm" 
                                variant="default" 
                                className="gap-1"
                                onClick={() => handleOpenReviewDialog(booking)}
                              >
                                <Star className="h-4 w-4" /> Leave Review
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => handleViewDetails(booking)}>
                              {t.listing.viewDetails} <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Booking Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.listing.viewDetails}</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              {/* Listing Info */}
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {selectedBooking.listing?.images?.[0]?.url ? (
                    <img
                      src={selectedBooking.listing.images[0].url}
                      alt={selectedBooking.listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedBooking.listing?.title}</h3>
                  {selectedBooking.listing?.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {selectedBooking.listing.location.address || selectedBooking.listing.location.city}
                    </p>
                  )}
                  <Badge className={`mt-2 ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </Badge>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Calendar className="h-4 w-4" />
                  {t.booking.selectDates}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t.booking.startDate}</p>
                    <p className="font-medium">{formatDate(selectedBooking.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t.booking.endDate}</p>
                    <p className="font-medium">{formatDate(selectedBooking.endDate)}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {t.booking.duration}: {getDuration(selectedBooking.startDate, selectedBooking.endDate)}
                </p>
              </div>

              {/* Owner/Renter Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <User className="h-4 w-4" />
                  {selectedBooking.owner ? t.listing.postedBy : t.auth.borrower}
                </div>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">
                    {selectedBooking.owner?.fullName || selectedBooking.renter?.fullName}
                  </p>
                  {(selectedBooking.owner?.phone || selectedBooking.renter?.phone) && (
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {selectedBooking.owner?.phone || selectedBooking.renter?.phone}
                    </p>
                  )}
                  {(selectedBooking.owner?.email || selectedBooking.renter?.email) && (
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {selectedBooking.owner?.email || selectedBooking.renter?.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Message */}
              {selectedBooking.message && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-1">{t.dashboard.messages}</p>
                  <p className="text-sm text-muted-foreground">{selectedBooking.message}</p>
                </div>
              )}

              {/* Pricing */}
              <div className="border-t pt-4 space-y-2">
                {selectedBooking.pricing?.subtotal && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.booking.totalPrice}</span>
                    <span>{formatCurrency(selectedBooking.pricing.subtotal)}</span>
                  </div>
                )}
                {selectedBooking.pricing?.serviceFee && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.booking.serviceFee}</span>
                    <span>{formatCurrency(selectedBooking.pricing.serviceFee)}</span>
                  </div>
                )}
                {selectedBooking.pricing?.deposit && selectedBooking.pricing.deposit > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.listing.deposit}</span>
                    <span>{formatCurrency(selectedBooking.pricing.deposit)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>{t.booking.grandTotal}</span>
                  <span>{formatCurrency(getTotalPrice(selectedBooking))}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setDetailsOpen(false)}>
                  {t.common.close}
                </Button>
                <Button className="flex-1" onClick={() => window.open(`/listing/${selectedBooking.listing?._id}`, '_blank')}>
                  {t.listing.viewDetails}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>
              Share your experience with {reviewBooking?.listing?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Rating */}
            <div className="space-y-2">
              <Label>Rating *</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= reviewRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {reviewRating > 0 && (
                <p className="text-sm text-muted-foreground">
                  {reviewRating === 5 && 'Excellent!'}
                  {reviewRating === 4 && 'Great!'}
                  {reviewRating === 3 && 'Good'}
                  {reviewRating === 2 && 'Fair'}
                  {reviewRating === 1 && 'Poor'}
                </p>
              )}
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="review-comment">Your Review *</Label>
              <Textarea
                id="review-comment"
                placeholder="Share your experience... What did you like or dislike?"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={5}
                maxLength={1000}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {reviewComment.length}/1000 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={reviewSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={reviewSubmitting || reviewRating === 0 || !reviewComment.trim()}
            >
              {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyBookings;
