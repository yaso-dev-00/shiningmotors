
import { supabase } from '../client';
import type { Database } from '../types';

// Core types for sim racing entities
export type SimUser = Database['public']['Tables']['sim_users']['Row'];
export type SimTeam = Database['public']['Tables']['sim_teams']['Row'];
export type SimEvent = Database['public']['Tables']['sim_events']['Row'];
export type SimLeague = Database['public']['Tables']['sim_leagues']['Row'];
export type SimGarage = Database['public']['Tables']['sim_garages']['Row'];
export type SimProduct = Database['public']['Tables']['sim_products']['Row'];

// API for sim racing - organized by entity
export const simRacingApi = {
  // Users API
  users: {
    getById: (id: string) => 
      supabase.from('sim_users').select('*, sim_teams:team_id(*)').eq('id', id).single(),
    
       getByEmails: (emails: string[]) =>
      supabase
        .from('sim_users')
        .select('id')
        .in('email', emails),

    update: (id: string, userData: Partial<SimUser>) => 
      supabase.from('sim_users').update(userData).eq('id', id),
    
    create: (userData: { id: string } & Omit<Partial<SimUser>, 'id' | 'created_at' | 'updated_at'>) => 
      supabase.from('sim_users').insert({
        id: userData.id,
        username: userData.username || '',
        email: userData.email || '',
        profile_picture: userData.profile_picture ?? null,
        rank: userData.rank ?? null,
        sim_ids: userData.sim_ids ?? null,
        stats: userData.stats ?? null,
        badges: userData.badges ?? null,
        team_id: userData.team_id ?? null
      } as any),
  },
  
  // Teams API
  teams: {
    getAll: () => 
      supabase.from('sim_teams').select('*'),
    
    getById: (id: string) => 
      supabase.from('sim_teams').select(`
        *,
        sponsor:sponsor_garage_id(*)
      `).eq('id', id).single(),
    getYourTeam:(id:string)=> supabase.from('sim_teams').select('*').eq('creator_id',id),
    create: (teamData: Pick<SimTeam, 'name'> & Partial<Omit<SimTeam, 'id' | 'created_at' | 'updated_at'>>) => 
      supabase.from('sim_teams').insert(teamData),
    
    update: (id: string, teamData: Partial<SimTeam>) => 
      supabase.from('sim_teams').update(teamData).eq('id', id),
    
    delete: (id: string) => 
      supabase.from('sim_teams').delete().eq('id', id),
      
    getMembers: (teamId: string) => 
      supabase.from('sim_users').select('*').eq('team_id', teamId),
  },
  
  // Events API
  events: {
    getAll: () => 
      supabase.from('sim_events').select('*').order('start_date', { ascending: true }),
    
    getById: (id: string) => 
      supabase.from('sim_events').select(`
        *,
        profile:created_by(id, username,avatar_url),
        league:league_id(*)
      `).eq('id', id).single(),
    
    getUpcoming: (limit: number = 5) => {
      const today = new Date().toISOString();
      return supabase
        .from('sim_events')
        .select('*')
        .gte('start_date', today)
        .order('start_date', { ascending: true })
        .limit(limit);
    },
    
    create: (eventData: Pick<SimEvent, 'title' | 'event_type' | 'registration_type'> & Partial<Omit<SimEvent, 'id' | 'created_at' | 'updated_at'>>) => 
      supabase.from('sim_events').insert(eventData),
    
    update: (id: string, eventData: Partial<SimEvent>) => 
      supabase.from('sim_events').update(eventData).eq('id', id),
    
    delete: (id: string) => 
      supabase.from('sim_events').delete().eq('id', id),
    
    getParticipants: (eventId: string) => {
      return Promise.all([
        // Get solo participants
        supabase.from('sim_event_participants_solo')
          .select(`
            *,
            user:user_id(id, username, profile_picture)
          `)
          .eq('event_id', eventId),
        
        // Get team participants
        supabase.from('sim_event_participants_team')
          .select(`
            *,
            team:team_id(*),
            drivers:sim_team_drivers(
              id,
              driver:driver_id(id, username, profile_picture)
            )
          `)
          .eq('event_id', eventId)
      ]).then(([soloRes, teamRes]) => {
        return {
          solo: soloRes.data || [],
          teams: teamRes.data || [],
          error: soloRes.error || teamRes.error
        };
      });
    },
    
    registerSolo: (eventId: string, userId: string, registrationData: Record<string, unknown>) => 
      supabase.from('sim_event_participants_solo').insert({
        event_id: eventId,
        user_id: userId,
        ...registrationData
      }),
      
    registerTeam: (eventId: string, teamId: string, driverIds: string[], registrationData: Record<string, unknown>) => {
      // This would need a complex transaction, for now we'll implement a simplified version
      return supabase.from('sim_event_participants_team').insert({
        event_id: eventId,
        team_id: teamId,
        ...registrationData
      });
    }
  },
  
  // Leagues API
  leagues: {
    getAll: () => 
      supabase.from('sim_leagues').select('*').order('start_date', { ascending: true }),
    
    getById: (id: string) => 
      supabase.from('sim_leagues').select(`
        *,
        profile:organizer_id(id, username, avatar_url)
      `).eq('id', id).single(),
      
    getActive: () => {
      const today = new Date().toISOString();
      return supabase
        .from('sim_leagues')
        .select('*')
        .lte('start_date', today)
        .gte('end_date', today)
        .order('start_date', { ascending: true });
    },
    
    create: (leagueData: Pick<SimLeague, 'name'> & Partial<Omit<SimLeague, 'id' | 'created_at' | 'updated_at'>>) => 
      supabase.from('sim_leagues').insert(leagueData),
    
    update: (id: string, leagueData: Partial<SimLeague>) => 
      supabase.from('sim_leagues').update(leagueData).eq('id', id),
      
    delete: (id: string) => 
      supabase.from('sim_leagues').delete().eq('id', id),
      
    getEvents: (leagueId: string) => 
      supabase.from('sim_events').select('*').eq('league_id', leagueId).order('start_date', { ascending: true }),
      
    getStandings: (leagueId: string) => {
      return Promise.all([
        // Get solo standings
        supabase.from('sim_league_participants_solo')
          .select(`
            id, total_points, car_class,
            user:user_id(id, username, profile_picture)
          `)
          .eq('league_id', leagueId)
          .order('total_points', { ascending: false }),
          
        // Get team standings
        supabase.from('sim_league_participants_team')
          .select(`
            id, total_points, car_class,
            team:team_id(*)
          `)
          .eq('league_id', leagueId)
          .order('total_points', { ascending: false })
      ]).then(([soloRes, teamRes]) => {
        return {
          solo: soloRes.data || [],
          teams: teamRes.data || [],
          error: soloRes.error || teamRes.error
        };
      });
    }
  },
  
  // Garages and Services API
  garages: {
    getAll: () => 
      supabase.from('sim_garages').select('*'),
      
    getById: (id: string) => 
      supabase.from('sim_garages').select(`
        *,
        services:sim_garage_services(*)
      `).eq('id', id).single(),
    
    create: (garageData: Pick<SimGarage, 'name'> & Partial<Omit<SimGarage, 'id' | 'created_at' | 'updated_at'>>) => 
      supabase.from('sim_garages').insert(garageData),
    
    update: (id: string, garageData: Partial<SimGarage>) => 
      supabase.from('sim_garages').update(garageData).eq('id', id),
      
    delete: (id: string) => 
      supabase.from('sim_garages').delete().eq('id', id),
      
    getServices: (garageId: string) => 
      supabase.from('sim_garage_services').select('*').eq('garage_id', garageId),

    createService: (serviceData: { garage_id: string; title: string } & Partial<Omit<any, 'id' | 'created_at' | 'updated_at'>>) =>
      supabase.from('sim_garage_services').insert(serviceData),

    updateService: (id: string, serviceData: Partial<any>) =>
      supabase.from('sim_garage_services').update(serviceData).eq('id', id),

    deleteService: (id: string) =>
      supabase.from('sim_garage_services').delete().eq('id', id),
      
    bookService: (userId: string, serviceId: string, bookingData: Record<string, unknown>) => 
      supabase.from('sim_service_bookings').insert({
        user_id: userId,
        garage_service_id: serviceId,
        ...bookingData
      })
  },
  
  // Leaderboards API
  leaderboards: {
    getAll: () => 
      supabase.from('sim_leaderboards').select('*'),
      
    getById: (id: string) => 
      supabase.from('sim_leaderboards').select('*').eq('id', id).single(),
      
    getEntries: (leaderboardId: string) => 
      supabase.from('sim_leaderboard_entries')
        .select(`
          *,
          user:user_id(id, username, profile_picture),
          team:team_id(*)
        `)
        .eq('leaderboard_id', leaderboardId)
        .order('lap_time', { ascending: true }),
        
    addEntry: (entryData: Record<string, unknown>) => 
      supabase.from('sim_leaderboard_entries').insert(entryData)
  },
  
  // Shop API
  shop: {
    getProducts: () => 
      supabase.from('sim_products').select('*'),
      
    getProductById: (id: string) => 
      supabase.from('sim_products').select('*').eq('id', id).single(),
      
    createProduct: (productData: Omit<Partial<SimProduct>, 'id' | 'created_at' | 'updated_at'>) => {
      // Ensure required fields are present
      if (!productData.name || !productData.price) {
        throw new Error('Product name and price are required');
      }
      return supabase.from('sim_products').insert({
        name: productData.name,
        price: productData.price,
        brand: productData.brand ?? null,
        category: productData.category ?? null,
        description: productData.description ?? null,
        features: productData.features ?? null,
        image_url: productData.image_url ?? null,
        stock: productData.stock ?? null,
      } as any);
    },
    
    updateProduct: (id: string, productData: Partial<SimProduct>) => 
      supabase.from('sim_products').update(productData).eq('id', id),
    
    deleteProduct: (id: string) => 
      supabase.from('sim_products').delete().eq('id', id),
      
    placeOrder: (userId: string, products: Array<{id: string, quantity: number, price: number}>, shippingAddress: Record<string, unknown>) => {
      const totalPrice = products.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // This would need a transaction in a real application
      return supabase.from('sim_product_orders').insert({
        user_id: userId,
        total_price: totalPrice,
        shipping_address: shippingAddress as any
      } as any);
    },
    
    getUserOrders: (userId: string) => 
      supabase.from('sim_product_orders')
        .select(`
          *,
          items:sim_order_items(
            id, 
            quantity,
            price,
            product:product_id(*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
  }
};
