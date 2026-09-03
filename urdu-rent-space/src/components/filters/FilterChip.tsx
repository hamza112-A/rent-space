import React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, onRemove }) => (
  <Badge variant="secondary" className="gap-1 pl-3 pr-1.5 py-1 text-sm font-normal">
    {label}
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${label} filter`}
      className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
    >
      <X className="w-3 h-3" />
    </button>
  </Badge>
);

export default FilterChip;
