import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Bell,
  Shield,
  Globe,
  CreditCard,
  Trash2,
  Camera,
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  Plus,
  Smartphone,
  Building,
  Star,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { userApi, authApi, paymentApi } from '@/lib/api';
import { toast } from 'sonner';

const AccountSettings: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { user, updateUser, logout, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [currency, setCurrency] = useState('PKR');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Password change dialog
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'jazzcash',
    mobileNumber: '',
    accountTitle: '',
    cardNumber: '',
    cardName: '',
    expiry: '',
    bankName: '',
    accountNumber: '',
  });

  // 2FA state
  const [twoFAStatus, setTwoFAStatus] = useState<{ enabled: boolean; backupCodesRemaining: number }>({ enabled: false, backupCodesRemaining: 0 });
  const [twoFADialogOpen, setTwoFADialogOpen] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState<'setup' | 'verify' | 'backup' | 'disable'>('setup');
  const [twoFAData, setTwoFAData] = useState<{ qrCode: string; secret: string; backupCodes: string[] }>({ qrCode: '', secret: '', backupCodes: [] });
  const [twoFAToken, setTwoFAToken] = useState('');
  const [twoFAPassword, setTwoFAPassword] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    bio: '',
    address: '',
  });
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: false,
    marketing: false,
  });

  useEffect(() => {
    fetchUserProfile();
    fetchPaymentMethods();
    fetch2FAStatus();
  }, []);

  const fetch2FAStatus = async () => {
    try {
      const response = await authApi.get2FAStatus();
      setTwoFAStatus(response.data?.data || { enabled: false, backupCodesRemaining: 0 });
    } catch (err) {
      console.error('Failed to fetch 2FA status:', err);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await paymentApi.getMethods();
      setPaymentMethods(response.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch payment methods:', err);
    }
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await userApi.getProfile();
      const userData = response.data?.data;
      if (userData) {
        setFormData({
          fullName: userData.fullName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          bio: userData.bio || '',
          address: userData.location?.address || '',
        });
        setProfileImage(userData.avatar?.url || null);
        if (userData.preferences?.currency) {
          setCurrency(userData.preferences.currency);
        }
        if (userData.preferences?.notifications) {
          setNotifications({
            email: userData.preferences.notifications.email ?? true,
            sms: userData.preferences.notifications.sms ?? true,
            push: userData.preferences.notifications.push ?? false,
            marketing: userData.preferences.notifications.marketing ?? false,
          });
        }
      }
    } catch (err) {
      // Fallback to auth context user data
      if (user) {
        setFormData({
          fullName: user.fullName || '',
          email: user.email || '',
          phone: user.phone || '',
          bio: '',
          address: '',
        });
        setProfileImage(user.profileImage || null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await userApi.updateProfile(formData);
      
      if (response.data?.data) {
        const newImageUrl = response.data.data.avatar?.url || response.data.data.profileImage;
        setProfileImage(newImageUrl);
        updateUser(response.data.data);
        await checkAuth(); // Refresh user data
        toast.success('Profile picture updated successfully');
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await userApi.updateProfile({
        fullName: formData.fullName,
        bio: formData.bio,
        location: { address: formData.address },
        preferences: {
          notifications: notifications,
          currency: currency,
        },
      });
      if (response.data?.data) {
        updateUser(response.data.data);
      }
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      setChangingPassword(true);
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordDialogOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password');
      return;
    }

    try {
      setDeletingAccount(true);
      await authApi.deleteAccount(deletePassword);
      toast.success('Account deleted successfully');
      setDeleteDialogOpen(false);
      logout();
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      setAddingPayment(true);
      
      let details: Record<string, string> = {};
      
      if (newPaymentMethod.type === 'jazzcash' || newPaymentMethod.type === 'easypaisa') {
        if (!newPaymentMethod.mobileNumber) {
          toast.error('Mobile number is required');
          return;
        }
        details = {
          mobileNumber: newPaymentMethod.mobileNumber,
          accountTitle: newPaymentMethod.accountTitle,
        };
      } else if (newPaymentMethod.type === 'card') {
        if (!newPaymentMethod.cardNumber || !newPaymentMethod.cardName || !newPaymentMethod.expiry) {
          toast.error('Please fill all card details');
          return;
        }
        const [expiryMonth, expiryYear] = newPaymentMethod.expiry.split('/');
        details = {
          cardNumber: newPaymentMethod.cardNumber,
          cardName: newPaymentMethod.cardName,
          expiryMonth,
          expiryYear,
        };
      } else if (newPaymentMethod.type === 'bank') {
        if (!newPaymentMethod.bankName || !newPaymentMethod.accountNumber) {
          toast.error('Please fill all bank details');
          return;
        }
        details = {
          bankName: newPaymentMethod.bankName,
          accountNumber: newPaymentMethod.accountNumber,
          accountTitle: newPaymentMethod.accountTitle,
        };
      }

      await paymentApi.addMethod({
        type: newPaymentMethod.type,
        details,
      });

      toast.success('Payment method added');
      setPaymentDialogOpen(false);
      setNewPaymentMethod({
        type: 'jazzcash',
        mobileNumber: '',
        accountTitle: '',
        cardNumber: '',
        cardName: '',
        expiry: '',
        bankName: '',
        accountNumber: '',
      });
      fetchPaymentMethods();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add payment method');
    } finally {
      setAddingPayment(false);
    }
  };

  const handleDeletePaymentMethod = async (methodId: string) => {
    try {
      await paymentApi.deleteMethod(methodId);
      toast.success('Payment method removed');
      fetchPaymentMethods();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove payment method');
    }
  };

  const handleSetDefaultPaymentMethod = async (methodId: string) => {
    try {
      await paymentApi.setDefaultMethod(methodId);
      toast.success('Default payment method updated');
      fetchPaymentMethods();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update default method');
    }
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'jazzcash':
      case 'easypaisa':
        return <Smartphone className="h-5 w-5" />;
      case 'card':
        return <CreditCard className="h-5 w-5" />;
      case 'bank':
        return <Building className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getPaymentMethodLabel = (method: any) => {
    switch (method.type) {
      case 'jazzcash':
        return `JazzCash - ${method.details?.mobileNumber || ''}`;
      case 'easypaisa':
        return `Easypaisa - ${method.details?.mobileNumber || ''}`;
      case 'card':
        return `Card ending in ${method.details?.cardNumber?.slice(-4) || '****'}`;
      case 'bank':
        return `${method.details?.bankName || 'Bank'} - ${method.details?.accountNumber || ''}`;
      default:
        return method.type;
    }
  };

  // 2FA handlers
  const handleSetup2FA = async () => {
    try {
      setTwoFALoading(true);
      const response = await authApi.setup2FA();
      setTwoFAData({
        qrCode: response.data?.data?.qrCode || '',
        secret: response.data?.data?.secret || '',
        backupCodes: [],
      });
      setTwoFAStep('verify');
      setTwoFADialogOpen(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to setup 2FA');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!twoFAToken || twoFAToken.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    try {
      setTwoFALoading(true);
      const response = await authApi.verify2FA(twoFAToken);
      setTwoFAData(prev => ({
        ...prev,
        backupCodes: response.data?.data?.backupCodes || [],
      }));
      setTwoFAStep('backup');
      setTwoFAStatus({ enabled: true, backupCodesRemaining: 10 });
      toast.success('2FA enabled successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!twoFAPassword) {
      toast.error('Please enter your password');
      return;
    }

    try {
      setTwoFALoading(true);
      await authApi.disable2FA({ password: twoFAPassword, token: twoFAToken || undefined });
      setTwoFAStatus({ enabled: false, backupCodesRemaining: 0 });
      setTwoFADialogOpen(false);
      setTwoFAPassword('');
      setTwoFAToken('');
      toast.success('2FA disabled successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleOpen2FADialog = () => {
    if (twoFAStatus.enabled) {
      setTwoFAStep('disable');
    } else {
      setTwoFAStep('setup');
    }
    setTwoFAToken('');
    setTwoFAPassword('');
    setTwoFADialogOpen(true);
    if (!twoFAStatus.enabled) {
      handleSetup2FA();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile and preferences</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold overflow-hidden">
                {profileImage || user?.profileImage ? (
                  <img 
                    src={profileImage || user?.profileImage} 
                    alt={formData.fullName || 'Profile'} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  getInitials(formData.fullName || user?.fullName || 'U')
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button 
                size="icon" 
                variant="outline" 
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <div className="flex gap-2">
                <Input id="email" value={formData.email} disabled className="flex-1" />
                <Badge className={user?.isEmailVerified ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}>
                  {user?.isEmailVerified ? 'Verified' : 'Pending'}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <div className="flex gap-2">
                <Input id="phone" value={formData.phone} disabled className="flex-1" />
                <Badge className={user?.isPhoneVerified ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}>
                  {user?.isPhoneVerified ? 'Verified' : 'Pending'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </Label>
            <Input 
              id="address" 
              placeholder="Enter your address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>

          <div className="flex justify-end">
            <Button className="gap-2" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive booking updates via email</p>
            </div>
            <Switch 
              checked={notifications.email} 
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email: checked }))}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">SMS Notifications</p>
              <p className="text-sm text-muted-foreground">Receive booking alerts via SMS</p>
            </div>
            <Switch 
              checked={notifications.sms} 
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, sms: checked }))}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Push Notifications</p>
              <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
            </div>
            <Switch 
              checked={notifications.push} 
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, push: checked }))}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Marketing Emails</p>
              <p className="text-sm text-muted-foreground">Receive tips, offers and updates</p>
            </div>
            <Switch 
              checked={notifications.marketing} 
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, marketing: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Language & Region
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={(value: 'en' | 'ur') => setLanguage(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ur">اردو (Urdu)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PKR">PKR - Pakistani Rupee</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Password</p>
              <p className="text-sm text-muted-foreground">Change your password</p>
            </div>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>Change Password</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              {twoFAStatus.enabled && (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  Enabled
                </Badge>
              )}
            </div>
            <Button 
              variant={twoFAStatus.enabled ? "destructive" : "outline"} 
              onClick={handleOpen2FADialog}
              disabled={twoFALoading}
            >
              {twoFALoading ? 'Loading...' : twoFAStatus.enabled ? 'Disable 2FA' : 'Enable 2FA'}
            </Button>
          </div>
          {twoFAStatus.enabled && twoFAStatus.backupCodesRemaining < 3 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-600">
                ⚠️ You have only {twoFAStatus.backupCodesRemaining} backup codes remaining. Consider regenerating them.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
          <CardDescription>Manage your payment and payout methods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentMethods.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No payment methods added yet</p>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method._id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      {getPaymentMethodIcon(method.type)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{getPaymentMethodLabel(method)}</p>
                      {method.details?.accountTitle && (
                        <p className="text-sm text-muted-foreground">{method.details.accountTitle}</p>
                      )}
                    </div>
                    {method.isDefault && (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        <Star className="h-3 w-3 mr-1" /> Default
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefaultPaymentMethod(method._id)}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeletePaymentMethod(method._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" className="w-full gap-2" onClick={() => setPaymentDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Payment Method
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Logout</p>
              <p className="text-sm text-muted-foreground">Sign out of your account</p>
            </div>
            <Button variant="outline" onClick={() => logout()}>Logout</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>Delete Account</Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data, listings, and bookings will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">
                Warning: This will permanently delete your account and all associated data including listings, bookings, messages, and reviews.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deletePassword">Enter your password to confirm</Label>
              <Input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deletingAccount}>
              {deletingAccount ? 'Deleting...' : 'Delete My Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Payment Method Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Add a new payment method for transactions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Payment Type</Label>
              <RadioGroup
                value={newPaymentMethod.type}
                onValueChange={(value) => setNewPaymentMethod(prev => ({ ...prev, type: value }))}
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="jazzcash"
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    newPaymentMethod.type === 'jazzcash' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <RadioGroupItem value="jazzcash" id="jazzcash" />
                  <Smartphone className="h-4 w-4 text-red-500" />
                  <span>JazzCash</span>
                </Label>
                <Label
                  htmlFor="easypaisa"
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    newPaymentMethod.type === 'easypaisa' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <RadioGroupItem value="easypaisa" id="easypaisa" />
                  <Smartphone className="h-4 w-4 text-green-500" />
                  <span>Easypaisa</span>
                </Label>
                <Label
                  htmlFor="card"
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    newPaymentMethod.type === 'card' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <RadioGroupItem value="card" id="card" />
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  <span>Card</span>
                </Label>
                <Label
                  htmlFor="bank"
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    newPaymentMethod.type === 'bank' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <RadioGroupItem value="bank" id="bank" />
                  <Building className="h-4 w-4 text-purple-500" />
                  <span>Bank</span>
                </Label>
              </RadioGroup>
            </div>

            {/* Mobile Wallet Fields */}
            {(newPaymentMethod.type === 'jazzcash' || newPaymentMethod.type === 'easypaisa') && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">Mobile Number</Label>
                  <Input
                    id="mobileNumber"
                    placeholder="03XX XXXXXXX"
                    value={newPaymentMethod.mobileNumber}
                    onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, mobileNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountTitle">Account Title (Optional)</Label>
                  <Input
                    id="accountTitle"
                    placeholder="Account holder name"
                    value={newPaymentMethod.accountTitle}
                    onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, accountTitle: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Card Fields */}
            {newPaymentMethod.type === 'card' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={newPaymentMethod.cardNumber}
                    onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, cardNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardName">Name on Card</Label>
                  <Input
                    id="cardName"
                    placeholder="AHMED KHAN"
                    value={newPaymentMethod.cardName}
                    onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, cardName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={newPaymentMethod.expiry}
                    onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, expiry: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Bank Fields */}
            {newPaymentMethod.type === 'bank' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Select
                    value={newPaymentMethod.bankName}
                    onValueChange={(value) => setNewPaymentMethod(prev => ({ ...prev, bankName: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HBL">Habib Bank Limited (HBL)</SelectItem>
                      <SelectItem value="UBL">United Bank Limited (UBL)</SelectItem>
                      <SelectItem value="MCB">MCB Bank</SelectItem>
                      <SelectItem value="ABL">Allied Bank Limited (ABL)</SelectItem>
                      <SelectItem value="Meezan">Meezan Bank</SelectItem>
                      <SelectItem value="Faysal">Faysal Bank</SelectItem>
                      <SelectItem value="Bank Alfalah">Bank Alfalah</SelectItem>
                      <SelectItem value="Standard Chartered">Standard Chartered</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number / IBAN</Label>
                  <Input
                    id="accountNumber"
                    placeholder="Enter account number"
                    value={newPaymentMethod.accountNumber}
                    onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, accountNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccountTitle">Account Title</Label>
                  <Input
                    id="bankAccountTitle"
                    placeholder="Account holder name"
                    value={newPaymentMethod.accountTitle}
                    onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, accountTitle: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPaymentMethod} disabled={addingPayment}>
              {addingPayment ? 'Adding...' : 'Add Method'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Dialog */}
      <Dialog open={twoFADialogOpen} onOpenChange={setTwoFADialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {twoFAStep === 'disable' ? 'Disable Two-Factor Authentication' : 'Enable Two-Factor Authentication'}
            </DialogTitle>
            <DialogDescription>
              {twoFAStep === 'setup' && 'Setting up 2FA...'}
              {twoFAStep === 'verify' && 'Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)'}
              {twoFAStep === 'backup' && 'Save these backup codes in a safe place. You can use them if you lose access to your authenticator app.'}
              {twoFAStep === 'disable' && 'Enter your password to disable 2FA'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {twoFAStep === 'verify' && (
              <>
                {twoFAData.qrCode && (
                  <div className="flex justify-center">
                    <img src={twoFAData.qrCode} alt="2FA QR Code" className="w-48 h-48" />
                  </div>
                )}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Or enter this code manually:</p>
                  <code className="px-3 py-2 bg-muted rounded text-sm font-mono">{twoFAData.secret}</code>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="twoFAToken">Enter 6-digit code from your app</Label>
                  <Input
                    id="twoFAToken"
                    placeholder="000000"
                    value={twoFAToken}
                    onChange={(e) => setTwoFAToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                  />
                </div>
              </>
            )}

            {twoFAStep === 'backup' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {twoFAData.backupCodes.map((code, index) => (
                    <div key={index} className="px-3 py-2 bg-muted rounded text-center font-mono text-sm">
                      {code}
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm text-amber-600">
                    ⚠️ These codes will only be shown once. Save them now!
                  </p>
                </div>
              </div>
            )}

            {twoFAStep === 'disable' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="disablePassword">Password</Label>
                  <Input
                    id="disablePassword"
                    type="password"
                    value={twoFAPassword}
                    onChange={(e) => setTwoFAPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disableToken">2FA Code (optional)</Label>
                  <Input
                    id="disableToken"
                    placeholder="000000"
                    value={twoFAToken}
                    onChange={(e) => setTwoFAToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {twoFAStep === 'verify' && (
              <>
                <Button variant="outline" onClick={() => setTwoFADialogOpen(false)}>Cancel</Button>
                <Button onClick={handleVerify2FA} disabled={twoFALoading || twoFAToken.length !== 6}>
                  {twoFALoading ? 'Verifying...' : 'Verify & Enable'}
                </Button>
              </>
            )}
            {twoFAStep === 'backup' && (
              <Button onClick={() => setTwoFADialogOpen(false)}>Done</Button>
            )}
            {twoFAStep === 'disable' && (
              <>
                <Button variant="outline" onClick={() => setTwoFADialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDisable2FA} disabled={twoFALoading}>
                  {twoFALoading ? 'Disabling...' : 'Disable 2FA'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountSettings;
