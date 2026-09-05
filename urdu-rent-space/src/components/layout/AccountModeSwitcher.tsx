import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, ShoppingBag, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Only meaningful for a user with both the owner and buyer capabilities —
// lets them jump between the two dashboards without going through Settings.
// Renders nothing for a single-role account, since there's nothing to
// switch to.
const AccountModeSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { user, setActiveMode } = useAuth();
  const navigate = useNavigate();

  if (!user || user.role !== 'both') return null;

  const mode: 'owner' | 'borrower' = user.activeMode === 'borrower' ? 'borrower' : 'owner';

  const handleSwitch = async (next: 'owner' | 'borrower') => {
    if (next === mode) return;
    await setActiveMode(next);
    navigate(next === 'owner' ? '/dashboard/owner' : '/dashboard/buyer');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={`gap-2 ${className || ''}`}>
          {mode === 'owner' ? <Building2 className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
          <span>{mode === 'owner' ? 'Owner mode' : 'Buyer mode'}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleSwitch('owner')} className="gap-2">
          <Building2 className="h-4 w-4" /> Owner mode
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSwitch('borrower')} className="gap-2">
          <ShoppingBag className="h-4 w-4" /> Buyer mode
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountModeSwitcher;
