"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { ConversationSummary } from "@/types";

interface HistorySidebarProps {
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewChat: () => void;
}

export function HistorySidebar({
  activeConversationId,
  onSelectConversation,
  onNewChat,
}: HistorySidebarProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function loadConversations() {
    setError(null);
    const response = await fetch("/api/conversations");
    const payload = (await response.json()) as { conversations?: ConversationSummary[]; error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Failed to load conversations.");
      return;
    }

    setConversations(payload.conversations ?? []);
  }

  useEffect(() => {
    void loadConversations();
  }, [activeConversationId]);

  async function deleteConversation(conversationId: string) {
    setError(null);
    const response = await fetch(`/api/conversations/${conversationId}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Failed to delete conversation.");
      return;
    }

    await loadConversations();

    if (activeConversationId === conversationId) {
      onNewChat();
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <aside className="hidden w-[320px] shrink-0 border-r border-f1.line bg-black/55 backdrop-blur-xl lg:block">
      <div className="flex items-center justify-between gap-3 border-b border-f1.line px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl border border-f1.line bg-black/55">
            <img src="/logo.png" alt="f1GPT" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-white/60">Chats</p>
            <p className="text-sm font-black">f1GPT</p>
          </div>
        </div>

        <button
          type="button"
          onClick={signOut}
          className="rounded-xl border border-f1.line bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:border-f1.red"
        >
          Sign out
        </button>
      </div>

      <div className="p-4">
        <button
          type="button"
          onClick={() => startTransition(onNewChat)}
          disabled={isPending}
          className="w-full rounded-2xl bg-f1.red px-4 py-3 text-sm font-extrabold uppercase tracking-[0.2em] text-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
        >
          New chat
        </button>
      </div>

      <div className="px-2 pb-4">
        <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.34em] text-white/50">
          History
        </div>
        <div className="max-h-[calc(100vh-180px)] overflow-y-auto px-2">
          {conversations.length === 0 ? (
            <div className="rounded-2xl border border-f1.line bg-white/5 px-3 py-3 text-sm text-white/60">
              No chats yet.
            </div>
          ) : null}

          <ul className="space-y-2">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              return (
                <li key={conversation.id}>
                  <div
                    className={[
                      "group flex items-center justify-between gap-2 rounded-2xl border px-3 py-2 transition",
                      isActive
                        ? "border-f1.red/70 bg-gradient-to-b from-f1.red/15 to-black/40"
                        : "border-f1.line bg-white/5 hover:border-f1.red/60",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectConversation(conversation.id)}
                      className="min-w-0 flex-1 text-left"
                      title={conversation.title}
                    >
                      <p className="truncate text-sm font-semibold text-white">
                        {conversation.title || "New chat"}
                      </p>
                      <p className="mt-1 text-[11px] text-white/50">
                        {new Date(conversation.updated_at).toLocaleString()}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => void deleteConversation(conversation.id)}
                      className="rounded-xl border border-transparent bg-white/0 px-2 py-1 text-xs font-semibold text-white/60 opacity-0 transition hover:border-f1.line hover:bg-white/5 group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {error ? <p className="mt-3 px-2 text-sm text-red-300">{error}</p> : null}
      </div>
    </aside>
  );
}
