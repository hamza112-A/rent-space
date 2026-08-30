import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  CreditCard,
  Camera,
  Shield,
  AlertTriangle,
  ChevronRight,
  Upload,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userApi, authApi } from '@/lib/api';
import { toast } from 'sonner';

interface VerificationStatus {
  email: { verified: boolean; verifiedAt?: string };
  phone: { verified: boolean; verifiedAt?: string };
  identity: { verified: boolean; status: string; verifiedAt?: string; rejectionReason?: string };
  biometric: { verified: boolean; status: string; verifiedAt?: string; rejectionReason?: string };
}

type StepId = 'email' | 'phone' | 'identity' | 'biometric';

const Verification: React.FC = () => {
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // OTP dialog (email/phone)
  const [otpStep, setOtpStep] = useState<'email' | 'phone' | null>(null);
  const [otp, setOtp] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Identity dialog
  const [identityOpen, setIdentityOpen] = useState(false);
  const [documentType, setDocumentType] = useState<'cnic' | 'passport' | 'driving_license'>('cnic');
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [identitySubmitting, setIdentitySubmitting] = useState(false);

  // Biometric dialog
  const [biometricOpen, setBiometricOpen] = useState(false);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);
  const [livenessVideo, setLivenessVideo] = useState<File | null>(null);
  const [biometricSubmitting, setBiometricSubmitting] = useState(false);

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userApi.getVerificationStatus();
      setVerificationStatus(response.data?.data || null);
    } catch (err: any) {
      console.error('Failed to fetch verification status:', err);
      if (user) {
        setVerificationStatus({
          email: { verified: user.isEmailVerified || false },
          phone: { verified: user.isPhoneVerified || false },
          identity: { verified: false, status: 'not_submitted' },
          biometric: { verified: false, status: 'not_submitted' },
        });
      } else {
        setError('Failed to load verification status');
      }
    } finally {
      setLoading(false);
    }
  };

  const getVerificationSteps = () => {
    const status = verificationStatus;
    return [
      {
        id: 'email' as StepId,
        label: 'Email',
        description: 'Confirm your email address',
        icon: Mail,
        status: status?.email?.verified ? 'verified' : 'not_started',
        completedAt: status?.email?.verifiedAt,
      },
      {
        id: 'phone' as StepId,
        label: 'Phone',
        description: 'Confirm your phone number',
        icon: Phone,
        status: status?.phone?.verified ? 'verified' : 'not_started',
        completedAt: status?.phone?.verifiedAt,
      },
      {
        id: 'identity' as StepId,
        label: 'ID Document',
        description: 'Upload a government-issued ID',
        icon: CreditCard,
        status: status?.identity?.verified
          ? 'verified'
          : status?.identity?.status === 'pending'
            ? 'pending'
            : status?.identity?.status === 'rejected'
              ? 'rejected'
              : 'not_started',
        completedAt: status?.identity?.verifiedAt,
        rejectionReason: status?.identity?.rejectionReason,
      },
      {
        id: 'biometric' as StepId,
        label: 'Face Verification',
        description: 'Take a selfie to confirm it is you',
        icon: Camera,
        status: status?.biometric?.verified
          ? 'verified'
          : status?.biometric?.status === 'pending'
            ? 'pending'
            : status?.biometric?.status === 'rejected'
              ? 'rejected'
              : 'not_started',
        completedAt: status?.biometric?.verifiedAt,
        rejectionReason: status?.biometric?.rejectionReason,
      },
    ];
  };

  const verificationSteps = getVerificationSteps();
  const completedSteps = verificationSteps.filter((s) => s.status === 'verified').length;
  const progress = (completedSteps / verificationSteps.length) * 100;

  const isAccountVerified = completedSteps >= 1;
  const isFullyVerified = completedSteps === verificationSteps.length;
  const contactVerified = verificationStatus?.email?.verified && verificationStatus?.phone?.verified;

  const getVerificationLevel = () => {
    if (completedSteps === 4) return 'Fully Verified';
    if (completedSteps >= 2) return 'Verified';
    if (completedSteps === 1) return 'Basic Verified';
    return 'Unverified';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Verified</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending review</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Rejected</Badge>;
      default:
        return <Badge variant="outline">Not started</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // --- Email/Phone OTP flow ---
  const startOtpStep = async (type: 'email' | 'phone') => {
    if (!user?._id) return;
    setOtp('');
    setOtpStep(type);
    try {
      await authApi.resendOTP({ userId: user._id, type });
      setResendCooldown(60);
      toast.success(`Code sent to your ${type}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to send ${type} code`);
    }
  };

  const handleResendOtp = async () => {
    if (!user?._id || !otpStep || resendCooldown > 0) return;
    try {
      await authApi.resendOTP({ userId: user._id, type: otpStep });
      setResendCooldown(60);
      toast.success('Code resent');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    }
  };

  const handleVerifyOtp = async () => {
    if (!user?._id || !otpStep || otp.length !== 6) return;
    setOtpSubmitting(true);
    try {
      await authApi.verifyOTP({ userId: user._id, otp, type: otpStep });
      toast.success(`${otpStep === 'email' ? 'Email' : 'Phone'} verified!`);
      setOtpStep(null);
      fetchVerificationStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid code, please try again');
    } finally {
      setOtpSubmitting(false);
    }
  };

  // --- Identity upload flow ---
  const handleSubmitIdentity = async () => {
    if (!frontImage) {
      toast.error('Front image of your ID is required');
      return;
    }
    setIdentitySubmitting(true);
    try {
      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('frontImage', frontImage);
      if (backImage) formData.append('backImage', backImage);

      await userApi.uploadIDDocument(formData);
      toast.success('ID submitted — it is now pending review.');
      setIdentityOpen(false);
      setFrontImage(null);
      setBackImage(null);
      fetchVerificationStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit ID document');
    } finally {
      setIdentitySubmitting(false);
    }
  };

  // --- Biometric upload flow ---
  const handleSubmitBiometric = async () => {
    if (!selfieImage) {
      toast.error('A selfie photo is required');
      return;
    }
    setBiometricSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('selfieImage', selfieImage);
      if (livenessVideo) formData.append('livenessVideo', livenessVideo);

      await userApi.verifyBiometric(formData);
      toast.success('Selfie submitted — it is now pending review.');
      setBiometricOpen(false);
      setSelfieImage(null);
      setLivenessVideo(null);
      fetchVerificationStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit selfie');
    } finally {
      setBiometricSubmitting(false);
    }
  };

  const handleStartVerification = (stepId: StepId) => {
    if (stepId === 'email' || stepId === 'phone') {
      startOtpStep(stepId);
      return;
    }
    if (!contactVerified) {
      toast.info('Verify your email and phone first.');
      return;
    }
    if (stepId === 'identity') setIdentityOpen(true);
    if (stepId === 'biometric') setBiometricOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchVerificationStatus}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Verification</h1>
        <p className="text-muted-foreground">Build trust with owners and borrowers by verifying your account.</p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" className="stroke-muted" strokeWidth="12" fill="none" />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  className="stroke-primary"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${progress * 3.51} 351`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">{Math.round(progress)}%</p>
                  <p className="text-xs text-muted-foreground">Complete</p>
                </div>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-semibold text-foreground">
                {isFullyVerified ? 'Fully Verified!' : isAccountVerified ? 'Account Verified!' : 'Get Verified'}
              </h3>
              <p className="text-muted-foreground mt-1">
                {completedSteps} of {verificationSteps.length} verification steps completed
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {isAccountVerified ? (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
                    <Shield className="h-3 w-3" /> {getVerificationLevel()}
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
                    <AlertTriangle className="h-3 w-3" /> Not Verified
                  </Badge>
                )}
                {isAccountVerified && !isFullyVerified && (
                  <Badge variant="outline" className="gap-1">
                    Complete more steps for higher trust
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Verification Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium text-foreground">Trusted Badge</h4>
              <p className="text-sm text-muted-foreground mt-1">Stand out with a verified badge on your profile</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium text-foreground">Higher Visibility</h4>
              <p className="text-sm text-muted-foreground mt-1">Your listings appear higher in search results</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium text-foreground">Instant Bookings</h4>
              <p className="text-sm text-muted-foreground mt-1">Enable instant booking for your listings</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Steps</CardTitle>
          <CardDescription>Complete all steps to become a verified member</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {verificationSteps.map((step) => {
              const Icon = step.icon;
              const locked = (step.id === 'identity' || step.id === 'biometric') && !contactVerified;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                    step.status === 'verified'
                      ? 'border-green-500/20 bg-green-500/5'
                      : step.status === 'pending'
                        ? 'border-amber-500/20 bg-amber-500/5'
                        : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">{step.label}</h4>
                      {getStatusBadge(step.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                    {step.completedAt && step.status === 'verified' && (
                      <p className="text-xs text-green-600 mt-1">Completed on {formatDate(step.completedAt)}</p>
                    )}
                    {step.status === 'pending' && <p className="text-xs text-amber-600 mt-1">Under review</p>}
                    {step.status === 'rejected' && step.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">Reason: {step.rejectionReason}</p>
                    )}
                    {locked && step.status === 'not_started' && (
                      <p className="text-xs text-muted-foreground mt-1">Verify email and phone first</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusIcon(step.status)}
                    {step.status === 'not_started' && (
                      <Button
                        size="sm"
                        className="gap-1"
                        disabled={locked}
                        onClick={() => handleStartVerification(step.id)}
                      >
                        Start <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                    {step.status === 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => handleStartVerification(step.id)}
                      >
                        Retry <Upload className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground">Your data is secure</h4>
              <p className="text-sm text-muted-foreground mt-1">
                All verification documents are encrypted and securely stored. We never share your personal information
                with third parties without your consent.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email/Phone OTP Dialog */}
      <Dialog open={!!otpStep} onOpenChange={(open) => !open && setOtpStep(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify your {otpStep}</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code we sent to your {otpStep === 'email' ? user?.email : user?.phone}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-lg tracking-widest"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0}
            >
              <RefreshCw className={`h-3 w-3 ${resendCooldown > 0 ? '' : ''}`} />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOtpStep(null)} disabled={otpSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleVerifyOtp} disabled={otp.length !== 6 || otpSubmitting} className="gap-2">
              {otpSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Identity Upload Dialog */}
      <Dialog open={identityOpen} onOpenChange={setIdentityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload ID Document</DialogTitle>
            <DialogDescription>Submit a clear photo of a government-issued ID.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Document type</Label>
              <Select
                value={documentType}
                onValueChange={(v: 'cnic' | 'passport' | 'driving_license') => setDocumentType(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cnic">CNIC</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="driving_license">Driving License</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Front image</Label>
              <Input type="file" accept="image/*" onChange={(e) => setFrontImage(e.target.files?.[0] || null)} />
              {frontImage && (
                <img
                  src={URL.createObjectURL(frontImage)}
                  alt="Front preview"
                  className="mt-2 h-32 rounded-lg border object-cover"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Back image (optional)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setBackImage(e.target.files?.[0] || null)} />
              {backImage && (
                <img
                  src={URL.createObjectURL(backImage)}
                  alt="Back preview"
                  className="mt-2 h-32 rounded-lg border object-cover"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIdentityOpen(false)} disabled={identitySubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitIdentity} disabled={identitySubmitting || !frontImage} className="gap-2">
              {identitySubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Biometric Upload Dialog */}
      <Dialog open={biometricOpen} onOpenChange={setBiometricOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Face Verification</DialogTitle>
            <DialogDescription>Take or upload a clear selfie so we can confirm it's you.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <Camera className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Your browser will ask for camera access next — this is only used to capture your selfie for
                verification and is never shared with other users.
              </span>
            </div>
            <div className="space-y-2">
              <Label>Selfie photo</Label>
              <Input
                type="file"
                accept="image/*"
                capture="user"
                onChange={(e) => setSelfieImage(e.target.files?.[0] || null)}
              />
              {selfieImage && (
                <img
                  src={URL.createObjectURL(selfieImage)}
                  alt="Selfie preview"
                  className="mt-2 h-32 rounded-lg border object-cover"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Liveness video (optional)</Label>
              <Input
                type="file"
                accept="video/*"
                capture="user"
                onChange={(e) => setLivenessVideo(e.target.files?.[0] || null)}
              />
              {livenessVideo && (
                <video
                  src={URL.createObjectURL(livenessVideo)}
                  className="mt-2 h-32 rounded-lg border"
                  controls
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBiometricOpen(false)} disabled={biometricSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitBiometric} disabled={biometricSubmitting || !selfieImage} className="gap-2">
              {biometricSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Verification;
