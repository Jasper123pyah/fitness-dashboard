import { Settings } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";

import { BottomNav } from "./bottom-nav";
import { DesktopNav } from "./desktop-nav";
import { ActiveSessionBar } from "@/features/workouts/active-session-bar";
import { OfflineNotice } from "@/components/layout/offline-notice";
import { Button } from "@/components/ui/button";

export function AppShell() {
  const location = useLocation();

  // Bij het wisselen van pagina weer bovenaan beginnen; op mobiel is dat wat je verwacht.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="flex min-h-dvh">
      <DesktopNav />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="safe-top sticky top-0 z-30 border-b bg-background/85 px-4 py-3 backdrop-blur-lg md:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between">
            <Link to="/" className="text-base font-semibold tracking-tight">
              Trainlog
            </Link>
            <Button
              nativeButton={false}
              render={<Link to="/instellingen" />}
              variant="ghost"
              size="icon"
              aria-label="Instellingen"
            >
              <Settings className="size-5" aria-hidden />
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4 md:px-8 md:pb-10 md:pt-8">
          <OfflineNotice />
          <ActiveSessionBar />
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
