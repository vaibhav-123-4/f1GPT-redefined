"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginUI() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const oauthError = searchParams.get("error");
    const details = searchParams.get("details");
    if (!oauthError) return;
    const composed = details ? `${oauthError}: ${details}` : oauthError;
    setError(composed);
  }, [searchParams]);

  // In development, we optionally force-clear any stale auth cookies
  // so a server restart behaves like a fresh session.
  async function devLogout() {
    try {
      await fetch("/api/auth/dev-logout", { method: "POST" });
    } catch {
      // ignore
    }
  }

  async function signUpWithEmailPassword() {
    setError(null);
    setMessage(null);

    await devLogout();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) return setError("Enter your email.");
    if (!password || password.length < 8) return setError("Password must be at least 8 characters.");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // If confirmations are enabled, Supabase returns no session.
    if (!data.session) {
      setMessage(
        "Account created, but email confirmation is enabled in Supabase. Disable 'Confirm email' in Supabase Auth settings to allow password sign-in without links.",
      );
      return;
    }

    window.location.href = "/";
  }

  async function signInWithEmailPassword() {
    setError(null);
    setMessage(null);

    await devLogout();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) return setError("Enter your email.");
    if (!password) return setError("Enter your password.");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    window.location.href = "/";
  }

  async function signInWithProvider(provider: "google") {
    setError(null);
    setMessage(null);

    await devLogout();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const redirectTo = new URL("/auth/callback", siteUrl ?? window.location.origin).toString();

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    });

    if (signInError) {
      setError(signInError.message);
    }
  }

  return (
    <main className="relative min-h-screen px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 f1-grid opacity-[0.20]" aria-hidden="true" />

      <div className="mx-auto w-full max-w-md overflow-hidden rounded-[28px] border border-f1.line bg-black/45 shadow-glow backdrop-blur-xl">
        <div className="border-b border-f1.line px-6 py-6 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-[22px] border border-f1.line bg-black/55 shadow-glow">
            <img src="/logo.png" alt="f1GPT" className="h-full w-full object-cover" />
          </div>
          <h1 className="mt-5 text-2xl font-black tracking-tight">Sign in to f1GPT</h1>
          <p className="mt-2 text-sm text-white/60">Your chats sync across devices.</p>
        </div>

        <div className="space-y-4 px-6 py-6">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={[
                "rounded-2xl border px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] transition",
                mode === "login"
                  ? "border-f1.red bg-f1.red/15 text-white"
                  : "border-f1.line bg-white/5 text-white/75 hover:border-f1.red/60",
              ].join(" ")}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={[
                "rounded-2xl border px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] transition",
                mode === "signup"
                  ? "border-f1.red bg-f1.red/15 text-white"
                  : "border-f1.line bg-white/5 text-white/75 hover:border-f1.red/60",
              ].join(" ")}
            >
              Sign up
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.24em] text-white/70">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-f1.line bg-black/45 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-f1.red"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.24em] text-white/70">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              className="w-full rounded-2xl border border-f1.line bg-black/45 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-f1.red"
            />
            {mode === "signup" ? <p className="text-xs text-white/55">Minimum 8 characters.</p> : null}
          </div>

          <button
            type="button"
            onClick={() =>
              startTransition(mode === "signup" ? signUpWithEmailPassword : signInWithEmailPassword)
            }
            disabled={isPending}
            className="w-full rounded-2xl bg-f1.red px-6 py-3 text-sm font-extrabold uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {mode === "signup" ? "Create account" : "Login"}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-f1.line" />
            <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-white/45">Or</span>
            <div className="h-px flex-1 bg-f1.line" />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => void signInWithProvider("google")}
              className="rounded-2xl border border-f1.line bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-f1.red"
            >
              Continue with Google
            </button>
          </div>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {message ? <p className="text-sm text-white/70">{message}</p> : null}
        </div>
      </div>
    </main>
  );
}
