import type { Metadata } from "next";
import { AssistantChat } from "@/components/assistant-chat";

export const metadata: Metadata = {
  title: "AI travel assistant",
  description: "A grounded travel assistant that answers from verified data with sources — visas, weather, budgets, food and safety.",
};

export default function AssistantPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">AI travel assistant</h1>
      <p className="mt-2 text-sm leading-relaxed text-stone-500">
        Pipeline: your request → Wanderly database → verified travel information → real-time providers →
        answer with sources. The assistant is a reasoning layer, never a source of truth.
      </p>
      <div className="mt-6">
        <AssistantChat />
      </div>
    </div>
  );
}
