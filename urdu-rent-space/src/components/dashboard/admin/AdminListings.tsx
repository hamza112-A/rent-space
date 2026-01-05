import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, MoreHorizontal, CheckCircle, X, Star, Trash2, AlertTriangle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';

interface Listing {
  _id: string;
  title: string;
  category: string;
  status: string;
  verified: boolean;
  featured: boolean;
  pricing: { daily: number };
  owner: { fullName: string };
  createdAt: string;
  images: Array<{ url: string }>;
}

const AdminListings: React.FC = () => {
  const { t } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: string; listing: Listing | null }>({ open: false, type: '', listing: null });
  const [actionData, setActionData] = useState({ status: '', reason: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchListings(); }, [page, statusFilter, categoryFilter]);
  
  useEffect(() => {
    const timeout = setTimeout(() => { page === 1 ? fetchListings() : setPage(1); }, 500);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getListings({ page, limit: 20, status: statusFilter || undefined, category: categoryFilter || undefined });
      setListings(response.data?.data || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch { toast.error('Failed to load listings'); }
    finally { setLoading(false); }
  };

  const handleAction = async () => {
    if (!actionDialog.listing) return;
    try {
      setActionLoading(true);
      const id = actionDialog.listing._id;
      if (actionDialog.type === 'status') {
        await adminApi.updateListingStatus(id, { status: actionData.status, reason: actionData.reason });
        toast.success(`Listing ${actionData.status}`);
      } else if (actionDialog.type === 'verify') {
        await adminApi.verifyListing(id, !actionDialog.listing.verified);
        toast.success(`Listing ${actionDialog.listing.verified ? 'unverified' : 'verified'}`);
      } else if (actionDialog.type === 'feature') {
        await adminApi.featureListing(id, !actionDialog.listing.featured);
        toast.success(`Listing ${actionDialog.listing.featured ? 'unfeatured' : 'featured'}`);
      } else if (actionDialog.type === 'delete') {
        await adminApi.deleteListing(id);
        toast.success('Listing deleted');
      }
      setActionDialog({ open: false, type: '', listing: null });
      fetchListings();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setActionLoading(false); }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { active: 'bg-green-500/10 text-green-600', paused: 'bg-yellow-500/10 text-yellow-600', rejected: 'bg-red-500/10 text-red-600' };
    return colors[status] || 'bg-gray-500/10 text-gray-600';
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.admin.listings}</h1>
        <p className="text-muted-foreground">{t.admin.listingManagement}</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder={t.nav.search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder={t.filters.title} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.common.all}</SelectItem>
                <SelectItem value="active">{t.listing.available}</SelectItem>
                <SelectItem value="paused">{t.booking.pending}</SelectItem>
                <SelectItem value="rejected">{t.booking.rejected}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter || 'all'} onValueChange={(v) => setCategoryFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder={t.nav.categories} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.common.all}</SelectItem>
                <SelectItem value="electronics">{t.categories.equipment}</SelectItem>
                <SelectItem value="vehicles">{t.categories.vehicles}</SelectItem>
                <SelectItem value="property">{t.categories.property}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t.admin.listings} ({listings.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : listings.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{t.common.noResults}</p>
          ) : (
            <div className="space-y-4">
              {listings.map((listing) => (
                <div key={listing._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded bg-muted overflow-hidden">
                      {listing.images?.[0]?.url ? (
                        <img src={listing.images[0].url} alt={listing.title} className="h-full w-full object-cover" />
                      ) : <span className="text-xs text-muted-foreground flex items-center justify-center h-full">{t.common.noResults}</span>}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{listing.title}</p>
                        {listing.verified && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {listing.featured && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{t.listing.postedBy} {listing.owner?.fullName} • {listing.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(listing.status)}>
                          {listing.status === 'active' && t.listing.available}
                          {listing.status === 'paused' && t.booking.pending}
                          {listing.status === 'rejected' && t.booking.rejected}
                        </Badge>
                        <span className="text-sm font-medium">{formatCurrency(listing.pricing?.daily || 0)}{t.listing.perDay}</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setActionDialog({ open: true, type: 'status', listing })}><X className="h-4 w-4 mr-2" />{t.common.edit}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActionDialog({ open: true, type: 'verify', listing })}><CheckCircle className="h-4 w-4 mr-2" />{listing.verified ? t.verification.notVerified : t.listing.verified}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActionDialog({ open: true, type: 'feature', listing })}><Star className="h-4 w-4 mr-2" />{listing.featured ? t.listing.featured : t.listing.featured}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActionDialog({ open: true, type: 'delete', listing })} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />{t.common.delete}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{t.common.back}</Button>
              <span className="flex items-center px-4">{page} / {totalPages}</span>
              <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>{t.common.next}</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'status' && t.common.edit}
              {actionDialog.type === 'verify' && (actionDialog.listing?.verified ? t.verification.notVerified : t.listing.verified)}
              {actionDialog.type === 'feature' && (actionDialog.listing?.featured ? t.listing.featured : t.listing.featured)}
              {actionDialog.type === 'delete' && t.common.delete}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {actionDialog.type === 'delete' && <div className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-4 w-4" />{t.common.error}</div>}
            {actionDialog.type === 'status' && (
              <>
                <div><Label>{t.filters.title}</Label>
                  <Select value={actionData.status} onValueChange={(v) => setActionData(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue placeholder={t.filters.title} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t.listing.available}</SelectItem>
                      <SelectItem value="paused">{t.booking.pending}</SelectItem>
                      <SelectItem value="rejected">{t.booking.rejected}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {actionData.status === 'rejected' && (
                  <div><Label>{t.listing.description}</Label><Textarea value={actionData.reason} onChange={(e) => setActionData(p => ({ ...p, reason: e.target.value }))} placeholder={t.listing.description} /></div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, type: '', listing: null })}>{t.common.cancel}</Button>
            <Button onClick={handleAction} disabled={actionLoading} variant={actionDialog.type === 'delete' ? 'destructive' : 'default'}>
              {actionLoading ? t.common.loading : t.common.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminListings;
