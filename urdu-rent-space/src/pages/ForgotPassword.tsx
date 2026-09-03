import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { authApi } from '@/lib/api';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/validation/auth';
import { getApiErrorMessage } from '@/lib/errors';

const ForgotPassword = () => {
  const { language } = useLanguage();
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const t = {
    en: {
      title: 'Forgot Password',
      subtitle: 'Enter your email address and we\'ll send you a link to reset your password',
      emailLabel: 'Email Address',
      emailPlaceholder: 'Enter your email',
      submitButton: 'Send Reset Link',
      submittingButton: 'Sending...',
      backToLogin: 'Back to Login',
      successTitle: 'Check Your Email',
      successMessage: 'We\'ve sent a password reset link to your email address. Please check your inbox and follow the instructions.',
      errorMessage: 'Failed to send reset email. Please try again.',
      invalidEmail: 'Please enter a valid email address',
      didntReceive: 'Didn\'t receive the email?',
      resend: 'Resend',
    },
    ur: {
      title: 'پاس ورڈ بھول گئے',
      subtitle: 'اپنا ای میل ایڈریس درج کریں اور ہم آپ کو پاس ورڈ ری سیٹ کرنے کا لنک بھیجیں گے',
      emailLabel: 'ای میل ایڈریس',
      emailPlaceholder: 'اپنا ای میل درج کریں',
      submitButton: 'ری سیٹ لنک بھیجیں',
      submittingButton: 'بھیجا جا رہا ہے...',
      backToLogin: 'لاگ ان پر واپس جائیں',
      successTitle: 'اپنی ای میل چیک کریں',
      successMessage: 'ہم نے آپ کے ای میل ایڈریس پر پاس ورڈ ری سیٹ لنک بھیج دیا ہے۔ براہ کرم اپنا ان باکس چیک کریں اور ہدایات پر عمل کریں۔',
      errorMessage: 'ری سیٹ ای میل بھیجنے میں ناکام۔ براہ کرم دوبارہ کوشش کریں۔',
      invalidEmail: 'براہ کرم ایک درست ای میل ایڈریس درج کریں',
      didntReceive: 'ای میل موصول نہیں ہوئی؟',
      resend: 'دوبارہ بھیجیں',
    },
  };

  const text = t[language as keyof typeof t] || t.en;

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setSubmitError('');
    try {
      await authApi.forgotPassword(values.email);
      setSuccess(true);
    } catch (err) {
      console.error('Forgot password error:', err);
      setSubmitError(getApiErrorMessage(err, text.errorMessage));
    }
  };

  const handleResend = async () => {
    setSubmitError('');
    try {
      await authApi.forgotPassword(form.getValues('email'));
    } catch (err) {
      console.error('Resend error:', err);
      setSubmitError(getApiErrorMessage(err, text.errorMessage));
    }
  };

  const isLoading = form.formState.isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">{text.title}</CardTitle>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              {text.backToLogin}
            </Link>
          </div>
          <CardDescription>{text.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong className="font-semibold">{text.successTitle}</strong>
                  <p className="mt-2 text-sm">{text.successMessage}</p>
                </AlertDescription>
              </Alert>

              {submitError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>{text.didntReceive}</span>
                <Button variant="link" className="p-0 h-auto" onClick={handleResend} disabled={isLoading}>
                  {text.resend}
                </Button>
              </div>

              <Link to="/login" className="block">
                <Button className="w-full" variant="outline">
                  {text.backToLogin}
                </Button>
              </Link>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {submitError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{text.emailLabel}</FormLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={text.emailPlaceholder}
                            className="pl-10"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? text.submittingButton : text.submitButton}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
