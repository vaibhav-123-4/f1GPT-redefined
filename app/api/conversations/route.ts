import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only show conversations that actually have at least one message.
  // This avoids sidebar spam from unused "New chat" rows.
  const { data, error } = await supabase
    .from("conversations")
    .select("id,title,created_at,updated_at,messages!inner(id)")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const conversations = (data ?? []).map(({ messages, ...c }: any) => c);
  return NextResponse.json({ conversations });
}

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: userData.user.id,
      title: "New chat",
    })
    .select("id,title,created_at,updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversation: data });
}
