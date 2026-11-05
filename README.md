# ellith ♡

Custom-coded pastel angelcore contact website with a Supabase-powered admin dashboard.

## Stack
- React + Vite
- Supabase Auth, Postgres and Storage
- Responsive CSS, lucide-react icons

## Run locally
1. Install Node.js 18+.
2. Copy `.env.example` to `.env`.
3. Fill in your Supabase project URL and anon/publishable key.
4. In Supabase SQL Editor, run `supabase/schema.sql`.
5. In Supabase Authentication, create an admin user (email + password). Disable public sign-ups.
6. Install and start:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The public site is at `/`; admin is at `/#admin`.

## Admin
Sign in using the admin email and password created in Supabase Auth. The username field accepts the admin email address. From the dashboard you can edit site text, theme, image URLs, upload images, and manage contact links.

## Deploy to Vercel
Import this GitHub repository into Vercel. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Project Settings → Environment Variables, then deploy. Vite's default build command is `npm run build` and output directory is `dist`.

## Important security notes
- Never put a Supabase service-role key in frontend code or commit it to GitHub.
- Disable public sign-ups. Only create trusted admin accounts manually.
- The SQL policies grant write access to authenticated users, so keep the project restricted to trusted admin accounts.
- The public anon key is designed for browser use; RLS is the security boundary.

## Notes
- Music playback requires a direct, publicly accessible audio URL (MP3). Browsers require a user click before audio can play.
- The cover image URL is stored and editable; the current layout uses avatar/background imagery. You can extend the visual hero with the cover image later.
