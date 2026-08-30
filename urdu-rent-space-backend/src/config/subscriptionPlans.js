// Single source of truth for subscription tiers — referenced by
// subscriptionRoutes (pricing/limits) and bookingRoutes (commission rate).
// See docs/redesign/01-business-model.md and 02-subscription-tiers.md.
const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    nameUrdu: 'مفت',
    price: 0,
    currency: 'PKR',
    maxListings: 3,
    listingDuration: 720, // 30 days, in hours
    commissionRate: 0.10,
    featuredCredits: 0,
    features: {
      prioritySupport: false,
      enhancedVisibility: false,
      analytics: false,
      featuredBadge: false,
      topVisibility: false,
      storefront: false,
      teamAccounts: false
    },
    benefits: [
      '3 listings',
      'Listings active for 30 days',
      '10% commission on bookings',
      'Community support'
    ],
    limitations: [
      'Limited to 3 listings',
      'Standard visibility only',
      'No featured-listing credits'
    ]
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    nameUrdu: 'پلس',
    price: 799,
    currency: 'PKR',
    period: 'month',
    maxListings: 15,
    listingDuration: 1440, // 60 days
    commissionRate: 0.08,
    featuredCredits: 2,
    features: {
      prioritySupport: true,
      enhancedVisibility: false,
      analytics: true,
      featuredBadge: false,
      topVisibility: false,
      storefront: false,
      teamAccounts: false
    },
    benefits: [
      '15 listings',
      'Listings active for 60 days, one-click renew',
      '8% commission on bookings',
      '2 featured-listing credits/month',
      'Basic analytics (views, inquiries, conversion)',
      'Priority email support'
    ],
    limitations: []
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    nameUrdu: 'پرو',
    price: 2499,
    currency: 'PKR',
    period: 'month',
    maxListings: -1, // unlimited
    listingDuration: -1, // auto-renew, never expires
    commissionRate: 0.05,
    featuredCredits: 10,
    features: {
      prioritySupport: true,
      enhancedVisibility: true,
      analytics: true,
      featuredBadge: true,
      topVisibility: false,
      storefront: true,
      teamAccounts: false
    },
    benefits: [
      'Unlimited listings, auto-renew',
      '5% commission on bookings',
      '10 featured-listing credits/month + homepage rotation',
      'Advanced analytics (funnel, revenue trend, benchmarking)',
      'Faster payouts (T+1 business day)',
      'Storefront/brand page',
      'Priority phone/WhatsApp support'
    ],
    limitations: []
  },
  business: {
    id: 'business',
    name: 'Business',
    nameUrdu: 'بزنس',
    price: 9999,
    currency: 'PKR',
    period: 'month',
    maxListings: -1,
    listingDuration: -1,
    commissionRate: 0.03,
    featuredCredits: 30,
    features: {
      prioritySupport: true,
      enhancedVisibility: true,
      analytics: true,
      featuredBadge: true,
      topVisibility: true,
      storefront: true,
      teamAccounts: true
    },
    benefits: [
      'Everything in Pro',
      'Multi-user team accounts',
      'Bulk listing upload (CSV)',
      '3% commission, negotiable lower at high volume',
      'Dedicated account manager',
      'White-label booking widget (phase 2)'
    ],
    limitations: [],
    custom: true
  }
};

// A la carte featured-listing boost, for owners without (or out of) monthly
// credits — see "Boosts / featured listings" in docs/redesign/01-business-model.md.
const FEATURED_BOOST = {
  days: 3,
  price: 199,
  currency: 'PKR'
};

const DEFAULT_PLAN_ID = 'free';

const getPlan = (planId) => SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS[DEFAULT_PLAN_ID];

const getCommissionRate = (planId) => getPlan(planId).commissionRate;

module.exports = { SUBSCRIPTION_PLANS, DEFAULT_PLAN_ID, FEATURED_BOOST, getPlan, getCommissionRate };
