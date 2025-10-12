import React, { useState } from 'react';
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
  Star,
  Eye,
  Ban,
  MessageCircle,
  TrendingUp,
} from 'lucide-react';

const Subscription: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);
  const [currency, setCurrency] = useState<'pkr' | 'usd'>('pkr');

  const plans = [
    {
      id: 'free',
      name: t.subscription.free,
      price: { pkr: 0, usd: 0 },
      description: 'Basic access with limitations',
      features: [
        { text: 'Listings visible for 48 hours', included: true },
        { text: 'Unverified badge on profile', included: true },
        { text: 'Ads displayed on listings', included: true },
        { text: 'Basic support', included: true },
        { text: 'No reviews shown', included: false },
        { text: 'Limited messages', included: true },
        { text: 'Standard search visibility', included: true },
      ],
      limitations: [
        'Ads shown after every 2 minutes',
        'Random ads on web pages',
        'Ads shown on last page',
        'No reviews displayed',
      ],
      popular: false,
      cta: 'Current Plan',
    },
    {
      id: 'premium',
      name: t.subscription.premium,
      price: { pkr: isAnnual ? 5000 : 500, usd: isAnnual ? 79.99 : 7.99 },
      description: 'Full access with premium benefits',
      features: [
        { text: 'Listings visible for 30 days', included: true },
        { text: 'Verified customer badge', included: true },
        { text: 'No ads displayed', included: true },
        { text: 'Priority support', included: true },
        { text: 'All reviews shown', included: true },
        { text: 'Unlimited messages', included: true },
        { text: 'Priority search visibility', included: true },
        { text: 'Featured in recommendations', included: true },
        { text: 'Analytics dashboard', included: true },
      ],
      limitations: [],
      popular: true,
      cta: t.subscription.subscribe,
    },
  ];

  const handleSubscribe = (planId: string) => {
    if (planId === 'free') return;
    toast.success('Redirecting to payment...');
    navigate('/payment');
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all ${
                  plan.popular ? 'border-primary shadow-xl scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-gradient-to-r from-amber-400 to-orange-400 text-white">
                      <Crown className="w-3 h-3 mr-1" /> Most Popular
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
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                        )}
                        <span className={feature.included ? 'text-foreground' : 'text-muted-foreground line-through'}>
                          {feature.text}
                        </span>
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
                    disabled={plan.id === 'free'}
                  >
                    {plan.id === 'premium' && <Zap className="w-4 h-4 mr-2" />}
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

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
                { q: 'Is there a refund policy?', a: 'We offer a 7-day money-back guarantee if you\'re not satisfied with Premium.' },
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
