import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, X, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';

interface VerificationUser {
  _id: string;
  fullName: string;
  email: string;
  verification: {
    identity?: { status: string; documents?: Array<{ url: string }> };
    biometric?: { status: string; image?: { url: string } };
  };
  createdAt: string;
}

const AdminVerifications: React.FC = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<VerificationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { fetchVerifications(); }, []);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getVerifications({ limit: 50 });
      setUsers(response.data?.data || []);
    } catch { toast.error('Failed to load verifications'); }
    finally { setLoading(false); }
  };

  const handleApprove = async (userId: string, type: 'identity' | 'biometric') => {
    try {
      setActionLoading(`${userId}-${type}-approve`);
      await adminApi.approveVerification(userId, type);
      toast.success(`${type} verification approved`);
      fetchVerifications();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to approve'); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (userId: string, type: 'identity' | 'biometric') => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      setActionLoading(`${userId}-${type}-reject`);
      await adminApi.rejectVerification(userId, type, reason);
      toast.success(`${type} verification rejected`);
      fetchVerifications();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to reject'); }
    finally { setActionLoading(null); }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.admin.verifications}</h1>
        <p className="text-muted-foreground">{t.verification.subtitle}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>{t.admin.pendingVerifications} ({users.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">{t.common.noResults}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {users.map((user) => (
                <div key={user._id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">{user.fullName}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</p>
                    </div>
                    <Badge className="bg-yellow-500/10 text-yellow-600"><Clock className="h-3 w-3 mr-1" />{t.verification.pending}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.verification?.identity?.status === 'pending' && (
                      <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-sm">{t.verification.id}</CardTitle></CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {user.verification.identity.documents?.map((doc, idx) => (
                              <div key={idx} className="border rounded p-2">
                                <img src={doc.url} alt={`ID ${idx + 1}`} className="w-full h-32 object-cover rounded" />
                              </div>
                            ))}
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleApprove(user._id, 'identity')} disabled={actionLoading === `${user._id}-identity-approve`} className="flex-1">
                                <CheckCircle className="h-4 w-4 mr-1" />{actionLoading === `${user._id}-identity-approve` ? t.common.loading : t.booking.approved}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleReject(user._id, 'identity')} disabled={actionLoading === `${user._id}-identity-reject`} className="flex-1">
                                <X className="h-4 w-4 mr-1" />{actionLoading === `${user._id}-identity-reject` ? t.common.loading : t.booking.rejected}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {user.verification?.biometric?.status === 'pending' && (
                      <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-sm">{t.verification.biometric}</CardTitle></CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {user.verification.biometric.image?.url && (
                              <div className="border rounded p-2">
                                <img src={user.verification.biometric.image.url} alt="Biometric" className="w-full h-32 object-cover rounded" />
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleApprove(user._id, 'biometric')} disabled={actionLoading === `${user._id}-biometric-approve`} className="flex-1">
                                <CheckCircle className="h-4 w-4 mr-1" />{actionLoading === `${user._id}-biometric-approve` ? t.common.loading : t.booking.approved}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleReject(user._id, 'biometric')} disabled={actionLoading === `${user._id}-biometric-reject`} className="flex-1">
                                <X className="h-4 w-4 mr-1" />{actionLoading === `${user._id}-biometric-reject` ? t.common.loading : t.booking.rejected}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
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

export default AdminVerifications;
