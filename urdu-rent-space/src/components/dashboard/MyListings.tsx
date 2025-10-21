import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  Pause, 
  Play,
  MapPin,
  Calendar
} from 'lucide-react';

const MyListings: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const listings = [
    {
      id: 1,
      title: 'Honda Civic 2022 - Premium Sedan',
      category: 'Vehicles',
      subcategory: 'Cars',
      price: 'PKR 5,000/day',
      location: 'Lahore, DHA Phase 5',
      status: 'active',
      views: 234,
      inquiries: 12,
      image: 'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=400',
      createdAt: 'Dec 15, 2025',
    },
    {
      id: 2,
      title: 'Luxury 3BR Apartment - Fully Furnished',
      category: 'Property',
      subcategory: 'Apartments',
      price: 'PKR 150,000/month',
      location: 'Karachi, Clifton',
      status: 'active',
      views: 456,
      inquiries: 28,
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
      createdAt: 'Dec 10, 2025',
    },
    {
      id: 3,
      title: 'Professional Photography Equipment Set',
      category: 'Equipment',
      subcategory: 'Electronics',
      price: 'PKR 3,000/day',
      location: 'Islamabad, F-7',
      status: 'paused',
      views: 89,
      inquiries: 5,
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400',
      createdAt: 'Dec 5, 2025',
    },
    {
      id: 4,
      title: 'Designer Bridal Dress - Red & Gold',
      category: 'Clothes',
      subcategory: 'Wedding Wear',
      price: 'PKR 15,000/event',
      location: 'Lahore, Gulberg',
      status: 'active',
      views: 178,
      inquiries: 9,
      image: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=400',
      createdAt: 'Nov 28, 2025',
    },
    {
      id: 5,
      title: 'Farm Tractor with Equipment',
      category: 'Equipment',
      subcategory: 'Farming',
      price: 'PKR 8,000/day',
      location: 'Faisalabad',
      status: 'expired',
      views: 67,
      inquiries: 3,
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
      createdAt: 'Nov 15, 2025',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'paused':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'expired':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || listing.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Listings</h1>
          <p className="text-muted-foreground">Manage your rental listings</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Listing
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Property">Property</SelectItem>
                <SelectItem value="Vehicles">Vehicles</SelectItem>
                <SelectItem value="Clothes">Clothes</SelectItem>
                <SelectItem value="Equipment">Equipment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredListings.map((listing) => (
          <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="flex">
              <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="flex-1 p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {listing.category}
                      </Badge>
                      <Badge className={getStatusColor(listing.status)}>
                        {listing.status}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-foreground truncate">{listing.title}</h3>
                    <p className="text-primary font-bold mt-1">{listing.price}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{listing.location}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {listing.views} views
                      </span>
                      <span>{listing.inquiries} inquiries</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Eye className="h-4 w-4" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Edit className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      {listing.status === 'active' ? (
                        <DropdownMenuItem className="gap-2">
                          <Pause className="h-4 w-4" /> Pause
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem className="gap-2">
                          <Play className="h-4 w-4" /> Activate
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="gap-2 text-destructive">
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>

      {filteredListings.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No listings found matching your filters</p>
            <Button className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Listing
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyListings;
