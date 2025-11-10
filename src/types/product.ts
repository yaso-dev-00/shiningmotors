// Product-related type definitions

export interface ProductPhysicalProperties {
  weight: number;
  length: number;
  breadth: number;
  height: number;
}

export interface ProductShippingProperties {
  pickup_postcode: string;
  gst_percentage: number;
}

export interface ProductDimensions {
  length: number;
  breadth: number;
  height: number;
}

// Utility type for product form data
export interface ProductFormData {
  // Basic properties
  name: string;
  description: string;
  price: number;
  category: string;
  inventory: number;
  images: string[];
  status?: "on sale" | "upcoming";
  subCategory: string;
  parts: string;
  
  // Physical properties (required)
  weight: number;
  length: number;
  breadth: number;
  height: number;
  
  // Shipping & tax properties (required)
  pickup_postcode: string;
  gst_percentage: number;
}

// Validation schemas for the new properties
export const PHYSICAL_PROPERTIES_SCHEMA = {
  weight: { min: 0.01, max: 999999.99, unit: 'kg' },
  length: { min: 0.01, max: 999999.99, unit: 'cm' },
  breadth: { min: 0.01, max: 999999.99, unit: 'cm' },
  height: { min: 0.01, max: 999999.99, unit: 'cm' },
} as const;

export const SHIPPING_PROPERTIES_SCHEMA = {
  pickup_postcode: { minLength: 1, maxLength: 20 },
  gst_percentage: { min: 0, max: 100, unit: '%' },
} as const;

// Helper functions for validation
export const validatePhysicalProperties = (props: Partial<ProductPhysicalProperties>): boolean => {
  return Object.entries(PHYSICAL_PROPERTIES_SCHEMA).every(([key, schema]) => {
    const value = props[key as keyof ProductPhysicalProperties];
    return value !== undefined && value >= schema.min && value <= schema.max;
  });
};

export const validateShippingProperties = (props: Partial<ProductShippingProperties>): boolean => {
  if (props.pickup_postcode && (props.pickup_postcode.length < 1 || props.pickup_postcode.length > 20)) {
    return false;
  }
  if (props.gst_percentage !== undefined && (props.gst_percentage < 0 || props.gst_percentage > 100)) {
    return false;
  }
  return true;
};
