'use server'

import { ThemeSwitcher } from "@/components/theme-switcher";
import { AuthButton } from "@/components/auth-button";
import Link from "next/link";
import { fal } from "@fal-ai/client";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

fal.config({
  proxyUrl: "/api/fal/proxy",
});

export default async function Home() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Deegva | AI</Link>
            </div>
            <ThemeSwitcher/>
            <AuthButton />
          </div>
        </nav>

        <Button asChild size="sm" variant={"default"}>
          <Link href="/protected">Pipelines</Link>
        </Button>
        
        {!user && <h1>Login to use app</h1>}
      </div>
    </div>
  );
}
