import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Shield,
  CheckCircle2,
  Lock,
  Loader2,
} from 'lucide-react';

interface BookingDetails {
  bookingId: string;
  listingId: string;
  item: string;
  dates: string;
  nights: number;
  pricePerNight: number;
  subtotal: number;
  serviceFee: number;
  total: number;
}

const PaymentMethods: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedMethod, setSelectedMethod] = useState('jazzcash');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    mobileNumber: '',
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
  });

  // Get booking details from navigation state
  const bookingDetails: BookingDetails = location.state?.bookingDetails || {
    bookingId: '',
    listingId: '',
    item: 'No booking selected',
    dates: '',
    nights: 0,
    pricePerNight: 0,
    subtotal: 0,
    serviceFee: 0,
    total: 0,
  };

  useEffect(() => {
    // Redirect if no booking details
    if (!location.state?.bookingDetails) {
      toast.error('No booking details found');
      navigate('/');
    }
  }, [location.state, navigate]);

  const paymentMethods = [
    {
      id: 'jazzcash',
      name: 'JazzCash',
      icon: '/jazzcash.png',
      description: 'Pay using your JazzCash mobile wallet',
      color: 'bg-red-500',
    },
    {
      id: 'easypaisa',
      name: 'Easypaisa',
      icon: '/easypaisa.png',
      description: 'Pay using your Easypaisa mobile wallet',
      color: 'bg-green-500',
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: null,
      description: 'Pay securely with Visa or Mastercard',
      color: 'bg-blue-500',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookingDetails.bookingId) {
      toast.error('Invalid booking');
      return;
    }

    // Validate form based on payment method
    if (selectedMethod === 'jazzcash' || selectedMethod === 'easypaisa') {
      if (!formData.mobileNumber || formData.mobileNumber.length < 11) {
        toast.error('Please enter a valid mobile number');
        return;
      }
    } else if (selectedMethod === 'card') {
      if (!formData.cardNumber || !formData.cardName || !formData.expiry || !formData.cvv) {
        toast.error('Please fill in all card details');
        return;
      }
    }

    setIsLoading(true);
    
    try {
      // Initiate payment
      const initiateResponse = await fetch('http://localhost:5000/api/v1/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bookingId: bookingDetails.bookingId,
          method: selectedMethod,
          amount: bookingDetails.total,
        }),
      });

      const initiateData = await initiateResponse.json();
      
      if (!initiateData.success) {
        throw new Error(initiateData.message || 'Failed to initiate payment');
      }

      // Simulate payment gateway processing
      // In production, this would redirect to actual payment gateway
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Verify payment (mock transaction ID for demo)
      const verifyResponse = await fetch('http://localhost:5000/api/v1/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          paymentId: initiateData.data._id,
          transactionId: `TXN${Date.now()}`,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        throw new Error(verifyData.message || 'Payment verification failed');
      }

      toast.success('Payment successful! Your booking is confirmed.');
      navigate('/dashboard', { state: { tab: 'bookings' } });
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="pt-20 min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <h1 className="text-3xl font-bold text-foreground">{t.payment.title}</h1>
            <p className="text-muted-foreground mt-2">Complete your booking securely</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit}>
                <Card>
                  <CardHeader>
                    <CardTitle>{t.payment.selectMethod}</CardTitle>
                    <CardDescription>Choose your preferred payment method</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod} className="space-y-4">
                      {paymentMethods.map((method) => (
                        <Label
                          key={method.id}
                          htmlFor={method.id}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedMethod === method.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <RadioGroupItem value={method.id} id={method.id} />
                          <div className={`w-12 h-12 rounded-xl ${method.color} flex items-center justify-center text-white`}>
                            {method.id === 'card' ? (
                              <CreditCard className="w-6 h-6" />
                            ) : (
                              <Smartphone className="w-6 h-6" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{method.name}</span>
                              {method.id === 'jazzcash' && <Badge variant="secondary">Popular</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                          </div>
                        </Label>
                      ))}
                    </RadioGroup>

                    <Separator />

                    {/* Mobile Wallet Form */}
                    {(selectedMethod === 'jazzcash' || selectedMethod === 'easypaisa') && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="mobileNumber">Mobile Number</Label>
                          <div className="relative mt-2">
                            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="mobileNumber"
                              type="tel"
                              placeholder="03XX XXXXXXX"
                              value={formData.mobileNumber}
                              onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                              className="pl-10"
                              required
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            You will receive a payment request on your {selectedMethod === 'jazzcash' ? 'JazzCash' : 'Easypaisa'} app
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Card Form */}
                    {selectedMethod === 'card' && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <div className="relative mt-2">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="cardNumber"
                              type="text"
                              placeholder="1234 5678 9012 3456"
                              value={formData.cardNumber}
                              onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="cardName">Name on Card</Label>
                          <Input
                            id="cardName"
                            type="text"
                            placeholder="AHMED KHAN"
                            value={formData.cardName}
                            onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                            className="mt-2"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiry">Expiry Date</Label>
                            <Input
                              id="expiry"
                              type="text"
                              placeholder="MM/YY"
                              value={formData.expiry}
                              onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                              className="mt-2"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                              id="cvv"
                              type="text"
                              placeholder="123"
                              value={formData.cvv}
                              onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                              className="mt-2"
                              maxLength={4}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600">
                      <Lock className="w-4 h-4" />
                      <span className="text-sm">Your payment information is encrypted and secure</span>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={isLoading || !bookingDetails.bookingId}>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t.payment.processing}
                        </>
                      ) : (
                        `Pay PKR ${bookingDetails.total.toLocaleString()}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </form>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground">{bookingDetails.item}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{bookingDetails.dates}</p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        PKR {bookingDetails.pricePerNight.toLocaleString()} × {bookingDetails.nights} nights
                      </span>
                      <span>PKR {bookingDetails.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t.booking.serviceFee}</span>
                      <span>PKR {bookingDetails.serviceFee.toLocaleString()}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>{t.booking.grandTotal}</span>
                    <span className="text-primary">PKR {bookingDetails.total.toLocaleString()}</span>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span>Secure payment</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Free cancellation within 48 hours</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentMethods;
