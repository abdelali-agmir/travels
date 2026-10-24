"use client";

import { useEffect, useRef, useState } from "react";
import { Badge, ProviderNotice } from "@/components/ui";
import { cn } from "@/lib/utils-client";

type SourceRef = { name: string; url?: string; verifiedAt?: string | null; status?: string };
type Message = { role: "user" | "assistant"; text: string; sources?: SourceRef[]; suggestions?: string[] };
type Provider = { connected: boolean; provider: string; reason?: string };

function renderText(text: string) {
  // minimal markdown: **bold**, _italic_, bullet lines
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("_") && p.endsWith("_")) return <em key={i}>{p.slice(1, -1)}</em>;
    return <span key={i}>{p}</span>;
  });
}

export function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! I'm the Wanderly assistant. I answer from the platform's **verified travel database** — visa rules with official sources, live weather, budgets, food, safety and local phrases. I'll always show you where information comes from, and I'll say clearly when I don't know.",
      suggestions: [
        "Do Moroccan citizens need a visa for Japan?",
        "Weather in Tokyo",
        "What should I eat in Thailand?",
        "Daily budget in Paris",
        "Is Morocco safe?",
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState<Provider | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setProvider(data.provider);
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply.text, sources: data.reply.sources, suggestions: data.reply.suggestions }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Something went wrong on my side — please try that again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[480px] flex-col rounded-2xl border border-stone-200 bg-white shadow-[var(--shadow-card)]">
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%]", m.role === "user" ? "" : "flex gap-2.5")}>
              {m.role === "assistant" && (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white" aria-hidden>W</span>
              )}
              <div>
                <div
                  className={cn(
                    "whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    m.role === "user" ? "rounded-br-sm bg-brand-700 text-white" : "rounded-bl-sm bg-stone-100 text-stone-800",
                  )}
                >
                  {renderText(m.text)}
                </div>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {m.sources.map((s, j) => (
                      <span key={j} className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[10px] text-stone-500">
                        📎{" "}
                        {s.url ? (
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-stone-300 underline-offset-2 hover:text-brand-700">{s.name}</a>
                        ) : s.name}
                        {s.verifiedAt && <span>· verified {new Date(s.verifiedAt).toLocaleDateString("en-GB")}</span>}
                      </span>
                    ))}
                  </div>
                )}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.suggestions.map((s) => (
                      <button key={s} onClick={() => send(s)} className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs text-brand-700 transition hover:bg-brand-100">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white" aria-hidden>W</span>
            <div className="rounded-2xl rounded-bl-sm bg-stone-100 px-4 py-3">
              <span className="inline-flex gap-1">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400" style={{ animationDelay: `${d}ms` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-stone-100 p-4">
        {provider && !provider.connected && (
          <div className="mb-3">
            <ProviderNotice provider={provider.provider} reason={provider.reason ?? ""} />
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about visas, weather, budgets, food, safety…"
            className="h-12 min-w-0 flex-1 rounded-xl border border-stone-300 px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            aria-label="Message the assistant"
          />
          <button type="submit" disabled={busy || !input.trim()} className="h-12 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-50">
            Send
          </button>
        </form>
        <p className="mt-2 text-center text-[10px] text-stone-400">
          <Badge tone="green" className="mr-1">Grounded</Badge>
          Answers come from Wanderly's database and live providers — never from invented facts.
        </p>
      </div>
    </div>
  );
}
