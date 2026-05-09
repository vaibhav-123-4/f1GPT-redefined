import { redirect } from "next/navigation";
import { ChatUI } from "@/components/ChatUI";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEV_BUILD_ID } from "@/lib/devSession";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return <ChatUI devBuildId={DEV_BUILD_ID} />;
}
