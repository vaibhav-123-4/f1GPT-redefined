import { ChatMessage } from "@/types";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? (
        <div className="mt-1 hidden h-9 w-9 shrink-0 place-items-center rounded-full border border-f1.line bg-black/60 sm:grid">
          <span className="text-[11px] font-black tracking-[0.18em] text-f1.red">PIT</span>
        </div>
      ) : null}

      <div
        className={[
          "max-w-[92%] rounded-2xl border px-4 py-3 shadow-lg sm:max-w-[75%]",
          isUser
            ? "border-f1.red/70 bg-gradient-to-b from-f1.red to-[#8A0300] text-f1.white shadow-glow"
            : "border-f1.line bg-black/45 text-f1.white backdrop-blur",
          isUser ? "sm:mr-0" : "sm:ml-3",
        ].join(" ")}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white/70">
            <span className={`h-2 w-2 rounded-full ${isUser ? "bg-white" : "bg-f1.red"}`} />
            {isUser ? "You" : "f1GPT"}
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
            {isUser ? "Radio" : "Telemetry"}
          </span>
        </div>

        <p className="message-copy whitespace-pre-wrap text-sm leading-6 sm:text-[15px]">
          {message.content}
        </p>
      </div>
    </div>
  );
}
