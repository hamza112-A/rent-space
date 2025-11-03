import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Upload
} from 'lucide-react';

const Verification: React.FC = () => {
  const verificationSteps = [
    {
      id: 'email',
      label: 'Email Verification',
      description: 'Verify your email address',
      icon: Mail,
      status: 'verified',
      completedAt: 'Dec 1, 2025',
    },
    {
      id: 'phone',
      label: 'Phone Verification',
      description: 'Verify your mobile number via OTP',
      icon: Phone,
      status: 'verified',
      completedAt: 'Dec 1, 2025',
    },
    {
      id: 'cnic',
      label: 'CNIC Verification',
      description: 'Upload your National ID card',
      icon: CreditCard,
      status: 'pending',
      submittedAt: 'Dec 20, 2025',
    },
    {
      id: 'address',
      label: 'Address Verification',
      description: 'Verify your residential address',
      icon: FileText,
      status: 'not_started',
    },
    {
      id: 'selfie',
      label: 'Photo Verification',
      description: 'Take a selfie holding your ID',
      icon: Camera,
      status: 'not_started',
    },
  ];

  const completedSteps = verificationSteps.filter(s => s.status === 'verified').length;
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
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  className="stroke-muted"
                  strokeWidth="12"
                  fill="none"
                />
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
                {completedSteps === verificationSteps.length 
                  ? 'Fully Verified!' 
                  : 'Almost There!'}
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
              <p className="text-sm text-muted-foreground mt-1">
                Stand out with a verified badge on your profile
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium text-foreground">Higher Visibility</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Your listings appear higher in search results
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium text-foreground">Instant Bookings</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Enable instant booking for your listings
              </p>
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
            {verificationSteps.map((step, index) => {
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
                    {step.completedAt && (
                      <p className="text-xs text-green-600 mt-1">Completed on {step.completedAt}</p>
                    )}
                    {step.submittedAt && step.status === 'pending' && (
                      <p className="text-xs text-amber-600 mt-1">Submitted on {step.submittedAt} - Under review</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(step.status)}
                    {step.status === 'not_started' && (
                      <Button size="sm" className="gap-1">
                        Start <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                    {step.status === 'rejected' && (
                      <Button size="sm" variant="outline" className="gap-1">
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
                All verification documents are encrypted and securely stored. We never share your personal 
                information with third parties without your consent.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Verification;
