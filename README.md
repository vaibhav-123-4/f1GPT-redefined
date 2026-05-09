# F1 GPT Redefined

## Branding Assets

Place these files in `public/`:

- `public/logo.png` (your f1GPT logo)
- `public/favicon.png` (favicon, can be same as logo)
- `public/bg.png` (background image)

AI-powered Formula 1 chatbot built with Next.js, Tailwind CSS, OpenRouter, and real F1 data APIs.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Add your API key to `.env.local`:

```bash
OPENROUTER_API_KEY=your_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Auth

- This app uses Supabase Auth.
- Enable Email and Google OAuth in Supabase.
- For email/password login without confirmation links: Supabase Dashboard -> Auth -> Providers -> Email -> turn OFF "Confirm email".
- Add `http://localhost:3000/auth/callback` to your Redirect URLs.

## Security

- Never commit API keys.
- If a key is ever pasted into a tracked file, rotate/revoke it immediately.

3. Start the app:

```bash
npm run dev
```

## Data Sources

- Jolpica Ergast-compatible API for standings, drivers, constructors, and race results
- OpenF1 API included as an available data source in the backend layer

## Notes

- The backend uses OpenRouter tool calling with free models only.
- Factual F1 responses are routed through API-backed tools instead of guessed by the model.
