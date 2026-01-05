import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { listingApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { categories } from '@/lib/categories';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  MapPin,
  DollarSign,
  Calendar as CalendarIcon,
  CheckCircle2,
  Image as ImageIcon,
  Zap,
  Building2,
  Car,
  Shirt,
  Wrench,
  Users,
  Dog,
  Ship,
  Plane,
} from 'lucide-react';

const categoryIcons: Record<string, React.ElementType> = {
  property: Building2,
  vehicles: Car,
  clothes: Shirt,
  equipment: Wrench,
  services: Users,
  animals: Dog,
  boats: Ship,
  air: Plane,
};

// Dynamic fields based on category
const categoryFields: Record<string, { name: string; type: string; options?: string[]; required?: boolean }[]> = {
  property: [
    { name: 'bedrooms', type: 'select', options: ['1', '2', '3', '4', '5+'], required: true },
    { name: 'bathrooms', type: 'select', options: ['1', '2', '3', '4+'], required: true },
    { name: 'area', type: 'number', required: true },
    { name: 'furnishing', type: 'select', options: ['Unfurnished', 'Semi-Furnished', 'Fully Furnished'], required: true },
    { name: 'floor', type: 'number' },
    { name: 'parking', type: 'checkbox' },
    { name: 'wifi', type: 'checkbox' },
    { name: 'airConditioned', type: 'checkbox' },
  ],
  vehicles: [
    { name: 'make', type: 'text', required: true },
    { name: 'model', type: 'text', required: true },
    { name: 'year', type: 'number', required: true },
    { name: 'transmission', type: 'select', options: ['Automatic', 'Manual'], required: true },
    { name: 'fuelType', type: 'select', options: ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG'] },
    { name: 'seats', type: 'number' },
    { name: 'withDriver', type: 'checkbox' },
    { name: 'insurance', type: 'checkbox' },
  ],
  clothes: [
    { name: 'size', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'], required: true },
    { name: 'color', type: 'text', required: true },
    { name: 'material', type: 'text' },
    { name: 'brand', type: 'text' },
    { name: 'condition', type: 'select', options: ['New', 'Like New', 'Good', 'Fair'], required: true },
    { name: 'dryCleaningIncluded', type: 'checkbox' },
  ],
  equipment: [
    { name: 'brand', type: 'text' },
    { name: 'model', type: 'text' },
    { name: 'condition', type: 'select', options: ['New', 'Like New', 'Good', 'Fair'], required: true },
    { name: 'warranty', type: 'checkbox' },
    { name: 'deliveryAvailable', type: 'checkbox' },
    { name: 'setupIncluded', type: 'checkbox' },
  ],
  services: [
    { name: 'experience', type: 'select', options: ['<1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'], required: true },
    { name: 'certifications', type: 'text' },
    { name: 'languages', type: 'text' },
    { name: 'availability', type: 'select', options: ['Full-time', 'Part-time', 'On-call', 'Weekends only'] },
    { name: 'travelWilling', type: 'checkbox' },
  ],
  animals: [
    { name: 'species', type: 'text', required: true },
    { name: 'breed', type: 'text', required: true },
    { name: 'age', type: 'text' },
    { name: 'vaccinated', type: 'checkbox' },
    { name: 'trained', type: 'checkbox' },
    { name: 'healthCertificate', type: 'checkbox' },
  ],
  boats: [
    { name: 'type', type: 'text', required: true },
    { name: 'length', type: 'number' },
    { name: 'capacity', type: 'number', required: true },
    { name: 'withCrew', type: 'checkbox' },
    { name: 'fuelIncluded', type: 'checkbox' },
    { name: 'safetyEquipment', type: 'checkbox' },
  ],
  air: [
    { name: 'aircraftType', type: 'text', required: true },
    { name: 'passengerCapacity', type: 'number', required: true },
    { name: 'range', type: 'text' },
    { name: 'withPilot', type: 'checkbox' },
    { name: 'cateringAvailable', type: 'checkbox' },
  ],
};

const CreateListing: React.FC = () => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);

  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    title: '',
    description: '',
    location: '',
    city: '',
    hourlyRate: '',
    dailyRate: '',
    weeklyRate: '',
    monthlyRate: '',
    instantBook: false,
    deposit: '',
    cancellationPolicy: 'flexible',
    dynamicFields: {} as Record<string, string | boolean>,
  });

  const selectedCategory = categories.find((c) => c.id === formData.category);
  const dynamicFields = formData.category ? categoryFields[formData.category] || [] : [];

  const handleImageUpload = () => {
    // Mock image upload
    const mockImages = [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
    ];
    if (images.length < 10) {
      setImages([...images, mockImages[images.length % mockImages.length]]);
      toast.success('Image uploaded successfully');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to create a listing');
      navigate('/login');
      return;
    }

    setIsLoading(true);
    try {
      // Build the listing data matching the backend schema
      const listingData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        location: {
          address: formData.location,
          city: formData.city,
          area: formData.location,
        },
        pricing: {
          hourly: formData.hourlyRate ? Number(formData.hourlyRate) : undefined,
          daily: formData.dailyRate ? Number(formData.dailyRate) : undefined,
          weekly: formData.weeklyRate ? Number(formData.weeklyRate) : undefined,
          monthly: formData.monthlyRate ? Number(formData.monthlyRate) : undefined,
          currency: 'PKR',
        },
        availability: {
          instantBook: formData.instantBook,
          blockedDates: unavailableDates,
        },
        policies: {
          cancellation: formData.cancellationPolicy,
          deposit: {
            amount: formData.deposit ? Number(formData.deposit) : 0,
            required: !!formData.deposit,
          },
        },
        specifications: formData.dynamicFields,
      };

      // Create FormData for multipart upload (images)
      const submitData = new FormData();
      
      // Append all listing data as JSON
      Object.entries(listingData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object') {
            submitData.append(key, JSON.stringify(value));
          } else {
            submitData.append(key, String(value));
          }
        }
      });

      // Note: For real image upload, you'd append actual File objects here
      // For now, we're sending the mock image URLs
      if (images.length > 0) {
        submitData.append('imageUrls', JSON.stringify(images));
      }

      // Use the API client which handles cookies automatically
      await listingApi.create(submitData);

      toast.success('Listing created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating listing:', error);
      const message = error.response?.data?.message || error.message || 'Failed to create listing';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.category && formData.subcategory;
      case 2:
        return formData.title && formData.description && formData.location;
      case 3:
        return images.length > 0;
      case 4:
        return formData.dailyRate || formData.hourlyRate || formData.weeklyRate || formData.monthlyRate;
      default:
        return true;
    }
  };

  return (
    <Layout>
      <div className="pt-20 min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" />
              {t.common.back}
            </Link>
            <h1 className="text-3xl font-bold text-foreground">{t.nav.createListing}</h1>
            <p className="text-muted-foreground mt-2">{t.listing.description}</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {['Category', 'Details', 'Photos', 'Pricing', 'Availability'].map((label, idx) => (
              <div key={label} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                  step > idx + 1 ? 'bg-green-500 text-white' :
                  step === idx + 1 ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {step > idx + 1 ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                </div>
                <span className={`ml-2 text-sm hidden md:block ${step === idx + 1 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {label}
                </span>
                {idx < 4 && <div className={`w-8 md:w-16 h-0.5 mx-2 ${step > idx + 1 ? 'bg-green-500' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <Card>
            <CardContent className="p-6">
              {/* Step 1: Category */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-lg font-semibold">Select Category</Label>
                    <p className="text-muted-foreground text-sm mt-1">Choose the category that best fits your item</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categories.map((category) => {
                      const Icon = categoryIcons[category.id] || Building2;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setFormData({ ...formData, category: category.id, subcategory: '' })}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            formData.category === category.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className={`w-12 h-12 mx-auto mb-2 rounded-xl ${category.colorClass} flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-primary-foreground" />
                          </div>
                          <p className="text-sm font-medium text-center">{t.categories[category.nameKey as keyof typeof t.categories]}</p>
                        </button>
                      );
                    })}
                  </div>

                  {selectedCategory && (
                    <div>
                      <Label className="text-lg font-semibold">Select Subcategory</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                        {selectedCategory.subcategories.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => setFormData({ ...formData, subcategory: sub.id })}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              formData.subcategory === sub.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <p className="text-sm font-medium">{t.subcategories[sub.nameKey as keyof typeof t.subcategories]}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Details */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="title">Listing Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Luxury 3BR Apartment in DHA Phase 5"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your item in detail..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-2 min-h-32"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="karachi">Karachi</SelectItem>
                          <SelectItem value="lahore">Lahore</SelectItem>
                          <SelectItem value="islamabad">Islamabad</SelectItem>
                          <SelectItem value="rawalpindi">Rawalpindi</SelectItem>
                          <SelectItem value="faisalabad">Faisalabad</SelectItem>
                          <SelectItem value="multan">Multan</SelectItem>
                          <SelectItem value="peshawar">Peshawar</SelectItem>
                          <SelectItem value="quetta">Quetta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="location">Location/Area *</Label>
                      <div className="relative mt-2">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="location"
                          placeholder="e.g., DHA Phase 5, Block A"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Fields */}
                  {dynamicFields.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-4">{selectedCategory?.nameKey} Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dynamicFields.map((field) => (
                          <div key={field.name}>
                            {field.type === 'checkbox' ? (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={field.name}
                                  checked={formData.dynamicFields[field.name] as boolean || false}
                                  onCheckedChange={(checked) =>
                                    setFormData({
                                      ...formData,
                                      dynamicFields: { ...formData.dynamicFields, [field.name]: checked as boolean }
                                    })
                                  }
                                />
                                <Label htmlFor={field.name} className="capitalize">{field.name.replace(/([A-Z])/g, ' $1')}</Label>
                              </div>
                            ) : field.type === 'select' ? (
                              <div>
                                <Label className="capitalize">{field.name.replace(/([A-Z])/g, ' $1')} {field.required && '*'}</Label>
                                <Select
                                  value={formData.dynamicFields[field.name] as string || ''}
                                  onValueChange={(value) =>
                                    setFormData({
                                      ...formData,
                                      dynamicFields: { ...formData.dynamicFields, [field.name]: value }
                                    })
                                  }
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder={`Select ${field.name}`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {field.options?.map((opt) => (
                                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <div>
                                <Label htmlFor={field.name} className="capitalize">
                                  {field.name.replace(/([A-Z])/g, ' $1')} {field.required && '*'}
                                </Label>
                                <Input
                                  id={field.name}
                                  type={field.type}
                                  value={formData.dynamicFields[field.name] as string || ''}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      dynamicFields: { ...formData.dynamicFields, [field.name]: e.target.value }
                                    })
                                  }
                                  className="mt-1"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Photos */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-lg font-semibold">Upload Photos</Label>
                    <p className="text-muted-foreground text-sm mt-1">Add up to 10 photos. First photo will be the cover.</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                        <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <Badge className="absolute top-2 left-2">Cover</Badge>
                        )}
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {images.length < 10 && (
                      <button
                        onClick={handleImageUpload}
                        className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover:border-primary transition-colors"
                      >
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Upload</span>
                      </button>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 flex items-start gap-3">
                    <ImageIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Photo Tips</p>
                      <ul className="mt-1 space-y-1 list-disc list-inside">
                        <li>Use natural lighting for best results</li>
                        <li>Show multiple angles of your item</li>
                        <li>Include close-ups of important details</li>
                        <li>Minimum resolution: 800x600 pixels</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Pricing */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-lg font-semibold">Set Your Prices</Label>
                    <p className="text-muted-foreground text-sm mt-1">Choose which pricing options to enable</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hourlyRate">Hourly Rate (PKR)</Label>
                      <div className="relative mt-2">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="hourlyRate"
                          type="number"
                          placeholder="e.g., 500"
                          value={formData.hourlyRate}
                          onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="dailyRate">Daily Rate (PKR)</Label>
                      <div className="relative mt-2">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="dailyRate"
                          type="number"
                          placeholder="e.g., 5000"
                          value={formData.dailyRate}
                          onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="weeklyRate">Weekly Rate (PKR)</Label>
                      <div className="relative mt-2">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="weeklyRate"
                          type="number"
                          placeholder="e.g., 30000"
                          value={formData.weeklyRate}
                          onChange={(e) => setFormData({ ...formData, weeklyRate: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="monthlyRate">Monthly Rate (PKR)</Label>
                      <div className="relative mt-2">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="monthlyRate"
                          type="number"
                          placeholder="e.g., 100000"
                          value={formData.monthlyRate}
                          onChange={(e) => setFormData({ ...formData, monthlyRate: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="deposit">Security Deposit (PKR)</Label>
                    <div className="relative mt-2">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="deposit"
                        type="number"
                        placeholder="e.g., 10000"
                        value={formData.deposit}
                        onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Cancellation Policy</Label>
                    <Select
                      value={formData.cancellationPolicy}
                      onValueChange={(value) => setFormData({ ...formData, cancellationPolicy: value })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flexible">Flexible - Free cancellation up to 24 hours before</SelectItem>
                        <SelectItem value="moderate">Moderate - Free cancellation up to 48 hours before</SelectItem>
                        <SelectItem value="strict">Strict - 50% refund up to 7 days before</SelectItem>
                        <SelectItem value="non-refundable">Non-refundable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Enable Instant Booking</p>
                        <p className="text-sm text-muted-foreground">Allow renters to book without approval</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.instantBook}
                      onCheckedChange={(checked) => setFormData({ ...formData, instantBook: checked })}
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Availability */}
              {step === 5 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-lg font-semibold">Set Availability</Label>
                    <p className="text-muted-foreground text-sm mt-1">Select dates when your item is NOT available</p>
                  </div>

                  <div className="flex justify-center">
                    <Calendar
                      mode="multiple"
                      selected={unavailableDates}
                      onSelect={setUnavailableDates}
                      className="rounded-md border"
                      disabled={(date) => date < new Date()}
                    />
                  </div>

                  {unavailableDates.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-muted-foreground">Blocked dates:</span>
                      {unavailableDates.map((date, idx) => (
                        <Badge key={idx} variant="outline" className="gap-1">
                          {date.toLocaleDateString()}
                          <button onClick={() => setUnavailableDates(unavailableDates.filter((_, i) => i !== idx))}>
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2">Ready to publish?</h3>
                      <p className="text-sm text-muted-foreground">
                        Your listing will be reviewed and published within 24 hours. You can edit it anytime from your dashboard.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                {step > 1 ? (
                  <Button variant="outline" onClick={() => setStep(step - 1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                ) : (
                  <div />
                )}
                {step < 5 ? (
                  <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? 'Publishing...' : 'Publish Listing'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CreateListing;
