"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarRange, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/planning", label: "Planning", icon: CalendarRange },
  { href: "/capture", label: "Capture", icon: UserPlus },
  { href: "/contacts", label: "Contacts", icon: Users },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl md:static md:border-t-0 md:border-r md:w-56 md:min-h-screen">
      <div className="hidden md:flex items-center gap-2 p-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-grain-navy flex items-center justify-center">
          <span className="text-white font-bold text-sm">G</span>
        </div>
        <span className="font-semibold text-foreground">ConfTracker</span>
      </div>

      <div className="flex md:flex-col">
        {links.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-1 md:flex-none items-center justify-center md:justify-start gap-3 p-3 md:px-5 md:py-3 text-sm transition-colors",
                isActive
                  ? "text-grain-blue bg-grain-blue/10 md:border-r-2 md:border-grain-blue"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <link.icon className="w-5 h-5" />
              <span className="hidden md:inline">{link.label}</span>
              <span className="md:hidden text-[10px]">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
