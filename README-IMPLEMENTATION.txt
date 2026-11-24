LIFEHUB AI — PDF upload + OpenAI extraction patch

Files in this package are replacements/additions for your existing repository.

1. Replace src/App.tsx
2. Replace src/components/AppLayout.tsx
3. Add src/pages/Documents.tsx
4. Append the contents of src/styles.css.append to the END of your existing src/styles.css
5. Add supabase/functions/extract-document/index.ts
6. Add supabase/config.toml (or merge the function setting if this file already exists)

Then commit and push to GitHub. Netlify will rebuild the frontend automatically.

Supabase Edge Function deployment (browser-only):
- Supabase Dashboard > Edge Functions > Deploy a new function > use the editor.
- Function name: extract-document
- Paste the contents of supabase/functions/extract-document/index.ts into the function editor and deploy.
- If the dashboard offers function settings, keep JWT verification enabled.

Add Edge Function secrets in Supabase > Edge Functions > Secrets:
- OPENAI_API_KEY = your OpenAI API key
The platform provides SUPABASE_URL and SUPABASE_ANON_KEY to Edge Functions in the standard hosted environment. If the dashboard requires them as secrets, set those values too.
Never put OPENAI_API_KEY in Netlify environment variables or any VITE_ variable.

Important:
- This first implementation accepts PDF files only, max 10 MB.
- The storage bucket must be private and its RLS policies must allow each authenticated user to access only files under their own user-id folder.
- The documents table must already exist from migration 001.
- OpenAI API usage is billed separately from ChatGPT.
- The AI returns a preview. Events and reminders are only written after the user presses Approve.
- Test only with fictional sample documents first. Do not upload sensitive real documents until security, retention, privacy and error handling have been reviewed.
