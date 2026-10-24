"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <p className="text-5xl" aria-hidden>🧭</p>
      <h1 className="mt-4 font-display text-2xl font-semibold">We hit some turbulence</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-500">
        Something went wrong on our side — no technical mess, just a clean retry. If it keeps happening,
        the team has already been notified.
      </p>
      <div className="mt-6 flex gap-2">
        <button onClick={reset} className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800">
          Try again
        </button>
        <a href="/" className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50">
          Back home
        </a>
      </div>
    </div>
  );
}
