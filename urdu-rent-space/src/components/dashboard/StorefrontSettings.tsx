import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, Crown, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { storefrontApi } from '@/lib/api';

interface StorefrontData {
  enabled: boolean;
  slug?: string;
  name?: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
}

const StorefrontSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [form, setForm] = useState<StorefrontData>({ enabled: false });

  useEffect(() => {
    storefrontApi.getSettings().then((res) => {
      setEligible(res.data.data.eligible);
      setForm(res.data.data.storefront || { enabled: false });
    }).catch(() => {
      toast.error('Failed to load storefront settings');
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await storefrontApi.update(form);
      setForm(res.data.data);
      toast.success('Storefront saved');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save storefront');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!eligible) {
    return (
      <Card>
        <CardContent className="p-12 text-center space-y-4">
          <Crown className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-semibold text-foreground">Storefront pages are a Pro/Business feature</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Group all your listings under one branded public page by upgrading to Pro or Business.
          </p>
          <Link to="/subscription">
            <Button className="gap-2">
              <Crown className="h-4 w-4" />
              Upgrade
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
          <Store className="h-6 w-6" />
          Storefront
        </h1>
        <p className="text-muted-foreground">Your public brand page grouping all your listings.</p>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Page details</CardTitle>
            <CardDescription>
              {form.slug ? (
                <span className="flex items-center gap-2">
                  Live at <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/store/{form.slug}</code>
                  {form.enabled && (
                    <a href={`/store/${form.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </span>
              ) : 'Choose a URL to publish your storefront'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label htmlFor="storefront-enabled" className="font-medium">Publish storefront</Label>
                <p className="text-sm text-muted-foreground">Make your page publicly visible</p>
              </div>
              <Switch
                id="storefront-enabled"
                checked={!!form.enabled}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, enabled: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Storefront URL</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">/store/</span>
                <Input
                  id="slug"
                  placeholder="your-business-name"
                  value={form.slug || ''}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Business name</Label>
              <Input
                id="name"
                placeholder="e.g. Karachi Wheels Rentals"
                value={form.name || ''}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                placeholder="A short one-liner about your business"
                maxLength={200}
                value={form.tagline || ''}
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                maxLength={1000}
                placeholder="Tell borrowers about your business"
                value={form.description || ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                placeholder="https://..."
                value={form.logoUrl || ''}
                onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bannerUrl">Banner image URL</Label>
              <Input
                id="bannerUrl"
                placeholder="https://..."
                value={form.bannerUrl || ''}
                onChange={(e) => setForm((f) => ({ ...f, bannerUrl: e.target.value }))}
              />
            </div>

            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save storefront
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default StorefrontSettings;
