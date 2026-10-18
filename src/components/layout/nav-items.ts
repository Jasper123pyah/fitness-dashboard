import {
  Dumbbell,
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/training", label: "Training", icon: Dumbbell },
  { to: "/voeding", label: "Voeding", icon: UtensilsCrossed },
  { to: "/boodschappen", label: "Boodschappen", icon: ShoppingCart },
  { to: "/voortgang", label: "Voortgang", icon: TrendingUp },
];
