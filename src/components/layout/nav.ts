export type NavItem = {
  label: string;
  href: string;
  icon: string;
  badge?: string;
  isPlanned?: boolean;
};

export type NavSection = {
  section: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    section: "Operations",
    items: [
      { label: "Machinery", href: "/machinery", icon: "precision_manufacturing" },
      { label: "Log Book", href: "/machinery/log-book", icon: "menu_book" },
      { label: "Fuel", href: "/machinery/fuel", icon: "local_gas_station" },
      { label: "Breakdowns", href: "/machinery/breakdowns", icon: "build_circle" },
      { label: "Maintenance", href: "/machinery/maintenance", icon: "handyman" },
    ],
  },
  {
    section: "Inventory",
    items: [
      { label: "Store", href: "/store", icon: "store" },
      { label: "Items", href: "/store/items", icon: "category" },
      { label: "Inward / GRN", href: "/store?tab=inward", icon: "move_to_inbox" },
      { label: "Outward / Issue", href: "/store?tab=outward", icon: "outbox" },
      { label: "Stock Transfers", href: "/store?tab=transfers", icon: "swap_horiz" },
      { label: "Returns", href: "/store?tab=returns", icon: "assignment_return" },
      { label: "Stock Ledger", href: "/store?tab=ledger", icon: "receipt_long" },
    ],
  },
  {
    section: "Masters",
    items: [
      { label: "Projects", href: "/projects", icon: "location_city" },
      { label: "Sites", href: "/projects?tab=sites", icon: "explore" },
      { label: "Vendors", href: "/vendors", icon: "storefront" },
      { label: "Engines", href: "/machinery?view=engines", icon: "settings_input_component" },
      { label: "Assets", href: "/assets", icon: "home_repair_service" },
    ],
  },
  {
    section: "Control",
    items: [
      { label: "Compliance", href: "/compliance", icon: "verified" },
      { label: "Reports", href: "/reports", icon: "assessment" },
      { label: "Settings", href: "/settings", icon: "settings" },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  ...NAV_SECTIONS.flatMap((s) => s.items),
];
