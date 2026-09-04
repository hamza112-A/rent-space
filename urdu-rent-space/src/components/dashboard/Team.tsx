import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Users, UserPlus, Trash2, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { organizationApi } from '@/lib/api';
import EmptyState from '@/components/common/EmptyState';

interface Member {
  user: { _id: string; fullName: string; email: string; phone?: string };
  role: 'admin' | 'staff';
  addedAt: string;
}

interface Organization {
  _id: string;
  name: string;
  owner: { _id: string; fullName: string; email: string };
  members: Member[];
}

const Team: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<Organization | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [ineligible, setIneligible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchOrg = async () => {
    try {
      setLoading(true);
      setIneligible(false);
      const res = await organizationApi.getMine();
      setOrg(res.data.data.organization);
      setMyRole(res.data.data.myRole);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setIneligible(true);
      } else {
        toast.error(err.response?.data?.message || 'Failed to load team');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrg();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await organizationApi.addMember(inviteEmail.trim());
      setOrg(res.data.data);
      setInviteEmail('');
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add team member');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, role: 'admin' | 'staff') => {
    try {
      await organizationApi.updateMemberRole(userId, role);
      setOrg((prev) => prev && {
        ...prev,
        members: prev.members.map((m) => (m.user._id === userId ? { ...m, role } : m)),
      });
      toast.success('Role updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from your team?`)) return;
    try {
      setRemovingId(userId);
      await organizationApi.removeMember(userId);
      setOrg((prev) => prev && { ...prev, members: prev.members.filter((m) => m.user._id !== userId) });
      toast.success('Member removed');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (ineligible) {
    return (
      <Card>
        <CardContent className="p-12 text-center space-y-4">
          <Crown className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-semibold text-foreground">Team accounts are a Business-plan feature</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Invite staff to manage your listings under one shared business account by upgrading to the Business plan.
          </p>
          <Link to="/subscription">
            <Button className="gap-2">
              <Crown className="h-4 w-4" />
              Upgrade to Business
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6" />
          Team
        </h1>
        <p className="text-muted-foreground">
          {org?.name} — staff share your listing pool, limits, and commission rate.
        </p>
      </div>

      {myRole === 'owner' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add a team member</CardTitle>
            <CardDescription>They must already have a MyRental account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex gap-2">
              <Input
                type="email"
                placeholder="teammate@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={inviting} className="gap-2 shrink-0">
                {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Add
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="font-medium text-foreground">{org?.owner.fullName}</p>
              <p className="text-sm text-muted-foreground">{org?.owner.email}</p>
            </div>
            <Badge className="gap-1">
              <Crown className="h-3 w-3" /> Owner
            </Badge>
          </div>

          {org?.members.length === 0 && (
            <EmptyState icon={Users} title="No team members yet." />
          )}

          {org?.members.map((member) => (
            <div key={member.user._id} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-foreground">{member.user.fullName}</p>
                <p className="text-sm text-muted-foreground">{member.user.email}</p>
              </div>
              {myRole === 'owner' ? (
                <div className="flex items-center gap-2">
                  <Select
                    value={member.role}
                    onValueChange={(value) => handleRoleChange(member.user._id, value as 'admin' | 'staff')}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRemove(member.user._id, member.user.fullName)}
                    disabled={removingId === member.user._id}
                  >
                    {removingId === member.user._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <Badge variant="outline" className="capitalize">{member.role}</Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Team;
