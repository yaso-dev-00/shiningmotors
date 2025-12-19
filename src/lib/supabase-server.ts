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
  
  // Set the access token for RLS
  if (token) {
    try {
      // First, verify the token and get the user
      // This sets the user context in the client for RLS
      const { data: { user }, error: getUserError } = await client.auth.getUser(token);
      
      if (getUserError || !user) {
        console.warn('Failed to get user from token:', getUserError);
        // Try setSession as fallback
        const { error: sessionError } = await client.auth.setSession({
          access_token: token,
          refresh_token: token, // Use token as fallback
        } as any);
        
        if (sessionError) {
          console.warn('Failed to set session:', sessionError);
        }
      } else {
        // User verified, now set the session to ensure RLS works
        const { error: sessionError } = await client.auth.setSession({
          access_token: token,
          refresh_token: token, // Use token as fallback
        } as any);
        
        if (sessionError) {
          console.warn('Failed to set session after getUser:', sessionError);
        }
      }
    } catch (error) {
      console.warn('Error setting auth context:', error);
    }
  }
  
  return client;
}






