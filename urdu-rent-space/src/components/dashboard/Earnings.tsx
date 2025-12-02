import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Clock
} from 'lucide-react';

const Earnings: React.FC = () => {
  const [period, setPeriod] = useState('month');

  const stats = [
    {
      label: 'Total Earnings',
      value: 'PKR 125,000',
      change: '+15%',
      trend: 'up',
      icon: DollarSign,
    },
    {
      label: 'Pending Payouts',
      value: 'PKR 35,000',
      change: '3 bookings',
      trend: 'neutral',
      icon: Clock,
    },
    {
      label: 'Available Balance',
      value: 'PKR 90,000',
      change: 'Withdraw now',
      trend: 'neutral',
      icon: Wallet,
    },
    {
      label: 'This Month',
      value: 'PKR 45,000',
      change: '+23%',
      trend: 'up',
      icon: Calendar,
    },
  ];

  const transactions = [
    {
      id: 1,
      type: 'earning',
      description: 'Booking payment - Honda Civic',
      customer: 'Ahmed Khan',
      date: 'Jan 3, 2026',
      amount: '+PKR 15,000',
      status: 'completed',
    },
    {
      id: 2,
      type: 'withdrawal',
      description: 'Bank Transfer to Allied Bank',
      customer: null,
      date: 'Jan 1, 2026',
      amount: '-PKR 50,000',
      status: 'completed',
    },
    {
      id: 3,
      type: 'earning',
      description: 'Booking payment - Luxury Apartment',
      customer: 'Sara Ali',
      date: 'Dec 28, 2025',
      amount: '+PKR 45,000',
      status: 'pending',
    },
    {
      id: 4,
      type: 'earning',
      description: 'Booking payment - Bridal Dress',
      customer: 'Fatima Hassan',
      date: 'Dec 25, 2025',
      amount: '+PKR 15,000',
      status: 'completed',
    },
    {
      id: 5,
      type: 'refund',
      description: 'Booking cancelled - Photography Set',
      customer: 'Usman Malik',
      date: 'Dec 20, 2025',
      amount: '-PKR 3,000',
      status: 'completed',
    },
  ];

  const monthlyData = [
    { month: 'Aug', earnings: 65000 },
    { month: 'Sep', earnings: 78000 },
    { month: 'Oct', earnings: 92000 },
    { month: 'Nov', earnings: 85000 },
    { month: 'Dec', earnings: 110000 },
    { month: 'Jan', earnings: 125000 },
  ];

  const maxEarning = Math.max(...monthlyData.map(d => d.earnings));

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
        return 'text-green-600';
      case 'withdrawal':
      case 'refund':
        return 'text-red-500';
      default:
        return 'text-foreground';
    }
  };

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
                      <span className={stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}>
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
          <div className="h-64 flex items-end gap-4">
            {monthlyData.map((data) => (
              <div key={data.month} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-primary/20 rounded-t-lg hover:bg-primary/30 transition-colors relative group"
                  style={{ height: `${(data.earnings / maxEarning) * 200}px` }}
                >
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg transition-all"
                    style={{ height: `${(data.earnings / maxEarning) * 100}%` }}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    PKR {(data.earnings / 1000).toFixed(0)}k
                  </div>
                </div>
                <span className="text-xs text-muted-foreground mt-2">{data.month}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction History */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'earning' 
                        ? 'bg-green-500/10' 
                        : 'bg-red-500/10'
                    }`}>
                      {transaction.type === 'earning' ? (
                        <ArrowDownRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.customer && `${transaction.customer} • `}
                        {transaction.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                      {transaction.amount}
                    </p>
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
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
              <p className="text-3xl font-bold text-foreground">PKR 90,000</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                    AB
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Allied Bank</p>
                    <p className="text-xs text-muted-foreground">****4523</p>
                  </div>
                </div>
                <Badge>Default</Badge>
              </div>
              
              <Button className="w-full gap-2">
                <Wallet className="h-4 w-4" />
                Withdraw to Bank
              </Button>
              
              <Button variant="outline" className="w-full gap-2">
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
