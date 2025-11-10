
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ProductFiltersProps {
  status: string;
  onStatusChange: (status: string) => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (minPrice: string) => void;
  onMaxPriceChange: (maxPrice: string) => void;
  onApply: () => void;
  resetFilters: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  status,
  onStatusChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  onApply,
  resetFilters
}) => (
  <div className="flex flex-wrap gap-2 items-end">
    <div>
      <label className="block text-xs text-gray-600 font-medium mb-1">Status</label>
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[120px] h-10">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="on_sale">On Sale</SelectItem>
          <SelectItem value="upcoming">Upcoming</SelectItem>
          <SelectItem value="in_stock">In Stock</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <label className="block text-xs text-gray-600 font-medium mb-1">Min Price</label>
      <Input
        type="number"
        value={minPrice}
        onChange={e => onMinPriceChange(e.target.value)}
        className="w-24 h-10"
        min={0}
        placeholder="0"
      />
    </div>
    <div>
      <label className="block text-xs text-gray-600 font-medium mb-1">Max Price</label>
      <Input
        type="number"
        value={maxPrice}
        onChange={e => onMaxPriceChange(e.target.value)}
        className="w-24 h-10"
        min={0}
        placeholder="1000"
      />
    </div>
    <Button onClick={onApply} className="h-10 px-4">Apply</Button>
    <Button variant="outline" onClick={resetFilters} className="h-10 px-4">Reset</Button>
  </div>
);
