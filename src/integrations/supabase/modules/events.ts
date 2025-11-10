
import supabase from '../client';
import { Tables } from '../types';

export type Event = Tables<'events'>;

// Type for event creation/update
export interface EventFormData {
  category: string;
  title: string;
  description: string | null;
  venue: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  status: 'draft' | 'published' | 'completed' | 'cancelled';
  banner_image_url: string | null;
  gallery_urls: string[];
  promo_video_url: string | null;
  features: string[];
  tags: string[];
  registration_required: boolean;
  registration_start_date: string | null;
  registration_end_date: string | null;
  max_participants: number | null;
  fee_currency: string;
  fee_amount: number | null;
  category_details: Record<string, any> | null;
  organizer_id?:string
}

// Get all events
export const getAllEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  return data || [];
};

// Get a single event by ID
export const getEventById = async (id: string) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching event with ID ${id}:`, error);
    throw error;
  }

  return data;
};

export const getEventBySeller = async (id: string) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', id)
    .order('created_at',{ascending:false})

  if (error) {
    console.error(`Error fetching event with seller ID ${id}:`, error);
    throw error;
  }

  return data|| [];
};



// Create a new event
export const createEvent = async (eventData: EventFormData) => {
    const userId = await supabase.auth.getUser().then(({ data: { user } }) => user?.id);
       
  const event:EventFormData={...eventData,organizer_id:userId}
  const { data, error } = await supabase
    .from('events')
    .insert([event])
    .select()
    .single();

  if (error) {
    console.error('Error creating event:', error);
    throw error;
  }

  return data;
};

// Update an existing event
export const updateEvent = async (id: string, eventData: Partial<EventFormData>) => {
  const { data, error } = await supabase
    .from('events')
    .update(eventData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating event with ID ${id}:`, error);
    throw error;
  }

  return data;
};

// Delete an event
export const deleteEvent = async (id: string) => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting event with ID ${id}:`, error);
    throw error;
  }

  return true;
};

// Get events by category
export const getEventsByCategory = async (category: string) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('category', category)
    .eq('status', 'published')
    .order('start_date', { ascending: true });

  if (error) {
    console.error(`Error fetching events with category ${category}:`, error);
    throw error;
  }

  return data || [];
};

// Get featured/upcoming events for homepage
export const getFeaturedEvents = async (limit: number = 6) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching featured events:', error);
    throw error;
  }

  return data || [];
};
