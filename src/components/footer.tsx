import Link from "next/link";

const COLUMNS: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  {
    title: "Product",
    links: [
      { href: "/plan", label: "Trip planner" },
      { href: "/explore", label: "Explore destinations" },
      { href: "/map", label: "World map" },
      { href: "/visa", label: "Visa checker" },
      { href: "/guide", label: "Travel guide" },
      { href: "/guide/currency", label: "Currency tools" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "/community", label: "Stories & tips" },
      { href: "/creators", label: "Creator hub" },
      { href: "/assistant", label: "AI assistant" },
      { href: "/alerts", label: "Travel alerts" },
    ],
  },
  {
    title: "Popular",
    links: [
      { href: "/travel/japan/tokyo", label: "Tokyo" },
      { href: "/travel/france/paris", label: "Paris" },
      { href: "/travel/morocco/marrakech", label: "Marrakech" },
      { href: "/travel/thailand/bangkok", label: "Bangkok" },
      { href: "/travel/turkey/istanbul", label: "Istanbul" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-stone-200 bg-white pb-24 lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 font-display text-lg font-bold text-white">W</span>
              <span className="font-display text-lg font-bold tracking-tight">WANDERLY</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-stone-500">
              Travel the world. Plan everything in one place — destinations, routes, entry requirements, budgets and itineraries.
            </p>
            <p className="mt-4 text-xs text-stone-400">
              Factual travel information on Wanderly carries source and verification metadata. Always confirm visas and entry rules with official government sources before travel.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-stone-600 transition hover:text-brand-700">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-stone-100 pt-6 text-xs text-stone-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Wanderly. Built as a scalable travel platform foundation.</p>
          <p>Photos via Pexels · Weather by Open-Meteo · FX rates via ECB/Frankfurter</p>
        </div>
      </div>
    </footer>
  );
}
