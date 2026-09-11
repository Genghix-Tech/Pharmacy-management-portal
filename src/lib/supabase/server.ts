import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Reads the user's session from cookies so every query runs as that user and
 * is scoped by Row Level Security — never use the service role key here.
 *
 * Server Components can't write cookies, so the `setAll` call is wrapped in
 * try/catch: it silently no-ops there and relies on `proxy.ts` to keep the
 * session cookie refreshed on every request instead.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — ignore, proxy.ts handles it.
          }
        },
      },
    }
  );
}
