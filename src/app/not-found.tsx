import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <p className="font-display text-7xl font-bold text-brand-200">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold">This place isn't on our map yet</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-500">
        The page you're looking for doesn't exist or has moved. Maybe it's a destination we haven't
        charted — our coverage grows every week.
      </p>
      <div className="mt-6 flex gap-2">
        <Link href="/" className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800">
          Back home
        </Link>
        <Link href="/explore" className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50">
          Explore destinations
        </Link>
      </div>
    </div>
  );
}
