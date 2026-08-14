import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authApi } from '@/lib/api';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

const ResetPassword = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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
      passwordMismatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 8 characters',
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
      passwordMismatch: 'پاس ورڈ مماثل نہیں ہیں',
      passwordTooShort: 'پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے',
      invalidToken: 'غلط یا میعاد ختم شدہ ری سیٹ لنک',
      requirements: 'پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے',
    },
  };

  const text = t[language as keyof typeof t] || t.en;

  const validatePassword = () => {
    if (newPassword.length < 8) {
      setError(text.passwordTooShort);
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError(text.passwordMismatch);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePassword()) {
      return;
    }

    if (!token) {
      setError(text.invalidToken);
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword({ token, newPassword });
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err?.response?.data?.error?.message || text.errorMessage);
    } finally {
      setIsLoading(false);
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

  const passwordStrength = getPasswordStrength(newPassword);

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
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword">{text.newPasswordLabel}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={text.newPasswordPlaceholder}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
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
                            level <= passwordStrength.strength
                              ? passwordStrength.color
                              : 'bg-gray-200'
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{text.confirmPasswordLabel}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={text.confirmPasswordPlaceholder}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-500">{text.passwordMismatch}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !newPassword || !confirmPassword}
              >
                {isLoading ? text.submittingButton : text.submitButton}
              </Button>

              <Link to="/login" className="block">
                <Button variant="outline" className="w-full" type="button">
                  {text.backToLogin}
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
