import { 
  Building2, 
  Car, 
  Shirt, 
  Wrench, 
  Users, 
  Dog, 
  Ship, 
  Plane,
  Home,
  Building,
  PartyPopper,
  TreePine,
  BedDouble,
  Bike,
  Truck,
  TractorIcon,
  Laptop,
  Stethoscope,
  UtensilsCrossed,
  Dumbbell,
  Gamepad2,
  Briefcase,
  HardHat,
  Calendar,
  Tractor,
  HeartHandshake,
  UserCheck,
  Ambulance,
  PawPrint,
  Heart,
  Fish,
  Anchor,
  Sailboat,
  Sparkles,
  Shirt as ShirtIcon,
  Crown,
  Baby,
  Gem
} from 'lucide-react';

export interface Subcategory {
  id: string;
  nameKey: string;
  icon: typeof Building2;
}

export interface Category {
  id: string;
  nameKey: string;
  icon: typeof Building2;
  colorClass: string;
  subcategories: Subcategory[];
  listingsCount?: number;
}

export const categories: Category[] = [
  {
    id: 'property',
    nameKey: 'property',
    icon: Building2,
    colorClass: 'category-property',
    subcategories: [
      { id: 'apartments', nameKey: 'apartments', icon: Building },
      { id: 'houses', nameKey: 'houses', icon: Home },
      { id: 'commercial', nameKey: 'commercial', icon: Building2 },
      { id: 'events', nameKey: 'events', icon: PartyPopper },
      { id: 'farmhouses', nameKey: 'farmhouses', icon: TreePine },
      { id: 'rooms', nameKey: 'rooms', icon: BedDouble },
    ],
    listingsCount: 12450,
  },
  {
    id: 'vehicles',
    nameKey: 'vehicles',
    icon: Car,
    colorClass: 'category-vehicles',
    subcategories: [
      { id: 'cars', nameKey: 'cars', icon: Car },
      { id: 'motorcycles', nameKey: 'motorcycles', icon: Bike },
      { id: 'bicycles', nameKey: 'bicycles', icon: Bike },
      { id: 'trucks', nameKey: 'trucks', icon: Truck },
      { id: 'rickshaws', nameKey: 'rickshaws', icon: Car },
      { id: 'trailers', nameKey: 'trailers', icon: TractorIcon },
    ],
    listingsCount: 8320,
  },
  {
    id: 'clothes',
    nameKey: 'clothes',
    icon: Shirt,
    colorClass: 'category-clothes',
    subcategories: [
      { id: 'wedding', nameKey: 'wedding', icon: Crown },
      { id: 'designer', nameKey: 'designer', icon: Gem },
      { id: 'seasonal', nameKey: 'seasonal', icon: Sparkles },
      { id: 'costumes', nameKey: 'costumes', icon: ShirtIcon },
      { id: 'accessories', nameKey: 'accessories', icon: Gem },
      { id: 'maternity', nameKey: 'maternity', icon: Baby },
    ],
    listingsCount: 5670,
  },
  {
    id: 'equipment',
    nameKey: 'equipment',
    icon: Wrench,
    colorClass: 'category-equipment',
    subcategories: [
      { id: 'farming', nameKey: 'farming', icon: Tractor },
      { id: 'electronics', nameKey: 'electronics', icon: Laptop },
      { id: 'medical', nameKey: 'medical', icon: Stethoscope },
      { id: 'kitchen', nameKey: 'kitchen', icon: UtensilsCrossed },
      { id: 'sports', nameKey: 'sports', icon: Dumbbell },
      { id: 'gaming', nameKey: 'gaming', icon: Gamepad2 },
    ],
    listingsCount: 7890,
  },
  {
    id: 'services',
    nameKey: 'services',
    icon: Users,
    colorClass: 'category-services',
    subcategories: [
      { id: 'skilled', nameKey: 'skilled', icon: Briefcase },
      { id: 'technical', nameKey: 'technical', icon: HardHat },
      { id: 'eventStaff', nameKey: 'eventStaff', icon: Calendar },
      { id: 'agricultural', nameKey: 'agricultural', icon: Tractor },
      { id: 'domestic', nameKey: 'domestic', icon: HeartHandshake },
      { id: 'drivers', nameKey: 'drivers', icon: UserCheck },
      { id: 'medicalServices', nameKey: 'medicalServices', icon: Ambulance },
      { id: 'pilotServices', nameKey: 'pilotServices', icon: Plane },
    ],
    listingsCount: 4320,
  },
  {
    id: 'animals',
    nameKey: 'animals',
    icon: Dog,
    colorClass: 'category-animals',
    subcategories: [
      { id: 'pets', nameKey: 'pets', icon: PawPrint },
      { id: 'working', nameKey: 'working', icon: Dog },
      { id: 'veterinary', nameKey: 'veterinary', icon: Heart },
    ],
    listingsCount: 2150,
  },
  {
    id: 'boats',
    nameKey: 'boats',
    icon: Ship,
    colorClass: 'category-boats',
    subcategories: [
      { id: 'fishing', nameKey: 'fishing', icon: Fish },
      { id: 'ferries', nameKey: 'ferries', icon: Ship },
      { id: 'recreational', nameKey: 'recreational', icon: Anchor },
      { id: 'yachts', nameKey: 'yachts', icon: Sailboat },
      { id: 'cargo', nameKey: 'cargo', icon: Ship },
      { id: 'safety', nameKey: 'safety', icon: Heart },
    ],
    listingsCount: 890,
  },
  {
    id: 'air',
    nameKey: 'air',
    icon: Plane,
    colorClass: 'category-air',
    subcategories: [
      { id: 'charter', nameKey: 'charter', icon: Plane },
      { id: 'helicopter', nameKey: 'helicopter', icon: Plane },
      { id: 'ambulance', nameKey: 'ambulance', icon: Ambulance },
      { id: 'cargoAir', nameKey: 'cargoAir', icon: Plane },
    ],
    listingsCount: 340,
  },
];

export const getCategoryById = (id: string): Category | undefined => {
  return categories.find(cat => cat.id === id);
};

export const getSubcategoryById = (categoryId: string, subcategoryId: string): Subcategory | undefined => {
  const category = getCategoryById(categoryId);
  return category?.subcategories.find(sub => sub.id === subcategoryId);
};

export const getCategoryColor = (categoryId: string): string => {
  const colors: Record<string, string> = {
    property: 'bg-category-property',
    vehicles: 'bg-category-vehicles',
    clothes: 'bg-category-clothes',
    equipment: 'bg-category-equipment',
    services: 'bg-category-services',
    animals: 'bg-category-animals',
    boats: 'bg-category-boats',
    air: 'bg-category-air',
  };
  return colors[categoryId] || 'bg-primary';
};
