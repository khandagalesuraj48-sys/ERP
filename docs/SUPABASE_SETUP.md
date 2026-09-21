# Enabling the Supabase backend

FleetCommand runs on mock data out of the box. Follow these steps to switch it
to a real, free Supabase backend (Postgres + PostGIS + Auth + Realtime).

## 1. Create the project (free tier)

1. Sign up at [supabase.com](https://supabase.com) and create a **new project**
   (the free tier is enough). Pick a region close to you.
2. In **Project Settings → API**, copy:
   - **Project URL**
   - **anon public** key
   - **service_role** key (secret — used only for seeding)

## 2. Create the schema

Open **SQL Editor** in the Supabase dashboard, paste the contents of
[`supabase/schema.sql`](../supabase/schema.sql), and run it. This creates all
tables, the PostGIS `location` column + index, the realtime publication, RLS
policies, and a `vehicles_near()` geospatial helper.

## 3. Add environment variables

Create `.env.local` in the project root (copy from `.env.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# seeding only (server-side)
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 4. Seed the data

```bash
npx tsx supabase/seed.ts
```

This pushes the full mock dataset (vehicles as PostGIS points, drivers, trips,
etc.) into your tables.

## 5. Flip the data source to Supabase

The app auto-detects the env vars (`isSupabaseConfigured`). To make the screens
read from Supabase, implement the queries in
[`src/lib/data/repository.ts`](../src/lib/data/repository.ts) — e.g.

```ts
export async function getVehicles(): Promise<Vehicle[]> {
  if (!supabase) return mock.vehicles;
  const { data } = await supabase.from("vehicles").select("*");
  return (data ?? []).map(rowToVehicle); // map snake_case -> Vehicle
}
```

Every screen already imports from this repository, so no page changes are
needed. For **live tracking over Realtime**, subscribe in `useLiveFleet` to
`supabase.channel('vehicles')` postgres_changes instead of the simulator tick.

## Free-tier notes

- The free project **pauses after ~1 week of inactivity** — fine for a portfolio;
  it wakes on the next request. The mock fallback means the UI still renders even
  if the DB is briefly unavailable.
- PostGIS, Auth, Realtime and 500MB storage are all included free.
