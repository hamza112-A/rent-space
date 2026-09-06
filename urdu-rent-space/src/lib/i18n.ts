export type Language = 'en' | 'ur';

// Define a more flexible type for translations
interface NavTranslations {
  home: string;
  categories: string;
  listings: string;
  dashboard: string;
  login: string;
  register: string;
  logout: string;
  createListing: string;
  search: string;
  language: string;
}

interface HeroTranslations {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  locationPlaceholder: string;
  searchButton: string;
  popularSearches: string;
  apartments: string;
  cars: string;
  weddingDresses: string;
  cameras: string;
  featuredListings: string;
  featuredSubtitle: string;
  whyChoose: string;
  whyChooseSubtitle: string;
  verifiedUsers: string;
  verifiedUsersDesc: string;
  qualityAssured: string;
  qualityAssuredDesc: string;
  instantBooking: string;
  instantBookingDesc: string;
  // How It Works
  howItWorks: string;
  howItWorksSubtitle: string;
  stepSearch: string;
  stepSearchDesc: string;
  stepBook: string;
  stepBookDesc: string;
  stepEnjoy: string;
  stepEnjoyDesc: string;
  // CTA
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButton: string;
  ctaSecondary: string;
}

interface CategoriesTranslations {
  title: string;
  subtitle: string;
  property: string;
  vehicles: string;
  clothes: string;
  equipment: string;
  services: string;
  animals: string;
  boats: string;
  air: string;
  viewAll: string;
  listings: string;
}

interface SubcategoriesTranslations {
  apartments: string;
  houses: string;
  commercial: string;
  events: string;
  farmhouses: string;
  rooms: string;
  cars: string;
  motorcycles: string;
  bicycles: string;
  trucks: string;
  rickshaws: string;
  trailers: string;
  wedding: string;
  designer: string;
  seasonal: string;
  costumes: string;
  accessories: string;
  maternity: string;
  farming: string;
  electronics: string;
  medical: string;
  kitchen: string;
  sports: string;
  gaming: string;
  skilled: string;
  technical: string;
  eventStaff: string;
  agricultural: string;
  domestic: string;
  drivers: string;
  medicalServices: string;
  pilotServices: string;
  pets: string;
  working: string;
  veterinary: string;
  fishing: string;
  ferries: string;
  recreational: string;
  yachts: string;
  cargo: string;
  safety: string;
  charter: string;
  helicopter: string;
  ambulance: string;
  cargoAir: string;
}

interface ListingTranslations {
  perHour: string;
  perDay: string;
  perWeek: string;
  perMonth: string;
  verified: string;
  featured: string;
  available: string;
  unavailable: string;
  viewDetails: string;
  bookNow: string;
  sendRequest: string;
  instantBook: string;
  addToFavorites: string;
  share: string;
  report: string;
  reviews: string;
  rating: string;
  location: string;
  postedBy: string;
  memberSince: string;
  responseRate: string;
  responseTime: string;
  similarItems: string;
  description: string;
  features: string;
  specifications: string;
  availability: string;
  pricing: string;
  policies: string;
  cancellation: string;
  deposit: string;
  // Featured listing titles
  luxuryApartmentDHA: string;
  toyotaCorolla2023: string;
  weddingSherwaniSet: string;
  professionalCameraKit: string;
  // Locations
  karachi: string;
  lahore: string;
  islamabad: string;
}

interface BookingTranslations {
  title: string;
  selectDates: string;
  startDate: string;
  endDate: string;
  duration: string;
  totalPrice: string;
  serviceFee: string;
  grandTotal: string;
  confirmBooking: string;
  pending: string;
  approved: string;
  rejected: string;
  cancelled: string;
  completed: string;
  history: string;
  myBookings: string;
  receivedBookings: string;
}

interface AuthTranslations {
  login: string;
  register: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  forgotPassword: string;
  rememberMe: string;
  orContinueWith: string;
  noAccount: string;
  haveAccount: string;
  signUp: string;
  signIn: string;
  verifyOTP: string;
  enterOTP: string;
  resendOTP: string;
  selectRole: string;
  owner: string;
  borrower: string;
  both: string;
  terms: string;
}

interface DashboardTranslations {
  title: string;
  welcome: string;
  myListings: string;
  myBookings: string;
  favorites: string;
  messages: string;
  earnings: string;
  analytics: string;
  settings: string;
  profile: string;
  verification: string;
  totalEarnings: string;
  thisMonth: string;
  pendingPayouts: string;
  activeListings: string;
  totalBookings: string;
  averageRating: string;
  overview: string;
  disputes: string;
  ownerMode: string;
  buyerMode: string;
  accountType: string;
  accountTypeDesc: string;
  ownerRoleTitle: string;
  ownerRoleDesc: string;
  buyerRoleTitle: string;
  buyerRoleDesc: string;
  roleActive: string;
  defaultDashboard: string;
  ownerDashboardOption: string;
  buyerDashboardOption: string;
  becomeOwnerTitle: string;
  becomeOwnerDesc: string;
  goToSettings: string;
  backToDashboard: string;
  bookingsAsBuyer: string;
  awaitingDecision: string;
  onboardingOwnerTitle: string;
  onboardingBuyerTitle: string;
  onboardingOwnerDesc: string;
  onboardingBuyerDesc: string;
  onboardingOwnerTip1: string;
  onboardingOwnerTip2: string;
  onboardingBuyerTip1: string;
  skipForNow: string;
  goToVerification: string;
  gotIt: string;
}

interface VerificationTranslations {
  title: string;
  subtitle: string;
  email: string;
  phone: string;
  id: string;
  biometric: string;
  pending: string;
  notVerified: string;
  verify: string;
  uploadID: string;
  verifyFace: string;
}

interface PaymentTranslations {
  title: string;
  selectMethod: string;
  jazzCash: string;
  easypaisa: string;
  card: string;
  bankTransfer: string;
  processing: string;
  success: string;
  failed: string;
  retry: string;
}

interface SubscriptionTranslations {
  title: string;
  free: string;
  premium: string;
  freeFeatures: string;
  premiumFeatures: string;
  localPrice: string;
  intlPrice: string;
  subscribe: string;
  currentPlan: string;
}

interface CommonTranslations {
  loading: string;
  error: string;
  retry: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  close: string;
  back: string;
  next: string;
  submit: string;
  confirm: string;
  yes: string;
  no: string;
  all: string;
  none: string;
  from: string;
  to: string;
  pkr: string;
  noResults: string;
  seeMore: string;
  seeLess: string;
  add: string;
}

interface FiltersTranslations {
  title: string;
  priceRange: string;
  minPrice: string;
  maxPrice: string;
  location: string;
  radius: string;
  availability: string;
  rating: string;
  verified: string;
  instantBook: string;
  sortBy: string;
  relevance: string;
  priceLowHigh: string;
  priceHighLow: string;
  newest: string;
  topRated: string;
  apply: string;
  reset: string;
}

interface FooterTranslations {
  about: string;
  howItWorks: string;
  safety: string;
  help: string;
  terms: string;
  privacy: string;
  contact: string;
  careers: string;
  press: string;
  copyright: string;
  tagline: string;
}

interface AdminTranslations {
  title: string;
  dashboard: string;
  users: string;
  listings: string;
  verifications: string;
  bookings: string;
  categories: string;
  totalUsers: string;
  newUsers: string;
  totalListings: string;
  activeListings: string;
  totalBookings: string;
  pendingBookings: string;
  totalRevenue: string;
  pendingVerifications: string;
  userManagement: string;
  listingManagement: string;
  recentUsers: string;
  recentBookings: string;
}

export interface TranslationType {
  nav: NavTranslations;
  hero: HeroTranslations;
  categories: CategoriesTranslations;
  subcategories: SubcategoriesTranslations;
  listing: ListingTranslations;
  booking: BookingTranslations;
  auth: AuthTranslations;
  dashboard: DashboardTranslations;
  verification: VerificationTranslations;
  payment: PaymentTranslations;
  subscription: SubscriptionTranslations;
  common: CommonTranslations;
  filters: FiltersTranslations;
  footer: FooterTranslations;
  admin: AdminTranslations;
}

export const translations: Record<Language, TranslationType> = {
  en: {
    // Navigation
    nav: {
      home: 'Home',
      categories: 'Categories',
      listings: 'Browse Listings',
      dashboard: 'Dashboard',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      createListing: 'Create Listing',
      search: 'Search rentals...',
      language: 'Language',
    },
    // Hero
    hero: {
      title: 'Rent Anything, Anywhere in Pakistan',
      subtitle: 'From properties to vehicles, equipment to services — find trusted rentals across all categories',
      searchPlaceholder: 'What are you looking for?',
      locationPlaceholder: 'Location',
      searchButton: 'Search',
      popularSearches: 'Popular:',
      apartments: 'Apartments',
      cars: 'Cars',
      weddingDresses: 'Wedding Dresses',
      cameras: 'Cameras',
      featuredListings: 'Featured Listings',
      featuredSubtitle: 'Top-rated rentals from verified owners',
      whyChoose: 'Why Choose MyRental?',
      whyChooseSubtitle: 'Trusted by thousands across Pakistan',
      verifiedUsers: 'Verified Users',
      verifiedUsersDesc: 'All users undergo ID, email & phone verification',
      qualityAssured: 'Quality Assured',
      qualityAssuredDesc: 'Ratings & reviews from real renters',
      instantBooking: 'Instant Booking',
      instantBookingDesc: 'Book instantly or send requests — your choice',
      // How It Works
      howItWorks: 'How It Works',
      howItWorksSubtitle: 'Renting made simple in 3 easy steps',
      stepSearch: 'Search',
      stepSearchDesc: 'Browse thousands of listings across categories. Filter by location, price, and availability.',
      stepBook: 'Book',
      stepBookDesc: 'Choose your dates and book instantly or send a request to the owner.',
      stepEnjoy: 'Enjoy',
      stepEnjoyDesc: 'Pick up your rental and enjoy! Leave a review after your experience.',
      // CTA
      ctaTitle: 'Ready to Start Earning?',
      ctaSubtitle: 'List your items and start earning today. Join thousands of owners already making money on MyRental.',
      ctaButton: 'Create Your Listing',
      ctaSecondary: 'Learn More',
    },
    // Categories
    categories: {
      title: 'Browse by Category',
      subtitle: 'Discover rentals across diverse categories',
      property: 'Property',
      vehicles: 'Vehicles',
      clothes: 'Clothes',
      equipment: 'Equipment',
      services: 'Service Providers',
      animals: 'Animals',
      boats: 'Boats',
      air: 'Air Transport',
      viewAll: 'View All',
      listings: 'listings',
    },
    // Subcategories
    subcategories: {
      apartments: 'Apartments',
      houses: 'Houses & Villas',
      commercial: 'Commercial Spaces',
      events: 'Event Spaces',
      farmhouses: 'Farmhouses & Vacation',
      rooms: 'Rooms & Hostels',
      cars: 'Cars',
      motorcycles: 'Motorcycles & Scooters',
      bicycles: 'Bicycles',
      trucks: 'Trucks & Loaders',
      rickshaws: 'Rickshaws & Qingqi',
      trailers: 'Trailers & Heavy Machinery',
      wedding: 'Wedding & Formal Wear',
      designer: 'Designer Outfits',
      seasonal: 'Seasonal Clothing',
      costumes: 'Costumes & Theme Wear',
      accessories: 'Accessories',
      maternity: 'Maternity & Kids',
      farming: 'Farming Equipment',
      electronics: 'Electronics',
      medical: 'Medical Equipment',
      kitchen: 'Kitchen & Catering',
      sports: 'Sports & Fitness',
      gaming: 'Gaming Items',
      skilled: 'Skilled Workers',
      technical: 'Technical Staff',
      eventStaff: 'Event Staff',
      agricultural: 'Agricultural Labor',
      domestic: 'Domestic Help',
      drivers: 'Drivers',
      medicalServices: 'Medical Services',
      pilotServices: 'Pilot Services',
      pets: 'Pets',
      working: 'Working Animals',
      veterinary: 'Veterinary Services',
      fishing: 'Fishing Boats',
      ferries: 'Passenger Ferries',
      recreational: 'Recreational Boats',
      yachts: 'Yachts & Speedboats',
      cargo: 'Cargo Vessels',
      safety: 'Safety Equipment',
      charter: 'Charter Planes',
      helicopter: 'Helicopter Services',
      ambulance: 'Air Ambulance',
      cargoAir: 'Cargo Aircraft',
    },
    // Listings
    listing: {
      perHour: '/hour',
      perDay: '/day',
      perWeek: '/week',
      perMonth: '/month',
      verified: 'Verified',
      featured: 'Featured',
      available: 'Available',
      unavailable: 'Unavailable',
      viewDetails: 'View Details',
      bookNow: 'Book Now',
      sendRequest: 'Send Request',
      instantBook: 'Instant Booking',
      addToFavorites: 'Add to Favorites',
      share: 'Share',
      report: 'Report',
      reviews: 'reviews',
      rating: 'Rating',
      location: 'Location',
      postedBy: 'Posted by',
      memberSince: 'Member since',
      responseRate: 'Response rate',
      responseTime: 'Response time',
      similarItems: 'Similar Items',
      description: 'Description',
      features: 'Features',
      specifications: 'Specifications',
      availability: 'Availability',
      pricing: 'Pricing',
      policies: 'Policies',
      cancellation: 'Cancellation Policy',
      deposit: 'Security Deposit',
      // Featured listing titles
      luxuryApartmentDHA: 'Luxury Apartment in DHA',
      toyotaCorolla2023: 'Toyota Corolla 2023',
      weddingSherwaniSet: 'Wedding Sherwani Set',
      professionalCameraKit: 'Professional Camera Kit',
      // Locations
      karachi: 'Karachi',
      lahore: 'Lahore',
      islamabad: 'Islamabad',
    },
    // Booking
    booking: {
      title: 'Book This Rental',
      selectDates: 'Select Dates',
      startDate: 'Start Date',
      endDate: 'End Date',
      duration: 'Duration',
      totalPrice: 'Total Price',
      serviceFee: 'Service Fee',
      grandTotal: 'Grand Total',
      confirmBooking: 'Confirm Booking',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
      completed: 'Completed',
      history: 'Booking History',
      myBookings: 'My Bookings',
      receivedBookings: 'Received Bookings',
    },
    // Auth
    auth: {
      login: 'Login',
      register: 'Register',
      email: 'Email Address',
      phone: 'Phone Number',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      fullName: 'Full Name',
      forgotPassword: 'Forgot Password?',
      rememberMe: 'Remember me',
      orContinueWith: 'Or continue with',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
      signUp: 'Sign Up',
      signIn: 'Sign In',
      verifyOTP: 'Verify OTP',
      enterOTP: 'Enter the 6-digit code sent to',
      resendOTP: 'Resend OTP',
      selectRole: 'Select Your Role',
      owner: 'I want to rent out items',
      borrower: 'I want to rent items',
      both: 'Both - Rent & Rent Out',
      terms: 'I agree to the Terms of Service and Privacy Policy',
    },
    // Dashboard
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome back',
      myListings: 'My Listings',
      myBookings: 'My Bookings',
      favorites: 'Favorites',
      messages: 'Messages',
      earnings: 'Earnings',
      analytics: 'Analytics',
      settings: 'Settings',
      profile: 'Profile',
      verification: 'Verification',
      totalEarnings: 'Total Earnings',
      thisMonth: 'This Month',
      pendingPayouts: 'Pending Payouts',
      activeListings: 'Active Listings',
      totalBookings: 'Total Bookings',
      averageRating: 'Average Rating',
      overview: 'Overview',
      disputes: 'Disputes',
      ownerMode: 'Owner mode',
      buyerMode: 'Buyer mode',
      accountType: 'Account Type',
      accountTypeDesc: 'Owner and Buyer are separate capabilities on your account — add either one anytime',
      ownerRoleTitle: 'Owner',
      ownerRoleDesc: 'List items for rent',
      buyerRoleTitle: 'Buyer',
      buyerRoleDesc: 'Book items from other owners',
      roleActive: 'Active',
      defaultDashboard: 'Default dashboard on login',
      ownerDashboardOption: 'Owner dashboard',
      buyerDashboardOption: 'Buyer dashboard',
      becomeOwnerTitle: 'Become an Owner to list items',
      becomeOwnerDesc: 'Your account is currently set up as a Buyer only. Add the Owner capability from Settings to start listing items for rent.',
      goToSettings: 'Go to Settings',
      backToDashboard: 'Back to Dashboard',
      bookingsAsBuyer: 'Your bookings as a buyer',
      awaitingDecision: 'awaiting your decision',
      onboardingOwnerTitle: "You're now an Owner",
      onboardingBuyerTitle: "You're now a Buyer",
      onboardingOwnerDesc: 'You can list items for rent. A couple of things to set up before your first listing:',
      onboardingBuyerDesc: 'You can now book items from other owners. A couple of quick tips:',
      onboardingOwnerTip1: 'Add a payout method in Settings so you can get paid for completed bookings.',
      onboardingOwnerTip2: "Verified owners get more bookings — finish identity verification when you can.",
      onboardingBuyerTip1: "You'll get notified here about your booking requests and messages from owners.",
      skipForNow: 'Skip for now',
      goToVerification: 'Go to Verification',
      gotIt: 'Got it',
    },
    // Verification
    verification: {
      title: 'Verify Your Account',
      subtitle: 'Complete verification to build trust with renters',
      email: 'Email Verified',
      phone: 'Phone Verified',
      id: 'ID Verified',
      biometric: 'Biometric Verified',
      pending: 'Pending',
      notVerified: 'Not Verified',
      verify: 'Verify Now',
      uploadID: 'Upload ID Document',
      verifyFace: 'Verify Face',
    },
    // Payment
    payment: {
      title: 'Payment',
      selectMethod: 'Select Payment Method',
      jazzCash: 'JazzCash',
      easypaisa: 'Easypaisa',
      card: 'Credit/Debit Card',
      bankTransfer: 'Bank Transfer',
      processing: 'Processing...',
      success: 'Payment Successful',
      failed: 'Payment Failed',
      retry: 'Retry Payment',
    },
    // Subscription
    subscription: {
      title: 'Upgrade Your Account',
      free: 'Free',
      premium: 'Premium',
      freeFeatures: 'Ads visible on listings',
      premiumFeatures: 'No ads, Verified badge, Priority support',
      localPrice: 'PKR 500/month',
      intlPrice: '$7.99/month',
      subscribe: 'Subscribe Now',
      currentPlan: 'Current Plan',
    },
    // Common
    common: {
      loading: 'Loading...',
      error: 'Something went wrong',
      retry: 'Try Again',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      submit: 'Submit',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      all: 'All',
      none: 'None',
      from: 'From',
      to: 'To',
      pkr: 'PKR',
      noResults: 'No results found',
      seeMore: 'See More',
      seeLess: 'See Less',
      add: 'Add',
    },
    // Filters
    filters: {
      title: 'Filters',
      priceRange: 'Price Range',
      minPrice: 'Min Price',
      maxPrice: 'Max Price',
      location: 'Location',
      radius: 'Search Radius',
      availability: 'Availability',
      rating: 'Minimum Rating',
      verified: 'Verified Only',
      instantBook: 'Instant Booking',
      sortBy: 'Sort By',
      relevance: 'Relevance',
      priceLowHigh: 'Price: Low to High',
      priceHighLow: 'Price: High to Low',
      newest: 'Newest First',
      topRated: 'Top Rated',
      apply: 'Apply Filters',
      reset: 'Reset',
    },
    // Footer
    footer: {
      about: 'About Us',
      howItWorks: 'How It Works',
      safety: 'Safety Center',
      help: 'Help Center',
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      contact: 'Contact Us',
      careers: 'Careers',
      press: 'Press',
      copyright: '© 2025 My Rental Marketplace. All rights reserved.',
      tagline: 'Rent anything, anywhere in Pakistan',
    },
    // Admin
    admin: {
      title: 'Super Admin',
      dashboard: 'Admin Dashboard',
      users: 'User Management',
      listings: 'Listing Management',
      verifications: 'Verifications',
      bookings: 'All Bookings',
      categories: 'Categories',
      totalUsers: 'Total Users',
      newUsers: 'New Users',
      totalListings: 'Total Listings',
      activeListings: 'Active Listings',
      totalBookings: 'Total Bookings',
      pendingBookings: 'Pending Bookings',
      totalRevenue: 'Total Revenue',
      pendingVerifications: 'Pending Verifications',
      userManagement: 'User Management',
      listingManagement: 'Listing Management',
      recentUsers: 'Recent Users',
      recentBookings: 'Recent Bookings',
    },
  },
  ur: {
    // Navigation
    nav: {
      home: 'ہوم',
      categories: 'زمرہ جات',
      listings: 'اشتہارات دیکھیں',
      dashboard: 'ڈیش بورڈ',
      login: 'لاگ ان',
      register: 'رجسٹر',
      logout: 'لاگ آؤٹ',
      createListing: 'اشتہار بنائیں',
      search: 'کرایے تلاش کریں...',
      language: 'زبان',
    },
    // Hero
    hero: {
      title: 'پاکستان میں کچھ بھی، کہیں بھی کرایے پر لیں',
      subtitle: 'جائیداد سے گاڑیوں تک، سامان سے خدمات تک - تمام زمروں میں قابل اعتماد کرایہ تلاش کریں',
      searchPlaceholder: 'آپ کیا تلاش کر رہے ہیں؟',
      locationPlaceholder: 'مقام',
      searchButton: 'تلاش کریں',
      popularSearches: 'مقبول:',
      apartments: 'اپارٹمنٹس',
      cars: 'گاڑیاں',
      weddingDresses: 'شادی کے لباس',
      cameras: 'کیمرے',
      featuredListings: 'نمایاں اشتہارات',
      featuredSubtitle: 'تصدیق شدہ مالکان سے اعلی درجہ کے کرایے',
      whyChoose: 'مائی رینٹل کیوں چنیں؟',
      whyChooseSubtitle: 'پاکستان بھر میں ہزاروں کا اعتماد',
      verifiedUsers: 'تصدیق شدہ صارفین',
      verifiedUsersDesc: 'تمام صارفین شناخت، ای میل اور فون کی تصدیق سے گزرتے ہیں',
      qualityAssured: 'معیار کی ضمانت',
      qualityAssuredDesc: 'حقیقی کرایہ داروں کی ریٹنگز اور جائزے',
      instantBooking: 'فوری بکنگ',
      instantBookingDesc: 'فوری بک کریں یا درخواست بھیجیں - آپ کی مرضی',
      // How It Works
      howItWorks: 'یہ کیسے کام کرتا ہے',
      howItWorksSubtitle: '3 آسان مراحل میں کرایہ آسان بنایا گیا',
      stepSearch: 'تلاش کریں',
      stepSearchDesc: 'ہزاروں اشتہارات براؤز کریں۔ مقام، قیمت اور دستیابی کے مطابق فلٹر کریں۔',
      stepBook: 'بک کریں',
      stepBookDesc: 'اپنی تاریخیں منتخب کریں اور فوری بک کریں یا مالک کو درخواست بھیجیں۔',
      stepEnjoy: 'لطف اٹھائیں',
      stepEnjoyDesc: 'اپنا کرایہ اٹھائیں اور لطف اٹھائیں! تجربے کے بعد جائزہ چھوڑیں۔',
      // CTA
      ctaTitle: 'کمانا شروع کرنے کے لیے تیار ہیں؟',
      ctaSubtitle: 'اپنی چیزیں لسٹ کریں اور آج ہی کمانا شروع کریں۔ ہزاروں مالکان میں شامل ہوں جو پہلے سے مائی رینٹل پر کما رہے ہیں۔',
      ctaButton: 'اپنا اشتہار بنائیں',
      ctaSecondary: 'مزید جانیں',
    },
    // Categories
    categories: {
      title: 'زمرے کے مطابق براؤز کریں',
      subtitle: 'متنوع زمروں میں کرایے دریافت کریں',
      property: 'جائیداد',
      vehicles: 'گاڑیاں',
      clothes: 'کپڑے',
      equipment: 'آلات',
      services: 'خدمت فراہم کنندگان',
      animals: 'جانور',
      boats: 'کشتیاں',
      air: 'ہوائی نقل و حمل',
      viewAll: 'سب دیکھیں',
      listings: 'اشتہارات',
    },
    // Subcategories
    subcategories: {
      apartments: 'اپارٹمنٹس',
      houses: 'گھر اور ولاز',
      commercial: 'تجارتی جگہیں',
      events: 'تقریب کی جگہیں',
      farmhouses: 'فارم ہاؤسز اور چھٹیوں کے گھر',
      rooms: 'کمرے اور ہاسٹل',
      cars: 'گاڑیاں',
      motorcycles: 'موٹر سائیکلیں اور سکوٹر',
      bicycles: 'سائیکلیں',
      trucks: 'ٹرک اور لوڈر',
      rickshaws: 'رکشے اور چنگچی',
      trailers: 'ٹریلر اور بھاری مشینری',
      wedding: 'شادی اور رسمی لباس',
      designer: 'ڈیزائنر لباس',
      seasonal: 'موسمی لباس',
      costumes: 'کاسٹیوم اور تھیم ویئر',
      accessories: 'لوازمات',
      maternity: 'زچگی اور بچوں کے کپڑے',
      farming: 'زرعی آلات',
      electronics: 'الیکٹرانکس',
      medical: 'طبی آلات',
      kitchen: 'کچن اور کیٹرنگ',
      sports: 'کھیل اور فٹنس',
      gaming: 'گیمنگ آئٹمز',
      skilled: 'ہنر مند کارکنان',
      technical: 'تکنیکی عملہ',
      eventStaff: 'تقریب کا عملہ',
      agricultural: 'زرعی مزدور',
      domestic: 'گھریلو مدد',
      drivers: 'ڈرائیور',
      medicalServices: 'طبی خدمات',
      pilotServices: 'پائلٹ خدمات',
      pets: 'پالتو جانور',
      working: 'کام کرنے والے جانور',
      veterinary: 'ویٹرنری خدمات',
      fishing: 'ماہی گیری کی کشتیاں',
      ferries: 'مسافر فیری',
      recreational: 'تفریحی کشتیاں',
      yachts: 'یاٹ اور سپیڈ بوٹ',
      cargo: 'کارگو جہاز',
      safety: 'حفاظتی سامان',
      charter: 'چارٹر طیارے',
      helicopter: 'ہیلی کاپٹر خدمات',
      ambulance: 'ایئر ایمبولینس',
      cargoAir: 'کارگو ہوائی جہاز',
    },
    // Listings
    listing: {
      perHour: '/گھنٹہ',
      perDay: '/دن',
      perWeek: '/ہفتہ',
      perMonth: '/مہینہ',
      verified: 'تصدیق شدہ',
      featured: 'نمایاں',
      available: 'دستیاب',
      unavailable: 'دستیاب نہیں',
      viewDetails: 'تفصیلات دیکھیں',
      bookNow: 'ابھی بک کریں',
      sendRequest: 'درخواست بھیجیں',
      instantBook: 'فوری بکنگ',
      addToFavorites: 'پسندیدہ میں شامل کریں',
      share: 'شیئر کریں',
      report: 'رپورٹ کریں',
      reviews: 'جائزے',
      rating: 'ریٹنگ',
      location: 'مقام',
      postedBy: 'پوسٹ کنندہ',
      memberSince: 'ممبر ہیں',
      responseRate: 'جوابی شرح',
      responseTime: 'جوابی وقت',
      similarItems: 'ملتے جلتے آئٹمز',
      description: 'تفصیل',
      features: 'خصوصیات',
      specifications: 'تصریحات',
      availability: 'دستیابی',
      pricing: 'قیمت',
      policies: 'پالیسیاں',
      cancellation: 'منسوخی کی پالیسی',
      deposit: 'سیکیورٹی ڈپازٹ',
      // Featured listing titles
      luxuryApartmentDHA: 'ڈی ایچ اے میں لگژری اپارٹمنٹ',
      toyotaCorolla2023: 'ٹویوٹا کرولا 2023',
      weddingSherwaniSet: 'شادی شیروانی سیٹ',
      professionalCameraKit: 'پروفیشنل کیمرہ کٹ',
      // Locations
      karachi: 'کراچی',
      lahore: 'لاہور',
      islamabad: 'اسلام آباد',
    },
    // Booking
    booking: {
      title: 'یہ کرایہ بک کریں',
      selectDates: 'تاریخیں منتخب کریں',
      startDate: 'شروع کی تاریخ',
      endDate: 'اختتام کی تاریخ',
      duration: 'مدت',
      totalPrice: 'کل قیمت',
      serviceFee: 'سروس فیس',
      grandTotal: 'مجموعی ٹوٹل',
      confirmBooking: 'بکنگ کی تصدیق کریں',
      pending: 'زیر التوا',
      approved: 'منظور شدہ',
      rejected: 'مسترد',
      cancelled: 'منسوخ',
      completed: 'مکمل',
      history: 'بکنگ کی تاریخ',
      myBookings: 'میری بکنگز',
      receivedBookings: 'موصول شدہ بکنگز',
    },
    // Auth
    auth: {
      login: 'لاگ ان',
      register: 'رجسٹر',
      email: 'ای میل ایڈریس',
      phone: 'فون نمبر',
      password: 'پاس ورڈ',
      confirmPassword: 'پاس ورڈ کی تصدیق',
      fullName: 'پورا نام',
      forgotPassword: 'پاس ورڈ بھول گئے؟',
      rememberMe: 'مجھے یاد رکھیں',
      orContinueWith: 'یا جاری رکھیں',
      noAccount: 'اکاؤنٹ نہیں ہے؟',
      haveAccount: 'پہلے سے اکاؤنٹ ہے؟',
      signUp: 'سائن اپ',
      signIn: 'سائن ان',
      verifyOTP: 'OTP تصدیق کریں',
      enterOTP: '6 ہندسوں کا کوڈ درج کریں بھیجا گیا',
      resendOTP: 'OTP دوبارہ بھیجیں',
      selectRole: 'اپنا کردار منتخب کریں',
      owner: 'میں چیزیں کرایے پر دینا چاہتا ہوں',
      borrower: 'میں چیزیں کرایے پر لینا چاہتا ہوں',
      both: 'دونوں - کرایہ دینا اور لینا',
      terms: 'میں سروس کی شرائط اور رازداری کی پالیسی سے متفق ہوں',
    },
    // Dashboard
    dashboard: {
      title: 'ڈیش بورڈ',
      welcome: 'خوش آمدید',
      myListings: 'میرے اشتہارات',
      myBookings: 'میری بکنگز',
      favorites: 'پسندیدہ',
      messages: 'پیغامات',
      earnings: 'آمدنی',
      analytics: 'تجزیات',
      settings: 'ترتیبات',
      profile: 'پروفائل',
      verification: 'تصدیق',
      totalEarnings: 'کل آمدنی',
      thisMonth: 'اس مہینے',
      pendingPayouts: 'زیر التوا ادائیگیاں',
      activeListings: 'فعال اشتہارات',
      totalBookings: 'کل بکنگز',
      averageRating: 'اوسط ریٹنگ',
      overview: 'جائزہ',
      disputes: 'تنازعات',
      ownerMode: 'مالک موڈ',
      buyerMode: 'خریدار موڈ',
      accountType: 'اکاؤنٹ کی قسم',
      accountTypeDesc: 'مالک اور خریدار آپ کے اکاؤنٹ کی الگ الگ صلاحیتیں ہیں — کسی بھی وقت کوئی بھی شامل کریں',
      ownerRoleTitle: 'مالک',
      ownerRoleDesc: 'کرائے پر اشیاء دیں',
      buyerRoleTitle: 'خریدار',
      buyerRoleDesc: 'دوسرے مالکان سے اشیاء کرائے پر لیں',
      roleActive: 'فعال',
      defaultDashboard: 'لاگ اِن پر ڈیفالٹ ڈیش بورڈ',
      ownerDashboardOption: 'مالک ڈیش بورڈ',
      buyerDashboardOption: 'خریدار ڈیش بورڈ',
      becomeOwnerTitle: 'اشیاء درج کرنے کے لیے مالک بنیں',
      becomeOwnerDesc: 'آپ کا اکاؤنٹ فی الحال صرف خریدار کے طور پر سیٹ ہے۔ کرائے پر اشیاء درج کرنا شروع کرنے کے لیے سیٹنگز سے مالک کی صلاحیت شامل کریں۔',
      goToSettings: 'سیٹنگز پر جائیں',
      backToDashboard: 'ڈیش بورڈ پر واپس جائیں',
      bookingsAsBuyer: 'بطور خریدار آپ کی بکنگز',
      awaitingDecision: 'آپ کے فیصلے کا منتظر',
      onboardingOwnerTitle: 'اب آپ ایک مالک ہیں',
      onboardingBuyerTitle: 'اب آپ ایک خریدار ہیں',
      onboardingOwnerDesc: 'اب آپ کرائے پر اشیاء درج کر سکتے ہیں۔ اپنی پہلی لسٹنگ سے پہلے چند چیزیں سیٹ کر لیں:',
      onboardingBuyerDesc: 'اب آپ دوسرے مالکان سے اشیاء بک کر سکتے ہیں۔ چند فوری تجاویز:',
      onboardingOwnerTip1: 'مکمل بکنگز کی ادائیگی حاصل کرنے کے لیے سیٹنگز میں ادائیگی وصولی کا طریقہ شامل کریں۔',
      onboardingOwnerTip2: 'تصدیق شدہ مالکان کو زیادہ بکنگز ملتی ہیں — جب ممکن ہو شناختی تصدیق مکمل کریں۔',
      onboardingBuyerTip1: 'آپ کو یہاں اپنی بکنگ درخواستوں اور مالکان کے پیغامات کے بارے میں مطلع کیا جائے گا۔',
      skipForNow: 'ابھی کے لیے نظر انداز کریں',
      goToVerification: 'تصدیق پر جائیں',
      gotIt: 'سمجھ گیا',
    },
    // Verification
    verification: {
      title: 'اپنا اکاؤنٹ تصدیق کریں',
      subtitle: 'کرایہ داروں کے ساتھ اعتماد پیدا کرنے کے لیے تصدیق مکمل کریں',
      email: 'ای میل تصدیق شدہ',
      phone: 'فون تصدیق شدہ',
      id: 'شناخت تصدیق شدہ',
      biometric: 'بائیومیٹرک تصدیق شدہ',
      pending: 'زیر التوا',
      notVerified: 'تصدیق نہیں ہوئی',
      verify: 'ابھی تصدیق کریں',
      uploadID: 'شناختی دستاویز اپلوڈ کریں',
      verifyFace: 'چہرے کی تصدیق کریں',
    },
    // Payment
    payment: {
      title: 'ادائیگی',
      selectMethod: 'ادائیگی کا طریقہ منتخب کریں',
      jazzCash: 'جیز کیش',
      easypaisa: 'ایزی پیسہ',
      card: 'کریڈٹ/ڈیبٹ کارڈ',
      bankTransfer: 'بینک ٹرانسفر',
      processing: 'پروسیسنگ...',
      success: 'ادائیگی کامیاب',
      failed: 'ادائیگی ناکام',
      retry: 'دوبارہ کوشش کریں',
    },
    // Subscription
    subscription: {
      title: 'اپنا اکاؤنٹ اپ گریڈ کریں',
      free: 'مفت',
      premium: 'پریمیم',
      freeFeatures: 'اشتہارات پر اشتہارات نظر آئیں گے',
      premiumFeatures: 'کوئی اشتہارات نہیں، تصدیق شدہ بیج، ترجیحی سپورٹ',
      localPrice: 'PKR 500/ماہ',
      intlPrice: '$7.99/ماہ',
      subscribe: 'ابھی سبسکرائب کریں',
      currentPlan: 'موجودہ پلان',
    },
    // Common
    common: {
      loading: 'لوڈ ہو رہا ہے...',
      error: 'کچھ غلط ہو گیا',
      retry: 'دوبارہ کوشش کریں',
      save: 'محفوظ کریں',
      cancel: 'منسوخ کریں',
      delete: 'حذف کریں',
      edit: 'ترمیم',
      close: 'بند کریں',
      back: 'واپس',
      next: 'اگلا',
      submit: 'جمع کریں',
      confirm: 'تصدیق کریں',
      yes: 'ہاں',
      no: 'نہیں',
      all: 'تمام',
      none: 'کوئی نہیں',
      from: 'سے',
      to: 'تک',
      pkr: 'PKR',
      noResults: 'کوئی نتائج نہیں ملے',
      seeMore: 'مزید دیکھیں',
      seeLess: 'کم دیکھیں',
      add: 'شامل کریں',
    },
    // Filters
    filters: {
      title: 'فلٹرز',
      priceRange: 'قیمت کی حد',
      minPrice: 'کم از کم قیمت',
      maxPrice: 'زیادہ سے زیادہ قیمت',
      location: 'مقام',
      radius: 'تلاش کا دائرہ',
      availability: 'دستیابی',
      rating: 'کم از کم ریٹنگ',
      verified: 'صرف تصدیق شدہ',
      instantBook: 'فوری بکنگ',
      sortBy: 'ترتیب دیں',
      relevance: 'مطابقت',
      priceLowHigh: 'قیمت: کم سے زیادہ',
      priceHighLow: 'قیمت: زیادہ سے کم',
      newest: 'نئے پہلے',
      topRated: 'اعلی درجہ بندی',
      apply: 'فلٹرز لاگو کریں',
      reset: 'ری سیٹ کریں',
    },
    // Footer
    footer: {
      about: 'ہمارے بارے میں',
      howItWorks: 'یہ کیسے کام کرتا ہے',
      safety: 'سیفٹی سینٹر',
      help: 'مدد کا مرکز',
      terms: 'سروس کی شرائط',
      privacy: 'رازداری کی پالیسی',
      contact: 'ہم سے رابطہ کریں',
      careers: 'کیریئرز',
      press: 'پریس',
      copyright: '© 2025 مائی رینٹل مارکیٹ پلیس۔ جملہ حقوق محفوظ ہیں۔',
      tagline: 'پاکستان میں کچھ بھی، کہیں بھی کرایے پر لیں',
    },
    // Admin
    admin: {
      title: 'سپر ایڈمن',
      dashboard: 'ایڈمن ڈیش بورڈ',
      users: 'صارفین کا انتظام',
      listings: 'اشتہارات کا انتظام',
      verifications: 'تصدیقات',
      bookings: 'تمام بکنگز',
      categories: 'زمرہ جات',
      totalUsers: 'کل صارفین',
      newUsers: 'نئے صارفین',
      totalListings: 'کل اشتہارات',
      activeListings: 'فعال اشتہارات',
      totalBookings: 'کل بکنگز',
      pendingBookings: 'زیر التوا بکنگز',
      totalRevenue: 'کل آمدنی',
      pendingVerifications: 'زیر التوا تصدیقات',
      userManagement: 'صارفین کا انتظام',
      listingManagement: 'اشتہارات کا انتظام',
      recentUsers: 'حالیہ صارفین',
      recentBookings: 'حالیہ بکنگز',
    },
  },
};

export const getTranslation = (lang: Language): TranslationType => translations[lang];
