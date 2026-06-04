import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function getBaseUrl(request: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  // Prefer proxy headers on Vercel.
  const proto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (proto && host) {
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = getBaseUrl(request);

  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");
  if (oauthError) {
    const url = new URL("/login", origin);
    url.searchParams.set("error", oauthError);
    if (oauthErrorDescription) {
      url.searchParams.set("details", oauthErrorDescription);
    }
    return NextResponse.redirect(url);
  }

  const code = searchParams.get("code");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.redirect(`${origin}/login?error=missing_supabase_env`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  // Important for production (Vercel): write Supabase auth cookies onto the redirect response.
  const response = NextResponse.redirect(`${origin}/`);
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          response.cookies.set(cookie.name, cookie.value, cookie.options);
        }
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth exchange failed:", error);
    return NextResponse.redirect(`${origin}/login?error=auth_failed&details=${encodeURIComponent(error.message)}`);
  }

  // Ensure cookies are set before redirecting
  response.headers.set("Cache-Control", "no-store");
  return response;
}
