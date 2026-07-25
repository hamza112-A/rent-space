import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { userApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Star,
  MapPin,
  Calendar,
  CheckCircle2,
  Shield,
  MessageCircle,
  User,
  Package,
  Clock,
  TrendingUp,
} from 'lucide-react';

interface Review {
  _id: string;
  reviewerId: {
    _id: string;
    fullName: string;
    profileImage?: { url: string };
  };
  rating: number;
  comment: string;
  createdAt: string;
  booking?: {
    listing: {
      title: string;
    };
  };
}

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUserProfile();
    fetchReviews(1);
  }, [userId]);

  const fetchUserProfile = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await userApi.getPublicProfile(userId);
      setUser(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (page: number) => {
    if (!userId) return;
    
    try {
      setReviewsLoading(true);
      const response = await userApi.getReviews(userId, { page, limit: 10 });
      setReviews(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setCurrentPage(page);
    } catch (error: any) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="pt-20 min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="pt-20 min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <Card>
              <CardContent className="p-12 text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">User not found</p>
                <Link to="/">
                  <Button>Go Home</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  const averageRating = user.rating?.average || 0;
  const totalReviews = user.rating?.count || 0;
  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <Layout>
      <div className="pt-20 min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Header */}
            <Card>
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-6">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={user.profileImage?.url} />
                    <AvatarFallback className="text-4xl">
                      {user.fullName?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold">{user.fullName}</h1>
                        {user.isEmailVerified && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified
                          </Badge>
                        )}
                        {user.isPremium && (
                          <Badge className="gap-1 bg-gradient-to-r from-amber-400 to-orange-400">
                            <Shield className="h-3 w-3" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Member since {memberSince}
                        </div>
                        {user.location?.city && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {user.location.city}
                          </div>
                        )}
                      </div>
                    </div>

                    {user.bio && (
                      <p className="text-muted-foreground">{user.bio}</p>
                    )}

                    <div className="flex items-center gap-2">
                      <Button>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Contact
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                  </div>
                  <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Rating</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">{totalReviews}</div>
                  <div className="text-sm text-muted-foreground">Reviews</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Package className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold">{user.stats?.totalListings || 0}</div>
                  <div className="text-sm text-muted-foreground">Listings</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold">{user.responseRate || 0}%</div>
                  <div className="text-sm text-muted-foreground">Response Rate</div>
                </CardContent>
              </Card>
            </div>

            {/* Verification Status */}
            {(user.isEmailVerified || user.isPhoneVerified || user.isIdentityVerified) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Verification Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {user.isEmailVerified && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Email Verified</span>
                      </div>
                    )}
                    {user.isPhoneVerified && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Phone Verified</span>
                      </div>
                    )}
                    {user.isIdentityVerified && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>ID Verified</span>
                      </div>
                    )}
                    {user.isBiometricVerified && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Biometric Verified</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                  Reviews ({totalReviews})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {reviewsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No reviews yet</p>
                  </div>
                ) : (
                  <>
                    {reviews.map((review) => (
                      <div key={review._id}>
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarImage src={review.reviewerId?.profileImage?.url} />
                            <AvatarFallback>
                              {review.reviewerId?.fullName?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">
                                  {review.reviewerId?.fullName || 'Anonymous'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                                    month: 'long',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? 'text-amber-400 fill-amber-400'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            
                            {review.booking?.listing?.title && (
                              <p className="text-sm text-muted-foreground">
                                Booking: {review.booking.listing.title}
                              </p>
                            )}
                            
                            <p className="text-muted-foreground">{review.comment}</p>
                          </div>
                        </div>
                        <Separator className="mt-6" />
                      </div>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() => fetchReviews(currentPage - 1)}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === totalPages}
                          onClick={() => fetchReviews(currentPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;
