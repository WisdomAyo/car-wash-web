import { createClient } from "@supabase/supabase-js"

const url =
  (typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL)) ||
  ""
const key =
  (typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY)) ||
  ""

/** Only a public key belongs in the browser; never use a service-role key here. */
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // Route verification uses a typed email code.
          detectSessionInUrl: false,
        },
      })
    : null
