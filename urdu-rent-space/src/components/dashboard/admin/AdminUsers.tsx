import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, MoreHorizontal, Ban, CheckCircle, ShieldCheck, Trash2, AlertTriangle, Shield } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { useFilterState } from '@/hooks/useFilterState';
import FilterBar, { ActiveFilter } from '@/components/filters/FilterBar';
import AdminDataTable, { AdminDataTableColumn } from '@/components/admin/AdminDataTable';

interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  isAdmin: boolean;
  adminRole?: 'none' | 'support' | 'finance' | 'superadmin';
  verification: { email: { verified: boolean }; phone: { verified: boolean } };
  createdAt: string;
}

const ADMIN_ROLE_LABELS: Record<string, string> = {
  none: 'Not an admin',
  support: 'Support (moderation, no financials)',
  finance: 'Finance (payouts, revenue)',
  superadmin: 'Super Admin (full access)',
};

const FILTER_DEFAULTS = { search: '', status: '', role: '', page: 1 };

const AdminUsers: React.FC = () => {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: string; user: User | null }>({ open: false, type: '', user: null });
  const [actionData, setActionData] = useState({ status: '', reason: '', adminRole: 'none' as 'none' | 'support' | 'finance' | 'superadmin', verifyType: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const filters = useFilterState(FILTER_DEFAULTS);
  const { search, status: statusFilter, role: roleFilter, page } = filters.values;

  useEffect(() => { fetchUsers(); }, [page, statusFilter, roleFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => { page === 1 ? fetchUsers() : filters.setValue('page', 1); }, 500);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers({ page, limit: 20, search: search || undefined, status: statusFilter || undefined, role: roleFilter || undefined });
      setUsers(response.data?.data || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const activeChips = useMemo<ActiveFilter[]>(() => {
    const chips: ActiveFilter[] = [];
    if (search) chips.push({ key: 'search', label: `"${search}"`, onRemove: () => filters.setValue('search', '') });
    if (statusFilter) chips.push({ key: 'status', label: statusFilter, onRemove: () => filters.setValue('status', '') });
    if (roleFilter) chips.push({ key: 'role', label: roleFilter, onRemove: () => filters.setValue('role', '') });
    return chips;
  }, [search, statusFilter, roleFilter, filters]);

  const handleAction = async () => {
    if (!actionDialog.user) return;
    try {
      setActionLoading(true);
      const userId = actionDialog.user._id;
      if (actionDialog.type === 'status') {
        await adminApi.updateUserStatus(userId, { status: actionData.status, reason: actionData.reason });
        toast.success(`User ${actionData.status} successfully`);
      } else if (actionDialog.type === 'role') {
        await adminApi.setAdminRole(userId, actionData.adminRole);
        toast.success('Admin role updated');
      } else if (actionDialog.type === 'verify') {
        await adminApi.verifyUser(userId, actionData.verifyType);
        toast.success(`${actionData.verifyType} verified`);
      } else if (actionDialog.type === 'delete') {
        await adminApi.deleteUser(userId);
        toast.success('User deleted');
      }
      setActionDialog({ open: false, type: '', user: null });
      fetchUsers();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setActionLoading(false); }
  };

  const openDialog = (type: string, user: User) => {
    setActionDialog({ open: true, type, user });
    if (type === 'role') setActionData(prev => ({ ...prev, adminRole: user.adminRole || 'none' }));
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { active: 'bg-green-500/10 text-green-600', suspended: 'bg-yellow-500/10 text-yellow-600', banned: 'bg-red-500/10 text-red-600' };
    return colors[status] || 'bg-gray-500/10 text-gray-600';
  };

  const columns: AdminDataTableColumn<User>[] = [
    {
      key: 'user',
      header: t.admin.users,
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-primary">{user.fullName.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{user.fullName}</p>
              {user.adminRole && user.adminRole !== 'none' && (
                <Badge className="bg-purple-500/10 text-purple-600 capitalize"><Shield className="h-3 w-3 mr-1" />{user.adminRole}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: t.filters.title,
      render: (user) => <Badge className={getStatusColor(user.status)}>{user.status}</Badge>,
    },
    {
      key: 'role',
      header: t.auth.selectRole,
      render: (user) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{user.role}</Badge>
          {user.verification?.email?.verified && <CheckCircle className="h-3 w-3 text-green-500" />}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (user) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openDialog('status', user)}><Ban className="h-4 w-4 mr-2" />{t.common.edit}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => openDialog('verify', user)}><CheckCircle className="h-4 w-4 mr-2" />{t.verification.verify}</DropdownMenuItem>
              {currentUser?.isSuperAdmin && (
                <DropdownMenuItem onClick={() => openDialog('role', user)}><ShieldCheck className="h-4 w-4 mr-2" />Set Admin Role</DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => openDialog('delete', user)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />{t.common.delete}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.admin.users}</h1>
        <p className="text-muted-foreground">{t.admin.userManagement}</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder={t.nav.search} value={search} onChange={(e) => filters.setValue('search', e.target.value, { replace: true })} className="pl-10" />
            </div>
            <Select value={statusFilter || 'all'} onValueChange={(v) => filters.setValues({ status: v === 'all' ? '' : v, page: 1 })}>
              <SelectTrigger className="w-40"><SelectValue placeholder={t.filters.title} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.common.all}</SelectItem>
                <SelectItem value="active">{t.listing.available}</SelectItem>
                <SelectItem value="suspended">{t.booking.pending}</SelectItem>
                <SelectItem value="banned">{t.booking.cancelled}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter || 'all'} onValueChange={(v) => filters.setValues({ role: v === 'all' ? '' : v, page: 1 })}>
              <SelectTrigger className="w-40"><SelectValue placeholder={t.auth.selectRole} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.common.all}</SelectItem>
                <SelectItem value="owner">{t.auth.owner}</SelectItem>
                <SelectItem value="borrower">{t.auth.borrower}</SelectItem>
                <SelectItem value="both">{t.auth.both}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <FilterBar activeFilters={activeChips} onClearAll={filters.resetAll} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t.admin.users} ({users.length})</CardTitle></CardHeader>
        <CardContent>
          <AdminDataTable
            columns={columns}
            rows={users}
            getRowKey={(user) => user._id}
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

      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'status' && t.common.edit}
              {actionDialog.type === 'role' && t.auth.selectRole}
              {actionDialog.type === 'verify' && t.verification.verify}
              {actionDialog.type === 'delete' && t.common.delete}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {actionDialog.type === 'delete' && (
              <div className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-4 w-4" />{t.common.error}</div>
            )}
            {actionDialog.type === 'status' && (
              <>
                <div><Label>{t.filters.title}</Label>
                  <Select value={actionData.status} onValueChange={(v) => setActionData(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue placeholder={t.filters.title} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t.listing.available}</SelectItem>
                      <SelectItem value="suspended">{t.booking.pending}</SelectItem>
                      <SelectItem value="banned">{t.booking.cancelled}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(actionData.status === 'suspended' || actionData.status === 'banned') && (
                  <div><Label>{t.listing.description}</Label><Textarea value={actionData.reason} onChange={(e) => setActionData(p => ({ ...p, reason: e.target.value }))} placeholder={t.listing.description} /></div>
                )}
              </>
            )}
            {actionDialog.type === 'role' && (
              <div><Label>Admin Role</Label>
                <Select value={actionData.adminRole} onValueChange={(v: 'none' | 'support' | 'finance' | 'superadmin') => setActionData(p => ({ ...p, adminRole: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ADMIN_ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Support: verifications, disputes, listings, users, reports. Finance: payouts and revenue analytics. Super Admin: everything, including managing other admins.
                </p>
              </div>
            )}
            {actionDialog.type === 'verify' && (
              <div><Label>{t.verification.title}</Label>
                <Select value={actionData.verifyType} onValueChange={(v) => setActionData(p => ({ ...p, verifyType: v }))}>
                  <SelectTrigger><SelectValue placeholder={t.filters.title} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">{t.verification.email}</SelectItem>
                    <SelectItem value="phone">{t.verification.phone}</SelectItem>
                    <SelectItem value="identity">{t.verification.id}</SelectItem>
                    <SelectItem value="biometric">{t.verification.biometric}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, type: '', user: null })}>{t.common.cancel}</Button>
            <Button onClick={handleAction} disabled={actionLoading} variant={actionDialog.type === 'delete' ? 'destructive' : 'default'}>
              {actionLoading ? t.common.loading : t.common.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
