import { supabase } from "../client";
import type { Database } from "../types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

// Update the profiles type to include cover_url and mobile_phone
export interface ExtendedProfile extends Omit<Profile, "cover_url" | "mobile_phone"> {
  cover_url?: string | null;
  mobile_phone?: string | null;
}

// Update the ProfileUpdate type to include cover_url and mobile_phone
export interface ExtendedProfileUpdate extends ProfileUpdate {
  cover_url?: string | null;
  mobile_phone?: string | null;
}

export const profilesApi = {
  profiles: {
    select: () => supabase.from("profiles").select(),
    getById: (id: string) =>
      supabase.from("profiles").select().eq("id", id).single(),
    getByUsername: (username: string) =>
      supabase.from("profiles").select().eq("username", username).single(),
    insert: (values: ProfileInsert) => supabase.from("profiles").insert(values),
    update: (values: ExtendedProfileUpdate) =>
      supabase
        .from("profiles")
        .update(values)
        .eq("id", values.id || ""),
    upsert: (values: ProfileInsert) => supabase.from("profiles").upsert(values),
    searchByQuery: (query: string) =>
      supabase
        .from("profiles")
        .select("id, username, avatar_url, full_name")
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`),
  },
};

// Export all types
export { type Profile, type ProfileInsert, type ProfileUpdate };
