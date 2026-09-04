import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { earningsApi } from '@/lib/api';
import EmptyState from '@/components/common/EmptyState';
import { useSearchParams } from 'react-router-dom';

interface EarningsSummary {
  totalEarnings: number;
  pendingPayout: number;
  availableBalance: number;
  currency: string;
  thisMonth: {
    earnings: number;
    bookings: number;
    growth: number;
  };
  chart: { date: string; amount: number }[];
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  status: string;
  payoutStatus?: string;
  createdAt: string;
  bookingId?: {
    listing?: {
      title: string;
    };
  };
}

interface PayoutMethod {
  _id: string;
  type: 'bank_transfer' | 'jazzcash' | 'easypaisa';
  details: {
    mobileNumber?: string;
    accountTitle?: string;
    bankName?: string;
    accountNumber?: string;
    branchCode?: string;
  };
  isDefault: boolean;
}

interface ConnectStatus {
  connected: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

const PAYOUT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  jazzcash: 'JazzCash',
  easypaisa: 'Easypaisa',
  stripe: 'Stripe (sandbox)',
};

const Earnings: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [period, setPeriod] = useState('month');
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<string>('');
  const [withdrawing, setWithdrawing] = useState(false);

  const [manageOpen, setManageOpen] = useState(false);
  const [addingMethod, setAddingMethod] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [deletingMethodId, setDeletingMethodId] = useState<string | null>(null);
  const [newMethodType, setNewMethodType] = useState<'bank_transfer' | 'jazzcash' | 'easypaisa'>('jazzcash');
  const [newMethodDetails, setNewMethodDetails] = useState({
    mobileNumber: '',
    accountTitle: '',
    bankName: '',
    accountNumber: '',
    branchCode: '',
  });

  const fetchEarningsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, transactionsRes, methodsRes, connectRes] = await Promise.all([
        earningsApi.getSummary(period as 'week' | 'month' | 'year'),
        earningsApi.getTransactions({ limit: 10 }),
        earningsApi.getPayoutMethods(),
        earningsApi.getConnectStatus(),
      ]);

      setSummary(summaryRes.data?.data || null);
      setTransactions(transactionsRes.data?.data?.transactions || []);
      setPayoutMethods(methodsRes.data?.data || []);
      setConnectStatus(connectRes.data?.data || null);
    } catch (err) {
      console.error('Failed to fetch earnings:', err);
      setError('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchEarningsData();
  }, [fetchEarningsData]);

  // After returning from Stripe Connect onboarding, re-sync the account
  // status so payoutsEnabled reflects reality.
  useEffect(() => {
    const connectParam = searchParams.get('connect');
    if (connectParam === 'return') {
      earningsApi
        .syncConnectStatus()
        .then((res) => {
          setConnectStatus(res.data?.data || null);
          if (res.data?.data?.payoutsEnabled) {
            toast.success('Stripe account connected — you can now withdraw via Stripe.');
          } else {
            toast.info('Stripe onboarding saved. A few more details may still be needed.');
          }
        })
        .catch(() => {
          // Non-fatal — the regular getConnectStatus fetch above still ran.
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (amount: number) => {
    return `PKR ${(amount || 0).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'pending':
      case 'processing':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earning':
      case 'payment':
        return 'text-green-600';
      case 'withdrawal':
      case 'refund':
        return 'text-red-500';
      default:
        return 'text-foreground';
    }
  };

  const availableMethods = [
    ...payoutMethods.map((m) => ({ value: m.type, label: PAYOUT_METHOD_LABELS[m.type] })),
    ...(connectStatus?.payoutsEnabled ? [{ value: 'stripe', label: PAYOUT_METHOD_LABELS.stripe }] : []),
  ];

  const openWithdrawDialog = () => {
    if (availableMethods.length === 0) {
      toast.info('Add a payout method first.');
      setManageOpen(true);
      return;
    }
    setWithdrawMethod(availableMethods[0].value);
    setWithdrawOpen(true);
  };

  const handleWithdraw = async () => {
    if (!withdrawMethod) return;
    setWithdrawing(true);
    try {
      const res = await earningsApi.requestPayout(
        withdrawMethod as 'stripe' | 'bank_transfer' | 'jazzcash' | 'easypaisa'
      );
      const data = res.data?.data;
      if (data?.status === 'paid') {
        toast.success(`PKR ${data.amount?.toLocaleString()} sent via Stripe.`);
      } else {
        toast.success(
          data?.note || `Payout of PKR ${data?.amount?.toLocaleString()} requested — we'll process it shortly.`
        );
      }
      setWithdrawOpen(false);
      fetchEarningsData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to request payout');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleAddMethod = async () => {
    setAddingMethod(true);
    try {
      await earningsApi.addPayoutMethod({
        type: newMethodType,
        details: newMethodDetails,
      });
      toast.success('Payout method added');
      setNewMethodDetails({ mobileNumber: '', accountTitle: '', bankName: '', accountNumber: '', branchCode: '' });
      const res = await earningsApi.getPayoutMethods();
      setPayoutMethods(res.data?.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add payout method');
    } finally {
      setAddingMethod(false);
    }
  };

  const handleDeleteMethod = async (id: string) => {
    try {
      setDeletingMethodId(id);
      await earningsApi.deletePayoutMethod(id);
      setPayoutMethods((prev) => prev.filter((m) => m._id !== id));
      toast.success('Payout method removed');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove payout method');
    } finally {
      setDeletingMethodId(null);
    }
  };

  const handleConnectStripe = async () => {
    setConnecting(true);
    try {
      const res = await earningsApi.startConnectOnboarding();
      const url = res.data?.data?.url;
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start Stripe onboarding');
      setConnecting(false);
    }
  };

  // Build stats from real data
  const stats = summary
    ? [
        {
          label: t.dashboard.totalEarnings,
          value: formatCurrency(summary.totalEarnings),
          change: `${summary.thisMonth.growth >= 0 ? '+' : ''}${summary.thisMonth.growth}%`,
          trend: summary.thisMonth.growth >= 0 ? 'up' : 'down',
          icon: DollarSign,
        },
        {
          label: t.dashboard.pendingPayouts,
          value: formatCurrency(summary.pendingPayout),
          change: `${summary.thisMonth.bookings} ${t.dashboard.totalBookings.toLowerCase()}`,
          trend: 'neutral',
          icon: Clock,
        },
        {
          label: t.payment.title,
          value: formatCurrency(summary.availableBalance),
          change: t.common.seeMore,
          trend: 'neutral',
          icon: Wallet,
        },
        {
          label: t.dashboard.thisMonth,
          value: formatCurrency(summary.thisMonth.earnings),
          change: `${summary.thisMonth.growth >= 0 ? '+' : ''}${summary.thisMonth.growth}%`,
          trend: summary.thisMonth.growth >= 0 ? 'up' : 'down',
          icon: Calendar,
        },
      ]
    : [];

  // Build chart data
  const chartData = summary?.chart || [];
  const maxEarning = Math.max(...chartData.map((d) => d.amount), 1);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
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
          <Button onClick={fetchEarningsData}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.dashboard.earnings}</h1>
          <p className="text-muted-foreground">{t.dashboard.totalEarnings}</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">{t.dashboard.thisMonth}</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    <p className="text-xs mt-1 flex items-center gap-1">
                      {stat.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                      {stat.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                      <span
                        className={
                          stat.trend === 'up'
                            ? 'text-green-600'
                            : stat.trend === 'down'
                              ? 'text-red-500'
                              : 'text-muted-foreground'
                        }
                      >
                        {stat.change}
                      </span>
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Earnings Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-64 flex items-end gap-4">
              {chartData.map((data) => {
                const month = new Date(data.date).toLocaleDateString('en-US', { month: 'short' });
                return (
                  <div key={data.date} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-primary/20 rounded-t-lg hover:bg-primary/30 transition-colors relative group"
                      style={{ height: `${(data.amount / maxEarning) * 200}px`, minHeight: '20px' }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg transition-all"
                        style={{ height: `${(data.amount / maxEarning) * 100}%` }}
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        PKR {(data.amount / 1000).toFixed(0)}k
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground mt-2">{month}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <EmptyState title="No earnings data available yet" />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction History */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          transaction.type === 'earning' || transaction.type === 'payment'
                            ? 'bg-green-500/10'
                            : 'bg-red-500/10'
                        }`}
                      >
                        {transaction.type === 'earning' || transaction.type === 'payment' ? (
                          <ArrowDownRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {transaction.bookingId?.listing?.title || 'Transaction'}
                        </p>
                        <p className="text-sm text-muted-foreground">{formatDate(transaction.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'earning' || transaction.type === 'payment' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <Badge className={getStatusColor(transaction.payoutStatus || transaction.status)}>
                        {transaction.payoutStatus === 'completed'
                          ? 'paid out'
                          : transaction.payoutStatus || transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No transactions yet" />
            )}
          </CardContent>
        </Card>

        {/* Withdrawal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Withdraw Funds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(summary?.availableBalance || 0)}
              </p>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full gap-2"
                disabled={!summary?.availableBalance || summary.availableBalance <= 0}
                onClick={openWithdrawDialog}
              >
                <Wallet className="h-4 w-4" />
                Withdraw Available Balance
              </Button>

              <Button variant="outline" className="w-full gap-2" onClick={() => setManageOpen(true)}>
                <CreditCard className="h-4 w-4" />
                Manage Payout Methods
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Stripe payouts (sandbox) are instant. Bank/JazzCash/Easypaisa payouts are processed
              by our team within 1-3 business days.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Withdraw confirmation dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Available Balance</DialogTitle>
            <DialogDescription>
              You're withdrawing your full available balance of{' '}
              <span className="font-medium text-foreground">
                {formatCurrency(summary?.availableBalance || 0)}
              </span>
              . Choose where to send it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Payout method</Label>
            <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableMethods.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)} disabled={withdrawing}>
              Cancel
            </Button>
            <Button onClick={handleWithdraw} disabled={withdrawing || !withdrawMethod} className="gap-2">
              {withdrawing && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage payout methods dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payout Methods</DialogTitle>
            <DialogDescription>Where your earnings get sent when you withdraw.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Stripe Connect */}
            <div className="p-3 rounded-lg border flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground text-sm">Stripe (sandbox)</p>
                <p className="text-xs text-muted-foreground">
                  {connectStatus?.payoutsEnabled
                    ? 'Connected — ready for instant payouts'
                    : connectStatus?.connected
                      ? 'Onboarding started — finish it to enable payouts'
                      : 'Not connected'}
                </p>
              </div>
              {!connectStatus?.payoutsEnabled && (
                <Button size="sm" variant="outline" className="gap-1" onClick={handleConnectStripe} disabled={connecting}>
                  {connecting && <Loader2 className="h-3 w-3 animate-spin" />}
                  {connectStatus?.connected ? 'Finish setup' : 'Connect'}
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Existing manual methods */}
            {payoutMethods.map((m) => (
              <div key={m._id} className="p-3 rounded-lg border flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">{PAYOUT_METHOD_LABELS[m.type]}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.details.mobileNumber || m.details.accountNumber || m.details.accountTitle}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => handleDeleteMethod(m._id)} disabled={deletingMethodId === m._id}>
                  {deletingMethodId === m._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              </div>
            ))}

            {/* Add new manual method */}
            <div className="p-3 rounded-lg border border-dashed space-y-3">
              <Label>Add bank / mobile wallet method</Label>
              <Select
                value={newMethodType}
                onValueChange={(v: 'bank_transfer' | 'jazzcash' | 'easypaisa') => setNewMethodType(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jazzcash">JazzCash</SelectItem>
                  <SelectItem value="easypaisa">Easypaisa</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>

              {newMethodType === 'bank_transfer' ? (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Bank name"
                    value={newMethodDetails.bankName}
                    onChange={(e) => setNewMethodDetails({ ...newMethodDetails, bankName: e.target.value })}
                  />
                  <Input
                    placeholder="Account title"
                    value={newMethodDetails.accountTitle}
                    onChange={(e) => setNewMethodDetails({ ...newMethodDetails, accountTitle: e.target.value })}
                  />
                  <Input
                    placeholder="Account number"
                    className="col-span-2"
                    value={newMethodDetails.accountNumber}
                    onChange={(e) => setNewMethodDetails({ ...newMethodDetails, accountNumber: e.target.value })}
                  />
                  <Input
                    placeholder="Branch code"
                    className="col-span-2"
                    value={newMethodDetails.branchCode}
                    onChange={(e) => setNewMethodDetails({ ...newMethodDetails, branchCode: e.target.value })}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Mobile number"
                    value={newMethodDetails.mobileNumber}
                    onChange={(e) => setNewMethodDetails({ ...newMethodDetails, mobileNumber: e.target.value })}
                  />
                  <Input
                    placeholder="Account title"
                    value={newMethodDetails.accountTitle}
                    onChange={(e) => setNewMethodDetails({ ...newMethodDetails, accountTitle: e.target.value })}
                  />
                </div>
              )}

              <Button size="sm" className="gap-1" onClick={handleAddMethod} disabled={addingMethod}>
                {addingMethod ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                Add Method
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManageOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Earnings;
