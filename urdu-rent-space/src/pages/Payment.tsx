import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { paymentApi } from '@/lib/api';
import { toast } from 'sonner';
import { CreditCard, Lock, CheckCircle, AlertCircle } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

const CheckoutForm: React.FC<{ amount: number; bookingId?: string }> = ({ amount, bookingId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentId, setPaymentId] = useState('');

  useEffect(() => {
    createPaymentIntent();
  }, [amount]);

  const createPaymentIntent = async () => {
    try {
      const response = await paymentApi.createIntent({ bookingId, amount, currency: 'pkr' });
      setClientSecret(response.data.data.clientSecret);
      setPaymentId(response.data.data.paymentId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initialize payment');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setLoading(true);
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement }
    });

    if (error) {
      toast.error(error.message || 'Payment failed');
      navigate('/payment/failed');
    } else if (paymentIntent?.status === 'succeeded') {
      await paymentApi.confirm({ paymentIntentId: paymentIntent.id });
      navigate('/payment/success');
    }
    setLoading(false);
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg bg-muted/50">
        <CardElement options={{
          style: {
            base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
            invalid: { color: '#9e2146' }
          }
        }} />
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>Your payment is secure and encrypted</span>
      </div>
      <Button type="submit" disabled={!stripe || loading} className="w-full" size="lg">
        {loading ? t.common.loading : `Pay PKR ${amount.toLocaleString()}`}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Test card: 4242 4242 4242 4242 | Any future date | Any CVC
      </p>
    </form>
  );
};

const Payment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const amount = Number(searchParams.get('amount')) || 1000;
  const bookingId = searchParams.get('bookingId') || undefined;

  return (
    <Layout>
      <div className="pt-20 min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t.payment.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-primary/5 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Amount to Pay</p>
                <p className="text-3xl font-bold">PKR {amount.toLocaleString()}</p>
              </div>
              <Elements stripe={stripePromise}>
                <CheckoutForm amount={amount} bookingId={bookingId} />
              </Elements>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Payment;