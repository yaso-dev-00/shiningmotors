
import { supabase } from "@/integrations/supabase/client";

// Get all events
export async function getEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: true });
  
  if (error) {
    console.error('Error fetching events:', error);
    throw new Error(error.message);
  }
  
  return data;
}

// Get featured events
export async function getFeaturedEvents(limit = 3) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .order('start_date', { ascending: true })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching featured events:', error);
    throw new Error(error.message);
  }
  
  return data;
}

// Get upcoming events
export async function getUpcomingEvents(limit = 6) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .gte('start_date', today)
    .order('start_date', { ascending: true })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching upcoming events:', error);
    throw new Error(error.message);
  }
  
  return data;
}

// Get past events
export async function getPastEvents(limit = 6) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .lt('start_date', today)
    .order('start_date', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching past events:', error);
    throw new Error(error.message);
  }
  
  return data;
}

// Get event categories
export async function getEventCategories() {
  const { data, error } = await supabase
    .from('events')
    .select('category')
    .eq('status', 'published');
  
  if (error) {
    console.error('Error fetching event categories:', error);
    throw new Error(error.message);
  }
  
  // Extract unique categories
  const categories = [...new Set(data.map(event => event.category))];
  return categories;
}

// Get events by category
export async function getEventsByCategory(category: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .eq('category', category)
    .order('start_date', { ascending: true });
  
  if (error) {
    console.error(`Error fetching events for category ${category}:`, error);
    throw new Error(error.message);
  }
  
  return data;
}

// Get a single event by ID
export async function getEventById(id: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching event with ID ${id}:`, error);
    throw new Error(error.message);
  }
  
  return data;
}

// Register for an event
export async function registerForEvent(eventId: string, userId: string, registrationData: Record<string, unknown>) {
  try {
    // First, check if already registered
    const { data: existingRegistration } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();
    
    if (existingRegistration) {
      throw new Error('You are already registered for this event');
    }
    
    // Get event details for payment info
    const { data: eventData } = await supabase
      .from('events')
      .select('fee_amount, fee_currency')
      .eq('id', eventId)
      .single();
      
    // If not registered, create registration
    const { data, error } = await supabase
      .from('event_registrations')
      .insert({
        event_id: eventId,
        user_id: userId,
        registration_data: registrationData as any,
        status: 'confirmed',
        payment_amount: eventData?.fee_amount ?? null,
        payment_currency: eventData?.fee_currency ?? null,
        payment_status: (eventData?.fee_amount && eventData.fee_amount > 0) ? 'pending' : 'not_required'
      });
    
    if (error) {
      console.error('Error registering for event:', error);
      throw new Error(error.message);
    }
    
    return data;
  } catch (error: unknown) {
    console.error('Registration error:', error);
    throw error;
  }
}

// Check registration status
export async function checkRegistrationStatus(eventId: string, userId: string) {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
    console.error('Error checking registration status:', error);
    throw new Error(error.message);
  }
  
  return {
    isRegistered: !!data,
    registration: data || null
  };
}

// Get user's event registrations with event details
export async function getUserEventRegistrations(userId: string) {
  const { data, error } = await supabase
    .from('event_registrations')
    .select(`
      *,
      event:events(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching user registrations:', error);
    throw new Error(error.message);
  }
  
  return data;
}

// Update payment status for event registration
export async function updatePaymentStatus(registrationId: string, paymentStatus: string, paymentId?: string) {
  const updateData: { payment_status: string; payment_id?: string } = { payment_status: paymentStatus };
  
  if (paymentId) {
    updateData.payment_id = paymentId;
  }
  
  const { error } = await supabase
    .from('event_registrations')
    .update(updateData)
    .eq('id', registrationId);
  
  if (error) {
    console.error('Error updating payment status:', error);
    throw new Error(error.message);
  }
  
  return true;
}
