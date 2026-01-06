import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle, 
  Plus, 
  MessageSquare, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  User as UserIcon
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: { url: string };
  role: string;
}

interface Dispute {
  _id: string;
  disputeId: string;
  complainant: {
    _id: string;
    fullName: string;
    avatar?: { url: string };
  };
  respondent: {
    _id: string;
    fullName: string;
    avatar?: { url: string };
  };
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  booking?: {
    bookingId: string;
  };
  listing?: {
    title: string;
  };
  createdAt: string;
  messages: any[];
}

const Disputes: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filter, setFilter] = useState('all');

  // User search states
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    respondentId: '',
    bookingId: '',
    category: '',
    subject: '',
    description: '',
    requestedAmount: ''
  });

  useEffect(() => {
    if (user) {
      fetchDisputes();
    }
  }, [user]);

  // Search users when query changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (userSearchQuery.length >= 2) {
        searchUsers(userSearchQuery);
      } else {
        setSearchedUsers([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [userSearchQuery]);

  const searchUsers = async (query: string) => {
    try {
      setSearchingUsers(true);
      const response = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
      setSearchedUsers(response.data.data);
    } catch (error: any) {
      console.error('Failed to search users:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      // Super admins see all disputes, regular users see only their own
      const endpoint = user?.isSuperAdmin ? '/disputes/admin/all' : '/disputes/my-disputes';
      const response = await api.get(endpoint);
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

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast({
        title: 'Error',
        description: 'Please select a user to file dispute against',
        variant: 'destructive'
      });
      return;
    }

    try {
      const payload = {
        respondentId: selectedUser._id,
        bookingId: formData.bookingId || undefined,
        category: formData.category,
        subject: formData.subject,
        description: formData.description,
        requestedAmount: formData.requestedAmount ? parseFloat(formData.requestedAmount) : undefined
      };

      await api.post('/disputes', payload);
      
      toast({
        title: 'Success',
        description: 'Dispute has been submitted successfully. Our team will review it shortly.'
      });

      setShowCreateDialog(false);
      setFormData({
        respondentId: '',
        bookingId: '',
        category: '',
        subject: '',
        description: '',
        requestedAmount: ''
      });
      setSelectedUser(null);
      setUserSearchQuery('');
      fetchDisputes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create dispute',
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

  const filteredDisputes = disputes.filter(dispute => {
    if (filter === 'all') return true;
    return dispute.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {user?.isSuperAdmin ? 'All Disputes' : 'Dispute Resolution Center'}
          </h2>
          <p className="text-muted-foreground">
            {user?.isSuperAdmin 
              ? 'Review and manage all user disputes' 
              : 'Manage and track your disputes with our support team'}
          </p>
        </div>
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
                Provide details about your dispute. Your dispute will be sent to our admin team for review - not to the other party directly.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateDispute} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="respondent">Respondent User ID *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Enter the user ID of the other party. This is for admin reference only - they won't see this dispute.
                </p>
                <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={userSearchOpen}
                      className="w-full justify-between"
                    >
                      {selectedUser ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={selectedUser.avatar?.url} />
                            <AvatarFallback>{selectedUser.fullName[0]}</AvatarFallback>
                          </Avatar>
                          <span className="truncate">{selectedUser.fullName}</span>
                          <Badge variant="secondary" className="ml-2">
                            {selectedUser.role}
                          </Badge>
                        </div>
                      ) : (
                        <>
                          <span className="text-muted-foreground">Search user by name, email, or phone...</span>
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Type to search users..."
                        value={userSearchQuery}
                        onValueChange={setUserSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {searchingUsers ? (
                            <div className="flex items-center justify-center py-6">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            </div>
                          ) : userSearchQuery.length < 2 ? (
                            'Type at least 2 characters to search...'
                          ) : (
                            'No users found.'
                          )}
                        </CommandEmpty>
                        <CommandGroup>
                          {searchedUsers.map((searchUser) => (
                            <CommandItem
                              key={searchUser._id}
                              value={searchUser._id}
                              onSelect={() => {
                                setSelectedUser(searchUser);
                                setUserSearchOpen(false);
                              }}
                            >
                              <div className="flex items-center gap-3 w-full">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={searchUser.avatar?.url} />
                                  <AvatarFallback>{searchUser.fullName[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{searchUser.fullName}</p>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {searchUser.email}
                                  </p>
                                </div>
                                <Badge variant="outline">{searchUser.role}</Badge>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedUser && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedUser.fullName} ({selectedUser.email})
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bookingId">Booking ID (Optional)</Label>
                <Input
                  id="bookingId"
                  value={formData.bookingId}
                  onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                  placeholder="Related booking ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  required
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select dispute category" />
                  </SelectTrigger>
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
                <Input
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of the issue"
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea
                  id="description"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide detailed information about your dispute..."
                  rows={5}
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/2000 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestedAmount">Requested Amount (PKR, Optional)</Label>
                <Input
                  id="requestedAmount"
                  type="number"
                  min="0"
                  value={formData.requestedAmount}
                  onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
                  placeholder="0"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit Dispute</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="under_review">Under Review</TabsTrigger>
          <TabsTrigger value="investigating">Investigating</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Disputes List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredDisputes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No disputes found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {user?.isSuperAdmin 
                ? 'No disputes have been filed yet.'
                : "You haven't filed any disputes yet. If you encounter any issues, you can file a dispute above."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDisputes.map((dispute) => {
            const isComplainant = dispute.complainant._id === user?._id;
            const otherParty = isComplainant ? dispute.respondent : dispute.complainant;

            return (
              <Card key={dispute._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{dispute.subject}</CardTitle>
                      <CardDescription>
                        Dispute ID: {dispute.disputeId}
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
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <p className="font-medium">{dispute.category.replace(/_/g, ' ')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {isComplainant ? 'Respondent:' : 'Filed by:'}
                        </span>
                        <p className="font-medium">{otherParty.fullName}</p>
                      </div>
                      {dispute.booking && (
                        <div>
                          <span className="text-muted-foreground">Booking:</span>
                          <p className="font-medium">{dispute.booking.bookingId}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Filed:</span>
                        <p className="font-medium">
                          {new Date(dispute.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {dispute.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        <span>{dispute.messages?.length || 0} messages</span>
                      </div>
                      <Button variant="outline" size="sm">
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
    </div>
  );
};

export default Disputes;
