'use client'

import Link from "next/link";
import { ThemeSwitcher } from "./theme-switcher";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, navigationMenuTriggerStyle } from "./ui/navigation-menu";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import AuthButton from "./auth-button";

export default function Header() {
  const [user, setUser] = useState<{credits: number} | undefined | null>(null);
  useEffect(() => {
    async function getUser() {
      const supabase = createClient()

      const {data: { user }} = await supabase.auth.getUser()
      let profile;
      if (user) {
        const { data } = await supabase.from("user_profiles").select("credits").eq("id", user.id).single()
        profile = data;
      }
      setUser(profile);
    }

    getUser();

  }, [])

  return (
    <header>
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full flex justify-between items-center py-3 px-5 text-sm">
            <div className="flex items-center font-semibold mr-2">
              <Link className="flex items-center" href={"/"}>
                <img src={'/logo.svg'} width={'32px'} height={'32px'} />
                <span>Deegva | AI</span>
              </Link>
            </div>

            {user && (
              <NavigationMenu>
              <NavigationMenuList>
                  <NavigationMenuItem>
                      <Link href="/" className={navigationMenuTriggerStyle()} prefetch>GALLERY</Link>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                      <Link href="/credits" className={navigationMenuTriggerStyle()} prefetch>CREDITS</Link>
                  </NavigationMenuItem>

                <NavigationMenuItem className="ml-10">
                    <span className="mr-3">Credits: <b className="text-lg">{user?.credits}</b></span>
                    <Button variant='destructive'>
                      <Link href="/credits/top-up" prefetch>TOP UP</Link>
                    </Button>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            )}

            <div className="flex items-center">
              <div className="mr-2">
                <AuthButton />
              </div>
              <ThemeSwitcher/>
            </div>
          </div>
        </nav>
    </header>
  );
}
