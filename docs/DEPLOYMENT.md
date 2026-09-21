# Deploying FleetCommand (free on Vercel)

The app is a standard Next.js 14 app and deploys to Vercel's free Hobby tier
with **zero configuration**. It works with or without Supabase env vars.

## Option A — Deploy via GitHub (recommended)

1. **Push to GitHub:**
   ```bash
   git add -A
   git commit -m "FleetCommand"
   git branch -M main
   git remote add origin https://github.com/<you>/fleetcommand.git
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new), sign in with GitHub, and
   **Import** the repo.
3. Framework preset auto-detects **Next.js**. Leave build settings default
   (`next build`). Click **Deploy**.
4. (Optional) If using Supabase, add the env vars from `.env.example` under
   **Settings → Environment Variables**, then redeploy.

Your app will be live at `https://<project>.vercel.app`.

## Option B — Deploy via CLI

```bash
npm i -g vercel
vercel            # follow prompts (links/creates a project)
vercel --prod     # promote to production
```

## Notes

- No env vars are required — the app renders on mock data + the client GPS
  simulator, so the deployed demo is always alive.
- MapLibre tiles load from CARTO's free CDN (no key). If you later want a custom
  basemap, swap the tile URL in `src/features/tracking/FleetMap.tsx`.
- `output` is left as the default (server) so dynamic routes like
  `/vehicles/[id]` render on demand.
