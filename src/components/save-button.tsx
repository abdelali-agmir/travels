"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils-client";

export function SaveButton({
  placeId,
  cityId,
  initialSaved = false,
  className,
  label = true,
}: {
  placeId?: number;
  cityId?: number;
  initialSaved?: boolean;
  className?: string;
  label?: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const { success, error } = useToast();
  const router = useRouter();

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId, cityId }),
      });
      if (res.status === 401) {
        error("Sign in to save places");
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(data.saved);
      if (data.saved) success("Saved", "Find it in your Saved collection.");
    } catch {
      error("Couldn't update saved state");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition",
        saved
          ? "border-accent-500 bg-accent-500/10 text-accent-600"
          : "border-stone-300 bg-white text-stone-600 hover:border-accent-400 hover:text-accent-600",
        className,
      )}
    >
      <span aria-hidden>{saved ? "♥" : "♡"}</span>
      {label && (saved ? "Saved" : "Save")}
    </button>
  );
}
