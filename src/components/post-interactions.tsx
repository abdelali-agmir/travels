"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { cn, timeAgo } from "@/lib/utils-client";

type Comment = { id: number; body: string; createdAt: string; user: { id: number; name: string } };

export function PostInteractions({
  postId,
  initialLikes,
  initialLiked,
  initialComments,
  signedIn,
}: {
  postId: number;
  initialLikes: number;
  initialLiked: boolean;
  initialComments: Comment[];
  signedIn: boolean;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const { error, success } = useToast();
  const router = useRouter();

  async function toggleLike() {
    if (!signedIn) {
      router.push(`/login?next=/community/${postId}`);
      return;
    }
    setLiked(!liked);
    setLikes((l) => l + (liked ? -1 : 1));
    const res = await fetch(`/api/community/posts/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like" }),
    });
    if (!res.ok) {
      setLiked(liked);
      setLikes((l) => l + (liked ? 1 : -1));
      error("Couldn't update like");
    }
  }

  async function comment(e: React.FormEvent) {
    e.preventDefault();
    if (!signedIn) {
      router.push(`/login?next=/community/${postId}`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/community/posts/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", body: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        error("Couldn't post comment", data.error);
        return;
      }
      setComments((prev) => [...prev, data.comment]);
      setText("");
      success("Comment posted");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      success("Link copied", "Share it anywhere.");
    } catch {
      error("Couldn't copy link");
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 border-y border-stone-100 py-3">
        <button
          onClick={toggleLike}
          aria-pressed={liked}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition",
            liked ? "border-accent-500 bg-accent-500/10 text-accent-600" : "border-stone-300 text-stone-600 hover:border-accent-400 hover:text-accent-600",
          )}
        >
          {liked ? "♥" : "♡"} {likes}
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3.5 py-2 text-sm text-stone-500">
          💬 {comments.length}
        </span>
        <button onClick={share} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3.5 py-2 text-sm font-medium text-stone-600 transition hover:border-brand-400 hover:text-brand-700">
          ↗ Share
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
              {c.user.name.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1 rounded-xl bg-stone-50 px-3.5 py-2.5">
              <p className="text-xs font-semibold">
                {c.user.name} <span className="ml-1 font-normal text-stone-400">{timeAgo(c.createdAt)}</span>
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-stone-700">{c.body}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={comment} className="mt-5 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={signedIn ? "Add a helpful comment…" : "Sign in to comment"}
          required
          minLength={2}
          className="h-11 min-w-0 flex-1 rounded-lg border border-stone-300 px-3.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          aria-label="Comment"
        />
        <button type="submit" disabled={busy} className="h-11 rounded-lg bg-brand-700 px-5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-50">
          Reply
        </button>
      </form>
    </div>
  );
}
