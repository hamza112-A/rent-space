import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { authApi } from '@/lib/api';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/validation/auth';
import { getApiErrorMessage } from '@/lib/errors';

const ResetPassword = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const t = {
    en: {
      title: 'Reset Password',
      subtitle: 'Enter your new password below',
      newPasswordLabel: 'New Password',
      newPasswordPlaceholder: 'Enter new password (min 8 characters)',
      confirmPasswordLabel: 'Confirm Password',
      confirmPasswordPlaceholder: 'Re-enter your new password',
      submitButton: 'Reset Password',
      submittingButton: 'Resetting...',
      backToLogin: 'Back to Login',
      successTitle: 'Password Reset Successful!',
      successMessage: 'Your password has been reset successfully. You can now log in with your new password.',
      goToLogin: 'Go to Login',
      errorMessage: 'Failed to reset password. The link may have expired.',
      invalidToken: 'Invalid or expired reset link',
      requirements: 'Password must be at least 8 characters long',
    },
    ur: {
      title: 'پاس ورڈ ری سیٹ کریں',
      subtitle: 'نیچے اپنا نیا پاس ورڈ درج کریں',
      newPasswordLabel: 'نیا پاس ورڈ',
      newPasswordPlaceholder: 'نیا پاس ورڈ درج کریں (کم از کم 8 حروف)',
      confirmPasswordLabel: 'پاس ورڈ کی تصدیق کریں',
      confirmPasswordPlaceholder: 'اپنا نیا پاس ورڈ دوبارہ درج کریں',
      submitButton: 'پاس ورڈ ری سیٹ کریں',
      submittingButton: 'ری سیٹ ہو رہا ہے...',
      backToLogin: 'لاگ ان پر واپس جائیں',
      successTitle: 'پاس ورڈ کامیابی سے ری سیٹ ہو گیا!',
      successMessage: 'آپ کا پاس ورڈ کامیابی سے ری سیٹ ہو گیا ہے۔ اب آپ اپنے نئے پاس ورڈ سے لاگ ان کر سکتے ہیں۔',
      goToLogin: 'لاگ ان پر جائیں',
      errorMessage: 'پاس ورڈ ری سیٹ کرنے میں ناکام۔ لنک کی میعاد ختم ہو سکتی ہے۔',
      invalidToken: 'غلط یا میعاد ختم شدہ ری سیٹ لنک',
      requirements: 'پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے',
    },
  };

  const text = t[language as keyof typeof t] || t.en;

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const newPassword = form.watch('newPassword');

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setSubmitError('');

    if (!token) {
      setSubmitError(text.invalidToken);
      return;
    }

    try {
      await authApi.resetPassword({ token, newPassword: values.newPassword });
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Reset password error:', err);
      setSubmitError(getApiErrorMessage(err, text.errorMessage));
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (password.length < 8) return { strength: 1, label: 'Weak', color: 'bg-red-500' };
    if (password.length < 12) return { strength: 2, label: 'Fair', color: 'bg-yellow-500' };
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 3, label: 'Strong', color: 'bg-green-500' };
    }
    return { strength: 2, label: 'Fair', color: 'bg-yellow-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword || '');
  const isLoading = form.formState.isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{text.title}</CardTitle>
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

              <Link to="/login" className="block">
                <Button className="w-full">
                  {text.goToLogin}
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
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{text.newPasswordLabel}</FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder={text.newPasswordPlaceholder}
                            className="pl-10 pr-10"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>

                      {newPassword && (
                        <div className="space-y-1">
                          <div className="flex gap-1">
                            {[1, 2, 3].map((level) => (
                              <div
                                key={level}
                                className={`h-1 flex-1 rounded ${
                                  level <= passwordStrength.strength ? passwordStrength.color : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          {passwordStrength.label && (
                            <p className="text-xs text-muted-foreground">
                              Password strength: {passwordStrength.label}
                            </p>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">{text.requirements}</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{text.confirmPasswordLabel}</FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder={text.confirmPasswordPlaceholder}
                            className="pl-10 pr-10"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? text.submittingButton : text.submitButton}
                </Button>

                <Link to="/login" className="block">
                  <Button variant="outline" className="w-full" type="button">
                    {text.backToLogin}
                  </Button>
                </Link>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
