
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { socialApi } from './modules/social';
import { shopApi } from './modules/shop';
import { vehiclesApi } from './modules/vehicles';
import { profilesApi } from './modules/profiles';
import { simRacingApi } from './modules/simRacing';
import { wishlistApi } from './modules/wishlist';

const SUPABASE_URL = "https://rzrroghnzintpxspwauf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6cnJvZ2huemludHB4c3B3YXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDEzNjcsImV4cCI6MjA2MDQ3NzM2N30.8in2_4tU-O_uz3fgvthaSpmmteNggXMfQ4qJ-JMagoA";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Re-export all API modules
export { shopApi, socialApi, vehiclesApi, profilesApi, simRacingApi, wishlistApi };

export default supabase;
