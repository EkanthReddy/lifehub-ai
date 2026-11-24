# LIFEHUB AI

Personal Life Administration Agent — MVP starter.

## Stack
- React + TypeScript + Vite
- Supabase Auth + PostgreSQL + private Storage
- Netlify hosting
- OpenAI integration will be added through a server-side function later

## Deploy from the browser
1. Create a private GitHub repository named `lifehub-ai`.
2. Upload the contents of this project ZIP to the repository root (not the ZIP itself).
3. Create a Supabase project.
4. In Supabase SQL Editor, run `supabase/migrations/001_initial_schema.sql`.
5. In Netlify, choose **Add new site → Import an existing project** and connect GitHub.
6. Select `lifehub-ai`. Build command: `npm run build`; publish directory: `dist`.
7. Before deploying, add these environment variables in Netlify Site configuration → Environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
8. Trigger a deploy.

## Supabase values
Find the project URL and publishable/anon key in Supabase Project Settings → API.
The browser key is designed to be public; database security comes from Row Level Security.
Never put a Supabase service-role key or OpenAI API key in a `VITE_` variable.

## First test
- Open the Netlify URL.
- Create an account with an email you control.
- Confirm email if email confirmation is enabled.
- Sign in.
- Add an inbox item and refresh to verify persistence.

## Important
This is an MVP scaffold, not a production security certification. Review RLS, storage policies,
authentication settings, rate limits, backups, privacy disclosures and file validation before
accepting real sensitive documents or launching publicly.
