import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  MessageSquare, 
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AdminDataTable, { AdminDataTableColumn } from '@/components/admin/AdminDataTable';

interface Dispute {
  _id: string;
  disputeId: string;
  complainant: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: { url: string };
  };
  respondent: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: { url: string };
  };
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  booking?: {
    bookingId: string;
    startDate: string;
    endDate: string;
  };
  listing?: {
    title: string;
  };
  assignedTo?: {
    _id: string;
    fullName: string;
  };
  createdAt: string;
  messages: Array<{
    sender: {
      _id: string;
      fullName: string;
      avatar?: { url: string };
    };
    senderRole: string;
    content: string;
    timestamp: string;
  }>;
  timeline: Array<{
    action: string;
    timestamp: string;
    performedBy?: {
      fullName: string;
    };
  }>;
  requestedAmount?: number;
  awardedAmount?: number;
  respondentResponse?: {
    submitted: boolean;
    response?: string;
    submittedAt?: string;
  };
  resolution?: {
    decision?: string;
    explanation?: string;
    action?: string;
    resolvedAt?: string;
  };
}

interface Statistics {
  byStatus: Array<{ _id: string; count: number }>;
  byCategory: Array<{ _id: string; count: number }>;
  byPriority: Array<{ _id: string; count: number }>;
  totalAwarded: Array<{ total: number }>;
  avgResolutionTime: Array<{ avgTime: number }>;
}

const AdminDisputes: React.FC = () => {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [filter, setFilter] = useState('all');
  const [newMessage, setNewMessage] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState<'assign' | 'status' | 'message' | 'resolve' | null>(null);

  // Resolution form
  const [resolutionForm, setResolutionForm] = useState({
    decision: '',
    explanation: '',
    action: '',
    awardedAmount: ''
  });

  useEffect(() => {
    fetchDisputes();
    fetchStatistics();
  }, [filter]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      
      const response = await api.get('/disputes/admin/all', { params });
      setDisputes(response.data.data);
    } catch (error: any) {
      toast.error('Error', { description: error.response?.data?.message || 'Failed to fetch disputes' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/disputes/admin/statistics');
      setStatistics(response.data.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const fetchDisputeDetails = async (disputeId: string) => {
    try {
      const response = await api.get(`/disputes/${disputeId}`);
      setSelectedDispute(response.data.data);
      setShowDetailsDialog(true);
    } catch (error: any) {
      toast.error('Error', { description: error.response?.data?.message || 'Failed to fetch dispute details' });
    }
  };

  const handleAssignToMe = async () => {
    if (!selectedDispute) return;

    try {
      setActionSubmitting('assign');
      await api.put(`/disputes/${selectedDispute._id}/assign`, {
        adminId: user?._id
      });

      toast.success('Success', { description: 'Dispute assigned to you' });

      fetchDisputes();
      if (selectedDispute) {
        fetchDisputeDetails(selectedDispute._id);
      }
    } catch (error: any) {
      toast.error('Error', { description: error.response?.data?.message || 'Failed to assign dispute' });
    } finally {
      setActionSubmitting(null);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedDispute) return;

    try {
      setActionSubmitting('status');
      await api.put(`/disputes/${selectedDispute._id}/status`, { status });

      toast.success('Success', { description: 'Dispute status updated' });

      fetchDisputes();
      if (selectedDispute) {
        fetchDisputeDetails(selectedDispute._id);
      }
    } catch (error: any) {
      toast.error('Error', { description: error.response?.data?.message || 'Failed to update status' });
    } finally {
      setActionSubmitting(null);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedDispute || !newMessage.trim()) return;

    try {
      setActionSubmitting('message');
      await api.post(`/disputes/${selectedDispute._id}/messages`, {
        content: newMessage
      });

      setNewMessage('');
      toast.success('Success', { description: 'Message sent' });

      fetchDisputeDetails(selectedDispute._id);
    } catch (error: any) {
      toast.error('Error', { description: error.response?.data?.message || 'Failed to send message' });
    } finally {
      setActionSubmitting(null);
    }
  };

  const handleResolveDispute = async () => {
    if (!selectedDispute) return;

    try {
      setActionSubmitting('resolve');
      const payload = {
        ...resolutionForm,
        awardedAmount: resolutionForm.awardedAmount ? parseFloat(resolutionForm.awardedAmount) : undefined
      };

      const res = await api.put(`/disputes/${selectedDispute._id}/resolve`, payload);
      const refund = res.data?.refund;

      if (refund?.refunded) {
        toast.success('Dispute resolved', { description: `PKR ${refund.amount.toLocaleString()} refunded to the complainant via Stripe.` });
      } else if (refund && !refund.refunded) {
        toast.error('Dispute resolved — refund failed', { description: refund.error || 'Could not process the refund automatically. Process it manually.' });
      } else {
        toast.success('Success', { description: 'Dispute has been resolved' });
      }

      setShowResolveDialog(false);
      setResolutionForm({ decision: '', explanation: '', action: '', awardedAmount: '' });
      fetchDisputes();
      setShowDetailsDialog(false);
    } catch (error: any) {
      toast.error('Error', { description: error.response?.data?.message || 'Failed to resolve dispute' });
    } finally {
      setActionSubmitting(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: 'bg-blue-500',
      under_review: 'bg-yellow-500',
      investigating: 'bg-orange-500',
      awaiting_response: 'bg-purple-500',
      resolved: 'bg-green-500',
      closed: 'bg-gray-500',
      escalated: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-500',
      medium: 'bg-blue-500',
      high: 'bg-orange-500',
      urgent: 'bg-red-500'
    };
    return colors[priority] || 'bg-gray-500';
  };

  const getAgeBadge = (dispute: Dispute) => {
    if (['resolved', 'closed'].includes(dispute.status)) return null;
    const ageHours = (Date.now() - new Date(dispute.createdAt).getTime()) / (1000 * 60 * 60);
    const slaHours: Record<string, number> = { urgent: 24, high: 48, medium: 96, low: 168 };
    const overSla = ageHours > (slaHours[dispute.priority] || 96);
    const ageDays = Math.floor(ageHours / 24);
    return (
      <Badge variant="outline" className={overSla ? 'border-red-500/40 text-red-600' : 'text-muted-foreground'}>
        {ageDays > 0 ? `${ageDays}d old` : `${Math.round(ageHours)}h old`}{overSla ? ' — overdue' : ''}
      </Badge>
    );
  };

  const columns: AdminDataTableColumn<Dispute>[] = [
    {
      key: 'dispute',
      header: 'Dispute',
      render: (dispute) => (
        <div>
          <p className="font-medium">{dispute.subject}</p>
          <p className="text-xs text-muted-foreground">
            {dispute.disputeId} • Filed {new Date(dispute.createdAt).toLocaleDateString()}
          </p>
          {dispute.assignedTo && (
            <p className="text-xs text-muted-foreground mt-1">Assigned to {dispute.assignedTo.fullName}</p>
          )}
        </div>
      ),
    },
    {
      key: 'parties',
      header: 'Parties',
      render: (dispute) => (
        <div className="text-sm">
          <p><span className="text-muted-foreground">Complainant:</span> {dispute.complainant?.fullName || 'Unknown'}</p>
          <p><span className="text-muted-foreground">Respondent:</span> {dispute.respondent?.fullName || 'Unknown'}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (dispute) => <span className="text-sm capitalize">{dispute.category?.replace(/_/g, ' ') || 'N/A'}</span>,
    },
    {
      key: 'status',
      header: 'Priority / Status',
      render: (dispute) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className={getPriorityColor(dispute.priority)}>{dispute.priority}</Badge>
          <Badge className={getStatusColor(dispute.status)}>{dispute.status.replace(/_/g, ' ')}</Badge>
          {getAgeBadge(dispute)}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (dispute) => (
        <div className="flex items-center justify-end gap-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            {dispute.messages?.length || 0}
          </span>
          <Button variant="outline" size="sm" onClick={() => fetchDisputeDetails(dispute._id)}>
            <Eye className="mr-2 h-4 w-4" />
            View & Manage
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dispute Management</h2>
        <p className="text-muted-foreground">
          Review and resolve user disputes
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Disputes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{disputes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.byStatus.find(s => s._id === 'submitted')?.count || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.byStatus.find(s => s._id === 'resolved')?.count || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Awarded</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                PKR {statistics.totalAwarded[0]?.total?.toLocaleString() || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="submitted">New</TabsTrigger>
          <TabsTrigger value="under_review">Under Review</TabsTrigger>
          <TabsTrigger value="investigating">Investigating</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Disputes List */}
      <Card>
        <CardContent className="p-6">
          <AdminDataTable
            columns={columns}
            rows={disputes}
            getRowKey={(dispute) => dispute._id}
            loading={loading}
            emptyTitle="No disputes found"
          />
        </CardContent>
      </Card>

      {/* Dispute Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          {selectedDispute && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDispute.subject}</DialogTitle>
                <DialogDescription>
                  {selectedDispute.disputeId} • {selectedDispute.category.replace(/_/g, ' ')}
                </DialogDescription>
              </DialogHeader>
              
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-6">
                  {/* Parties */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Complainant</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={selectedDispute.complainant?.avatar?.url} />
                            <AvatarFallback>
                              {selectedDispute.complainant?.fullName?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{selectedDispute.complainant?.fullName || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{selectedDispute.complainant?.email || 'N/A'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Respondent</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={selectedDispute.respondent?.avatar?.url} />
                            <AvatarFallback>
                              {selectedDispute.respondent?.fullName?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{selectedDispute.respondent?.fullName || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{selectedDispute.respondent?.email || 'N/A'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Description */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedDispute.description}</p>
                    </CardContent>
                  </Card>

                  {/* Respondent Response */}
                  {selectedDispute.respondentResponse?.submitted && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Respondent's Response</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{selectedDispute.respondentResponse.response}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Messages */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Communication</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64 mb-4">
                        <div className="space-y-4">
                          {selectedDispute.messages?.map((msg, idx) => (
                            <div key={idx} className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={msg.sender?.avatar?.url} />
                                <AvatarFallback>{msg.sender?.fullName?.[0] || '?'}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{msg.sender?.fullName || 'Unknown'}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {msg.senderRole}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(msg.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm mt-1">{msg.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          rows={2}
                        />
                        <Button onClick={handleSendMessage} disabled={actionSubmitting === 'message' || !newMessage.trim()}>
                          {actionSubmitting === 'message' ? 'Sending...' : 'Send'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {!selectedDispute.assignedTo && user?.isSuperAdmin && (
                      <Button onClick={handleAssignToMe} disabled={actionSubmitting === 'assign'}>
                        {actionSubmitting === 'assign' ? 'Assigning...' : 'Assign to Me'}
                      </Button>
                    )}
                    {selectedDispute.status !== 'resolved' && (
                      <>
                        <Select onValueChange={handleUpdateStatus} disabled={actionSubmitting === 'status'}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder={actionSubmitting === 'status' ? 'Updating...' : 'Update Status'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="under_review">Under Review</SelectItem>
                            <SelectItem value="investigating">Investigating</SelectItem>
                            <SelectItem value="awaiting_response">Awaiting Response</SelectItem>
                          </SelectContent>
                        </Select>
                        {user?.isSuperAdmin && (
                          <Button onClick={() => setShowResolveDialog(true)} variant="default">
                            Resolve Dispute
                          </Button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Resolution Summary (if already resolved) */}
                  {selectedDispute.resolution?.decision && (
                    <Card className="border-green-200 bg-green-50/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          Resolution Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Decision</p>
                            <p className="font-medium">{selectedDispute.resolution.decision}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Action</p>
                            <Badge variant="secondary">
                              {selectedDispute.resolution.action?.replace(/_/g, ' ') || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                        {selectedDispute.resolution.explanation && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Explanation</p>
                            <p className="text-sm text-muted-foreground">{selectedDispute.resolution.explanation}</p>
                          </div>
                        )}
                        {selectedDispute.awardedAmount !== undefined && selectedDispute.awardedAmount > 0 && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-100">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-xs text-muted-foreground">Payout Awarded</p>
                              <p className="font-semibold text-green-700">
                                PKR {selectedDispute.awardedAmount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}
                        {selectedDispute.resolution.resolvedAt && (
                          <p className="text-xs text-muted-foreground">
                            Resolved on {new Date(selectedDispute.resolution.resolvedAt).toLocaleString()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Timeline */}
                  {selectedDispute.timeline?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Timeline</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedDispute.timeline.map((event, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium capitalize">
                                  {event.action.replace(/_/g, ' ')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(event.timestamp).toLocaleString()}
                                  {event.performedBy && ` · by ${event.performedBy.fullName}`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Provide resolution details. This action will close the dispute and notify both parties.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="decision">Decision *</Label>
              <Input
                id="decision"
                value={resolutionForm.decision}
                onChange={(e) => setResolutionForm({ ...resolutionForm, decision: e.target.value })}
                placeholder="e.g. Refund approved for complainant"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="explanation">Explanation *</Label>
              <Textarea
                id="explanation"
                value={resolutionForm.explanation}
                onChange={(e) => setResolutionForm({ ...resolutionForm, explanation: e.target.value })}
                placeholder="Detailed explanation visible to both parties..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Action Taken *</Label>
              <Select
                value={resolutionForm.action}
                onValueChange={(value) => setResolutionForm({ ...resolutionForm, action: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="refund_issued">Refund Issued</SelectItem>
                  <SelectItem value="warning_given">Warning Given</SelectItem>
                  <SelectItem value="account_suspended">Account Suspended</SelectItem>
                  <SelectItem value="booking_cancelled">Booking Cancelled</SelectItem>
                  <SelectItem value="compensation_provided">Compensation Provided</SelectItem>
                  <SelectItem value="no_action">No Action Required</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payout Adjustment */}
            <div className="space-y-2 p-4 rounded-lg border bg-muted/30">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Payout Adjustment (Optional)
              </Label>
              <p className="text-xs text-muted-foreground">
                If a refund or compensation is awarded, enter the PKR amount here. This will be
                recorded and trigger the payout workflow.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">PKR</span>
                <Input
                  id="awardedAmount"
                  type="number"
                  min="0"
                  value={resolutionForm.awardedAmount}
                  onChange={(e) => setResolutionForm({ ...resolutionForm, awardedAmount: e.target.value })}
                  placeholder="0"
                  className="flex-1"
                />
              </div>
              {resolutionForm.awardedAmount && parseFloat(resolutionForm.awardedAmount) > 0 && (
                <p className="text-xs text-green-600 font-medium">
                  PKR {parseFloat(resolutionForm.awardedAmount).toLocaleString()} will be awarded to the complainant
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleResolveDispute}
              disabled={actionSubmitting === 'resolve' || !resolutionForm.decision || !resolutionForm.explanation || !resolutionForm.action}
            >
              {actionSubmitting === 'resolve' ? 'Resolving...' : 'Resolve & Close Dispute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDisputes;
