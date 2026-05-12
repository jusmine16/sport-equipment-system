"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type NavTab = {
  href: string;
  label: string;
  icon: "dashboard" | "equipment" | "borrowed" | "history" | "checklist" | "pending" | "admin";
};

const tabIcon = (icon: NavTab["icon"]) => {
  if (icon === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.9">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }

  if (icon === "equipment") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.9">
        <path d="m3 11 9-5 9 5-9 5-9-5Z" />
        <path d="M12 16v5" />
      </svg>
    );
  }

  if (icon === "borrowed") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.9">
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M8 11h8M8 15h5" />
      </svg>
    );
  }

  if (icon === "history") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.9">
        <path d="M3 12a9 9 0 1 0 2.6-6.4" />
        <path d="M3 4v4h4" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  if (icon === "checklist") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.9">
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </svg>
    );
  }

  if (icon === "pending") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.9">
        <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 0 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.9">
      <path d="M12 3 4 7v6c0 4.8 3.4 7.8 8 8 4.6-.2 8-3.2 8-8V7l-8-4Z" />
    </svg>
  );
};

export default function Nav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const nextTheme = storedTheme === "light" || storedTheme === "dark"
      ? storedTheme
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
  }, []);

  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  const tabs: NavTab[] = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/equipment", label: "Equipment Catalog", icon: "equipment" },
    { href: "/transactions", label: "My Borrowed Items", icon: "borrowed" },
    { href: "/history", label: "History", icon: "history" },
    { href: "/borrow-checklist", label: "Borrowing Checklist", icon: "checklist" },
    ...(user?.role === "admin"
      ? [
          { href: "/pending-requests", label: "Pending Requests", icon: "pending" as const },
          { href: "/admin", label: "Admin Panel", icon: "admin" as const },
        ]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-white/6 backdrop-blur-xl shadow-[0_8px_26px_rgba(3,10,26,0.15)]">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-300 to-blue-500 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20">
                SB
              </span>
              <div>
                <div className="text-lg font-display font-semibold tracking-tight text-white">SportBorrow</div>
                <p className="text-xs text-slate-400">
                  Welcome{user?.username ? `, ${user.username}` : ""}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              suppressHydrationWarning
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              <span className="theme-toggle-icon theme-toggle-dark inline-flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.9">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
                </svg>
                <span>Light Mode</span>
              </span>
              <span className="theme-toggle-icon theme-toggle-light inline-flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.9">
                  <circle cx="12" cy="12" r="4" />
                  <path strokeLinecap="round" d="M12 2v2.2M12 19.8V22M22 12h-2.2M4.2 12H2M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6M19.1 19.1l-1.6-1.6M6.5 6.5 4.9 4.9" />
                </svg>
                <span>Dark Mode</span>
              </span>
            </button>

            <button
              onClick={logout}
              suppressHydrationWarning
              className="app-btn-secondary inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3 overflow-x-auto">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition whitespace-nowrap ${
                  active
                    ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200"
                    : "border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/8 hover:text-white"
                }`}
              >
                <span className={active ? "text-cyan-300" : "text-slate-400"}>
                  {tabIcon(tab.icon)}
                </span>
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
