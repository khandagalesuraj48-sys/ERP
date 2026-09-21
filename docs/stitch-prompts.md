# Stitch UI/UX Prompts — Fleet Management & Tracking System

> How to use: In Google Stitch, generate **one screen per prompt**. Paste the
> **Design Language block** at the top of each screen prompt (or set it once as
> your reference) so every screen shares the same look. Web / desktop dashboard
> unless a prompt says "mobile".

---

## 0) GLOBAL DESIGN LANGUAGE (prepend to every screen prompt)

```
Design language for all screens — keep this identical across every screen:

Product: "FleetCommand", a professional Fleet Management & Tracking System — a
modern SaaS web dashboard used by fleet managers and dispatchers in a control-room
setting. Data-dense but clean and breathable. Trustworthy, efficient, precise.

Layout: Fixed left vertical sidebar navigation (icons + labels, collapsible),
with sections: Dashboard, Live Tracking, Vehicles, Drivers, Trips & Dispatch,
Maintenance, Fuel & Cost, Compliance, Reports, Settings. Top bar with global
search, a date/range selector, notifications bell (with badge), and a user avatar
menu on the right. Main content area uses rounded-2xl cards with subtle shadows on
a light slate background.

Theme: Support both light and dark. Light = slate-50 background (#F8FAFC), white
cards, slate-900 text. Dark = slate-900 background, slate-800 cards, slate-100 text.
Primary accent: electric blue (#2563EB). 
Status colors (use consistently everywhere): moving/active = green (#16A34A),
idle = amber (#F59E0B), stopped/alert = red (#DC2626), offline = slate gray (#94A3B8).

Typography: Inter (or similar geometric sans). Clear hierarchy, tabular/aligned
numbers for metrics. Buttons and inputs rounded-lg. Badges/chips are pill-shaped.

Components style: KPI stat cards, filterable data tables with sticky headers,
status pill badges, line/bar/donut charts, side drawers for detail, modals for
forms, and toast notifications. Whitespace generous, borders subtle (slate-200).
```

---

> Note: Login screen intentionally omitted for now — start at the Dashboard.

## 1) MAIN DASHBOARD (Overview)

```
[paste Design Language]

Screen: Main Dashboard overview. Top row = 4 KPI stat cards: "Active Vehicles"
(e.g. 128/150 with green trend), "On-Trip Now", "Open Alerts" (red accent),
"Maintenance Due" (amber accent) — each with a small sparkline and % change.
Below, a 2-column layout: LEFT (wider) = a live mini-map card showing vehicle pins
colored by status with a "View live tracking" link; under it a "Fleet Utilization"
line chart (last 7 days). RIGHT column = "Recent Alerts" list (speeding, geofence
breach, SOS with time + vehicle), and a "Trips Today" summary donut (completed /
in-progress / scheduled). Bottom = a compact "Vehicles needing attention" table
(vehicle, status badge, issue, action). Data-dense but organized.
```

## 3) LIVE TRACKING (Map)

```
[paste Design Language]

Screen: Live Tracking. Full-bleed interactive map fills most of the screen with
vehicle pins colored by status (green moving, amber idle, red stopped). A
collapsible LEFT panel lists vehicles with search + status filter chips; each row
shows vehicle name/plate, driver, speed, and a status pill. Clicking a vehicle
opens a RIGHT-side detail drawer: live speed gauge, current location/address,
driver, current trip, last update time, and mini controls (center on map, view
trip, contact driver). Top of map has filter toolbar: status filter, depot filter,
and a "Geofences" toggle showing shaded geofence zones. Include a legend for status
colors. Control-room feel.
```

## 4) VEHICLES — LIST

```
[paste Design Language]

Screen: Vehicles list. A powerful data table: columns = Vehicle (photo + name +
plate), Type (truck/van/car icon), Status pill, Driver, Depot, Odometer,
Compliance (green/amber/red dot for docs expiry), Last seen. Above the table: a
search bar, filter chips (status, type, depot), and a primary "+ Add Vehicle"
button. Include pagination, row hover, and a right-click/⋯ actions menu (View,
Assign driver, Maintenance, Documents). Show a small summary strip above the table
with counts by status.
```

## 5) VEHICLE — DETAIL

```
[paste Design Language]

Screen: Vehicle detail page. Header with vehicle photo, name, plate, type, and a
large status pill + quick actions (Assign driver, Schedule maintenance, View on
map). Tabbed sections: Overview (specs, odometer, current driver, current trip),
Documents (registration, insurance, permit, fitness, pollution — each a card with
expiry date and a green/amber/red status), Maintenance history (timeline of work
orders), Fuel logs (table + mileage trend chart), Trip history (list with dates,
distance, duration). Right sidebar = mini live map with current location and a
"cost per km" stat.
```

## 6) DRIVERS — LIST

```
[paste Design Language]

Screen: Drivers list. Data table: Driver (avatar + name), License no. + expiry
status dot, Phone, Assigned vehicle, Status (on-duty/off-duty/on-trip pill),
Duty hours today, Rating (stars). Search bar, filter chips (status, depot),
"+ Add Driver" button. Summary strip: total drivers, on-duty, on-trip, available.
```

## 7) DRIVER — DETAIL

```
[paste Design Language]

Screen: Driver detail. Header with avatar, name, contact, status pill, assigned
vehicle. Cards: License & documents (number, class, expiry with status color),
Duty/rest hours (today + weekly bar chart), Performance (safety score, harsh-braking
& over-speeding counts, on-time %), Assigned vehicle card with link, and Trip
history table. Right side = quick stats (trips this month, distance, rating).
```

## 8) TRIPS & DISPATCH

```
[paste Design Language]

Screen: Trips & Dispatch board. Top = tabs/segments: Scheduled, In-Progress,
Completed, Cancelled with counts. Main = a trips table (Trip ID, Route origin →
destination, Vehicle, Driver, Scheduled time, ETA, Status pill, Progress bar).
Primary "+ New Trip" button opens a dispatch modal (select vehicle, driver, origin,
destination, cargo, schedule). Include a right-side mini map preview of a selected
trip's route. Emphasize a dispatcher-friendly, fast workflow.
```

## 9) TRIP DETAIL / ROUTE PLAYBACK

```
[paste Design Language]

Screen: Trip detail with route playback. Large map showing the planned route line
and the actual traveled path with start/end pins and event markers (stops,
speeding, geofence). A playback timeline scrubber at the bottom with play/pause and
speed controls to replay the trip. Side panel: trip summary (distance, duration,
avg/max speed, idle time, fuel used, cost), driver + vehicle, and an event log list
(timestamped: departed, over-speed, stopped, arrived).
```

## 10) MAINTENANCE & WORK ORDERS

```
[paste Design Language]

Screen: Maintenance. Top KPI cards: "Due Soon" (amber), "Overdue" (red),
"In Service", "Completed this month". Main = work orders table (Vehicle, Type
service/repair/inspection, Priority pill, Status open/in-progress/done, Scheduled
date, Cost, Assigned mechanic). "+ Create Work Order" button opens a modal.
A secondary panel: upcoming service schedule list (by odometer or date) with
"Schedule" actions. Include a parts/cost mini-summary.
```

## 11) FUEL & COST ANALYTICS

```
[paste Design Language]

Screen: Fuel & Cost analytics. Top KPI cards: Total fuel cost (period), Avg cost
per km, Avg mileage (km/l), Fuel anomalies detected (red). Charts: a line chart of
fuel cost over time, a bar chart of cost-per-km by vehicle (top/bottom performers),
and a donut of cost breakdown (fuel / maintenance / other). Below, a fuel logs
table (Date, Vehicle, Liters, Cost, Odometer, Mileage, flagged anomaly icon).
Date-range selector at top right.
```

## 12) COMPLIANCE & DOCUMENTS

```
[paste Design Language]

Screen: Compliance dashboard. Top = alert banners for expiring documents. KPI cards:
Valid, Expiring soon (amber, <30 days), Expired (red). Main = a documents table
grouped by type (Registration, Insurance, Permit, Fitness, Pollution) with columns
Vehicle, Document no., Issue date, Expiry date, Status pill, and a "Renew/Upload"
action. A calendar/timeline view toggle showing upcoming expiries by month.
```

## 13) REPORTS

```
[paste Design Language]

Screen: Reports. A grid of report cards (Fleet Utilization, Cost Analysis, Driver
Performance, Fuel Efficiency, Trip Summary, Maintenance Log) each with a preview
chart thumbnail and "Generate / Export (PDF, CSV)" actions. On selecting a report,
show a configuration panel (date range, vehicles, depots) and a large preview area
with charts + a data table. Clean, print-friendly aesthetic.
```

## 14) ALERTS & NOTIFICATIONS

```
[paste Design Language]

Screen: Alerts center. Filterable list of alerts with severity color coding:
over-speeding, geofence breach, harsh braking, SOS/panic (red, pinned to top),
idle too long, document expiry, maintenance due. Each row: icon, severity pill,
vehicle + driver, description, timestamp, and Acknowledge/Resolve actions. Left
filter rail: by type, severity, status (new/acknowledged/resolved), date. Top
summary counts by severity.
```

## 15) SETTINGS — USERS & ROLES

```
[paste Design Language]

Screen: Settings › Users & Roles. Left settings nav (Profile, Users & Roles,
Depots, Geofences, Alert Rules, Integrations, Billing). Main = users table (Name,
email, Role pill [Admin/Fleet Manager/Dispatcher/Driver/Viewer], Depot, Status,
Last active) with "+ Invite User". A roles/permissions matrix card showing which
role can access which module (checkmark grid). Clean admin settings aesthetic.
```

## 16) (Optional) DRIVER MOBILE APP — Trip View

```
[paste Design Language] — but MOBILE layout (narrow, single column).

Screen: Driver mobile app, active trip view. Top = current trip card (destination,
ETA, distance remaining) over a map with the route. Big primary buttons: "Start
Trip" / "Arrived", plus "Navigate". Below: cargo/notes, a status toggle
(available / on-trip / off-duty), an SOS button (red), and a bottom nav
(Trips, Vehicle, Messages, Profile). Large touch targets, glanceable.
```

---

### Tips for Stitch
- Generate screens in this order (Login → Dashboard → Live Tracking first) — they
  set the visual tone; reuse the same theme for the rest.
- If a screen comes out too busy, add: "simplify, more whitespace, fewer columns".
- To keep consistency, tell Stitch "match the previous screen's sidebar, top bar,
  colors, and card style."
- Export each screen; share the images/specs (or the Stitch code export) back to me
  and I'll build the real components to match.
