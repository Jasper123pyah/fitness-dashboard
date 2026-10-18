import { Settings } from "lucide-react";
import { NavLink } from "react-router-dom";

import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";

export function DesktopNav() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r px-3 py-6 md:flex">
      <div className="mb-6 px-3">
        <p className="text-lg font-semibold tracking-tight">Trainlog</p>
        <p className="text-xs text-muted-foreground">Training en voeding</p>
      </div>

      <nav aria-label="Hoofdnavigatie" className="flex-1">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <NavLink
        to="/instellingen"
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )
        }
      >
        <Settings className="size-4" aria-hidden />
        Instellingen
      </NavLink>
    </aside>
  );
}
