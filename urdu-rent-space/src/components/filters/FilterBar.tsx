import React from 'react';
import { Button } from '@/components/ui/button';
import FilterChip from './FilterChip';

export interface ActiveFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

interface FilterBarProps {
  activeFilters: ActiveFilter[];
  onClearAll: () => void;
  className?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({ activeFilters, onClearAll, className = '' }) => {
  if (activeFilters.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {activeFilters.map((filter) => (
        <FilterChip key={filter.key} label={filter.label} onRemove={filter.onRemove} />
      ))}
      <Button variant="ghost" size="sm" onClick={onClearAll} className="h-7 text-sm text-muted-foreground hover:text-foreground">
        Clear all
      </Button>
    </div>
  );
};

export default FilterBar;
