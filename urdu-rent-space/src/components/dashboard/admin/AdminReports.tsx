import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Flag } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';

interface Report {
  _id: string;
  reportedUser: { _id: string; fullName: string; email: string };
  reportedBy: { _id: string; fullName: string; email: string };
  reason: string;
  description?: string;
  createdAt: string;
  dismissed: boolean;
}

const REASON_LABELS: Record<string, string> = {
  harassment: 'Harassment or abusive language',
  scam: 'Scam or fraud attempt',
  off_platform_payment: 'Asked to pay outside the app',
  spam: 'Spam',
  other: 'Other',
};

const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDismissed, setShowDismissed] = useState(false);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getReports();
      setReports(res.data?.data || []);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (report: Report) => {
    setActionLoading(report._id);
    try {
      await adminApi.dismissReport(report.reportedUser._id, report._id);
      toast.success('Report dismissed');
      fetchReports();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dismiss report');
    } finally {
      setActionLoading(null);
    }
  };

  const visibleReports = reports.filter((r) => showDismissed || !r.dismissed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Report Queue</h1>
          <p className="text-muted-foreground">User reports filed from conversations</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowDismissed((s) => !s)}>
          {showDismissed ? 'Hide dismissed' : 'Show dismissed'}
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Reports ({visibleReports.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : visibleReports.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">No open reports</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleReports.map((r) => (
                <div key={r._id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-destructive" />
                      <p className="font-medium">{r.reportedUser?.fullName || 'Unknown user'}</p>
                      <Badge variant="outline">{REASON_LABELS[r.reason] || r.reason}</Badge>
                      {r.dismissed && <Badge className="bg-muted text-muted-foreground">Dismissed</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{r.reportedUser?.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reported by {r.reportedBy?.fullName || 'Unknown'} · {new Date(r.createdAt).toLocaleString()}
                    </p>
                    {r.description && <p className="text-sm mt-2">{r.description}</p>}
                  </div>
                  {!r.dismissed && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDismiss(r)}
                      disabled={actionLoading === r._id}
                    >
                      Dismiss
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReports;
