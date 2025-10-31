// lib/supabase.ts

import { createBrowserClient } from "@supabase/ssr";

// -----------------------------------------------------------
// Helper Function to Create the Supabase Client Instance
// -----------------------------------------------------------

/**
 * Creates and exports a client-side Supabase client instance.
 *
 * It uses NEXT_PUBLIC environment variables, which are safe to expose
 * to the browser. This client is primarily used for:
 * 1. Client-side data fetching (when not using server components).
 * 2. Client-side authentication actions (login, signup, etc.).
 * 3. Server-side API route session management.
 */
export const supabase = createBrowserClient(
  // The Supabase URL is the base address of your project.
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // The Public Anon Key is used for client-side API calls.
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// -----------------------------------------------------------
// IMPORTANT NOTE
// -----------------------------------------------------------
// For RLS (Row-Level Security) to work, NEVER use the SUPABASE_SERVICE_ROLE_KEY
// in this file. That key should ONLY be used in secure, server-only API routes
// (like the invite user API we created) and NEVER exposed to the client.
