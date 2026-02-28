import { supabase } from '../client';
import type { Database } from '../types';

// Define main types
export type SimLeague = Database['public']['Tables']['sim_leagues']['Row'];
export type SimEvent = Database['public']['Tables']['sim_events']['Row'];
export type SimProduct = Database['public']['Tables']['sim_products']['Row'];
export type SimGarage = Database['public']['Tables']['sim_garages']['Row'];
export type SimGarageService = Database['public']['Tables']['sim_garage_services']['Row'];
export type SimLeaderboardEntry = Database['public']['Tables']['sim_leaderboard_entries']['Row'];
export type SimTeam = Database['public']['Tables']['sim_teams']['Row'];

// API for the frontend sim racing app pages
export const simAppApi = {
  // Leagues
  leagues: {
    getActiveLeagues: () => {
      const today = new Date().toISOString();
      const todayDateOnly = new Date().toISOString().split('T')[0];
      return supabase
        .from('sim_leagues')
        .select('*, profile:organizer_id(id, username, avatar_url)')
      .lte('start_date', today)
    .gte('end_date', today)
        .order('start_date', { ascending: true });
    },
    
    getUpcomingLeagues: (limit = 4) => {
      const today = new Date().toISOString();
      return supabase
        .from('sim_leagues')
        .select('*, profile:organizer_id(id, username, avatar_url)')
        .gt('start_date', today)
        .order('start_date', { ascending: true })
        .limit(limit);
    },
    getPastLeagues: () => {
  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
  return supabase
    .from('sim_leagues')
    .select('*, profile:organizer_id(id, username, avatar_url)')
    .lt('end_date', today)
    .order('end_date', { ascending: false }); // Most recent first
},
    
    getLeagueDetails: (id: string) => 
      supabase.from('sim_leagues').select(`
        *,
        organizer:organizer_id(id, username, avatar_url),
        events:sim_events(*)
      `).eq('id', id).single(),
      
    registerForLeague: (leagueId: string, userId: string, registrationData: Record<string, unknown>) => 
      supabase.from('sim_league_participants_solo').insert({
        league_id: leagueId,
        user_id: userId,
        ...registrationData
      }),
      
    registerTeamForLeague: (leagueId: string, teamId: string, driverIds: string[], registrationData: Record<string, unknown>) =>
      supabase.from('sim_league_participants_team').insert({
        league_id: leagueId,
        team_id: teamId,
        ...registrationData
      }),
      
     checkEmailExists: async (email: string) => {
        const { data, error } = await supabase
          .from('sim_users')
          .select('id') // you can select just 'id' or '*'
          .eq('email', email)
          .limit(1); // Optional: Limit for performance
      
        if (error) throw error;
      
        return data.length > 0; // true if email exists
      },
    getUserSoloLeagues: (userId: string) => 
      supabase.from('sim_league_participants_solo')
        .select(`
          *,
          sim_leagues:league_id(*)
        `)
        .eq('user_id', userId)
        .order('registration_date', { ascending: false }),
    
    getUserTeamLeagues: (userId: string) => 
      
      supabase.from('sim_league_participants_team')
        .select(`
          *,
          sim_leagues:league_id(*)
        `)
        .order('registration_date', { ascending: false }),
      
 getTeamLeagueStandings: (leagueId: string) =>
  supabase
    .from('sim_league_participants_team')
    .select(`
      *,
      sim_teams:team_id (
        *,sim_users:creator_id(*)
      )
    `)
    .eq('league_id', leagueId)
    .order('registration_date', { ascending: false }),
    getLeagueStandings: (leagueId: string) => 
      supabase.from('sim_league_participants_solo')
        .select(`
          id, total_points, car_class, car_number,
          sim_user:user_id(id, username, profile_picture)
        `)
        .eq('league_id', leagueId)
        .order('total_points', { ascending: false })
  },
  
  // Events
  events: {
    getUpcomingEvents: (limit = 4) => {
      const today = new Date().toISOString();
      return supabase
        .from('sim_events')
        .select(`
          *,
          league:league_id(*),
          creator:created_by(id, username, avatar_url)
        `)
        .gt('start_date', today)
        .order('start_date', { ascending: true })
        .limit(limit);
    },
    getPastEvents:()=>{
          const today = new Date().toISOString();
      return supabase
        .from('sim_events')
        .select(`
          *,
          league:league_id(*),
          creator:created_by(id, username, avatar_url)
        `)
        .lt('end_date', today)
        .order('end_date', { ascending: true })
       
    },
    getOngoingEvent:()=>{
        const today = new Date().toISOString();
      return supabase
        .from('sim_events')
        .select(`
          *,
          league:league_id(*),
          creator:created_by(id, username, avatar_url)
        `)
        .lte('start_date', today).
         gte('end_date',today)
        .order('start_date', { ascending: true })
       
    },
    getEventDetails: (id: string) => 
      supabase.from('sim_events').select(`
        *,
        league:league_id(*),
        creator:created_by(id, username, avatar_url)
      `).eq('id', id).single(),
      
     getEventByLeagueId:(id:string)=>
         supabase.from('sim_events').select('*').eq("league_id",id)
     ,
    registerForEvent: (eventId: string, userId: string, registrationData: Record<string, unknown>) => 
      supabase.from('sim_event_participants_solo').insert({
        event_id: eventId,
        user_id: userId,
        ...registrationData
      }),
      
    getRegisteredEvents: (userId: string) => 
      supabase
        .from('sim_event_participants_solo')
        .select(`
          *,
          event:event_id(*)
        `)
        .eq('user_id', userId)
  },
  
  // Products
  products: {
    getFeaturedProducts: (limit = 8) => 
      supabase
        .from('sim_products')
        .select('*')
        .eq('is_disabled', false)
        .order('created_at', { ascending: false })
        .limit(limit),
        
    getProductsByCategory: (category: string) => 
      supabase
        .from('sim_products')
        .select('*')
        .eq('category', category)
        .eq('is_disabled', false)
        .order('created_at', { ascending: false }),
        
    getProductDetails: (id: string) => 
      supabase
        .from('sim_products')
        .select('*')
        .eq('id', id)
        .single(),
        
    placeOrder: (userId: string, products: Array<{id: string, quantity: number, price: number}>, shippingAddress: Record<string, unknown>) => {
      const totalPrice = products.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return supabase.from('sim_product_orders').insert({
        user_id: userId,
        total_price: totalPrice,
        shipping_address: shippingAddress as any,
        status: 'pending'
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
  },
  
  // Garages & Services
  garages: {
    getAllGarages: () => 
      supabase
        .from('sim_garages')
        .select(`
          *,
          services:sim_garage_services(*)
        `)
        .order('name', { ascending: true }),
        
    getGarageDetails: (id: string) => 
      supabase
        .from('sim_garages')
        .select(`
          *,
          services:sim_garage_services(*)
        `)
        .eq('id', id)
        .single(),
        
    bookService: (userId: string, serviceId: string, bookingData: Record<string, unknown>) => 
      supabase
        .from('sim_service_bookings')
        .insert({
          user_id: userId,
          garage_service_id: serviceId,
          ...bookingData
        }),
        
    getUserBookings: (userId: string) => 
      supabase
        .from('sim_service_bookings')
        .select(`
          *,
          service:garage_service_id(
            *,
            garage:garage_id(*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
  },
  
  // Leaderboards
  leaderboards: {
    getLeaderboards: () => 
      supabase
        .from('sim_leaderboards')
        .select('*')
        .order('created_at', { ascending: false }),
        
    getLeaderboardEntries: (leaderboardId: string, limit = 10) => 
      supabase
        .from('sim_leaderboard_entries')
        .select(`
          *,
          user:user_id(id, username, avatar_url),
          team:team_id(id, name, logo)
        `)
        .eq('leaderboard_id', leaderboardId)
        .order('lap_time', { ascending: true })
        .limit(limit)
  },
  
  // Teams API
  teams: {
    getUserTeams: (userId: string) =>
      supabase.from('sim_teams')
        .select('*')
        .eq('id', userId),
        
    createTeam: (teamData: { name: string, description?: string, user_id: string }) =>
      supabase.from('sim_teams').insert({
        name: teamData.name,
        description: teamData.description || '',
        creator_id:teamData.user_id,
        // Additional fields can be added as needed
      }).select(),
      
    addTeamMember: (teamId: string, userId: string, role: string = 'driver') =>
      supabase.from('sim_team_drivers').insert({
        team_participant_id: teamId,
        driver_id: userId,
        role: role
      }),
      getTeamDrivers:(teamId:string)=>
         supabase.from('sim_team_drivers').select(`*,sim_user:driver_id(*)
          `).eq('team_participant_id',teamId)
        
  }
};
