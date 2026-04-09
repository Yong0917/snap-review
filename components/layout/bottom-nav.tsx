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
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.10)]"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        background: "color-mix(in oklch, var(--background) 88%, transparent)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      <div className="max-w-md mx-auto flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3.5 text-[11px] font-medium transition-all duration-200 relative",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Active indicator pill */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2.5px] rounded-full bg-primary" />
              )}

              {/* Icon with active background */}
              <span
                className={cn(
                  "relative w-9 h-7 flex items-center justify-center rounded-xl transition-all duration-200",
                  active ? "bg-primary/10" : "hover:bg-muted/60"
                )}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.3 : 1.8}
                  className="transition-all"
                />
              </span>

              <span className={cn("transition-all", active ? "font-semibold" : "")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
