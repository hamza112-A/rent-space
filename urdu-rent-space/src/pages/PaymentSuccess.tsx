import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle, Home, Calendar, Star } from 'lucide-react';
import { bookingApi } from '@/lib/api';
import { toast } from 'sonner';

const PaymentSuccess: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('bookingId');
  
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const response = await bookingApi.getById(bookingId!);
      setBooking(response.data.data);
    } catch (err) {
      console.error('Failed to fetch booking:', err);
    }
  };

  const handleOpenReviewDialog = () => {
    setReviewRating(0);
    setReviewComment('');
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!bookingId) return;
    
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
      await bookingApi.addReview(bookingId, {
        rating: reviewRating,
        comment: reviewComment.trim()
      });
      
      toast.success('Review submitted successfully! Thank you for your feedback.');
      setReviewDialogOpen(false);
      setReviewRating(0);
      setReviewComment('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="pt-20 min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-md">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">{t.payment.success}</h1>
              <p className="text-muted-foreground mb-6">
                Your payment has been processed successfully. You will receive a confirmation email shortly.
              </p>
              <div className="space-y-3">
                {bookingId && (
                  <Button 
                    onClick={handleOpenReviewDialog}
                    className="w-full gap-2 bg-amber-500 hover:bg-amber-600"
                  >
                    <Star className="h-4 w-4" /> Leave a Review
                  </Button>
                )}
                <Link to="/dashboard?tab=bookings">
                  <Button className="w-full gap-2" variant={bookingId ? "outline" : "default"}>
                    <Calendar className="h-4 w-4" /> View My Bookings
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="outline" className="w-full gap-2">
                    <Home className="h-4 w-4" /> {t.nav.home}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Leave a Review</DialogTitle>
              <DialogDescription>
                Share your experience with this listing
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
                    {reviewRating === 5 && '⭐ Excellent!'}
                    {reviewRating === 4 && '⭐ Great!'}
                    {reviewRating === 3 && '⭐ Good'}
                    {reviewRating === 2 && '⭐ Fair'}
                    {reviewRating === 1 && '⭐ Poor'}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <Label htmlFor="review-comment">Your Review *</Label>
                <Textarea
                  id="review-comment"
                  placeholder="Share your experience... What did you like or dislike about this listing?"
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
                Skip for Now
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={reviewSubmitting || reviewRating === 0 || !reviewComment.trim()}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default PaymentSuccess;