import { createClient } from "@supabase/supabase-js";

const supabaseURL = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const supabase = supabaseURL && supabasePublishableKey
  ? createClient(supabaseURL, supabasePublishableKey)
  : null;
