import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  Plus,
  MessageSquare,
  Eye,
  Search,
  CheckCircle2,
  DollarSign,
  Activity,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface SearchUser {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: { url: string };
  role: string;
}

interface DisputeMessage {
  sender: {
    _id: string;
    fullName: string;
    avatar?: { url: string };
  };
  senderRole: string;
  content: string;
  timestamp: string;
}

interface TimelineEvent {
  action: string;
  timestamp: string;
  performedBy?: { fullName: string };
}

interface Dispute {
  _id: string;
  disputeId: string;
  complainant: { _id: string; fullName: string; avatar?: { url: string } };
  respondent: { _id: string; fullName: string; avatar?: { url: string } };
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  booking?: { bookingId: string };
  listing?: { title: string };
  createdAt: string;
  requestedAmount?: number;
  awardedAmount?: number;
  messages: DisputeMessage[];
  timeline: TimelineEvent[];
  respondentResponse?: { submitted: boolean; response?: string; submittedAt?: string };
  resolution?: { decision?: string; explanation?: string; action?: string; resolvedAt?: string };
  assignedTo?: { fullName: string };
}

const Disputes: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [filter, setFilter] = useState('all');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // User search
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<SearchUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Create form
  const [formData, setFormData] = useState({
    bookingId: '',
    category: '',
    subject: '',
    description: '',
    requestedAmount: '',
  });

  useEffect(() => {
    if (user) fetchDisputes();
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearchQuery.length >= 2) searchUsers(userSearchQuery);
      else setSearchedUsers([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  const searchUsers = async (query: string) => {
    try {
      setSearchingUsers(true);
      const res = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
      setSearchedUsers(res.data.data);
    } catch {
      // silent
    } finally {
      setSearchingUsers(false);
    }
  };

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const endpoint = user?.isSuperAdmin ? '/disputes/admin/all' : '/disputes/my-disputes';
      const res = await api.get(endpoint);
      setDisputes(res.data.data);
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to fetch disputes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputeDetails = async (disputeId: string) => {
    try {
      const res = await api.get(`/disputes/${disputeId}`);
      setSelectedDispute(res.data.data);
      setShowDetailDialog(true);
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to load details', variant: 'destructive' });
    }
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      toast({ title: 'Error', description: 'Please select a user', variant: 'destructive' });
      return;
    }
    try {
      await api.post('/disputes', {
        respondentId: selectedUser._id,
        bookingId: formData.bookingId || undefined,
        category: formData.category,
        subject: formData.subject,
        description: formData.description,
        requestedAmount: formData.requestedAmount ? parseFloat(formData.requestedAmount) : undefined,
      });
      toast({ title: 'Success', description: 'Dispute submitted. Our team will review it shortly.' });
      setShowCreateDialog(false);
      setFormData({ bookingId: '', category: '', subject: '', description: '', requestedAmount: '' });
      setSelectedUser(null);
      setUserSearchQuery('');
      fetchDisputes();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create dispute', variant: 'destructive' });
    }
  };

  const handleSendMessage = async () => {
    if (!selectedDispute || !newMessage.trim()) return;
    try {
      setSendingMessage(true);
      await api.post(`/disputes/${selectedDispute._id}/messages`, { content: newMessage });
      setNewMessage('');
      toast({ title: 'Message sent' });
      const res = await api.get(`/disputes/${selectedDispute._id}`);
      setSelectedDispute(res.data.data);
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to send message', variant: 'destructive' });
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      submitted: 'bg-blue-500',
      under_review: 'bg-yellow-500',
      investigating: 'bg-orange-500',
      awaiting_response: 'bg-purple-500',
      resolved: 'bg-green-500',
      closed: 'bg-gray-500',
      escalated: 'bg-red-500',
    };
    return map[status] || 'bg-gray-500';
  };

  const getPriorityColor = (priority: string) => {
    const map: Record<string, string> = {
      low: 'bg-gray-500',
      medium: 'bg-blue-500',
      high: 'bg-orange-500',
      urgent: 'bg-red-500',
    };
    return map[priority] || 'bg-gray-500';
  };

  const filteredDisputes = disputes.filter((d) => filter === 'all' || d.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dispute Resolution Center</h2>
          <p className="text-muted-foreground">Manage and track your disputes with our support team</p>
        </div>

        {/* Create Dispute Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              File New Dispute
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>File a New Dispute</DialogTitle>
              <DialogDescription>
                Your dispute will be reviewed by our admin team — not sent directly to the other party.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateDispute} className="space-y-4">
              {/* User Search */}
              <div className="space-y-2">
                <Label>Respondent *</Label>
                <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
                      {selectedUser ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={selectedUser.avatar?.url} />
                            <AvatarFallback>{selectedUser.fullName[0]}</AvatarFallback>
                          </Avatar>
                          <span className="truncate">{selectedUser.fullName}</span>
                          <Badge variant="secondary">{selectedUser.role}</Badge>
                        </div>
                      ) : (
                        <>
                          <span className="text-muted-foreground">Search by name, email or phone...</span>
                          <Search className="ml-2 h-4 w-4 opacity-50" />
                        </>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[480px] p-0">
                    <Command shouldFilter={false}>
                      <CommandInput placeholder="Type to search..." value={userSearchQuery} onValueChange={setUserSearchQuery} />
                      <CommandList>
                        <CommandEmpty>
                          {searchingUsers ? (
                            <div className="flex justify-center py-6">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                            </div>
                          ) : userSearchQuery.length < 2 ? 'Type at least 2 characters...' : 'No users found.'}
                        </CommandEmpty>
                        <CommandGroup>
                          {searchedUsers.map((u) => (
                            <CommandItem key={u._id} value={u._id} onSelect={() => { setSelectedUser(u); setUserSearchOpen(false); }}>
                              <div className="flex items-center gap-3 w-full">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={u.avatar?.url} />
                                  <AvatarFallback>{u.fullName[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{u.fullName}</p>
                                  <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                                </div>
                                <Badge variant="outline">{u.role}</Badge>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bookingId">Booking ID (Optional)</Label>
                <Input id="bookingId" value={formData.bookingId} onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })} placeholder="Related booking ID" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select required value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment_issue">Payment Issue</SelectItem>
                    <SelectItem value="property_condition">Property Condition</SelectItem>
                    <SelectItem value="cancellation_dispute">Cancellation Dispute</SelectItem>
                    <SelectItem value="damage_claim">Damage Claim</SelectItem>
                    <SelectItem value="refund_request">Refund Request</SelectItem>
                    <SelectItem value="behavior_issue">Behavior Issue</SelectItem>
                    <SelectItem value="safety_concern">Safety Concern</SelectItem>
                    <SelectItem value="fraudulent_activity">Fraudulent Activity</SelectItem>
                    <SelectItem value="breach_of_terms">Breach of Terms</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input id="subject" required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="Brief description of the issue" maxLength={200} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea id="description" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Provide detailed information..." rows={5} maxLength={2000} />
                <p className="text-xs text-muted-foreground">{formData.description.length}/2000</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestedAmount">Requested Amount PKR (Optional)</Label>
                <Input id="requestedAmount" type="number" min="0" value={formData.requestedAmount} onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })} placeholder="0" />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button type="submit">Submit Dispute</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="under_review">Under Review</TabsTrigger>
          <TabsTrigger value="investigating">Investigating</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      ) : filteredDisputes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No disputes found</h3>
            <p className="text-muted-foreground text-center">
              You haven't filed any disputes yet. If you encounter any issues, you can file a dispute above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDisputes.map((dispute) => {
            const isComplainant = dispute.complainant?._id === user?._id;
            const otherParty = isComplainant ? dispute.respondent : dispute.complainant;
            return (
              <Card key={dispute._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{dispute.subject}</CardTitle>
                      <CardDescription>Dispute ID: {dispute.disputeId}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getPriorityColor(dispute.priority)}>{dispute.priority}</Badge>
                      <Badge className={getStatusColor(dispute.status)}>{dispute.status.replace(/_/g, ' ')}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <p className="font-medium">{dispute.category.replace(/_/g, ' ')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{isComplainant ? 'Against:' : 'Filed by:'}</span>
                        <p className="font-medium">{otherParty?.fullName || 'Unknown'}</p>
                      </div>
                      {dispute.booking && (
                        <div>
                          <span className="text-muted-foreground">Booking:</span>
                          <p className="font-medium">{dispute.booking.bookingId}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Filed:</span>
                        <p className="font-medium">{new Date(dispute.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{dispute.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        <span>{dispute.messages?.length || 0} messages</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => fetchDisputeDetails(dispute._id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          {selectedDispute && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selectedDispute.subject}
                  <Badge className={getStatusColor(selectedDispute.status)}>
                    {selectedDispute.status.replace(/_/g, ' ')}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedDispute.disputeId} · {selectedDispute.category.replace(/_/g, ' ')} · Filed{' '}
                  {new Date(selectedDispute.createdAt).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="h-[65vh] pr-4">
                <div className="space-y-6">
                  {/* Parties */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Complainant</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={selectedDispute.complainant?.avatar?.url} />
                            <AvatarFallback>{selectedDispute.complainant?.fullName?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <p className="font-medium">{selectedDispute.complainant?.fullName || 'Unknown'}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Respondent</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={selectedDispute.respondent?.avatar?.url} />
                            <AvatarFallback>{selectedDispute.respondent?.fullName?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <p className="font-medium">{selectedDispute.respondent?.fullName || 'Unknown'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Financial */}
                  {(selectedDispute.requestedAmount || (selectedDispute.awardedAmount && selectedDispute.awardedAmount > 0)) && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-6">
                          {selectedDispute.requestedAmount && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Requested</p>
                                <p className="font-semibold">PKR {selectedDispute.requestedAmount.toLocaleString()}</p>
                              </div>
                            </div>
                          )}
                          {selectedDispute.awardedAmount !== undefined && selectedDispute.awardedAmount > 0 && (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <div>
                                <p className="text-xs text-muted-foreground">Awarded</p>
                                <p className="font-semibold text-green-600">PKR {selectedDispute.awardedAmount.toLocaleString()}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Description */}
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Description</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{selectedDispute.description}</p>
                    </CardContent>
                  </Card>

                  {/* Respondent Response */}
                  {selectedDispute.respondentResponse?.submitted && (
                    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                      <CardHeader className="pb-2"><CardTitle className="text-sm">Respondent's Response</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{selectedDispute.respondentResponse.response}</p>
                        {selectedDispute.respondentResponse.submittedAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Submitted {new Date(selectedDispute.respondentResponse.submittedAt).toLocaleString()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Resolution */}
                  {selectedDispute.resolution?.decision && (
                    <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-green-700 dark:text-green-300">
                          <CheckCircle2 className="h-4 w-4" />
                          Resolution
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Decision</p>
                          <p className="font-medium">{selectedDispute.resolution.decision}</p>
                        </div>
                        {selectedDispute.resolution.explanation && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Explanation</p>
                            <p className="text-sm text-muted-foreground">{selectedDispute.resolution.explanation}</p>
                          </div>
                        )}
                        {selectedDispute.resolution.action && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Action Taken</p>
                            <Badge variant="secondary">{selectedDispute.resolution.action.replace(/_/g, ' ')}</Badge>
                          </div>
                        )}
                        {selectedDispute.resolution.resolvedAt && (
                          <p className="text-xs text-muted-foreground">
                            Resolved on {new Date(selectedDispute.resolution.resolvedAt).toLocaleDateString()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Messages */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Communication ({selectedDispute.messages?.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-56 mb-4">
                        <div className="space-y-4 pr-2">
                          {!selectedDispute.messages?.length ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No messages yet</p>
                          ) : (
                            selectedDispute.messages.map((msg, idx) => {
                              const isMe = msg.sender?._id === user?._id;
                              return (
                                <div key={idx} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                  <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarImage src={msg.sender?.avatar?.url} />
                                    <AvatarFallback>{msg.sender?.fullName?.[0] || '?'}</AvatarFallback>
                                  </Avatar>
                                  <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-medium">{isMe ? 'You' : msg.sender?.fullName || 'Unknown'}</span>
                                      <Badge variant="outline" className="text-xs py-0">{msg.senderRole}</Badge>
                                      <span className="text-xs text-muted-foreground">{new Date(msg.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div className={`rounded-lg px-3 py-2 text-sm ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                      {msg.content}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </ScrollArea>
                      {!['resolved', 'closed'].includes(selectedDispute.status) && (
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Add a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            rows={2}
                            className="resize-none"
                          />
                          <Button onClick={handleSendMessage} disabled={sendingMessage || !newMessage.trim()} className="self-end">
                            {sendingMessage ? 'Sending...' : 'Send'}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Timeline */}
                  {selectedDispute.timeline?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Timeline
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedDispute.timeline.map((event, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium capitalize">{event.action.replace(/_/g, ' ')}</p>
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
    </div>
  );
};

export default Disputes;
