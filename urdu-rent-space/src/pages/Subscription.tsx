import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Check,
  X,
  Crown,
  Zap,
  Shield,
  Eye,
  Ban,
  TrendingUp,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  name_ur: string;
  price: number;
  features: string[];
  listingLimit: number;
}

interface CurrentSubscription {
  plan: string;
  expiresAt: string | null;
  features: string[];
}

const Subscription: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);
  const [currency, setCurrency] = useState<'pkr' | 'usd'>('pkr');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscribingPlan, setSubscribingPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/subscriptions/plans');
      const data = await response.json();
      if (data.success) {
        setPlans(data.data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load subscription plans');
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/subscriptions/current', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setCurrentSubscription(data.data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free' || planId === currentSubscription?.plan) return;
    
    setSubscribingPlan(planId);
    
    try {
      const response = await fetch('http://localhost:5000/api/v1/subscriptions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Subscription activated successfully!');
        setCurrentSubscription({
          plan: planId,
          expiresAt: data.data.expiresAt,
          features: plans.find(p => p.id === planId)?.features || [],
        });
      } else {
        throw new Error(data.message || 'Failed to subscribe');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to subscribe. Please try again.');
    } finally {
      setSubscribingPlan(null);
    }
  };

  const handleCancel = async () => {
    if (!currentSubscription || currentSubscription.plan === 'free') return;

    try {
      const response = await fetch('http://localhost:5000/api/v1/subscriptions/cancel', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Subscription cancelled');
        setCurrentSubscription({
          plan: 'free',
          expiresAt: null,
          features: plans.find(p => p.id === 'free')?.features || [],
        });
      } else {
        throw new Error(data.message || 'Failed to cancel subscription');
      }
    } catch (error: any) {
      console.error('Cancel error:', error);
      toast.error(error.message || 'Failed to cancel subscription');
    }
  };

  // Convert backend plans to display format
  const displayPlans = plans.map(plan => {
    const isCurrentPlan = currentSubscription?.plan === plan.id;
    const monthlyPrice = plan.price;
    const annualPrice = Math.round(plan.price * 10);
    
    return {
      id: plan.id,
      name: plan.name,
      price: { 
        pkr: isAnnual ? annualPrice : monthlyPrice, 
        usd: isAnnual ? Math.round(annualPrice / 280) : Math.round(monthlyPrice / 280) 
      },
      description: plan.id === 'free' ? 'Basic access with limitations' : 
                   plan.id === 'basic' ? 'Great for casual renters' : 
                   'Full access with premium benefits',
      features: plan.features.map(f => ({ text: f, included: true })),
      limitations: plan.id === 'free' ? [
        'Limited to 5 listings',
        'Standard visibility only',
        'Basic support'
      ] : [],
      popular: plan.id === 'premium',
      isCurrentPlan,
      cta: isCurrentPlan ? 'Current Plan' : plan.id === 'free' ? 'Downgrade' : t.subscription.subscribe,
    };
  });


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
              Choose the plan that's right for you. Upgrade to Premium to unlock all features and maximize your rental success.
            </p>
          </div>

          {/* Toggles */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            <div className="flex items-center gap-3">
              <span className={`text-sm ${!isAnnual ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>Monthly</span>
              <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
              <span className={`text-sm ${isAnnual ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                Annual <Badge variant="secondary" className="ml-1">Save 17%</Badge>
              </span>
            </div>
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <button
                onClick={() => setCurrency('pkr')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  currency === 'pkr' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                🇵🇰 PKR
              </button>
              <button
                onClick={() => setCurrency('usd')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  currency === 'usd' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                🌍 USD
              </button>
            </div>
          </div>

          {/* Plans */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {displayPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden transition-all ${
                    plan.popular ? 'border-primary shadow-xl scale-105' : ''
                  } ${plan.isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0">
                      <Badge className="rounded-none rounded-bl-lg bg-gradient-to-r from-amber-400 to-orange-400 text-white">
                        <Crown className="w-3 h-3 mr-1" /> Most Popular
                      </Badge>
                    </div>
                  )}
                  {plan.isCurrentPlan && (
                    <div className="absolute top-0 left-0">
                      <Badge className="rounded-none rounded-br-lg bg-green-500 text-white">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-foreground">
                        {currency === 'pkr' ? 'PKR ' : '$'}
                        {plan.price[currency].toLocaleString()}
                      </span>
                      {plan.price[currency] > 0 && (
                        <span className="text-muted-foreground">/{isAnnual ? 'year' : 'month'}</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-foreground">{feature.text}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.limitations.length > 0 && (
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                        <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                          <Ban className="w-4 h-4" />
                          Limitations
                        </h4>
                        <ul className="space-y-1">
                          {plan.limitations.map((limitation, idx) => (
                            <li key={idx} className="text-sm text-red-600/80 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                              {limitation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      className="w-full"
                      size="lg"
                      variant={plan.popular ? 'default' : 'outline'}
                      disabled={plan.isCurrentPlan || subscribingPlan === plan.id}
                    >
                      {subscribingPlan === plan.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {plan.id === 'premium' && !plan.isCurrentPlan && <Zap className="w-4 h-4 mr-2" />}
                          {plan.cta}
                        </>
                      )}
                    </Button>

                    {plan.isCurrentPlan && plan.id !== 'free' && (
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
              ))}
            </div>
          )}


          {/* Benefits Section */}
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">Premium Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { icon: Shield, title: 'Verified Badge', desc: 'Build trust with a verified customer badge' },
                { icon: Eye, title: 'More Visibility', desc: 'Your listings appear higher in search' },
                { icon: Ban, title: 'No Ads', desc: 'Enjoy an ad-free browsing experience' },
                { icon: TrendingUp, title: 'Analytics', desc: 'Track views and performance metrics' },
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

          {/* FAQ */}
          <div className="mt-20 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your subscription at any time. Your premium benefits will remain active until the end of your billing period.' },
                { q: 'What payment methods are accepted?', a: 'We accept JazzCash, Easypaisa, and all major credit/debit cards (Visa, Mastercard).' },
                { q: 'Is there a refund policy?', a: "We offer a 7-day money-back guarantee if you're not satisfied with Premium." },
              ].map((faq, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4">
                    <h4 className="font-medium text-foreground">{faq.q}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Subscription;
