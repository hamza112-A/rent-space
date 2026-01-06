import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { subscriptionApi, paymentApi } from '@/lib/api';
import {
  ArrowLeft,
  Check,
  Crown,
  Zap,
  Shield,
  Eye,
  Ban,
  TrendingUp,
  Loader2,
  CheckCircle2,
  Clock,
  Star,
  Infinity,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

interface Plan {
  id: string;
  name: string;
  nameUrdu: string;
  price: number;
  currency: string;
  period?: string;
  maxListings: number;
  listingDuration: number;
  features: {
    prioritySupport: boolean;
    enhancedVisibility: boolean;
    analytics: boolean;
    featuredBadge: boolean;
    topVisibility: boolean;
  };
  benefits: string[];
  limitations: string[];
}

interface CurrentSubscription {
  plan: string;
  status: string;
  startDate: string;
  endDate: string | null;
  maxListings: number;
  listingDuration: number;
  features: Plan['features'];
  planDetails: Plan;
}

// Payment Form Component
const PaymentForm: React.FC<{ 
  plan: Plan; 
  onSuccess: () => void; 
  onCancel: () => void;
}> = ({ plan, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      const response = await subscriptionApi.createPayment(plan.id);
      setClientSecret(response.data.data.clientSecret);
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
      setLoading(false);
    } else if (paymentIntent?.status === 'succeeded') {
      // Confirm payment and activate subscription
      try {
        await paymentApi.confirm({ paymentIntentId: paymentIntent.id });
        await subscriptionApi.subscribe({ planId: plan.id, paymentIntentId: paymentIntent.id });
        toast.success(`Successfully subscribed to ${plan.name} plan!`);
        onSuccess();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to activate subscription');
      }
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-muted rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <span className="font-medium">{plan.name} Plan</span>
          <span className="text-xl font-bold">PKR {plan.price.toLocaleString()}/month</span>
        </div>
      </div>
      
      <div className="p-4 border rounded-lg">
        <CardElement options={{
          style: {
            base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
            invalid: { color: '#9e2146' }
          }
        }} />
      </div>
      
      <p className="text-xs text-center text-muted-foreground">
        Test card: 4242 4242 4242 4242 | Any future date | Any CVC
      </p>
      
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || loading} className="flex-1">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Pay PKR {plan.price.toLocaleString()}
        </Button>
      </div>
    </form>
  );
};

const Subscription: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [plansRes, currentRes] = await Promise.all([
        subscriptionApi.getPlans(),
        subscriptionApi.getCurrentPlan()
      ]);
      setPlans(plansRes.data.data || []);
      setCurrentSubscription(currentRes.data.data || null);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = (plan: Plan) => {
    if (plan.id === 'free' || plan.id === currentSubscription?.plan) return;
    setSelectedPlan(plan);
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false);
    setSelectedPlan(null);
    fetchData();
  };

  const handleCancel = async () => {
    if (!currentSubscription || currentSubscription.plan === 'free') return;

    try {
      await subscriptionApi.cancel();
      toast.success('Subscription cancelled. You will retain access until the end of your billing period.');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'premium': return <Crown className="w-6 h-6" />;
      case 'basic': return <Star className="w-6 h-6" />;
      default: return <Shield className="w-6 h-6" />;
    }
  };

  const getListingDurationText = (hours: number) => {
    if (hours === -1) return 'Never expires';
    if (hours === 48) return '48 hours';
    if (hours === 720) return '30 days';
    return `${hours} hours`;
  };

  return (
    <Layout>
      <div className="pt-20 min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          {/* Header */}
          <div className="text-center mb-12">
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-foreground mb-4">{t.subscription.title}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that's right for you. Upgrade to unlock more listings and premium features.
            </p>
          </div>

          {/* Current Plan Info */}
          {currentSubscription && (
            <Card className="mb-8 border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {getPlanIcon(currentSubscription.plan)}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Plan</p>
                      <p className="text-xl font-bold text-foreground capitalize">{currentSubscription.plan}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <p className="text-muted-foreground">Listings</p>
                      <p className="font-medium">
                        {currentSubscription.maxListings === -1 ? (
                          <span className="flex items-center gap-1"><Infinity className="w-4 h-4" /> Unlimited</span>
                        ) : (
                          `${currentSubscription.maxListings} max`
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Listing Duration</p>
                      <p className="font-medium flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {getListingDurationText(currentSubscription.listingDuration)}
                      </p>
                    </div>
                    {currentSubscription.endDate && (
                      <div>
                        <p className="text-muted-foreground">Renews</p>
                        <p className="font-medium">{new Date(currentSubscription.endDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plans */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => {
                const isCurrentPlan = currentSubscription?.plan === plan.id;
                const isPremium = plan.id === 'premium';
                
                return (
                  <Card
                    key={plan.id}
                    className={`relative overflow-hidden transition-all ${
                      isPremium ? 'border-primary shadow-xl scale-105' : ''
                    } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
                  >
                    {isPremium && (
                      <div className="absolute top-0 right-0">
                        <Badge className="rounded-none rounded-bl-lg bg-gradient-to-r from-amber-400 to-orange-400 text-white">
                          <Crown className="w-3 h-3 mr-1" /> Best Value
                        </Badge>
                      </div>
                    )}
                    {isCurrentPlan && (
                      <div className="absolute top-0 left-0">
                        <Badge className="rounded-none rounded-br-lg bg-green-500 text-white">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-4 pt-8">
                      <div className="w-14 h-14 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                        {getPlanIcon(plan.id)}
                      </div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>
                        {plan.id === 'free' ? 'Basic access with limitations' : 
                         plan.id === 'basic' ? 'Great for casual renters' : 
                         'Full access with premium benefits'}
                      </CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-foreground">
                          PKR {plan.price.toLocaleString()}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-muted-foreground">/month</span>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {/* Key Stats */}
                      <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">
                            {plan.maxListings === -1 ? '∞' : plan.maxListings}
                          </p>
                          <p className="text-xs text-muted-foreground">Listings</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">
                            {plan.listingDuration === -1 ? '∞' : plan.listingDuration === 48 ? '48h' : '30d'}
                          </p>
                          <p className="text-xs text-muted-foreground">Duration</p>
                        </div>
                      </div>

                      {/* Benefits */}
                      <ul className="space-y-3">
                        {plan.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-center gap-3">
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-foreground">{benefit}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Limitations */}
                      {plan.limitations.length > 0 && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                          <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2 text-sm">
                            <Ban className="w-4 h-4" />
                            Limitations
                          </h4>
                          <ul className="space-y-1">
                            {plan.limitations.map((limitation, idx) => (
                              <li key={idx} className="text-xs text-red-600/80 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-red-400" />
                                {limitation}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <Button
                        onClick={() => handleSubscribe(plan)}
                        className="w-full"
                        size="lg"
                        variant={isPremium ? 'default' : 'outline'}
                        disabled={isCurrentPlan || plan.id === 'free'}
                      >
                        {isCurrentPlan ? (
                          'Current Plan'
                        ) : plan.id === 'free' ? (
                          'Free Plan'
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Upgrade Now
                          </>
                        )}
                      </Button>

                      {isCurrentPlan && plan.id !== 'free' && (
                        <Button
                          onClick={handleCancel}
                          variant="ghost"
                          className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          Cancel Subscription
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Benefits Section */}
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">Why Upgrade?</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { icon: Eye, title: 'More Visibility', desc: 'Your listings appear higher in search results' },
                { icon: Clock, title: 'Longer Duration', desc: 'Keep your listings active for longer' },
                { icon: TrendingUp, title: 'Analytics', desc: 'Track views and performance metrics' },
                { icon: Shield, title: 'Priority Support', desc: 'Get help faster when you need it' },
              ].map((benefit) => (
                <Card key={benefit.title} className="text-center p-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subscribe to {selectedPlan?.name}</DialogTitle>
            <DialogDescription>
              Enter your payment details to activate your subscription
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <Elements stripe={stripePromise}>
              <PaymentForm 
                plan={selectedPlan} 
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowPaymentDialog(false)}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Subscription;
