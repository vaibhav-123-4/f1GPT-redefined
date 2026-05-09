// Dev-only: force logout per server restart.
//
// Supabase auth uses cookies/local storage, so a browser stays logged in across
// `npm run dev` restarts. That's normal and not a security vulnerability.
//
// If you want "closing the server logs out the current user" while developing,
// we approximate that by rotating a per-process build id and forcing signOut
// in the browser when it changes.

export const DEV_BUILD_ID =
  process.env.NODE_ENV === "development"
    ? `${Date.now()}-${Math.random().toString(16).slice(2)}`
    : null;
