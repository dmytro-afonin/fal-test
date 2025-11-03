"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AuthButton from "./auth-button";
import { ThemeSwitcher } from "./theme-switcher";
import { Button } from "./ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "./ui/navigation-menu";

interface Profile {
  credits: number;
}

export default function Header() {
  const [user, setUser] = useState<Profile | undefined | null>(null);
  useEffect(() => {
    async function getUser() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      let profile: Profile | null = null;
      if (user) {
        const { data } = await supabase
          .from("user_profiles")
          .select("credits")
          .eq("id", user.id)
          .single();
        profile = data;
      }
      setUser(profile);
    }

    getUser();
  }, []);

  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full flex justify-between items-center py-3 px-5 text-sm">
        <div className="flex items-center font-semibold mr-2">
          <Link className="flex items-center" href={"/"}>
            <Image src="/logo.svg" alt="Deegva | AI" width={32} height={32} />
            <span>Deegva | AI</span>
          </Link>
        </div>

        {user && (
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link
                  href="/"
                  className={navigationMenuTriggerStyle()}
                  prefetch
                >
                  GALLERY
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link
                  href="/credits"
                  className={navigationMenuTriggerStyle()}
                  prefetch
                >
                  CREDITS
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem className="ml-10">
                <span className="mr-3">
                  Credits: <b className="text-lg">{user?.credits}</b>
                </span>
                <Button variant="destructive">
                  <Link href="/credits/top-up" prefetch>
                    TOP UP
                  </Link>
                </Button>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        )}

        <div className="flex items-center">
          <div className="mr-2">
            <AuthButton />
          </div>
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
}
