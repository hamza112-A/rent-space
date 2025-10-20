import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
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
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>();
  const [isFavorite, setIsFavorite] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [message, setMessage] = useState('');

  // Mock listing data
  const listing = {
    id: listingId,
    title: 'Luxury 3BR Apartment in DHA Phase 5',
    description: 'Experience luxury living in this beautifully furnished 3-bedroom apartment located in the heart of DHA Phase 5. Perfect for families or professionals seeking a premium rental experience. The apartment features modern amenities, high-end finishes, and stunning city views.',
    category: 'property',
    subcategory: 'apartments',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800',
      'https://images.unsplash.com/photo-1560185008-a33f5c7b1844?w=800',
    ],
    pricing: {
      hourly: null,
      daily: 15000,
      weekly: 85000,
      monthly: 280000,
    },
    location: 'DHA Phase 5, Karachi',
    rating: 4.9,
    reviewCount: 47,
    verified: true,
    instantBook: true,
    features: [
      '3 Bedrooms',
      '2 Bathrooms',
      'Fully Furnished',
      'Air Conditioned',
      'High-Speed WiFi',
      'Parking Available',
      '24/7 Security',
      'Gym Access',
    ],
    specifications: {
      'Area': '2,200 sq ft',
      'Floor': '12th Floor',
      'Bedrooms': '3',
      'Bathrooms': '2',
      'Furnishing': 'Fully Furnished',
      'Built Year': '2021',
    },
    policies: {
      cancellation: 'Free cancellation up to 48 hours before check-in',
      deposit: 'PKR 50,000 security deposit required',
      rules: ['No smoking', 'No pets', 'No parties', 'Quiet hours after 10 PM'],
    },
    owner: {
      id: '1',
      name: 'Ahmed Raza',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      verified: true,
      memberSince: 'March 2023',
      responseRate: 98,
      responseTime: 'Within 1 hour',
      totalListings: 5,
      rating: 4.9,
    },
  };

  const reviews = [
    {
      id: '1',
      user: 'Sara Ali',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      rating: 5,
      date: 'December 2025',
      comment: 'Amazing apartment! Very clean and exactly as described. Ahmed was very responsive and helpful throughout our stay.',
    },
    {
      id: '2',
      user: 'Usman Khan',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      rating: 5,
      date: 'November 2025',
      comment: 'Great location in DHA. The apartment has all modern amenities. Would definitely recommend!',
    },
    {
      id: '3',
      user: 'Fatima Hassan',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      rating: 4,
      date: 'October 2025',
      comment: 'Nice place, good value for money. Only minor issue was slow WiFi during peak hours.',
    },
  ];

  const similarListings = [
    { id: '2', title: 'Modern 2BR in Clifton', price: 180000, priceType: 'month', location: 'Clifton, Karachi', rating: 4.8, image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400', verified: true },
    { id: '3', title: 'Penthouse with Sea View', price: 450000, priceType: 'month', location: 'DHA Phase 8, Karachi', rating: 5.0, image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400', verified: true },
    { id: '4', title: 'Cozy Studio Apartment', price: 85000, priceType: 'month', location: 'Gulshan, Karachi', rating: 4.7, image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400', verified: false },
  ];

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % listing.images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + listing.images.length) % listing.images.length);
  };

  const handleBookNow = () => {
    if (!selectedDates || selectedDates.length === 0) {
      toast.error('Please select dates first');
      return;
    }
    setBookingDialogOpen(true);
  };

  const handleConfirmBooking = () => {
    setBookingDialogOpen(false);
    toast.success('Booking request sent successfully! The owner will respond shortly.');
    setSelectedDates(undefined);
  };

  const handleSendMessage = () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    setContactDialogOpen(false);
    toast.success('Message sent to owner!');
    setMessage('');
  };

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
                  <img
                    src={listing.images[selectedImage]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
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
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {listing.images.map((_, idx) => (
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
                  {listing.instantBook && (
                    <Badge className="absolute top-4 right-4 gap-1" variant="secondary">
                      <Zap className="w-3 h-3" /> {t.listing.instantBook}
                    </Badge>
                  )}
                </div>
                <div className="p-2 flex gap-2 overflow-x-auto">
                  {listing.images.map((img, idx) => (
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
              </Card>

              {/* Title & Actions */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">{listing.title}</h1>
                  <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {listing.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <span className="font-medium text-foreground">{listing.rating}</span>
                      <span>({listing.reviewCount} {t.listing.reviews})</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsFavorite(!isFavorite)}
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
              <Card>
                <CardHeader>
                  <CardTitle>{t.listing.features}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {listing.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Specifications */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.listing.specifications}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(listing.specifications).map(([key, value]) => (
                      <div key={key} className="p-3 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">{key}</p>
                        <p className="font-medium text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Policies */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.listing.policies}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">{t.listing.cancellation}</h4>
                    <p className="text-muted-foreground">{listing.policies.cancellation}</p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-foreground mb-2">{t.listing.deposit}</h4>
                    <p className="text-muted-foreground">{listing.policies.deposit}</p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-foreground mb-2">House Rules</h4>
                    <ul className="space-y-1">
                      {listing.policies.rules.map((rule) => (
                        <li key={rule} className="text-muted-foreground flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Reviews */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                    {listing.rating} · {listing.reviewCount} {t.listing.reviews}
                  </CardTitle>
                  <Button variant="outline" size="sm">See All</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reviews.map((review) => (
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
                  ))}
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
                        PKR {listing.pricing.daily?.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">{t.listing.perDay}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {listing.pricing.weekly && (
                        <Badge variant="outline">PKR {listing.pricing.weekly.toLocaleString()}{t.listing.perWeek}</Badge>
                      )}
                      {listing.pricing.monthly && (
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
                            PKR {listing.pricing.daily?.toLocaleString()} × {selectedDates.length} days
                          </span>
                          <span>PKR {((listing.pricing.daily || 0) * selectedDates.length).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{t.booking.serviceFee}</span>
                          <span>PKR {Math.round((listing.pricing.daily || 0) * selectedDates.length * 0.05).toLocaleString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>{t.booking.grandTotal}</span>
                          <span>PKR {Math.round((listing.pricing.daily || 0) * selectedDates.length * 1.05).toLocaleString()}</span>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Book Buttons */}
                  <div className="space-y-3">
                    {listing.instantBook ? (
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
                      <AvatarImage src={listing.owner.avatar} />
                      <AvatarFallback>{listing.owner.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{listing.owner.name}</h3>
                        {listing.owner.verified && (
                          <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
                            <Shield className="h-3 w-3" /> Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t.listing.memberSince} {listing.owner.memberSince}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-lg font-semibold text-foreground">{listing.owner.responseRate}%</p>
                      <p className="text-xs text-muted-foreground">{t.listing.responseRate}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-lg font-semibold text-foreground">{listing.owner.rating}</p>
                      <p className="text-xs text-muted-foreground">{t.listing.rating}</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mt-4 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {t.listing.responseTime}: {listing.owner.responseTime}
                  </p>

                  <Link to={`/user/${listing.owner.id}`}>
                    <Button variant="outline" className="w-full mt-4">
                      View Profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Similar Items */}
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
                <img src={listing.images[0]} alt={listing.title} className="w-20 h-14 rounded-lg object-cover" />
                <div>
                  <h4 className="font-semibold text-foreground">{listing.title}</h4>
                  <p className="text-sm text-muted-foreground">{listing.location}</p>
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
                  <span>PKR {listing.pricing.daily?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service Fee (5%)</span>
                  <span>PKR {Math.round((listing.pricing.daily || 0) * (selectedDates?.length || 0) * 0.05).toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary">PKR {Math.round((listing.pricing.daily || 0) * (selectedDates?.length || 0) * 1.05).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleConfirmBooking}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirm Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Contact Owner Dialog */}
        <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Contact {listing.owner.name}</DialogTitle>
              <DialogDescription>
                Send a message to the owner about this listing
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <Avatar>
                  <AvatarImage src={listing.owner.avatar} />
                  <AvatarFallback>{listing.owner.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{listing.owner.name}</span>
                    {listing.owner.verified && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Shield className="h-3 w-3" /> Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Usually responds {listing.owner.responseTime.toLowerCase()}</p>
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
              <Button variant="outline" onClick={() => setContactDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSendMessage}>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ListingDetail;
