import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  CreditCard,
  FileText,
  Camera,
  Shield,
  AlertTriangle,
  ChevronRight,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userApi } from '@/lib/api';
import { toast } from 'sonner';

interface VerificationStatus {
  email: { verified: boolean; verifiedAt?: string };
  phone: { verified: boolean; verifiedAt?: string };
  identity: { verified: boolean; status: string; verifiedAt?: string };
  biometric: { verified: boolean; status: string; verifiedAt?: string };
}

const Verification: React.FC = () => {
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userApi.getVerificationStatus();
      console.log('Verification status response:', response.data);
      setVerificationStatus(response.data?.data || null);
    } catch (err: any) {
      console.error('Failed to fetch verification status:', err);
      // Use user data as fallback
      if (user) {
        console.log('Using fallback user data:', user);
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
        id: 'email',
        label: 'Email Verification',
        description: 'Verify your email address',
        icon: Mail,
        status: status?.email?.verified ? 'verified' : 'not_started',
        completedAt: status?.email?.verifiedAt,
      },
      {
        id: 'phone',
        label: 'Phone Verification',
        description: 'Verify your mobile number via OTP',
        icon: Phone,
        status: status?.phone?.verified ? 'verified' : 'not_started',
        completedAt: status?.phone?.verifiedAt,
      },
      {
        id: 'identity',
        label: 'ID Verification',
        description: 'Upload your National ID card (CNIC/Passport)',
        icon: CreditCard,
        status: status?.identity?.verified
          ? 'verified'
          : status?.identity?.status === 'pending'
            ? 'pending'
            : status?.identity?.status === 'rejected'
              ? 'rejected'
              : 'not_started',
        completedAt: status?.identity?.verifiedAt,
      },
      {
        id: 'biometric',
        label: 'Photo Verification',
        description: 'Take a selfie for identity confirmation',
        icon: Camera,
        status: status?.biometric?.verified
          ? 'verified'
          : status?.biometric?.status === 'pending'
            ? 'pending'
            : status?.biometric?.status === 'rejected'
              ? 'rejected'
              : 'not_started',
        completedAt: status?.biometric?.verifiedAt,
      },
    ];
  };

  const verificationSteps = getVerificationSteps();
  const completedSteps = verificationSteps.filter((s) => s.status === 'verified').length;
  const progress = (completedSteps / verificationSteps.length) * 100;

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
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending Review</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Rejected</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleStartVerification = (stepId: string) => {
    toast.info(`${stepId} verification coming soon!`);
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
        <h1 className="text-2xl font-bold text-foreground">Verification Status</h1>
        <p className="text-muted-foreground">Complete verification to unlock all features</p>
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
                {completedSteps === verificationSteps.length ? 'Fully Verified!' : 'Almost There!'}
              </h3>
              <p className="text-muted-foreground mt-1">
                {completedSteps} of {verificationSteps.length} verification steps completed
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {completedSteps === verificationSteps.length ? (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
                    <Shield className="h-3 w-3" /> Trusted Member
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
                    <AlertTriangle className="h-3 w-3" /> Verification Incomplete
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
                    {step.status === 'pending' && (
                      <p className="text-xs text-amber-600 mt-1">Under review</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusIcon(step.status)}
                    {step.status === 'not_started' && (
                      <Button size="sm" className="gap-1" onClick={() => handleStartVerification(step.id)}>
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
    </div>
  );
};

export default Verification;