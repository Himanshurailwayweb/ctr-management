const SUPABASE_URL =
  "https://dxfcvxgiqquyxlheqbch.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_tv9lC5VdAyXLOjQ4TbtDRg_Mfi25mJ-";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );