import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rzrroghnzintpxspwauf.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6cnJvZ2huemludHB4c3B3YXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDEzNjcsImV4cCI6MjA2MDQ3NzM2N30.8in2_4tU-O_uz3fgvthaSpmmteNggXMfQ4qJ-JMagoA";

export function createServerClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}






