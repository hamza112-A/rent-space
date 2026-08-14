import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authApi } from '@/lib/api';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError(text.invalidEmail);
      return;
    }

    setIsLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err?.response?.data?.error?.message || text.errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setIsLoading(true);

    try {
      await authApi.forgotPassword(email);
      setError('');
    } catch (err: any) {
      console.error('Resend error:', err);
      setError(err?.response?.data?.error?.message || text.errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>{text.didntReceive}</span>
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={handleResend}
                  disabled={isLoading}
                >
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{text.emailLabel}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={text.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !email}
              >
                {isLoading ? text.submittingButton : text.submitButton}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
