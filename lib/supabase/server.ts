// File: lib/supabase/server.ts (Fixed cookies handling for Next.js 13+ App Router)

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a Supabase Client for Server Components and Route Handlers.
 * In Next.js 13+ App Router, cookies() is synchronous.
 * It returns a getter function to cookies as required by createServerComponentClient.
 */
export const createSupabaseServerClient = () => {
  return createServerComponentClient({
    cookies: () => cookies(),
  });
};
