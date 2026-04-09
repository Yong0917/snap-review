"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/",        label: "홈",       icon: Home  },
  { href: "/history", label: "히스토리", icon: Clock },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/processing" || pathname === "/result") return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border/60"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-md mx-auto flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3.5 text-[11px] font-medium transition-colors relative",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Active indicator dot */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-primary" />
              )}
              <Icon
                size={21}
                className={cn("transition-all", active && "stroke-[2.3px]")}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
