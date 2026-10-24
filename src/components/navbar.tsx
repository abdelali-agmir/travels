"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GlobalSearch } from "@/components/global-search";
import { cn } from "@/lib/utils";

type NavUser = { id: number; name: string; role: string } | null;
type Notification = { id: number; title: string; body: string | null; href: string | null; read: boolean };

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/trips", label: "Trips" },
  { href: "/map", label: "Map" },
  { href: "/visa", label: "Visa" },
  { href: "/guide", label: "Travel Guide" },
  { href: "/community", label: "Community" },
];

const MOBILE_LINKS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/explore", label: "Explore", icon: "🧭" },
  { href: "/plan", label: "Plan", icon: "➕" },
  { href: "/trips", label: "Trips", icon: "🧳" },
  { href: "/map", label: "Map", icon: "🗺️" },
];

export function Navbar({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (user) {
      fetch("/api/notifications")
        .then((r) => (r.ok ? r.json() : { notifications: [] }))
        .then((d) => setNotifications(d.notifications ?? []))
        .catch(() => {});
    }
  }, [user, pathname]);

  const unread = notifications.filter((n) => !n.read).length;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="Wanderly home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 font-display text-lg font-bold text-white">
              W
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-ink">WANDERLY</span>
          </Link>

          <nav className="ml-4 hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
            {NAV_LINKS.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition",
                    active ? "bg-brand-50 text-brand-800" : "text-stone-600 hover:bg-stone-100 hover:text-ink",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-500 shadow-sm transition hover:border-stone-300 sm:min-w-44"
              aria-label="Open search"
            >
              <span aria-hidden>🔍</span>
              <span className="hidden sm:block">Search anywhere…</span>
              <kbd className="ml-auto hidden rounded border border-stone-200 bg-stone-50 px-1.5 text-[10px] text-stone-400 md:block">
                ⌘K
              </kbd>
            </button>

            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen((o) => !o)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-lg text-lg transition hover:bg-stone-100"
                  aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
                >
                  🔔
                  {unread > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="animate-rise absolute right-0 top-12 w-80 rounded-xl border border-stone-200 bg-white p-2 shadow-[var(--shadow-card-hover)]">
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <p className="text-sm font-semibold">Notifications</p>
                      {unread > 0 && (
                        <button onClick={markAllRead} className="text-xs font-medium text-brand-700 hover:underline">
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="px-2 py-6 text-center text-xs text-stone-400">You're all caught up.</p>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <Link
                          key={n.id}
                          href={n.href ?? "#"}
                          onClick={() => setNotifOpen(false)}
                          className={cn("block rounded-lg px-2 py-2 transition hover:bg-stone-50", !n.read && "bg-brand-50/50")}
                        >
                          <p className="text-xs font-semibold text-ink">{n.title}</p>
                          {n.body && <p className="mt-0.5 line-clamp-2 text-[11px] text-stone-500">{n.body}</p>}
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {user && (
              <Link
                href="/saved"
                className="hidden h-10 w-10 items-center justify-center rounded-lg text-lg transition hover:bg-stone-100 sm:flex"
                aria-label="Saved places"
              >
                ♡
              </Link>
            )}

            <Link href="/plan" className="hidden rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 sm:block">
              Plan a Trip
            </Link>

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800 ring-1 ring-brand-200 transition hover:ring-brand-400"
                  aria-label="Account menu"
                  aria-expanded={menuOpen}
                >
                  {user.name.slice(0, 1).toUpperCase()}
                </button>
                {menuOpen && (
                  <div className="animate-rise absolute right-0 top-12 w-52 rounded-xl border border-stone-200 bg-white p-1.5 shadow-[var(--shadow-card-hover)]">
                    <p className="px-3 py-2 text-xs text-stone-400">Signed in as <span className="font-semibold text-stone-600">{user.name}</span></p>
                    {[
                      { href: "/trips", label: "My trips" },
                      { href: "/saved", label: "Saved places" },
                      { href: "/profile", label: "Profile & preferences" },
                      ...(user.role === "admin" ? [{ href: "/admin", label: "Admin dashboard" }] : []),
                    ].map((i) => (
                      <Link key={i.href} href={i.href} onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-stone-700 transition hover:bg-stone-50">
                        {i.label}
                      </Link>
                    ))}
                    <button onClick={logout} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50">
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="Mobile navigation"
      >
        <div className="grid grid-cols-5">
          {MOBILE_LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition",
                  active ? "text-brand-700" : "text-stone-400",
                )}
              >
                <span className={cn("text-lg leading-none", l.href === "/plan" && "flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-sm text-white")} aria-hidden>
                  {l.icon}
                </span>
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
