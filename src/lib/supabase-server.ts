import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rzrroghnzintpxspwauf.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6cnJvZ2huemludHB4c3B3YXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDEzNjcsImV4cCI6MjA2MDQ3NzM2N30.8in2_4tU-O_uz3fgvthaSpmmteNggXMfQ4qJ-JMagoA";

export function createServerClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export async function createAuthenticatedServerClient(accessToken?: string) {
  // Get token from parameter or cookies
  let token = accessToken;
  
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('sb-access-token')?.value || 
              cookieStore.get('access_token')?.value ||
              cookieStore.get('sb:token')?.value;
    } catch (cookieError) {
      // Cookies might not be available in all contexts
      console.warn('Could not read cookies:', cookieError);
    }
  }
  
  // Create client
  const client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  
  // Set the access token for RLS using global fetch headers
  // This is the recommended way for server-side RLS
  if (token) {
    // Create client with token in global headers for RLS
    // This avoids the setSession issues with expired tokens
    const authenticatedClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    return authenticatedClient;
  }
  
  return client;
}






