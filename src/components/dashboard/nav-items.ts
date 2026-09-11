import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Pill,
  Tags,
  Truck,
  Users,
  Receipt,
  FileText,
  PackagePlus,
  Wallet,
  BarChart3,
  UserCog,
  Settings,
} from "lucide-react";
import type { NavSection } from "@/lib/utils/permissions";

export interface NavItem {
  label: string;
  href: string;
  section: NavSection;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", section: "dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Operations",
    items: [
      { label: "POS / New Sale", href: "/dashboard/pos", section: "pos", icon: ShoppingCart },
      { label: "Inventory", href: "/dashboard/inventory", section: "inventory", icon: Boxes },
      { label: "Medicines", href: "/dashboard/medicines", section: "medicines", icon: Pill },
      { label: "Categories", href: "/dashboard/categories", section: "categories", icon: Tags },
    ],
  },
  {
    label: "Relationships",
    items: [
      { label: "Suppliers", href: "/dashboard/suppliers", section: "suppliers", icon: Truck },
      { label: "Customers", href: "/dashboard/customers", section: "customers", icon: Users },
    ],
  },
  {
    label: "Money",
    items: [
      { label: "Sales", href: "/dashboard/sales", section: "sales", icon: Receipt },
      { label: "Invoices", href: "/dashboard/invoices", section: "invoices", icon: FileText },
      { label: "Purchases", href: "/dashboard/purchases", section: "purchases", icon: PackagePlus },
      { label: "Expenses", href: "/dashboard/expenses", section: "expenses", icon: Wallet },
    ],
  },
  {
    label: "Insights",
    items: [{ label: "Reports", href: "/dashboard/reports", section: "reports", icon: BarChart3 }],
  },
  {
    label: "Administration",
    items: [
      { label: "Staff", href: "/dashboard/staff", section: "staff", icon: UserCog },
      { label: "Settings", href: "/dashboard/settings", section: "settings", icon: Settings },
    ],
  },
];
