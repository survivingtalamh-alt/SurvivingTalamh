/* ==========================================================
   SURVIVING TALAMH — Configuration
   ----------------------------------------------------------
   Replace the two placeholder values below with your real
   Supabase project URL and anon (public) key.

   Find them in: Supabase Dashboard → Project Settings → API
   ========================================================== */

window.ST_CONFIG = {
  // Supabase project URL — e.g. "https://abcdefgh.supabase.co"
  SUPABASE_URL: "https://vvzbzueqzejztjppmcmu.supabase.co/rest/v1/",

  // Supabase anon (public) key — safe to expose in client code
  // because Row-Level Security policies protect the data
  SUPABASE_ANON_KEY: "sb_publishable_VEh6Bw_bf6Uy7BT6BDiX3w_yQVDKJdJ",

  // Storage bucket name for fan art uploads (created during setup)
  STORAGE_BUCKET: "fan-art",

  // Release date — ISO 8601, UK time (Feb 1 2027 at 00:00)
  RELEASE_DATE: "2027-02-01T00:00:00+00:00",

  // Max upload size in MB (per image)
  MAX_UPLOAD_MB: 5
};
