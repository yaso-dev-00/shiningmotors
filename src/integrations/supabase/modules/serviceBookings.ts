export interface ServiceBooking {
  id: number;
  service_id: string | null;
  vendor_id: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string | null;
  notes: string | null;
  booking_slot: string | null;
  booking_date: string | null;
  status: string | null;
  service?: {
    title: string | null;
    price: string | null;
    description: string | null;
    category: string | null;
    media_urls: string[] | null;
    location: string | null;
  };
  vendor?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const serviceBookingsApi = {
  getByUserId: async (userId: string) => {
    const response = await fetch(`/api/service-bookings/${userId}?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Ensure no caching
    });
    const result = await response.json();
    if (!response.ok) {
      return { data: null, error: result.error || 'Failed to fetch service bookings' };
    }
    return { data: result.data as ServiceBooking[], error: null };
  },

  updateStatus: async (bookingId: number, userId: string, status: string) => {
    const response = await fetch(`/api/service-bookings/update?t=${Date.now()}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookingId, userId, status }),
      cache: 'no-store', // Ensure no caching
    });
    const result = await response.json();
    if (!response.ok) {
      return { data: null, error: result.error || 'Failed to update service booking' };
    }
    return { data: result.data, error: null };
  },
};

