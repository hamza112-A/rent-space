import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { listingApi, bookingApi, messageApi } from '@/lib/api';
import {
  Star,
  MapPin,
  Heart,
  Share2,
  Flag,
  CheckCircle2,
  Clock,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap,
  Calendar as CalendarIcon,
  User,
  Phone,
  Mail,
  Send,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

const ListingDetail: React.FC = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>();
  const [isFavorite, setIsFavorite] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      if (!listingId) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await listingApi.getById(listingId);
        setListing(response.data.data);
      } catch (err: any) {
        console.error('Failed to fetch listing:', err);
        setError(err.response?.data?.message || 'Failed to load listing');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId]);

  // Mock reviews and similar listings for now (can be fetched from API later)
  const reviews = [
    {
      id: '1',
      user: 'Sara Ali',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      rating: 5,
      date: 'December 2025',
      comment: 'Amazing experience! Very clean and exactly as described.',
    },
  ];

  const similarListings: any[] = [];

  const nextImage = () => {
    if (!listing?.images?.length) return;
    setSelectedImage((prev) => (prev + 1) % listing.images.length);
  };

  const prevImage = () => {
    if (!listing?.images?.length) return;
    setSelectedImage((prev) => (prev - 1 + listing.images.length) % listing.images.length);
  };

  const handleBookNow = () => {
    if (!isAuthenticated) {
      toast.error('Please login to book');
      return;
    }
    if (!selectedDates || selectedDates.length === 0) {
      toast.error('Please select dates first');
      return;
    }
    setBookingDialogOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedDates || selectedDates.length === 0 || !listingId) return;
    
    setBookingLoading(true);
    try {
      const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
      const startDate = sortedDates[0].toISOString();
      const endDate = sortedDates[sortedDates.length - 1].toISOString();

      const response = await bookingApi.create({
        listingId,
        startDate,
        endDate,
        message: message || undefined,
      });

      setBookingDialogOpen(false);
      
      // Calculate total amount and redirect to payment
      const pricePerDay = listing?.pricing?.daily || 0;
      const totalAmount = Math.round(pricePerDay * selectedDates.length * 1.05);
      const bookingId = response.data?.data?._id;
      
      // Redirect to payment page
      navigate(`/payment/checkout?amount=${totalAmount}&bookingId=${bookingId}`);
      
      setSelectedDates(undefined);
      setMessage('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    if (!isAuthenticated) {
      toast.error('Please login to send messages');
      return;
    }
    
    try {
      await messageApi.createConversation({
        participantId: listing?.owner?._id,
        listingId,
        content: message,
      });
      setContactDialogOpen(false);
      toast.success('Message sent to owner!');
      setMessage('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to save favorites');
      return;
    }
    
    try {
      await listingApi.toggleFavorite(listingId!);
      setIsFavorite(!isFavorite);
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (err) {
      toast.error('Failed to update favorites');
    }
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="pt-20 min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-8 w-64 mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
              <div>
                <Skeleton className="h-96 w-full" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error || !listing) {
    return (
      <Layout>
        <div className="pt-20 min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive mb-4">{error || 'Listing not found'}</p>
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

  // Extract data from listing
  const images = listing.images?.map((img: any) => img.url) || [];
  const dailyPrice = listing.pricing?.daily || 0;
  const locationStr = `${listing.location?.area || ''}, ${listing.location?.city || ''}`.replace(/^, |, $/g, '');
  const features = listing.features || [];
  const specifications = listing.specifications || {};
  const owner = listing.owner || {};

  return (
    <Layout>
      <div className="pt-20 min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link to={`/category/${listing.category}`} className="hover:text-foreground capitalize">{listing.category}</Link>
            <span>/</span>
            <span className="text-foreground">{listing.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <Card className="overflow-hidden">
                <div className="relative aspect-video">
                  {images.length > 0 ? (
                    <img
                      src={images[selectedImage]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      No Images
                    </div>
                  )}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </>
                  )}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === selectedImage ? 'bg-primary' : 'bg-background/60'
                        }`}
                      />
                    ))}
                  </div>
                  {listing.verified && (
                    <Badge className="absolute top-4 left-4 gap-1 bg-gradient-to-r from-amber-400 to-orange-400">
                      <CheckCircle2 className="w-3 h-3" /> {t.listing.verified}
                    </Badge>
                  )}
                  {listing.availability?.instantBook && (
                    <Badge className="absolute top-4 right-4 gap-1" variant="secondary">
                      <Zap className="w-3 h-3" /> {t.listing.instantBook}
                    </Badge>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="p-2 flex gap-2 overflow-x-auto">
                    {images.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                          idx === selectedImage ? 'border-primary' : 'border-transparent'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </Card>

              {/* Title & Actions */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">{listing.title}</h1>
                  <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {locationStr || 'Location not specified'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <span className="font-medium text-foreground">{listing.rating?.average || 0}</span>
                      <span>({listing.rating?.count || 0} {t.listing.reviews})</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleToggleFavorite}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Flag className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.listing.description}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{listing.description}</p>
                </CardContent>
              </Card>

              {/* Features */}
              {features.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t.listing.features}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {features.map((feature: string) => (
                        <div key={feature} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Specifications */}
              {Object.keys(specifications).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t.listing.specifications}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(specifications).map(([key, value]) => (
                        <div key={key} className="p-3 rounded-lg bg-muted/50">
                          <p className="text-sm text-muted-foreground">{key}</p>
                          <p className="font-medium text-foreground">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Policies */}
              {listing.policies && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t.listing.policies}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">{t.listing.cancellation}</h4>
                      <p className="text-muted-foreground">{listing.policies.cancellation || 'Contact owner for details'}</p>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-foreground mb-2">{t.listing.deposit}</h4>
                      <p className="text-muted-foreground">
                        {listing.policies.deposit?.required 
                          ? `PKR ${listing.policies.deposit.amount?.toLocaleString()} security deposit required`
                          : 'No deposit required'}
                      </p>
                    </div>
                    {listing.policies.rules?.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium text-foreground mb-2">House Rules</h4>
                          <ul className="space-y-1">
                            {listing.policies.rules.map((rule: string) => (
                              <li key={rule} className="text-muted-foreground flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                                {rule}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Reviews */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                    {listing.rating?.average || 0} · {listing.rating?.count || 0} {t.listing.reviews}
                  </CardTitle>
                  <Button variant="outline" size="sm">See All</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reviews.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No reviews yet</p>
                  ) : (
                    reviews.map((review) => (
                    <div key={review.id} className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={review.avatar} />
                          <AvatarFallback>{review.user[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">{review.user}</p>
                              <p className="text-sm text-muted-foreground">{review.date}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                              ))}
                            </div>
                          </div>
                          <p className="mt-2 text-muted-foreground">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Booking Card */}
              <Card className="sticky top-24">
                <CardContent className="p-6 space-y-6">
                  {/* Pricing */}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-foreground">
                        PKR {dailyPrice.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">{t.listing.perDay}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {listing.pricing?.weekly && (
                        <Badge variant="outline">PKR {listing.pricing.weekly.toLocaleString()}{t.listing.perWeek}</Badge>
                      )}
                      {listing.pricing?.monthly && (
                        <Badge variant="outline">PKR {listing.pricing.monthly.toLocaleString()}{t.listing.perMonth}</Badge>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Calendar */}
                  <div>
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {t.booking.selectDates}
                    </h4>
                    <Calendar
                      mode="multiple"
                      selected={selectedDates}
                      onSelect={setSelectedDates}
                      className="rounded-md border"
                      disabled={(date) => date < new Date()}
                    />
                  </div>

                  <Separator />

                  {/* Price Breakdown */}
                  {selectedDates && selectedDates.length > 0 && (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            PKR {dailyPrice.toLocaleString()} × {selectedDates.length} days
                          </span>
                          <span>PKR {(dailyPrice * selectedDates.length).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{t.booking.serviceFee}</span>
                          <span>PKR {Math.round(dailyPrice * selectedDates.length * 0.05).toLocaleString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>{t.booking.grandTotal}</span>
                          <span>PKR {Math.round(dailyPrice * selectedDates.length * 1.05).toLocaleString()}</span>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Book Buttons */}
                  <div className="space-y-3">
                    {listing.availability?.instantBook ? (
                      <Button className="w-full gap-2" size="lg" onClick={handleBookNow}>
                        <Zap className="h-4 w-4" />
                        {t.listing.bookNow}
                      </Button>
                    ) : (
                      <Button className="w-full gap-2" size="lg" onClick={handleBookNow}>
                        <Clock className="h-4 w-4" />
                        {t.listing.sendRequest}
                      </Button>
                    )}
                    <Button variant="outline" className="w-full gap-2" onClick={() => setContactDialogOpen(true)}>
                      <MessageCircle className="h-4 w-4" />
                      Contact Owner
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Owner Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={owner.profileImage} />
                      <AvatarFallback>{owner.fullName?.[0] || 'O'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{owner.fullName || 'Owner'}</h3>
                        {owner.isEmailVerified && (
                          <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
                            <Shield className="h-3 w-3" /> Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t.listing.memberSince} {owner.createdAt ? new Date(owner.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-lg font-semibold text-foreground">{owner.verificationLevel || 'Basic'}</p>
                      <p className="text-xs text-muted-foreground">Verification</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-lg font-semibold text-foreground">{listing.rating?.average || 0}</p>
                      <p className="text-xs text-muted-foreground">{t.listing.rating}</p>
                    </div>
                  </div>

                  {owner._id && (
                    <Link to={`/user/${owner._id}`}>
                      <Button variant="outline" className="w-full mt-4">
                        View Profile
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Similar Items */}
          {similarListings.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">{t.listing.similarItems}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {similarListings.map((item) => (
                  <Link key={item.id} to={`/listing/${item.id}`}>
                    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                      <div className="relative h-48">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        {item.verified && (
                          <Badge className="absolute top-3 left-3 gap-1 bg-gradient-to-r from-amber-400 to-orange-400">
                            <CheckCircle2 className="w-3 h-3" /> {t.listing.verified}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground mb-2 line-clamp-1">{item.title}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                          <MapPin className="w-4 h-4" /> {item.location}
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-bold text-primary">PKR {item.price.toLocaleString()}</span>
                            <span className="text-sm text-muted-foreground">/{item.priceType}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="font-medium">{item.rating}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Booking Confirmation Dialog */}
        <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Your Booking</DialogTitle>
              <DialogDescription>
                Review your booking details before confirming
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                {images[0] && (
                  <img src={images[0]} alt={listing.title} className="w-20 h-14 rounded-lg object-cover" />
                )}
                <div>
                  <h4 className="font-semibold text-foreground">{listing.title}</h4>
                  <p className="text-sm text-muted-foreground">{locationStr}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Selected Dates</span>
                  <span>{selectedDates?.length || 0} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price per Day</span>
                  <span>PKR {dailyPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service Fee (5%)</span>
                  <span>PKR {Math.round(dailyPrice * (selectedDates?.length || 0) * 0.05).toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary">PKR {Math.round(dailyPrice * (selectedDates?.length || 0) * 1.05).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>{t.common.cancel}</Button>
              <Button onClick={handleConfirmBooking} disabled={bookingLoading}>
                {bookingLoading ? t.common.loading : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {t.booking.confirmBooking}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Contact Owner Dialog */}
        <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Contact {owner.fullName || 'Owner'}</DialogTitle>
              <DialogDescription>
                Send a message to the owner about this listing
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <Avatar>
                  <AvatarImage src={owner.profileImage} />
                  <AvatarFallback>{owner.fullName?.[0] || 'O'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{owner.fullName || 'Owner'}</span>
                    {owner.isEmailVerified && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Shield className="h-3 w-3" /> Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Textarea
                placeholder="Hi, I'm interested in this listing. Is it available for..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setContactDialogOpen(false)}>{t.common.cancel}</Button>
              <Button onClick={handleSendMessage}>
                <Send className="h-4 w-4 mr-2" />
                {t.dashboard.messages}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ListingDetail;
