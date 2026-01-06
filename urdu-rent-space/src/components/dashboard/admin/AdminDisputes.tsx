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
  User,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch disputes',
        variant: 'destructive'
      });
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
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch dispute details',
        variant: 'destructive'
      });
    }
  };

  const handleAssignToMe = async () => {
    if (!selectedDispute) return;
    
    try {
      await api.put(`/disputes/${selectedDispute._id}/assign`, {
        adminId: user?._id
      });
      
      toast({
        title: 'Success',
        description: 'Dispute assigned to you'
      });
      
      fetchDisputes();
      if (selectedDispute) {
        fetchDisputeDetails(selectedDispute._id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to assign dispute',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedDispute) return;
    
    try {
      await api.put(`/disputes/${selectedDispute._id}/status`, { status });
      
      toast({
        title: 'Success',
        description: 'Dispute status updated'
      });
      
      fetchDisputes();
      if (selectedDispute) {
        fetchDisputeDetails(selectedDispute._id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update status',
        variant: 'destructive'
      });
    }
  };

  const handleSendMessage = async () => {
    if (!selectedDispute || !newMessage.trim()) return;
    
    try {
      await api.post(`/disputes/${selectedDispute._id}/messages`, {
        content: newMessage
      });
      
      setNewMessage('');
      toast({
        title: 'Success',
        description: 'Message sent'
      });
      
      fetchDisputeDetails(selectedDispute._id);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const handleResolveDispute = async () => {
    if (!selectedDispute) return;
    
    try {
      const payload = {
        ...resolutionForm,
        awardedAmount: resolutionForm.awardedAmount ? parseFloat(resolutionForm.awardedAmount) : undefined
      };

      await api.put(`/disputes/${selectedDispute._id}/resolve`, payload);
      
      toast({
        title: 'Success',
        description: 'Dispute has been resolved'
      });
      
      setShowResolveDialog(false);
      setResolutionForm({ decision: '', explanation: '', action: '', awardedAmount: '' });
      fetchDisputes();
      setShowDetailsDialog(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to resolve dispute',
        variant: 'destructive'
      });
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
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {disputes.map((dispute) => (
            <Card key={dispute._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{dispute.subject}</CardTitle>
                    <CardDescription>
                      {dispute.disputeId} • Filed {new Date(dispute.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(dispute.priority)}>
                      {dispute.priority}
                    </Badge>
                    <Badge className={getStatusColor(dispute.status)}>
                      {dispute.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Complainant:</span>
                      <p className="font-medium">{dispute.complainant.fullName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Respondent:</span>
                      <p className="font-medium">{dispute.respondent.fullName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Category:</span>
                      <p className="font-medium">{dispute.category.replace(/_/g, ' ')}</p>
                    </div>
                  </div>

                  {dispute.assignedTo && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Assigned to:</span>
                      <span className="font-medium">{dispute.assignedTo.fullName}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      <span>{dispute.messages?.length || 0} messages</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fetchDisputeDetails(dispute._id)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View & Manage
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
                            <AvatarImage src={selectedDispute.complainant.avatar?.url} />
                            <AvatarFallback>
                              {selectedDispute.complainant.fullName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{selectedDispute.complainant.fullName}</p>
                            <p className="text-sm text-muted-foreground">{selectedDispute.complainant.email}</p>
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
                            <AvatarImage src={selectedDispute.respondent.avatar?.url} />
                            <AvatarFallback>
                              {selectedDispute.respondent.fullName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{selectedDispute.respondent.fullName}</p>
                            <p className="text-sm text-muted-foreground">{selectedDispute.respondent.email}</p>
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
                          {selectedDispute.messages.map((msg, idx) => (
                            <div key={idx} className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={msg.sender.avatar?.url} />
                                <AvatarFallback>{msg.sender.fullName[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{msg.sender.fullName}</span>
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
                        <Button onClick={handleSendMessage}>Send</Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {!selectedDispute.assignedTo && user?.isSuperAdmin && (
                      <Button onClick={handleAssignToMe}>Assign to Me</Button>
                    )}
                    {selectedDispute.status !== 'resolved' && (
                      <>
                        <Select onValueChange={handleUpdateStatus}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Update Status" />
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
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Provide resolution details for this dispute
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="decision">Decision *</Label>
              <Input
                id="decision"
                value={resolutionForm.decision}
                onChange={(e) => setResolutionForm({ ...resolutionForm, decision: e.target.value })}
                placeholder="Brief decision summary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="explanation">Explanation *</Label>
              <Textarea
                id="explanation"
                value={resolutionForm.explanation}
                onChange={(e) => setResolutionForm({ ...resolutionForm, explanation: e.target.value })}
                placeholder="Detailed explanation of the resolution"
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

            <div className="space-y-2">
              <Label htmlFor="awardedAmount">Awarded Amount (PKR)</Label>
              <Input
                id="awardedAmount"
                type="number"
                min="0"
                value={resolutionForm.awardedAmount}
                onChange={(e) => setResolutionForm({ ...resolutionForm, awardedAmount: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolveDispute}>
              Resolve Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDisputes;
