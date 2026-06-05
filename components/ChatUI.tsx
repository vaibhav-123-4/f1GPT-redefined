"use client";

import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { MessageBubble } from "@/components/MessageBubble";
import { HistorySidebar } from "@/components/HistorySidebar";
import { ChatMessage, ChatResponseBody } from "@/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const starterMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "f1GPT online. Ask about standings, drivers, constructors, or the last Grand Prix and I’ll fetch verified F1 data when needed.",
  },
];

const promptChips = [
  "Who won the last race?",
  "Current driver standings",
  "Tell me about Verstappen",
  "Constructor championship table",
];

interface ChatUIProps {
  devBuildId: string | null;
}

export function ChatUI({ devBuildId }: ChatUIProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    if (!devBuildId) {
      return;
    }

    const key = "f1gpt:devBuildId";
    window.localStorage.setItem(key, devBuildId);
    // Note: Dev logout on restart disabled to prevent session loss during development
  }, [devBuildId]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isPending]);

  useEffect(() => {
    // Intentionally do not create a conversation until the user sends a message.
  }, []);

  async function loadConversation(nextConversationId: string) {
    setError(null);
    setIsHistoryLoading(true);
    try {
      const response = await fetch(`/api/conversations/${nextConversationId}/messages`);
      const payload = (await response.json()) as {
        messages?: Array<{ id: string; role: "user" | "assistant"; content: string }>;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load conversation.");
      }

      const loadedMessages: ChatMessage[] = (payload.messages ?? []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      }));

      setConversationId(nextConversationId);
      setMessages(loadedMessages.length ? loadedMessages : starterMessages);
    } finally {
      setIsHistoryLoading(false);
    }
  }

  async function newChat() {
    setError(null);
    setConversationId(null);
    setMessages(starterMessages);
  }

  function appendUserMessage(content: string) {
    const trimmed = content.trim();

    if (!trimmed) {
      return null;
    }

    const nextMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((currentMessages) => [...currentMessages, nextMessage]);
    setInput("");
    setError(null);

    return nextMessage;
  }

  async function submitMessage(content: string) {
    const userMessage = appendUserMessage(content);

    if (!userMessage) {
      return;
    }

    startTransition(async () => {
      try {
        let activeConversationId = conversationId;
        if (!activeConversationId) {
          const response = await fetch("/api/conversations", { method: "POST" });
          const payload = (await response.json()) as {
            conversation?: { id: string };
            error?: string;
          };

          if (!response.ok || !payload.conversation?.id) {
            throw new Error(payload.error ?? "Failed to create conversation");
          }

          activeConversationId = payload.conversation.id;
          setConversationId(activeConversationId);
        }

        const history = [...messages, userMessage].map(({ id, ...message }) => ({ id, ...message }));
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages: history, conversationId: activeConversationId }),
        });

        const payload = (await response.json()) as ChatResponseBody & {
          error?: string;
          details?: string;
        };

        if (!response.ok || !payload.message) {
          if (response.status === 401) {
            window.location.href = "/login";
            return;
          }
          throw new Error(payload.details || payload.error || "Chat request failed.");
        }

        setMessages((currentMessages) => [...currentMessages, payload.message]);
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Something went wrong while contacting race control.";

        setError(message);
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "I hit an issue fetching verified F1 data. Please try again in a moment.",
          },
        ]);
      }
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage(input);
  }

  return (
    <main className="relative min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 f1-grid opacity-[0.20]" aria-hidden="true" />

      <div className="f1-panel f1-corners mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl overflow-hidden rounded-[28px] border border-f1.line bg-black/35 shadow-glow backdrop-blur-xl">
        <HistorySidebar
          activeConversationId={conversationId}
          onSelectConversation={(id) => void loadConversation(id)}
          onNewChat={() => void newChat()}
        />

        <div className="grid flex-1 grid-rows-[auto,auto,1fr,auto]">
        <header className="relative border-b border-f1.line px-5 py-4 sm:px-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-f1.red to-transparent" />
          <div className="absolute left-0 top-0 h-1 w-[140px] f1-checker opacity-70" aria-hidden="true" />
          <div className="absolute right-0 top-0 h-1 w-[140px] f1-checker opacity-40" aria-hidden="true" />

          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-[22px] border border-f1.line bg-black/55 shadow-glow sm:h-20 sm:w-20">
              {/* You will provide this file: public/logo.png */}
              <img src="/logo.png" alt="f1GPT" className="h-full w-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">f1GPT</h1>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.34em] text-white/60">
                Formula 1 Chat
              </p>
              <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.26em] text-white/50">
                <span className="h-2 w-2 rounded-full bg-f1.red" />
                Race Radio
                <span className="h-[10px] w-px bg-white/15" aria-hidden="true" />
                Pit Wall Tools
              </div>
            </div>
          </div>
        </header>

        <section className="border-b border-f1.line px-5 py-3 sm:px-8">
          <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2">
            {promptChips.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void submitMessage(prompt)}
                className="rounded-full border border-f1.line bg-white/5 px-3 py-1.5 text-sm font-semibold text-white transition hover:border-f1.red hover:bg-f1.red hover:shadow-glow"
              >
                {prompt}
              </button>
            ))}
          </div>
        </section>

        <section
          ref={listRef}
          className="space-y-4 overflow-y-auto px-5 py-6 sm:px-8"
        >
          {isHistoryLoading ? (
            <div className="rounded-2xl border border-f1.line bg-black/35 px-4 py-3 text-sm text-white/70">
              Loading chat history...
            </div>
          ) : null}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isPending ? (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-f1.line bg-black/35 px-4 py-3 backdrop-blur">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white/70">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-f1.red" />
                  f1GPT
                </div>
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white/80 [animation-delay:-0.3s]" />
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white/80 [animation-delay:-0.15s]" />
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-white/80" />
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <footer className="relative border-t border-f1.line bg-black/30 px-5 py-4 sm:px-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" aria-hidden="true" />
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="sr-only" htmlFor="chat-input">
                  Ask an F1 question
                </label>
                <textarea
                  id="chat-input"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask anything Formula 1..."
                  rows={2}
                  className="min-h-[64px] w-full resize-none rounded-2xl border border-f1.line bg-black/55 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-f1.red focus:shadow-glow"
                />
              </div>
              <button
                type="submit"
                disabled={isPending || !input.trim()}
                className="rounded-2xl bg-f1.red px-7 py-4 text-sm font-extrabold uppercase tracking-[0.2em] text-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>

            <div className="flex flex-col gap-2 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
              <p>For factual queries, f1GPT uses F1 APIs before answering.</p>
              {error ? <p className="text-red-300">{error}</p> : null}
            </div>
          </form>
        </footer>
        </div>
      </div>
    </main>
  );
}
