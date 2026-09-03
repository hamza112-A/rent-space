import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Phone, RefreshCw } from 'lucide-react';
import { authApi } from '@/lib/api';
import { verifyOtpSchema, type VerifyOtpFormValues } from '@/lib/validation/auth';
import { getApiErrorMessage } from '@/lib/errors';

const VerifyOTP: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [verifyMethod, setVerifyMethod] = useState<'email' | 'phone'>('email');
  const [userInfo, setUserInfo] = useState<{ userId: string; email: string; phone: string; role: string } | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const form = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    // Get pending verification info from localStorage
    const pending = localStorage.getItem('pendingVerification');
    if (pending) {
      setUserInfo(JSON.parse(pending));
    } else {
      toast.error('No pending verification found');
      navigate('/register');
    }
  }, [navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const setOtpValue = (newOtp: string[]) => {
    setOtp(newOtp);
    form.setValue('otp', newOtp.join(''), { shouldValidate: form.formState.isSubmitted });
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtpValue(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtpValue(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onSubmit = async (values: VerifyOtpFormValues) => {
    if (!userInfo) {
      toast.error('User information not found');
      return;
    }

    try {
      await authApi.verifyOTP({
        userId: userInfo.userId,
        otp: values.otp,
        type: verifyMethod,
      });

      // Clear pending verification
      localStorage.removeItem('pendingVerification');

      toast.success('Verification successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Invalid OTP. Please try again.'));
      setOtpValue(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !userInfo) return;

    try {
      await authApi.resendOTP({
        userId: userInfo.userId,
        type: verifyMethod,
      });
      setResendCooldown(30);
      toast.success(`New OTP sent to your ${verifyMethod}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to resend OTP'));
    }
  };

  const isLoading = form.formState.isSubmitting;

  const maskedEmail = userInfo?.email
    ? userInfo.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : 'your@email.com';

  const maskedPhone = userInfo?.phone
    ? userInfo.phone.replace(/(\+\d{2}\s?\d{3})\s?\d+(\d{3})/, '$1 ****$2')
    : '+92 300 ****567';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/register" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {t.common.back}
        </Link>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
              {verifyMethod === 'email' ? (
                <Mail className="w-8 h-8 text-primary" />
              ) : (
                <Phone className="w-8 h-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold">{t.auth.verifyOTP}</CardTitle>
            <CardDescription>
              {t.auth.enterOTP}{' '}
              <span className="font-medium text-foreground">
                {verifyMethod === 'email' ? maskedEmail : maskedPhone}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Toggle between email and phone verification */}
            <div className="flex gap-2 mb-6">
              <Button
                type="button"
                variant={verifyMethod === 'email' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setVerifyMethod('email')}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                type="button"
                variant={verifyMethod === 'phone' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setVerifyMethod('phone')}
              >
                <Phone className="w-4 h-4 mr-2" />
                Phone
              </Button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="otp"
                  render={() => (
                    <FormItem>
                      <div className="flex justify-center gap-3">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => (inputRefs.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-border bg-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            autoFocus={index === 0}
                          />
                        ))}
                      </div>
                      <FormMessage className="text-center" />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? t.common.loading : 'Verify & Continue'}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Didn't receive the code?</p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className="gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : t.auth.resendOTP}
                  </Button>
                </div>
              </form>
            </Form>

            <div className="mt-6 p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium text-sm mb-2">Verification Tips</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Check your spam folder if you don't see the email</li>
                <li>• The code expires in 10 minutes</li>
                <li>• Contact support if you're having trouble</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyOTP;
