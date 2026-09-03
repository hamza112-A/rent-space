import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, User, Building } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { useFilterState } from '@/hooks/useFilterState';
import FilterBar, { ActiveFilter } from '@/components/filters/FilterBar';
import AdminDataTable, { AdminDataTableColumn } from '@/components/admin/AdminDataTable';

interface Booking {
  _id: string;
  listing: { title: string };
  renter: { fullName: string };
  owner: { fullName: string };
  status: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  createdAt: string;
}

const FILTER_DEFAULTS = { status: '', page: 1 };

const AdminBookings: React.FC = () => {
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const filters = useFilterState(FILTER_DEFAULTS);
  const { status: statusFilter, page } = filters.values;

  useEffect(() => { fetchBookings(); }, [page, statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getBookings({ page, limit: 20, status: statusFilter || undefined });
      setBookings(response.data?.data || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  };

  const activeChips = useMemo<ActiveFilter[]>(() => {
    const chips: ActiveFilter[] = [];
    if (statusFilter) chips.push({ key: 'status', label: statusFilter, onRemove: () => filters.setValue('status', '') });
    return chips;
  }, [statusFilter, filters]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-600',
      confirmed: 'bg-blue-500/10 text-blue-600',
      completed: 'bg-green-500/10 text-green-600',
      cancelled: 'bg-red-500/10 text-red-600',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-600';
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const columns: AdminDataTableColumn<Booking>[] = [
    {
      key: 'listing',
      header: 'Listing',
      render: (booking) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <p className="font-medium">{booking.listing?.title}</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><User className="h-3 w-3" />{t.auth.borrower}: {booking.renter?.fullName}</span>
            <span className="flex items-center gap-1"><User className="h-3 w-3" />{t.auth.owner}: {booking.owner?.fullName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: t.filters.title,
      render: (booking) => (
        <Badge className={getStatusColor(booking.status)}>
          {booking.status === 'pending' && t.booking.pending}
          {booking.status === 'confirmed' && t.booking.approved}
          {booking.status === 'completed' && t.booking.completed}
          {booking.status === 'cancelled' && t.booking.cancelled}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (booking) => <p className="font-semibold">{formatCurrency(booking.totalAmount)}</p>,
    },
    {
      key: 'requested',
      header: 'Requested',
      render: (booking) => <p className="text-sm text-muted-foreground">{formatDate(booking.createdAt)}</p>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.admin.bookings}</h1>
        <p className="text-muted-foreground">{t.booking.history}</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <Select value={statusFilter || 'all'} onValueChange={(v) => filters.setValues({ status: v === 'all' ? '' : v, page: 1 })}>
            <SelectTrigger className="w-48"><SelectValue placeholder={t.filters.title} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.common.all}</SelectItem>
              <SelectItem value="pending">{t.booking.pending}</SelectItem>
              <SelectItem value="confirmed">{t.booking.approved}</SelectItem>
              <SelectItem value="completed">{t.booking.completed}</SelectItem>
              <SelectItem value="cancelled">{t.booking.cancelled}</SelectItem>
            </SelectContent>
          </Select>
          <FilterBar activeFilters={activeChips} onClearAll={filters.resetAll} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t.admin.bookings} ({bookings.length})</CardTitle></CardHeader>
        <CardContent>
          <AdminDataTable
            columns={columns}
            rows={bookings}
            getRowKey={(booking) => booking._id}
            loading={loading}
            emptyTitle={t.common.noResults}
          />
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button variant="outline" onClick={() => filters.setValue('page', Math.max(1, page - 1))} disabled={page === 1}>{t.common.back}</Button>
              <span className="flex items-center px-4">{page} / {totalPages}</span>
              <Button variant="outline" onClick={() => filters.setValue('page', Math.min(totalPages, page + 1))} disabled={page === totalPages}>{t.common.next}</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBookings;
