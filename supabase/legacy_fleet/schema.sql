-- ===========================================================================
-- FleetCommand — Supabase schema (Postgres + PostGIS)
-- Run this in the Supabase SQL editor once, then run supabase/seed.ts.
-- ===========================================================================

create extension if not exists postgis;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type vehicle_status as enum ('moving', 'idle', 'stopped', 'offline');
exception when duplicate_object then null; end $$;

do $$ begin
  create type vehicle_type as enum ('truck', 'van', 'car', 'bus');
exception when duplicate_object then null; end $$;

do $$ begin
  create type driver_status as enum ('on-trip', 'on-duty', 'off-duty');
exception when duplicate_object then null; end $$;

do $$ begin
  create type trip_status as enum ('scheduled', 'in-progress', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------
create table if not exists depots (
  id text primary key,
  name text not null
);

create table if not exists drivers (
  id text primary key,
  name text not null,
  phone text,
  status driver_status not null default 'off-duty',
  depot text references depots(id),
  license_no text,
  license_class text,
  license_expiry date,
  duty_hours_today numeric default 0,
  rating numeric default 0,
  safety_score int default 0,
  overspeed_events int default 0,
  harsh_braking_events int default 0,
  on_time_pct int default 0,
  trips_this_month int default 0,
  distance_this_month int default 0
);

create table if not exists vehicles (
  id text primary key,
  name text not null,
  plate text not null,
  type vehicle_type not null,
  status vehicle_status not null default 'offline',
  driver_id text references drivers(id),
  depot text references depots(id),
  odometer int default 0,
  speed int default 0,
  -- PostGIS point (lng, lat), SRID 4326
  location geography(Point, 4326),
  address text,
  last_seen timestamptz default now(),
  fuel_level int default 100,
  make text,
  model text,
  year int,
  cost_per_km numeric default 0
);
create index if not exists vehicles_location_idx on vehicles using gist (location);
create index if not exists vehicles_status_idx on vehicles (status);

create table if not exists trips (
  id text primary key,
  origin text,
  destination text,
  vehicle_id text references vehicles(id),
  driver_id text references drivers(id),
  status trip_status not null default 'scheduled',
  scheduled_at timestamptz,
  eta text,
  progress int default 0,
  distance_km int default 0,
  cargo text,
  delayed_min int
);
create index if not exists trips_status_idx on trips (status);

create table if not exists work_orders (
  id text primary key,
  vehicle_id text references vehicles(id),
  type text,
  priority text,
  status text,
  scheduled_date date,
  cost int,
  mechanic text,
  description text
);

create table if not exists fuel_logs (
  id text primary key,
  vehicle_id text references vehicles(id),
  date date,
  liters numeric,
  cost int,
  odometer int,
  mileage numeric,
  anomaly boolean default false
);

create table if not exists compliance_docs (
  id text primary key,
  vehicle_id text references vehicles(id),
  type text,
  document_no text,
  issue_date date,
  expiry_date date,
  status text
);

create table if not exists alerts (
  id text primary key,
  type text,
  severity text,
  vehicle_id text references vehicles(id),
  driver_id text references drivers(id),
  description text,
  timestamp timestamptz default now(),
  status text default 'new'
);

create table if not exists app_users (
  id text primary key,
  name text,
  email text unique,
  role text,
  depot text,
  status text default 'active',
  last_active timestamptz default now()
);

create table if not exists geofences (
  id text primary key,
  name text,
  area geography(Polygon, 4326)
);
create index if not exists geofences_area_idx on geofences using gist (area);

-- ---------------------------------------------------------------------------
-- Realtime: broadcast vehicle position changes to subscribed dashboards
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table vehicles;

-- ---------------------------------------------------------------------------
-- Row Level Security (enable + read policy for authenticated users).
-- Tighten per-role once auth roles are mapped.
-- ---------------------------------------------------------------------------
alter table vehicles enable row level security;
alter table drivers enable row level security;
alter table trips enable row level security;
alter table work_orders enable row level security;
alter table fuel_logs enable row level security;
alter table compliance_docs enable row level security;
alter table alerts enable row level security;
alter table app_users enable row level security;

do $$
declare t text;
begin
  foreach t in array array['vehicles','drivers','trips','work_orders','fuel_logs','compliance_docs','alerts','app_users']
  loop
    execute format('drop policy if exists "read for authenticated" on %I', t);
    execute format('create policy "read for authenticated" on %I for select using (auth.role() = ''authenticated'')', t);
  end loop;
end $$;

-- Helper RPC: vehicles within a radius (metres) of a point — geospatial demo.
create or replace function vehicles_near(lng float, lat float, radius_m float)
returns setof vehicles
language sql stable as $$
  select * from vehicles
  where st_dwithin(location, st_setsrid(st_makepoint(lng, lat), 4326)::geography, radius_m);
$$;
