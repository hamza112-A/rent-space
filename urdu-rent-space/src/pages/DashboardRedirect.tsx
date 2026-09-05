import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// `/dashboard` is kept as a stable, bookmarkable entry point that sends the
// user to whichever dashboard matches their account: a single-role user
// always goes to their one dashboard, a 'both' user goes to whichever mode
// they last used (activeMode). Preserves the query string (e.g.
// `?tab=settings`) so existing deep links like the Stripe Connect return
// redirect keep working.
const DashboardRedirect: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const base = user?.role === 'borrower'
    ? '/dashboard/buyer'
    : user?.role === 'both' && user.activeMode === 'borrower'
      ? '/dashboard/buyer'
      : '/dashboard/owner';

  return <Navigate to={`${base}${location.search}`} replace />;
};

export default DashboardRedirect;
