const SUPABASE_URL = "https://ydrcwahxucotegzewzqj.supabase.co";
const SUPABASE_KEY = "sb_publishable_2Re28ix5_9kiunhi1VDiaw_rYf5UcAy";

async function createSupabaseClient() {
  if (window.supabase?.createClient) {
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

const supabaseClient = await createSupabaseClient();

export default supabaseClient;
