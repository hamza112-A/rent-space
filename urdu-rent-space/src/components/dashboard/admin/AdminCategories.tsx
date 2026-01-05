import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Tag, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';

interface Category {
  _id: string;
  name: string;
  nameUrdu: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  subcategories?: Array<{ name: string; nameUrdu: string }>;
}

const AdminCategories: React.FC = () => {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; type: 'create' | 'edit' | 'delete'; category: Category | null }>({ open: false, type: 'create', category: null });
  const [formData, setFormData] = useState({ name: '', nameUrdu: '', description: '', icon: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getCategories();
      setCategories(response.data?.data || []);
    } catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  const openDialog = (type: 'create' | 'edit' | 'delete', category: Category | null = null) => {
    setDialog({ open: true, type, category });
    if (type === 'edit' && category) {
      setFormData({ name: category.name, nameUrdu: category.nameUrdu, description: category.description || '', icon: category.icon || '' });
    } else if (type === 'create') {
      setFormData({ name: '', nameUrdu: '', description: '', icon: '' });
    }
  };

  const handleSubmit = async () => {
    try {
      setActionLoading(true);
      if (dialog.type === 'create') {
        await adminApi.createCategory(formData);
        toast.success('Category created');
      } else if (dialog.type === 'edit' && dialog.category) {
        await adminApi.updateCategory(dialog.category._id, formData);
        toast.success('Category updated');
      } else if (dialog.type === 'delete' && dialog.category) {
        await adminApi.deleteCategory(dialog.category._id);
        toast.success('Category deleted');
      }
      setDialog({ open: false, type: 'create', category: null });
      fetchCategories();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t.admin.categories}</h1>
          <p className="text-muted-foreground">{t.categories.title}</p>
        </div>
        <Button onClick={() => openDialog('create')}><Plus className="h-4 w-4 mr-2" />{t.common.save}</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>{t.admin.categories} ({categories.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : categories.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{t.common.noResults}</p>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                      <Tag className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{category.name}</p>
                        <span className="text-muted-foreground">({category.nameUrdu})</span>
                        <Badge variant={category.isActive ? 'default' : 'secondary'}>{category.isActive ? t.listing.available : t.listing.unavailable}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{category.description || t.listing.description}</p>
                      {category.subcategories && category.subcategories.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">{category.subcategories.length} subcategories</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openDialog('edit', category)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => openDialog('delete', category)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog.open} onOpenChange={(open) => setDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog.type === 'create' && t.nav.createListing}
              {dialog.type === 'edit' && t.common.edit}
              {dialog.type === 'delete' && t.common.delete}
            </DialogTitle>
          </DialogHeader>
          {dialog.type === 'delete' ? (
            <div className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-4 w-4" />{t.common.error}</div>
          ) : (
            <div className="space-y-4">
              <div><Label>Name (English)</Label><Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Category name" /></div>
              <div><Label>Name (Urdu)</Label><Input value={formData.nameUrdu} onChange={(e) => setFormData(p => ({ ...p, nameUrdu: e.target.value }))} placeholder="اردو نام" dir="rtl" /></div>
              <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Category description" /></div>
              <div><Label>Icon (optional)</Label><Input value={formData.icon} onChange={(e) => setFormData(p => ({ ...p, icon: e.target.value }))} placeholder="Icon name or URL" /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false, type: 'create', category: null })}>{t.common.cancel}</Button>
            <Button onClick={handleSubmit} disabled={actionLoading} variant={dialog.type === 'delete' ? 'destructive' : 'default'}>
              {actionLoading ? t.common.loading : dialog.type === 'delete' ? t.common.delete : t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategories;
