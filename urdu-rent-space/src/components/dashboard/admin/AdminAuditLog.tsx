import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import AdminDataTable, { AdminDataTableColumn } from '@/components/admin/AdminDataTable';

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

  const columns: AdminDataTableColumn<AuditEntry>[] = [
    {
      key: 'admin',
      header: 'Admin',
      render: (e) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{e.admin?.fullName || 'Unknown admin'}</span>
          <Badge variant="outline" className="text-xs capitalize">{e.adminRole}</Badge>
        </div>
      ),
    },
    {
      key: 'target',
      header: 'Target',
      render: (e) => <Badge variant="outline" className="text-xs capitalize">{e.targetType}</Badge>,
    },
    {
      key: 'action',
      header: 'Action',
      render: (e) => (
        <div>
          <p className="text-sm">{e.action}</p>
          {formatDetails(e.details) && (
            <p className="text-xs text-muted-foreground mt-1">{formatDetails(e.details)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'when',
      header: 'When',
      render: (e) => <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</span>,
    },
  ];

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
          <AdminDataTable
            columns={columns}
            rows={entries}
            getRowKey={(e) => e._id}
            loading={loading}
            emptyTitle="No admin actions recorded yet"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuditLog;
