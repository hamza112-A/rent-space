import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, Wallet, Clock } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';

interface Payout {
  _id: string;
  user: { _id: string; fullName: string; email: string };
  amount: number;
  currency: string;
  method: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  failureReason?: string;
  requestedAt: string;
  processedAt?: string;
  processedBy?: { fullName: string };
}

interface PayoutTotal {
  _id: string;
  amount: number;
  count: number;
}

const METHOD_LABELS: Record<string, string> = {
  stripe: 'Stripe',
  bank_transfer: 'Bank Transfer',
  jazzcash: 'JazzCash',
  easypaisa: 'Easypaisa',
};

const AdminPayouts: React.FC = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [totals, setTotals] = useState<PayoutTotal[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPayouts();
  }, [statusFilter]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getPayouts({
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 50,
      });
      setPayouts(res.data?.data || []);
      setTotals(res.data?.totals || []);
    } catch (err) {
      toast.error('Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (payoutId: string) => {
    setActionLoading(`${payoutId}-paid`);
    try {
      await adminApi.markPayoutPaid(payoutId);
      toast.success('Payout marked as paid');
      fetchPayouts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update payout');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkFailed = async (payoutId: string) => {
    const reason = prompt('Reason for failure (shown to the owner):');
    if (reason === null) return;
    setActionLoading(`${payoutId}-failed`);
    try {
      await adminApi.markPayoutFailed(payoutId, reason || undefined);
      toast.success('Payout marked as failed');
      fetchPayouts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update payout');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'failed': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    }
  };

  const formatCurrency = (amount: number, currency = 'PKR') => `${currency} ${amount.toLocaleString()}`;

  const totalFor = (status: string) => totals.find((t) => t._id === status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payout Oversight</h1>
        <p className="text-muted-foreground">Review and process owner payout requests</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {['pending', 'processing', 'paid', 'failed'].map((status) => {
          const t = totalFor(status);
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground capitalize">{status}</p>
                    <p className="text-lg font-bold">{formatCurrency(t?.amount || 0)}</p>
                    <p className="text-xs text-muted-foreground">{t?.count || 0} payout{t?.count === 1 ? '' : 's'}</p>
                  </div>
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader><CardTitle>Payouts ({payouts.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">Nothing here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payouts.map((p) => (
                <div key={p._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{p.user?.fullName || 'Unknown owner'}</p>
                      <Badge className={getStatusColor(p.status)}>{p.status}</Badge>
                      <Badge variant="outline">{METHOD_LABELS[p.method] || p.method}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{p.user?.email}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" /> Requested {new Date(p.requestedAt).toLocaleString()}
                    </p>
                    {p.failureReason && <p className="text-xs text-red-600 mt-1">Reason: {p.failureReason}</p>}
                    {p.processedBy && <p className="text-xs text-muted-foreground mt-1">Processed by {p.processedBy.fullName}</p>}
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-lg font-bold">{formatCurrency(p.amount, p.currency)}</p>
                    {(p.status === 'pending' || p.status === 'processing') && p.method !== 'stripe' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-destructive"
                          onClick={() => handleMarkFailed(p._id)}
                          disabled={actionLoading === `${p._id}-failed`}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Failed
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => handleMarkPaid(p._id)}
                          disabled={actionLoading === `${p._id}-paid`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark Paid
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPayouts;
