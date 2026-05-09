import { NextResponse } from "next/server";
import {
  createChatCompletion,
  ENGLISH_ONLY_GUARD,
  F1_SYSTEM_PROMPT,
  OpenRouterError,
} from "@/lib/openrouter";
import { executeTool, toolDefinitions } from "@/lib/tools";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ChatRequestBody, ChatResponseBody, OpenRouterMessage } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;

    // Auth required for persisted history.
    const supabase = await createSupabaseServerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "Messages are required." }, { status: 400 });
    }

    const conversationId = (body as any).conversationId as string | undefined;
    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required." }, { status: 400 });
    }

    const conversation: OpenRouterMessage[] = [
      {
        role: "system",
        content: `${F1_SYSTEM_PROMPT}\n\n${ENGLISH_ONLY_GUARD}`,
      },
      ...body.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ];

    const firstPass = await createChatCompletion({
      messages: conversation,
      tools: toolDefinitions as unknown as unknown[],
      toolChoice: "auto",
    });

    conversation.push(firstPass);

    if (firstPass.tool_calls?.length) {
      for (const toolCall of firstPass.tool_calls) {
        let toolData: unknown;
        try {
          toolData = await executeTool(toolCall.function.name, toolCall.function.arguments);
        } catch (toolError) {
          const toolMessage = toolError instanceof Error ? toolError.message : "Unknown tool error";
          toolData = { error: toolMessage };
        }

        conversation.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: JSON.stringify(toolData),
        });
      }

      const finalPass = await createChatCompletion({
        messages: conversation,
        tools: toolDefinitions as unknown as unknown[],
        toolChoice: "none",
      });

      const responseBody: ChatResponseBody = {
        message: {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            finalPass.content ??
            "I found the data, but I could not format a final answer. Please try again.",
        },
      };

      // Persist the last user message + assistant response.
      const lastUser = body.messages.filter((m) => m.role === "user").slice(-1)[0];
      const inserts = [
        lastUser
          ? {
              conversation_id: conversationId,
              user_id: userData.user.id,
              role: "user",
              content: lastUser.content,
            }
          : null,
        {
          conversation_id: conversationId,
          user_id: userData.user.id,
          role: "assistant",
          content: responseBody.message.content,
        },
      ].filter(Boolean) as any[];

      await supabase.from("messages").insert(inserts);

      // Update title on first exchange.
      const title = lastUser?.content?.slice(0, 48) ?? "New chat";
      await supabase
        .from("conversations")
        .update({ title })
        .eq("id", conversationId)
        .eq("user_id", userData.user.id)
        .eq("title", "New chat");

      return NextResponse.json(responseBody);
    }

    const responseBody: ChatResponseBody = {
      message: {
        id: crypto.randomUUID(),
        role: "assistant",
        content: firstPass.content ?? "I could not generate a response. Please try again.",
      },
    };

    const lastUser = body.messages.filter((m) => m.role === "user").slice(-1)[0];
    const inserts = [
      lastUser
        ? {
            conversation_id: conversationId,
            user_id: userData.user.id,
            role: "user",
            content: lastUser.content,
          }
        : null,
      {
        conversation_id: conversationId,
        user_id: userData.user.id,
        role: "assistant",
        content: responseBody.message.content,
      },
    ].filter(Boolean) as any[];

    await supabase.from("messages").insert(inserts);

    const title = lastUser?.content?.slice(0, 48) ?? "New chat";
    await supabase
      .from("conversations")
      .update({ title })
      .eq("id", conversationId)
      .eq("user_id", userData.user.id)
      .eq("title", "New chat");

    return NextResponse.json(responseBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";

    // Avoid returning 500 for common upstream issues like rate limiting.
    if (error instanceof OpenRouterError) {
      const isRateLimited = error.status === 429;
      const status = isRateLimited ? 503 : 502;

      return NextResponse.json(
        {
          error: isRateLimited ? "OpenRouter is rate-limiting right now." : "OpenRouter request failed.",
          details: error.message,
        },
        { status },
      );
    }

    return NextResponse.json(
      {
        error: "Unable to process chat request.",
        details: message,
      },
      { status: 500 },
    );
  }
}
