import { supabase } from '../client';
import type { Database } from '../types';

type Vehicle = Database['public']['Tables']['vehicles']['Row'] & {
  status?: string;
};

type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];

// Extended Vehicle interface with optional properties
export interface ExtendedVehicle extends Omit<Vehicle, 'seats'> {
  user_id?: string;
  color?: string;
  fuel_type: string;  // Now it's required
  transmission?: string;
  user?: Record<string, unknown>;
  rating?: number;
  stock?: number;
  features?: string[];
  seats?: number | null;
  location?: string;
  isFeatured?: boolean;
  status: string;
}

// Vehicle filters interface for search and filtering
export interface VehicleFilters {
  category?: string;
  make?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  searchTerm?: string;
  sortOption?: string; 
}

export const vehiclesApi = {
  vehicles: {
    select: () => supabase.from('vehicles').select('*', { count: 'exact' }),
    getById: (id: string) => supabase.from('vehicles').select(`
      *,
      user:seller_id (
        id,
        username,
        avatar_url,
        full_name
      )
    `).eq('id', id).single(),
    getByCategory: (category: string) => supabase.from('vehicles').select().eq('category', category),
    getByMake: (make: string) => supabase.from('vehicles').select().eq('make', make),
    getByModel: (model: string) => supabase.from('vehicles').select().eq('model', model),
    getByYearRange: (minYear: number, maxYear: number) => 
      supabase.from('vehicles').select().gte('year', minYear).lte('year', maxYear),
    getByPriceRange: (minPrice: number, maxPrice: number) => 
      supabase.from('vehicles').select().gte('price', minPrice).lte('price', maxPrice),
    getByStatus: (status: string) => supabase.from('vehicles').select().eq('status', status),
    search: (term: string) => supabase.from('vehicles').select().or(
      `title.ilike.%${term}%,make.ilike.%${term}%,model.ilike.%${term}%,description.ilike.%${term}%`
    ),
    getBySeller: (sellerId: string) => supabase.from('vehicles').select().eq('seller_id', sellerId),
    getFiltered: (filters?: VehicleFilters, page: number = 1, limit: number = 15) => {
      let query = supabase.from('vehicles').select('*', { count: 'exact' });
      
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters?.make) {
        query = query.eq('make', filters.make);
      }
      
      if (filters?.model) {
        query = query.eq('model', filters.model);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.minYear) {
        query = query.gte('year', filters.minYear);
      }
      
      if (filters?.maxYear) {
        query = query.lte('year', filters.maxYear);
      }
      
      if (filters?.minPrice) {
        query = query.gte('price', filters.minPrice);
      }
      
      if (filters?.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }
      
      if (filters?.searchTerm) {
        const isNumber = !isNaN(Number(filters.searchTerm));

        const orConditions = [
          `title.ilike.%${filters.searchTerm}%`,
          `make.ilike.%${filters.searchTerm}%`,
          `model.ilike.%${filters.searchTerm}%`
        ];
        
        if (isNumber) {
          orConditions.push(`price.eq.${filters.searchTerm}`);
        }
        
        query = query.or(orConditions.join(','));
      }
      
      // Calculate pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      return query.order('created_at', { ascending: false }).range(from, to);
    },
    insert: (values: VehicleInsert) => supabase.from('vehicles').insert(values),
    update: (id: string, values: VehicleUpdate) => supabase.from('vehicles').update(values).eq('id', id),
    delete: (id: string) => supabase.from('vehicles').delete().eq('id', id),
    getFeatured: () => supabase.from('vehicles').select().eq('status', 'Available').order('created_at', { ascending: false }).limit(6),
  },
};

export { type Vehicle, type VehicleInsert, type VehicleUpdate };