import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { listingApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { categories } from '@/lib/categories';
import { categoryFields } from '@/lib/categoryFields';
import { listingSchema, LISTING_STEP_FIELDS, type ListingFormValues } from '@/lib/validation/listing';
import { getApiErrorMessage } from '@/lib/errors';
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
  Loader2,
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

const DEFAULT_VALUES: ListingFormValues = {
  category: '',
  subcategory: '',
  title: '',
  description: '',
  city: '',
  location: '',
  images: 0,
  hourlyRate: '',
  dailyRate: '',
  weeklyRate: '',
  monthlyRate: '',
  deposit: '',
  cancellationPolicy: 'flexible',
  instantBook: false,
  dynamicFields: {},
};

const CreateListing: React.FC = () => {
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { listingId } = useParams<{ listingId: string }>();
  const isEditMode = !!listingId;
  const isOwner = user?.role === 'owner' || user?.role === 'both';

  const [step, setStep] = useState(1);
  const [isLoadingListing, setIsLoadingListing] = useState(isEditMode);
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const category = form.watch('category');
  const subcategory = form.watch('subcategory');
  const dynamicFieldValues = form.watch('dynamicFields');
  const selectedCategory = categories.find((c) => c.id === category);
  const dynamicFieldDefs = category ? categoryFields[category] || [] : [];

  // Keep the schema's `images` field (a plain count used only for validation
  // gating) in sync with the real image state.
  useEffect(() => {
    form.setValue('images', images.length, { shouldValidate: form.formState.isSubmitted });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  // Load existing listing data when in edit mode
  useEffect(() => {
    if (isEditMode && listingId) {
      const loadListing = async () => {
        try {
          setIsLoadingListing(true);
          const response = await listingApi.getById(listingId);
          const listing = response.data.data;

          form.reset({
            category: listing.category || '',
            subcategory: listing.subcategory || '',
            title: listing.title || '',
            description: listing.description || '',
            city: listing.location?.city || '',
            location: listing.location?.address || '',
            images: listing.images?.length || 0,
            hourlyRate: listing.pricing?.hourly?.toString() || '',
            dailyRate: listing.pricing?.daily?.toString() || '',
            weeklyRate: listing.pricing?.weekly?.toString() || '',
            monthlyRate: listing.pricing?.monthly?.toString() || '',
            deposit: listing.policies?.deposit?.amount?.toString() || '',
            cancellationPolicy: listing.policies?.cancellation || 'flexible',
            instantBook: listing.availability?.instantBook || false,
            dynamicFields: listing.specifications || {},
          });

          // Load existing images
          if (listing.images && listing.images.length > 0) {
            setImages(listing.images.map((img: any) => img.url));
          }

          // Load blocked dates
          if (listing.availability?.blockedDates && listing.availability.blockedDates.length > 0) {
            setUnavailableDates(listing.availability.blockedDates.map((date: string) => new Date(date)));
          }

          setIsLoadingListing(false);
        } catch (error) {
          console.error('Error loading listing:', error);
          toast.error(getApiErrorMessage(error, 'Failed to load listing'));
          setIsLoadingListing(false);
          navigate('/dashboard');
        }
      };

      loadListing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, listingId, navigate]);

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 10 - images.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    filesToAdd.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload only image files');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string]);
          setImageFiles((prev) => [...prev, file]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (filesToAdd.length > 0) {
      toast.success(`${filesToAdd.length} image(s) added`);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: ListingFormValues) => {
    if (!isAuthenticated) {
      toast.error('Please login to create a listing');
      navigate('/login');
      return;
    }

    try {
      // Build the listing data matching the backend schema
      const listingData = {
        title: values.title,
        description: values.description,
        category: values.category,
        subcategory: values.subcategory,
        location: {
          address: values.location,
          city: values.city,
          area: values.location,
        },
        pricing: {
          hourly: values.hourlyRate ? Number(values.hourlyRate) : undefined,
          daily: values.dailyRate ? Number(values.dailyRate) : undefined,
          weekly: values.weeklyRate ? Number(values.weeklyRate) : undefined,
          monthly: values.monthlyRate ? Number(values.monthlyRate) : undefined,
          currency: 'PKR',
        },
        availability: {
          instantBook: values.instantBook,
          blockedDates: unavailableDates,
        },
        policies: {
          cancellation: values.cancellationPolicy,
          deposit: {
            amount: values.deposit ? Number(values.deposit) : 0,
            required: !!values.deposit,
          },
        },
        specifications: values.dynamicFields,
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

      // Append actual image files
      imageFiles.forEach((file) => {
        submitData.append('images', file);
      });

      // Use the API client which handles cookies automatically
      if (isEditMode && listingId) {
        await listingApi.update(listingId, submitData);
        toast.success('Listing updated successfully!');
      } else {
        await listingApi.create(submitData);
        toast.success('Listing created successfully!');
      }

      navigate('/dashboard');
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} listing:`, error);
      toast.error(getApiErrorMessage(error, `Failed to ${isEditMode ? 'update' : 'create'} listing`));
    }
  };

  const isLoading = form.formState.isSubmitting;

  const goNext = async () => {
    let fields = LISTING_STEP_FIELDS[step] || [];
    if (step === 2) {
      const requiredDynamic = dynamicFieldDefs.filter((f) => f.required).map((f) => `dynamicFields.${f.name}` as const);
      fields = [...fields, ...requiredDynamic];
    }
    const valid = await form.trigger(fields as any);
    if (valid) setStep(step + 1);
  };

  const onInvalidSubmit = () => {
    toast.error('Please check the form for missing or invalid fields.');
    setStep(1);
  };

  // A buyer-only account can't list items — the server would 403 on submit
  // anyway, so surface that upfront instead of letting them fill out the
  // whole form first.
  if (isAuthenticated && !isOwner) {
    return (
      <Layout>
        <div className="pt-20 min-h-screen bg-background flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center space-y-4">
              <Building2 className="h-10 w-10 text-primary mx-auto" />
              <h1 className="text-xl font-bold text-foreground">Become an Owner to list items</h1>
              <p className="text-muted-foreground text-sm">
                Your account is currently set up as a Buyer only. Add the Owner capability from Settings to start listing items for rent.
              </p>
              <Button className="w-full" onClick={() => navigate('/dashboard/buyer?tab=settings')}>
                Go to Settings
              </Button>
              <Link to="/dashboard" className="block text-sm text-muted-foreground hover:text-foreground">
                Back to Dashboard
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

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
            <h1 className="text-3xl font-bold text-foreground">
              {isEditMode ? 'Edit Listing' : t.nav.createListing}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isEditMode ? 'Update your listing details' : t.listing.description}
            </p>
          </div>

          {/* Loading state for edit mode */}
          {isLoadingListing ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading listing...</p>
              </div>
            </div>
          ) : (
            <>
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

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)}>
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
                            {categories.map((cat) => {
                              const Icon = categoryIcons[cat.id] || Building2;
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => {
                                    form.setValue('category', cat.id, { shouldValidate: form.formState.isSubmitted });
                                    form.setValue('subcategory', '', { shouldValidate: form.formState.isSubmitted });
                                  }}
                                  className={`p-4 rounded-xl border-2 transition-all ${
                                    category === cat.id
                                      ? 'border-primary bg-primary/5'
                                      : 'border-border hover:border-primary/50'
                                  }`}
                                >
                                  <div className={`w-12 h-12 mx-auto mb-2 rounded-xl ${cat.colorClass} flex items-center justify-center`}>
                                    <Icon className="w-6 h-6 text-primary-foreground" />
                                  </div>
                                  <p className="text-sm font-medium text-center">{t.categories[cat.nameKey as keyof typeof t.categories]}</p>
                                </button>
                              );
                            })}
                          </div>
                          {form.formState.errors.category && (
                            <p className="text-sm font-medium text-destructive">{form.formState.errors.category.message}</p>
                          )}

                          {selectedCategory && (
                            <div>
                              <Label className="text-lg font-semibold">Select Subcategory</Label>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                                {selectedCategory.subcategories.map((sub) => (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => form.setValue('subcategory', sub.id, { shouldValidate: form.formState.isSubmitted })}
                                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                                      subcategory === sub.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50'
                                    }`}
                                  >
                                    <p className="text-sm font-medium">{t.subcategories[sub.nameKey as keyof typeof t.subcategories]}</p>
                                  </button>
                                ))}
                              </div>
                              {form.formState.errors.subcategory && (
                                <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.subcategory.message}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Step 2: Details */}
                      {step === 2 && (
                        <div className="space-y-6">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Listing Title *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Luxury 3BR Apartment in DHA Phase 5" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description *</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Describe your item in detail..." className="min-h-32" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City *</FormLabel>
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select city" />
                                      </SelectTrigger>
                                    </FormControl>
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
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="location"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Location/Area *</FormLabel>
                                  <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <FormControl>
                                      <Input placeholder="e.g., DHA Phase 5, Block A" className="pl-10" {...field} />
                                    </FormControl>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Dynamic Fields */}
                          {dynamicFieldDefs.length > 0 && (
                            <div>
                              <h3 className="font-semibold text-lg mb-4">{selectedCategory?.nameKey} Details</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {dynamicFieldDefs.map((fieldDef) => {
                                  const fieldPath = `dynamicFields.${fieldDef.name}` as const;
                                  const currentValue = dynamicFieldValues[fieldDef.name];
                                  const errorMessage = (form.formState.errors.dynamicFields as any)?.[fieldDef.name]?.message;

                                  if (fieldDef.type === 'checkbox') {
                                    return (
                                      <div key={fieldDef.name} className="flex items-center gap-2">
                                        <Checkbox
                                          id={fieldDef.name}
                                          checked={(currentValue as boolean) || false}
                                          onCheckedChange={(checked) =>
                                            form.setValue(fieldPath, checked as boolean, { shouldValidate: form.formState.isSubmitted })
                                          }
                                        />
                                        <Label htmlFor={fieldDef.name} className="capitalize">
                                          {fieldDef.name.replace(/([A-Z])/g, ' $1')}
                                        </Label>
                                      </div>
                                    );
                                  }

                                  if (fieldDef.type === 'select') {
                                    return (
                                      <div key={fieldDef.name}>
                                        <Label className="capitalize">
                                          {fieldDef.name.replace(/([A-Z])/g, ' $1')} {fieldDef.required && '*'}
                                        </Label>
                                        <Select
                                          value={(currentValue as string) || ''}
                                          onValueChange={(value) =>
                                            form.setValue(fieldPath, value, { shouldValidate: form.formState.isSubmitted })
                                          }
                                        >
                                          <SelectTrigger className="mt-1">
                                            <SelectValue placeholder={`Select ${fieldDef.name}`} />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {fieldDef.options?.map((opt) => (
                                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        {errorMessage && <p className="text-sm font-medium text-destructive mt-1">{errorMessage}</p>}
                                      </div>
                                    );
                                  }

                                  return (
                                    <div key={fieldDef.name}>
                                      <Label htmlFor={fieldDef.name} className="capitalize">
                                        {fieldDef.name.replace(/([A-Z])/g, ' $1')} {fieldDef.required && '*'}
                                      </Label>
                                      <Input
                                        id={fieldDef.name}
                                        type={fieldDef.type}
                                        value={(currentValue as string) || ''}
                                        onChange={(e) =>
                                          form.setValue(fieldPath, e.target.value, { shouldValidate: form.formState.isSubmitted })
                                        }
                                        className="mt-1"
                                      />
                                      {errorMessage && <p className="text-sm font-medium text-destructive mt-1">{errorMessage}</p>}
                                    </div>
                                  );
                                })}
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

                          {/* Hidden file input */}
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            multiple
                            className="hidden"
                          />

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {images.map((img, idx) => (
                              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                                <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                                {idx === 0 && (
                                  <Badge className="absolute top-2 left-2">Cover</Badge>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeImage(idx)}
                                  className="absolute top-2 right-2 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            {images.length < 10 && (
                              <button
                                type="button"
                                onClick={handleImageUpload}
                                className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover:border-primary transition-colors"
                              >
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Upload</span>
                              </button>
                            )}
                          </div>
                          {form.formState.errors.images && (
                            <p className="text-sm font-medium text-destructive">{form.formState.errors.images.message}</p>
                          )}

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
                            <FormField
                              control={form.control}
                              name="hourlyRate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Hourly Rate (PKR)</FormLabel>
                                  <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <FormControl>
                                      <Input type="number" placeholder="e.g., 500" className="pl-10" {...field} />
                                    </FormControl>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="dailyRate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Daily Rate (PKR)</FormLabel>
                                  <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <FormControl>
                                      <Input type="number" placeholder="e.g., 5000" className="pl-10" {...field} />
                                    </FormControl>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="weeklyRate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Weekly Rate (PKR)</FormLabel>
                                  <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <FormControl>
                                      <Input type="number" placeholder="e.g., 30000" className="pl-10" {...field} />
                                    </FormControl>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="monthlyRate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Monthly Rate (PKR)</FormLabel>
                                  <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <FormControl>
                                      <Input type="number" placeholder="e.g., 100000" className="pl-10" {...field} />
                                    </FormControl>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="deposit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Security Deposit (PKR)</FormLabel>
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <FormControl>
                                    <Input type="number" placeholder="e.g., 10000" className="pl-10" {...field} />
                                  </FormControl>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="cancellationPolicy"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cancellation Policy</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="flexible">Flexible - Free cancellation up to 24 hours before</SelectItem>
                                    <SelectItem value="moderate">Moderate - Free cancellation up to 48 hours before</SelectItem>
                                    <SelectItem value="strict">Strict - 50% refund up to 7 days before</SelectItem>
                                    <SelectItem value="non-refundable">Non-refundable</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="instantBook"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between p-4 rounded-lg border space-y-0">
                                <div className="flex items-center gap-3">
                                  <Zap className="w-5 h-5 text-primary" />
                                  <div>
                                    <p className="font-medium">Enable Instant Booking</p>
                                    <p className="text-sm text-muted-foreground">Allow renters to book without approval</p>
                                  </div>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
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
                              onSelect={(dates) => setUnavailableDates(dates || [])}
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
                                  <button type="button" onClick={() => setUnavailableDates(unavailableDates.filter((_, i) => i !== idx))}>
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
                          <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Previous
                          </Button>
                        ) : (
                          <div />
                        )}
                        {step < 5 ? (
                          <Button type="button" onClick={goNext}>
                            Next
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        ) : (
                          <Button type="submit" disabled={isLoading}>
                            {isLoading ? (isEditMode ? 'Updating...' : 'Publishing...') : (isEditMode ? 'Update Listing' : 'Publish Listing')}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </Form>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CreateListing;
