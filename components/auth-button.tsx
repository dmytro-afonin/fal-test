"use client";

import type { JwtPayload } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "./logout-button";
import { Button } from "./ui/button";

export default function AuthButton() {
  const [user, setUser] = useState<JwtPayload | undefined>();
  useEffect(() => {
    async function getUser() {
      const supabase = createClient();

      // You can also use getUser() which will be slower.
      const { data } = await supabase.auth.getClaims();

      setUser(data?.claims);
    }
    getUser();
  }, []);

  return user ? (
    <div className="flex items-center gap-4">
      {user.email}
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant="default">
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
