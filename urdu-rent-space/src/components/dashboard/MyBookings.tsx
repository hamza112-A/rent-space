import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  MapPin,
  User,
  Phone,
  MessageSquare,
  Check,
  X,
  Clock,
  ChevronRight
} from 'lucide-react';

const MyBookings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('incoming');

  const incomingBookings = [
    {
      id: 1,
      item: 'Honda Civic 2022 - Premium Sedan',
      itemImage: 'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=400',
      customer: 'Ahmed Khan',
      customerAvatar: 'AK',
      phone: '+92 300 1234567',
      dates: 'Jan 5 - Jan 7, 2026',
      duration: '3 days',
      amount: 'PKR 15,000',
      status: 'pending',
      requestedAt: '2 hours ago',
    },
    {
      id: 2,
      item: 'Designer Bridal Dress',
      itemImage: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=400',
      customer: 'Fatima Hassan',
      customerAvatar: 'FH',
      phone: '+92 321 9876543',
      dates: 'Jan 10, 2026',
      duration: '1 day',
      amount: 'PKR 15,000',
      status: 'confirmed',
      requestedAt: '1 day ago',
    },
    {
      id: 3,
      item: 'Professional Photography Set',
      itemImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400',
      customer: 'Ali Raza',
      customerAvatar: 'AR',
      phone: '+92 333 4567890',
      dates: 'Jan 15 - Jan 16, 2026',
      duration: '2 days',
      amount: 'PKR 6,000',
      status: 'pending',
      requestedAt: '3 hours ago',
    },
  ];

  const outgoingBookings = [
    {
      id: 4,
      item: 'Luxury Villa - Beach View',
      itemImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400',
      owner: 'Karachi Rentals',
      ownerAvatar: 'KR',
      dates: 'Jan 20 - Jan 25, 2026',
      duration: '5 days',
      amount: 'PKR 250,000',
      status: 'confirmed',
      bookedAt: '1 week ago',
    },
    {
      id: 5,
      item: 'Toyota Fortuner 2023',
      itemImage: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400',
      owner: 'Premium Car Rentals',
      ownerAvatar: 'PC',
      dates: 'Dec 28 - Dec 30, 2025',
      duration: '3 days',
      amount: 'PKR 24,000',
      status: 'completed',
      bookedAt: '2 weeks ago',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
        <p className="text-muted-foreground">Manage incoming and outgoing rental requests</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="incoming" className="gap-2">
            <span>Incoming</span>
            <Badge variant="secondary" className="h-5 px-1.5">
              {incomingBookings.filter(b => b.status === 'pending').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="outgoing">My Rentals</TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="mt-6 space-y-4">
          {incomingBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-48 h-40 sm:h-auto flex-shrink-0">
                    <img
                      src={booking.itemImage}
                      alt={booking.item}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {booking.requestedAt}
                          </span>
                        </div>
                        <h3 className="font-semibold text-foreground">{booking.item}</h3>
                        
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                              {booking.customerAvatar}
                            </div>
                            <span className="text-foreground">{booking.customer}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{booking.dates}</span>
                            <span className="text-xs">({booking.duration})</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{booking.phone}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end justify-between">
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">{booking.amount}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        
                        {booking.status === 'pending' && (
                          <div className="flex gap-2 mt-4">
                            <Button size="sm" variant="outline" className="gap-1">
                              <X className="h-4 w-4" /> Decline
                            </Button>
                            <Button size="sm" className="gap-1">
                              <Check className="h-4 w-4" /> Accept
                            </Button>
                          </div>
                        )}
                        
                        {booking.status === 'confirmed' && (
                          <Button size="sm" variant="outline" className="gap-1 mt-4">
                            <MessageSquare className="h-4 w-4" /> Message
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="outgoing" className="mt-6 space-y-4">
          {outgoingBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-48 h-40 sm:h-auto flex-shrink-0">
                    <img
                      src={booking.itemImage}
                      alt={booking.item}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-foreground">{booking.item}</h3>
                        
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                              {booking.ownerAvatar}
                            </div>
                            <span className="text-foreground">{booking.owner}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{booking.dates}</span>
                            <span className="text-xs">({booking.duration})</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end justify-between">
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">{booking.amount}</p>
                          <p className="text-xs text-muted-foreground">Total Paid</p>
                        </div>
                        
                        <Button size="sm" variant="outline" className="gap-1 mt-4">
                          View Details <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyBookings;
