import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/* ── Badge ── */
const badgeTones: Record<string, string> = {
  neutral: "bg-stone-100 text-stone-700 border-stone-200",
  brand: "bg-brand-50 text-brand-700 border-brand-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
  blue: "bg-sky-50 text-sky-700 border-sky-200",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof badgeTones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ── Verification / source badge ── */
export function VerificationBadge({ status }: { status: string }) {
  const map: Record<string, { tone: keyof typeof badgeTones; label: string; icon: string }> = {
    verified: { tone: "green", label: "Verified", icon: "✓" },
    needs_review: { tone: "amber", label: "Needs review", icon: "⟳" },
    expired: { tone: "red", label: "Expired", icon: "!" },
    disputed: { tone: "red", label: "Disputed", icon: "⚑" },
  };
  const v = map[status] ?? map.needs_review;
  return (
    <Badge tone={v.tone}>
      <span aria-hidden>{v.icon}</span> {v.label}
    </Badge>
  );
}

export function SourceLine({
  name,
  url,
  checkedAt,
  status,
  className,
}: {
  name: string;
  url?: string | null;
  checkedAt?: Date | string | null;
  status?: string | null;
  className?: string;
}) {
  const dateStr = checkedAt
    ? new Date(checkedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;
  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500", className)}>
      <span>
        Source:{" "}
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="underline decoration-stone-300 underline-offset-2 hover:text-brand-700">
            {name}
          </a>
        ) : (
          name
        )}
      </span>
      {dateStr && <span aria-hidden>·</span>}
      {dateStr && <span>Last checked {dateStr}</span>}
      {status && <VerificationBadge status={status} />}
    </div>
  );
}

/* ── Section heading ── */
export function SectionHeading({
  title,
  subtitle,
  action,
  as: Tag = "h2",
}: {
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <Tag className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</Tag>
        {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="hidden shrink-0 text-sm font-medium text-brand-700 hover:text-brand-800 sm:block"
        >
          {action.label} →
        </Link>
      )}
    </div>
  );
}

/* ── Buttons (link + button share styles) ── */
export const buttonStyles = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 active:bg-brand-900 disabled:opacity-50 disabled:cursor-not-allowed",
  accent:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-600 disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-stone-400 hover:bg-stone-50 disabled:opacity-50",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-ink",
  small:
    "inline-flex items-center justify-center gap-1.5 rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 transition hover:border-brand-400 hover:text-brand-700 disabled:opacity-50",
};

/* ── Empty state ── */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white/60 px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-2xl" aria-hidden>
        {icon}
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-stone-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ── Skeletons ── */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-stone-200 bg-white", className)}>
      <div className="skeleton h-40 w-full" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

export function SkeletonLines({ n = 3 }: { n?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="skeleton h-4 rounded" style={{ width: `${85 - i * 12}%` }} />
      ))}
    </div>
  );
}

/* ── Stat ── */
export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-[var(--shadow-card)]">
      <p className="text-xs font-medium uppercase tracking-wider text-stone-400">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

/* ── "Not connected" provider panel ── */
export function ProviderNotice({
  provider,
  reason,
}: {
  provider: string;
  reason: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4">
      <span className="mt-0.5 text-lg" aria-hidden>🔌</span>
      <div>
        <p className="text-sm font-semibold text-stone-700">
          {provider} — <span className="text-stone-500">not connected</span>
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-stone-500">{reason}</p>
      </div>
    </div>
  );
}

/* ── Data-sample notice ── */
export function SampleDataBadge() {
  return (
    <Badge tone="blue" className="normal-case">
      Sample dataset · not global coverage yet
    </Badge>
  );
}
