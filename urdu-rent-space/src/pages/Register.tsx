import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, Package, ShoppingBag, RefreshCw } from 'lucide-react';
import { authApi } from '@/lib/api';
import { registerSchema, REGISTER_STEP_1_FIELDS, type RegisterFormValues } from '@/lib/validation/auth';
import { getApiErrorMessage, getApiErrorDetails } from '@/lib/errors';

const Register: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'both',
      agreeToTerms: false,
    },
  });

  const handleNext = async () => {
    const valid = await form.trigger(REGISTER_STEP_1_FIELDS);
    if (valid) setStep(2);
  };

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      // Format phone number to +92 format
      let phone = values.phone.replace(/\s+/g, '').replace(/-/g, '');
      if (phone.startsWith('0')) {
        phone = '+92' + phone.substring(1);
      } else if (!phone.startsWith('+92')) {
        phone = '+92' + phone;
      }

      const response = await authApi.register({
        fullName: values.fullName,
        email: values.email,
        phone,
        password: values.password,
        role: values.role,
      });

      const { userId, email } = response.data.data;

      // Store user info for OTP verification
      localStorage.setItem('pendingVerification', JSON.stringify({
        userId,
        email,
        phone,
        role: values.role,
      }));

      toast.success('Account created! Please verify your email.');
      navigate('/verify-otp');
    } catch (error) {
      const details = getApiErrorDetails(error);
      if (details) {
        let mappedToField = false;
        (Object.keys(details) as (keyof RegisterFormValues)[]).forEach((field) => {
          if (field in form.getValues()) {
            form.setError(field, { message: details[field][0] });
            mappedToField = true;
          }
        });
        if (mappedToField) {
          setStep(1);
          return;
        }
      }
      toast.error(getApiErrorMessage(error, 'Registration failed. Please try again.'));
    }
  };

  const isLoading = form.formState.isSubmitting;
  const role = form.watch('role');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {t.common.back}
        </Link>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-hero mx-auto mb-4 flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">M</span>
            </div>
            <CardTitle className="text-2xl font-bold">{t.auth.register}</CardTitle>
            <CardDescription>
              {step === 1 ? 'Create your account to get started' : t.auth.selectRole}
            </CardDescription>

            {/* Progress Indicator */}
            <div className="flex justify-center gap-2 mt-4">
              <div className={`w-20 h-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-20 h-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {step === 1 ? (
                  <>
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.auth.fullName}</FormLabel>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <FormControl>
                              <Input type="text" placeholder="Ahmed Khan" className="pl-10" {...field} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.auth.email}</FormLabel>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <FormControl>
                              <Input type="email" placeholder="you@example.com" className="pl-10" {...field} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.auth.phone}</FormLabel>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <FormControl>
                              <Input type="tel" placeholder="+92 300 1234567" className="pl-10" {...field} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.auth.password}</FormLabel>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <FormControl>
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="pl-10 pr-10"
                                {...field}
                              />
                            </FormControl>
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.auth.confirmPassword}</FormLabel>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <FormControl>
                              <Input type="password" placeholder="••••••••" className="pl-10" {...field} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-3">
                              <FormLabel
                                htmlFor="owner"
                                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all font-normal ${
                                  role === 'owner' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                }`}
                              >
                                <RadioGroupItem value="owner" id="owner" className="mt-1" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Package className="w-5 h-5 text-primary" />
                                    <span className="font-semibold">Owner</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{t.auth.owner}</p>
                                </div>
                              </FormLabel>

                              <FormLabel
                                htmlFor="borrower"
                                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all font-normal ${
                                  role === 'borrower' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                }`}
                              >
                                <RadioGroupItem value="borrower" id="borrower" className="mt-1" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <ShoppingBag className="w-5 h-5 text-secondary" />
                                    <span className="font-semibold">Buyer</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{t.auth.borrower}</p>
                                </div>
                              </FormLabel>

                              <FormLabel
                                htmlFor="both"
                                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all font-normal ${
                                  role === 'both' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                }`}
                              >
                                <RadioGroupItem value="both" id="both" className="mt-1" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <RefreshCw className="w-5 h-5 text-accent" />
                                    <span className="font-semibold">Both</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{t.auth.both}</p>
                                </div>
                              </FormLabel>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="agreeToTerms"
                      render={({ field }) => (
                        <FormItem className="pt-4">
                          <div className="flex items-start space-x-2">
                            <FormControl>
                              <Checkbox id="terms" checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel htmlFor="terms" className="text-sm font-normal cursor-pointer leading-relaxed">
                              {t.auth.terms}
                            </FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  {step === 2 && (
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                      {t.common.back}
                    </Button>
                  )}
                  {step === 1 ? (
                    <Button type="button" className="flex-1" size="lg" onClick={handleNext}>
                      {t.common.next}
                    </Button>
                  ) : (
                    <Button type="submit" className="flex-1" size="lg" disabled={isLoading}>
                      {isLoading ? t.common.loading : t.auth.signUp}
                    </Button>
                  )}
                </div>
              </form>
            </Form>

            {step === 1 && (
              <>
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">{t.auth.orContinueWith}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Button variant="outline" className="w-full">
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </Button>
                    <Button variant="outline" className="w-full">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                      </svg>
                      Apple
                    </Button>
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  {t.auth.haveAccount}{' '}
                  <Link to="/login" className="text-primary font-medium hover:underline">
                    {t.auth.signIn}
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
