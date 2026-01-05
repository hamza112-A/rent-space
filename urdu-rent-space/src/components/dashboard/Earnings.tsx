import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

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
  createdAt: string;
  bookingId?: {
    listing?: {
      title: string;
    };
  };
}

const Earnings: React.FC = () => {
  const [period, setPeriod] = useState('month');
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEarningsData();
  }, [period]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, transactionsRes] = await Promise.all([
        fetch(`${API_URL}/earnings/summary?period=${period}`, {
          credentials: 'include',
        }),
        fetch(`${API_URL}/earnings/transactions?limit=10`, {
          credentials: 'include',
        }),
      ]);

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData.data);
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData.data?.transactions || []);
      }
    } catch (err) {
      console.error('Failed to fetch earnings:', err);
      setError('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

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

  // Build stats from real data
  const stats = summary
    ? [
        {
          label: 'Total Earnings',
          value: formatCurrency(summary.totalEarnings),
          change: `+${summary.thisMonth.growth}%`,
          trend: summary.thisMonth.growth >= 0 ? 'up' : 'down',
          icon: DollarSign,
        },
        {
          label: 'Pending Payouts',
          value: formatCurrency(summary.pendingPayout),
          change: `${summary.thisMonth.bookings} bookings`,
          trend: 'neutral',
          icon: Clock,
        },
        {
          label: 'Available Balance',
          value: formatCurrency(summary.availableBalance),
          change: 'Withdraw now',
          trend: 'neutral',
          icon: Wallet,
        },
        {
          label: 'This Month',
          value: formatCurrency(summary.thisMonth.earnings),
          change: `+${summary.thisMonth.growth}%`,
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
          <h1 className="text-2xl font-bold text-foreground">Earnings</h1>
          <p className="text-muted-foreground">Track your rental income and payouts</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
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
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No earnings data available yet
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction History */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm">
              View All
            </Button>
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
                      <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No transactions yet</div>
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
                onClick={() => toast.info('Withdrawal feature coming soon!')}
              >
                <Wallet className="h-4 w-4" />
                Withdraw to Bank
              </Button>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => toast.info('Add payment method feature coming soon!')}
              >
                <CreditCard className="h-4 w-4" />
                Add Payment Method
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Withdrawals are processed within 1-3 business days
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Earnings;
