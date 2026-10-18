import { NavLink } from "react-router-dom";

import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";

/** Vaste navigatie onderaan het scherm: met één duim bereikbaar. */
export function BottomNav() {
  return (
    <nav
      aria-label="Hoofdnavigatie"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/85 backdrop-blur-lg md:hidden"
    >
      <ul className="mx-auto flex max-w-xl items-stretch">
        {NAV_ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground active:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      "size-5 transition-transform",
                      isActive && "scale-110",
                    )}
                    aria-hidden
                  />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
