export interface CategoryField {
  name: string;
  type: string;
  options?: string[];
  required?: boolean;
}

// Dynamic per-category fields shown on step 2 of listing creation.
export const categoryFields: Record<string, CategoryField[]> = {
  property: [
    { name: 'bedrooms', type: 'select', options: ['1', '2', '3', '4', '5+'], required: true },
    { name: 'bathrooms', type: 'select', options: ['1', '2', '3', '4+'], required: true },
    { name: 'area', type: 'number', required: true },
    { name: 'furnishing', type: 'select', options: ['Unfurnished', 'Semi-Furnished', 'Fully Furnished'], required: true },
    { name: 'floor', type: 'number' },
    { name: 'parking', type: 'checkbox' },
    { name: 'wifi', type: 'checkbox' },
    { name: 'airConditioned', type: 'checkbox' },
  ],
  vehicles: [
    { name: 'make', type: 'text', required: true },
    { name: 'model', type: 'text', required: true },
    { name: 'year', type: 'number', required: true },
    { name: 'transmission', type: 'select', options: ['Automatic', 'Manual'], required: true },
    { name: 'fuelType', type: 'select', options: ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG'] },
    { name: 'seats', type: 'number' },
    { name: 'withDriver', type: 'checkbox' },
    { name: 'insurance', type: 'checkbox' },
  ],
  clothes: [
    { name: 'size', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'], required: true },
    { name: 'color', type: 'text', required: true },
    { name: 'material', type: 'text' },
    { name: 'brand', type: 'text' },
    { name: 'condition', type: 'select', options: ['New', 'Like New', 'Good', 'Fair'], required: true },
    { name: 'dryCleaningIncluded', type: 'checkbox' },
  ],
  equipment: [
    { name: 'brand', type: 'text' },
    { name: 'model', type: 'text' },
    { name: 'condition', type: 'select', options: ['New', 'Like New', 'Good', 'Fair'], required: true },
    { name: 'warranty', type: 'checkbox' },
    { name: 'deliveryAvailable', type: 'checkbox' },
    { name: 'setupIncluded', type: 'checkbox' },
  ],
  services: [
    { name: 'experience', type: 'select', options: ['<1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'], required: true },
    { name: 'certifications', type: 'text' },
    { name: 'languages', type: 'text' },
    { name: 'availability', type: 'select', options: ['Full-time', 'Part-time', 'On-call', 'Weekends only'] },
    { name: 'travelWilling', type: 'checkbox' },
  ],
  animals: [
    { name: 'species', type: 'text', required: true },
    { name: 'breed', type: 'text', required: true },
    { name: 'age', type: 'text' },
    { name: 'vaccinated', type: 'checkbox' },
    { name: 'trained', type: 'checkbox' },
    { name: 'healthCertificate', type: 'checkbox' },
  ],
  boats: [
    { name: 'type', type: 'text', required: true },
    { name: 'length', type: 'number' },
    { name: 'capacity', type: 'number', required: true },
    { name: 'withCrew', type: 'checkbox' },
    { name: 'fuelIncluded', type: 'checkbox' },
    { name: 'safetyEquipment', type: 'checkbox' },
  ],
  air: [
    { name: 'aircraftType', type: 'text', required: true },
    { name: 'passengerCapacity', type: 'number', required: true },
    { name: 'range', type: 'text' },
    { name: 'withPilot', type: 'checkbox' },
    { name: 'cateringAvailable', type: 'checkbox' },
  ],
};
