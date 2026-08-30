import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClipboardList } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';

interface AuditEntry {
  _id: string;
  admin?: { fullName: string; email: string };
  adminRole: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

const TARGET_TYPES = ['user', 'listing', 'booking', 'verification', 'payout', 'dispute', 'report', 'category'];

const AdminAuditLog: React.FC = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetType, setTargetType] = useState('all');

  useEffect(() => { fetchLog(); }, [targetType]);

  const fetchLog = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAuditLog({
        limit: 100,
        targetType: targetType === 'all' ? undefined : targetType,
      });
      setEntries(res.data?.data || []);
    } catch {
      toast.error('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  };

  const formatDetails = (details?: Record<string, unknown>) => {
    if (!details) return null;
    const entries = Object.entries(details).filter(([, v]) => v !== undefined && v !== null && v !== '');
    if (entries.length === 0) return null;
    return entries.map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`).join(' · ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground">Who did what, when — every admin action, in order</p>
        </div>
        <Select value={targetType} onValueChange={setTargetType}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TARGET_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Actions ({entries.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No admin actions recorded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((e) => (
                <div key={e._id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{e.admin?.fullName || 'Unknown admin'}</span>
                      <Badge variant="outline" className="text-xs capitalize">{e.adminRole}</Badge>
                      <Badge variant="outline" className="text-xs capitalize">{e.targetType}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm mt-1">{e.action}</p>
                  {formatDetails(e.details) && (
                    <p className="text-xs text-muted-foreground mt-1">{formatDetails(e.details)}</p>
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

export default AdminAuditLog;
