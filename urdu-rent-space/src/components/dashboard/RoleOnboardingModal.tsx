import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Building2, ShoppingBag, Wallet, ShieldCheck, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userApi } from '@/lib/api';

interface RoleOnboardingModalProps {
  open: boolean;
  role: 'owner' | 'borrower';
  onClose: () => void;
}

// Short, skippable one-time intro shown right after a user adds a role
// capability they didn't have at signup — orients them in the new dashboard
// instead of dropping them in silently.
const RoleOnboardingModal: React.FC<RoleOnboardingModalProps> = ({ open, role, onClose }) => {
  const { updateUser, user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const complete = async (goTo?: string) => {
    setSubmitting(true);
    try {
      await userApi.updateProfile({ completeRoleOnboarding: role });
      if (user) {
        const profileKey = role === 'owner' ? 'ownerProfile' : 'buyerProfile';
        updateUser({
          ...user,
          [profileKey]: { ...(user as any)[profileKey], onboardingCompletedAt: new Date().toISOString() },
        });
      }
      onClose();
      if (goTo) navigate(goTo);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && complete()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {role === 'owner' ? <Building2 className="h-5 w-5 text-primary" /> : <ShoppingBag className="h-5 w-5 text-secondary" />}
            {role === 'owner' ? "You're now an Owner" : "You're now a Buyer"}
          </DialogTitle>
          <DialogDescription>
            {role === 'owner'
              ? "You can list items for rent. A couple of things to set up before your first listing:"
              : 'You can now book items from other owners. A couple of quick tips:'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {role === 'owner' ? (
            <>
              <div className="flex items-start gap-3 text-sm">
                <Wallet className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span>Add a payout method in Settings so you can get paid for completed bookings.</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <ShieldCheck className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span>Verified owners get more bookings — finish identity verification when you can.</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 text-sm">
                <Bell className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span>You'll get notified here about your booking requests and messages from owners.</span>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => complete()} disabled={submitting}>
            Skip for now
          </Button>
          <Button onClick={() => complete(role === 'owner' ? '/dashboard/owner?tab=verification' : undefined)} disabled={submitting}>
            {role === 'owner' ? 'Go to Verification' : 'Got it'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoleOnboardingModal;
