"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { MascotSmall } from "./Mascot";

interface SidebarProps {
  childName?: string;
}

export function Sidebar({ childName = "ребенка" }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/parent/dashboard", icon: "🏠", label: "Parent Dashboard" },
    { href: "/child", icon: "🎮", label: "Game Selection" },
    { href: "/parent/children", icon: "🏆", label: "Rewards & Badges" },
    { href: "/parent/settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <aside className="w-64 sidebar-bg flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <MascotSmall />
        <span className="font-display text-2xl font-bold text-[#5B9BD5]">DamuBala</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className={`nav-item ${
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "active"
                  : ""
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* Cloud decoration area */}
      <div className="h-24 relative">
        {/* Clouds are added via CSS */}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-white/20">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50">
          <div className="w-10 h-10 rounded-full bg-[#5B9BD5] flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0).toUpperCase() || "P"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">
              {childName ? `${childName}'s Dad` : user?.name}
            </p>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center text-xs text-muted-foreground">
        © 2024 DamuBala
      </div>
    </aside>
  );
}

