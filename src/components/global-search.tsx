"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SearchResult = {
  kind: string;
  label: string;
  sublabel: string;
  href: string;
  emoji: string;
};

const POPULAR = ["Tokyo", "Paris", "Marrakech", "Bangkok", "Istanbul", "Rome"];

export function GlobalSearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [highlighted, setHighlighted] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setError("");
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    try {
      const saved = JSON.parse(
        localStorage.getItem("wanderly_recent_searches") ?? "[]",
      );

      if (Array.isArray(saved)) {
        setRecent(saved.filter((x): x is string => typeof x === "string"));
      }
    } catch {
      setRecent([]);
    }

    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const value = query.trim();

    if (!value) {
      setResults([]);
      setError("");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(value)}`,
          {
            method: "GET",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Search request failed: ${response.status}`);
        }

        const data = await response.json();

        if (cancelled) return;

        const nextResults = Array.isArray(data.results)
          ? data.results
          : [];

        setResults(nextResults);
        setHighlighted(0);
      } catch (err) {
        if (cancelled) return;

        console.error("Wanderly search error:", err);
        setResults([]);
        setError("Search is temporarily unavailable. Please try again.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const remember = useCallback((term: string) => {
    try {
      const previous = JSON.parse(
        localStorage.getItem("wanderly_recent_searches") ?? "[]",
      );

      const previousList = Array.isArray(previous)
        ? previous.filter((x): x is string => typeof x === "string")
        : [];

      const next = [
        term,
        ...previousList.filter((item) => item !== term),
      ].slice(0, 6);

      localStorage.setItem(
        "wanderly_recent_searches",
        JSON.stringify(next),
      );

      setRecent(next);
    } catch {
      // Ignore localStorage errors.
    }
  }, []);

  const go = useCallback(
    (result: SearchResult) => {
      remember(result.label);
      onClose();
      router.push(result.href);
    },
    [remember, onClose, router],
  );

  useEffect(() => {
    if (!open) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (!results.length) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlighted((current) =>
          Math.min(current + 1, results.length - 1),
        );
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlighted((current) =>
          Math.max(current - 1, 0),
        );
      }

      if (event.key === "Enter") {
        event.preventDefault();

        const selected = results[highlighted];

        if (selected) {
          go(selected);
        }
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [open, results, highlighted, go, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-ink/40 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Global search"
    >
      <div
        className="animate-rise w-full max-w-xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-stone-100 px-4">
          <span
            aria-hidden
            className="text-stone-400"
          >
            🔍
          </span>

          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search countries, cities, airports, hotels, attractions…"
            className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-stone-400"
            aria-label="Search"
            autoComplete="off"
          />

          <kbd className="hidden rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[10px] text-stone-400 sm:block">
            ESC
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {loading && (
            <div className="space-y-2 p-2">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="skeleton h-12 rounded-lg"
                />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="px-4 py-8 text-center">
              <div className="mb-2 text-2xl">⚠️</div>

              <p className="text-sm font-medium text-ink">
                Search could not be completed
              </p>

              <p className="mt-1 text-xs text-stone-500">
                {error}
              </p>

              <button
                type="button"
                onClick={() => setQuery((current) => `${current} `)}
                className="mt-4 rounded-lg bg-brand-700 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-800"
              >
                Try again
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            query &&
            results.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-stone-500">
                No results for “{query}”.
              </p>
            )}

          {!loading &&
            !error &&
            results.length > 0 &&
            results.map((result, index) => (
              <button
                key={`${result.href}-${index}`}
                type="button"
                onClick={() => go(result)}
                onMouseEnter={() => setHighlighted(index)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                  index === highlighted
                    ? "bg-brand-50"
                    : "hover:bg-stone-50"
                }`}
              >
                <span
                  className="text-lg"
                  aria-hidden
                >
                  {result.emoji}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">
                    {result.label}
                  </span>

                  <span className="block truncate text-xs text-stone-500">
                    {result.sublabel}
                  </span>
                </span>

                <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-500">
                  {result.kind}
                </span>
              </button>
            ))}
          
          {!query && !loading && !error && (
            <div className="p-2">
              {recent.length > 0 && (
                <>
                  <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Recent
                  </p>

                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {recent.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setQuery(item)}
                        className="rounded-full border border-stone-200 px-3 py-1 text-xs text-stone-600 transition hover:border-brand-300 hover:text-brand-700"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Popular
              </p>

              <div className="flex flex-wrap gap-1.5">
                {POPULAR.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setQuery(item)}
                    className="rounded-full border border-stone-200 px-3 py-1 text-xs text-stone-600 transition hover:border-brand-300 hover:text-brand-700"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="mt-4 border-t border-stone-100 pt-3">
                <Link
                  href="/explore"
                  onClick={onClose}
                  className="block px-1 text-xs font-medium text-brand-700 hover:underline"
                >
                  Browse all destinations →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}