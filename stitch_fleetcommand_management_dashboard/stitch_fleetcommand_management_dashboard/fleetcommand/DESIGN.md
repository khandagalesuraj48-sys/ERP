---
name: FleetCommand
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fe'
  surface-container: '#ededf9'
  surface-container-high: '#e7e7f3'
  surface-container-highest: '#e1e2ed'
  on-surface: '#191b23'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3039'
  inverse-on-surface: '#f0f0fb'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ed'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-mono:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  sidebar_width: 280px
  sidebar_collapsed: 80px
  header_height: 64px
  gutter: 24px
  container_padding: 32px
  component_gap: 16px
---

## Brand & Style
The design system is engineered for precision, efficiency, and industrial-grade reliability. It serves a professional audience of fleet managers and logistics coordinators who require high data density without cognitive fatigue. 

The aesthetic is **Corporate Modern** with a focus on functional clarity. It utilizes a structured layout, generous negative space within data modules, and high-contrast status signaling. The interface evokes a sense of "mission control"—commanding, stable, and technologically advanced.

## Colors
This design system utilizes a sophisticated slate-based palette to maintain a professional, neutral foundation, allowing the **Electric Blue** accent and functional status colors to stand out.

- **Primary Accent:** Used for primary actions, active navigation states, and key focus indicators.
- **Semantic States:** These are non-negotiable for fleet tracking. Use Green for movement, Amber for idling, Red for critical stops or mechanical alerts, and Slate Gray for disconnected assets.
- **Surface Strategy:** In Light mode, use subtle borders (`Slate-200`) to define cards. In Dark mode, use slight elevation shifts and `Slate-700` borders to maintain depth.

## Typography
**Inter** is the sole typeface, chosen for its exceptional legibility in data-heavy environments. 

- **Tabular Numerals:** All tables, coordinates, and timestamps must use `font-feature-settings: 'tnum' on` to ensure numbers align vertically, aiding quick scanning of telemetry data.
- **Hierarchy:** Use `label-sm` for table headers and small metadata tags. Use `headline-md` for card titles.
- **Mobile scaling:** For screens below 768px, `display` should scale down to 28px and `headline-lg` to 24px.

## Layout & Spacing
The layout follows a **Fixed-Fluid hybrid model**. 

- **Navigation:** A fixed left sidebar handles primary app switching. It is collapsible to an icon-only view to maximize map or table real estate.
- **Header:** A global top bar stays fixed, containing search and user profile.
- **Content Area:** Uses a standard 12-column grid within the main viewport. 
- **Density:** Maintain a 16px (1rem) base spacing unit. For data tables, reduce vertical padding to 12px to increase information density, while maintaining 24px margins for the outer container to ensure "breathability."

## Elevation & Depth
Depth is communicated through **Tonal Layering** and **Ambient Shadows**.

- **Level 0 (Background):** Slate-50 (Light) / Slate-900 (Dark).
- **Level 1 (Cards/Sidebar):** White (Light) / Slate-800 (Dark). Use a very soft, diffused shadow: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`.
- **Level 2 (Modals/Popovers):** Higher elevation with a more pronounced shadow to separate the element from the data grid.
- **Outlines:** Use a 1px border (`Slate-200` in light, `Slate-700` in dark) on all Level 1 surfaces to maintain crispness on low-resolution industrial monitors.

## Shapes
The design system employs a tiered rounding strategy to balance modern aesthetics with functional UI:

- **Large Containers:** Dashboard cards and main content wrappers use `rounded-2xl` (16px) for a soft, professional look.
- **Interactive Elements:** Buttons, input fields, and dropdowns use `rounded-lg` (8px) to feel precise and "tool-like."
- **Indicators:** Status badges and tags are "Pill-shaped" (Full rounded) to distinguish them immediately from clickable buttons.

## Components
- **Buttons:** Primary buttons use the Electric Blue fill with white text. Secondary buttons use a ghost style (outline) with Slate text. Height should be a standard 40px for desktop.
- **Status Badges:** Use a subtle background tint (10% opacity of the status color) with high-contrast bold text of the same color. Include a small 6px solid circle icon for "Moving" and "Stopped" states.
- **Inputs:** Use `Slate-100` background in light mode and `Slate-900` in dark mode. The focus state must be a 2px Electric Blue ring.
- **Data Tables:** Row hovering should use a subtle tint change. Columns containing vehicle IDs or timestamps should use the `data-mono` type style.
- **Sidebar Items:** Active states use a thick 4px vertical bar on the left edge in Electric Blue, with a light blue background tint for the entire row.