import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { messageApi, safetyApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  MessageSquare,
  Send,
  User,
  Search,
  ArrowLeft,
  Clock,
  Check,
  CheckCheck,
  MoreVertical,
  ShieldAlert,
  ShieldOff,
  Flag,
  Paperclip,
  CalendarPlus,
  Calendar as CalendarIcon,
  Info,
} from 'lucide-react';

interface Message {
  _id: string;
  sender: { _id: string; fullName: string };
  content: string;
  attachments?: { url: string; type: string }[];
  read: boolean;
  createdAt: string;
}

interface Conversation {
  _id: string;
  participants: Array<{ _id: string; fullName: string; profileImage?: { url: string } }>;
  listing?: { _id: string; title: string; images?: Array<{ url: string }> };
  lastMessage?: { content: string; createdAt: string; read: boolean };
  unreadCount?: number;
  booking?: { _id: string; bookingId: string; status: string };
  updatedAt: string;
}

const REPORT_REASONS = [
  { value: 'harassment', label: 'Harassment or abusive language' },
  { value: 'scam', label: 'Scam or fraud attempt' },
  { value: 'off_platform_payment', label: 'Asked to pay outside the app' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
];

interface MessagesProps {
  onNavigateTab?: (tab: string) => void;
}

const Messages: React.FC<MessagesProps> = ({ onNavigateTab }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportNote, setReportNote] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchConversations().then(() => openPendingConversation());
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await messageApi.getConversations();
      setConversations(response.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const openPendingConversation = async () => {
    const raw = sessionStorage.getItem('pending_conversation');
    if (!raw) return;
    sessionStorage.removeItem('pending_conversation');
    try {
      const { participantId, listingId } = JSON.parse(raw);
      if (!participantId) return;
      const res = await messageApi.createConversation({ participantId, listingId });
      const conversation = res.data?.data;
      if (conversation) {
        setConversations((prev) => {
          const exists = prev.some((c) => c._id === conversation._id);
          return exists ? prev : [conversation, ...prev];
        });
        setSelectedConversation(conversation);
      }
    } catch (err) {
      console.error('Failed to open pending conversation:', err);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true);
      const response = await messageApi.getMessages(conversationId);
      setMessages(response.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      await messageApi.sendMessage(selectedConversation._id, { content: newMessage });
      setNewMessage('');
      fetchMessages(selectedConversation._id);
      fetchConversations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleAttachmentPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;
    try {
      setSending(true);
      const formData = new FormData();
      formData.append('images', file);
      await messageApi.sendAttachment(selectedConversation._id, formData);
      fetchMessages(selectedConversation._id);
      fetchConversations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send attachment');
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p._id !== user?._id) || conversation.participants[0];
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleToggleBlock = async (conversation: Conversation) => {
    const other = getOtherParticipant(conversation);
    try {
      const res = await safetyApi.toggleBlock(other._id);
      const blocked = res.data?.data?.blocked;
      setBlockedIds((prev) => {
        const next = new Set(prev);
        if (blocked) next.add(other._id);
        else next.delete(other._id);
        return next;
      });
      toast.success(blocked ? `Blocked ${other.fullName}` : `Unblocked ${other.fullName}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update block status');
    }
  };

  const openReportDialog = () => {
    setReportReason('');
    setReportNote('');
    setReportOpen(true);
  };

  const handleSubmitReport = async () => {
    if (!selectedConversation || !reportReason) {
      toast.error('Please select a reason');
      return;
    }
    const other = getOtherParticipant(selectedConversation);
    setReportSubmitting(true);
    try {
      await safetyApi.reportUser(other._id, {
        reason: reportReason,
        description: reportNote.trim() || undefined,
        conversationId: selectedConversation._id,
      });
      toast.success('Report submitted. Our team will review it.');
      setReportOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setReportSubmitting(false);
    }
  };

  const goToBooking = (conversation: Conversation) => {
    if (!conversation.booking) return;
    onNavigateTab?.('bookings');
  };

  const goToDispute = (conversation: Conversation) => {
    if (!conversation.booking) return;
    const other = getOtherParticipant(conversation);
    sessionStorage.setItem('dispute_prefill', JSON.stringify({
      bookingId: conversation.booking._id,
      bookingCode: conversation.booking.bookingId,
      respondentId: other._id,
      respondentName: other.fullName,
      listingTitle: conversation.listing?.title,
    }));
    onNavigateTab?.('disputes');
  };

  const filteredConversations = conversations.filter((conv) => {
    const other = getOtherParticipant(conv);
    return (
      other.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.listing?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-[600px]" />
          <Skeleton className="h-[600px] lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t.dashboard.messages}</h1>
        <p className="text-muted-foreground">{t.booking.receivedBookings}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
        {/* Conversations List */}
        <Card className={`${selectedConversation ? 'hidden lg:block' : ''}`}>
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.nav.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t.common.noResults}</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const other = getOtherParticipant(conv);
                  const isSelected = selectedConversation?._id === conv._id;
                  return (
                    <button
                      key={conv._id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors border-b ${
                        isSelected ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {conv.listing?.images?.[0]?.url ? (
                          <img
                            src={conv.listing.images[0].url}
                            alt={conv.listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : other.profileImage?.url ? (
                          <img
                            src={other.profileImage.url}
                            alt={other.fullName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-primary font-medium">
                            {other.fullName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{other.fullName}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conv.updatedAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          {conv.listing && (
                            <p className="text-xs text-primary truncate">{conv.listing.title}</p>
                          )}
                          {conv.booking && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1 h-4">
                              Booking #{conv.booking.bookingId?.slice(-6) || conv.booking._id.slice(-6)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                      {conv.unreadCount && conv.unreadCount > 0 && (
                        <Badge className="bg-primary">{conv.unreadCount}</Badge>
                      )}
                    </button>
                  );
                })
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Messages Area */}
        <Card className={`lg:col-span-2 flex flex-col ${!selectedConversation ? 'hidden lg:flex' : ''}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b py-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {getOtherParticipant(selectedConversation).profileImage?.url ? (
                      <img
                        src={getOtherParticipant(selectedConversation).profileImage!.url}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {getOtherParticipant(selectedConversation).fullName}
                    </p>
                    {selectedConversation.listing && (
                      <p className="text-xs text-muted-foreground">
                        {selectedConversation.listing.title}
                      </p>
                    )}
                  </div>

                  {/* Quick actions */}
                  {selectedConversation.booking ? (
                    <>
                      <Button size="sm" variant="outline" className="gap-1 hidden sm:flex" onClick={() => goToBooking(selectedConversation)}>
                        <CalendarIcon className="h-3.5 w-3.5" /> View booking
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 hidden sm:flex text-destructive" onClick={() => goToDispute(selectedConversation)}>
                        <ShieldAlert className="h-3.5 w-3.5" /> Dispute
                      </Button>
                    </>
                  ) : selectedConversation.listing ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 hidden sm:flex"
                      onClick={() => window.open(`/listing/${selectedConversation.listing?._id}`, '_blank')}
                    >
                      <CalendarPlus className="h-3.5 w-3.5" /> Request to book
                    </Button>
                  ) : null}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {selectedConversation.booking && (
                        <>
                          <DropdownMenuItem className="sm:hidden" onClick={() => goToBooking(selectedConversation)}>
                            <CalendarIcon className="h-4 w-4 mr-2" /> View booking
                          </DropdownMenuItem>
                          <DropdownMenuItem className="sm:hidden text-destructive" onClick={() => goToDispute(selectedConversation)}>
                            <ShieldAlert className="h-4 w-4 mr-2" /> Raise a dispute
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem onClick={() => handleToggleBlock(selectedConversation)}>
                        <ShieldOff className="h-4 w-4 mr-2" />
                        {blockedIds.has(getOtherParticipant(selectedConversation)._id) ? 'Unblock user' : 'Block user'}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={openReportDialog}>
                        <Flag className="h-4 w-4 mr-2" /> Report user
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-[420px] p-4">
                  {messagesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-3/4" />
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-700 text-xs max-w-sm">
                        <Info className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>For your safety, keep payments and communication inside the app — never share card or bank details here.</span>
                      </div>
                      <p className="text-muted-foreground">{t.common.noResults}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-700 text-xs">
                        <Info className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>For your safety, keep payments and communication inside the app.</span>
                      </div>
                      {messages.map((msg) => {
                        const isOwn = msg.sender._id === user?._id;
                        return (
                          <div
                            key={msg._id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground rounded-br-md'
                                  : 'bg-muted rounded-bl-md'
                              }`}
                            >
                              {msg.attachments?.map((a, idx) => (
                                <img
                                  key={idx}
                                  src={a.url}
                                  alt="attachment"
                                  className="rounded-lg mb-1 max-h-48 object-cover cursor-pointer"
                                  onClick={() => window.open(a.url, '_blank')}
                                />
                              ))}
                              {msg.content && <p className="text-sm">{msg.content}</p>}
                              <div
                                className={`flex items-center gap-1 mt-1 ${
                                  isOwn ? 'justify-end' : ''
                                }`}
                              >
                                <span className="text-xs opacity-70">
                                  {formatTime(msg.createdAt)}
                                </span>
                                {isOwn && (
                                  msg.read ? (
                                    <CheckCheck className="h-3 w-3 opacity-70" />
                                  ) : (
                                    <Check className="h-3 w-3 opacity-70" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAttachmentPick}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={sending}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder={t.dashboard.messages}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={sending || !newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">{t.dashboard.messages}</p>
                <p className="text-muted-foreground">{t.common.noResults}</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Report dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report this user</DialogTitle>
            <DialogDescription>
              Reports are reviewed by our moderation team, not sent to the other party.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Additional details (optional)</Label>
              <Textarea value={reportNote} onChange={(e) => setReportNote(e.target.value)} rows={3} maxLength={1000} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)} disabled={reportSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSubmitReport} disabled={reportSubmitting || !reportReason}>
              {reportSubmitting ? 'Submitting...' : 'Submit report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Messages;
