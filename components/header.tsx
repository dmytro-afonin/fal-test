"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { useUser } from "@/hooks/useUser";
import AuthButton from "./auth-button";
import { ThemeSwitcher } from "./theme-switcher";
import { Button } from "./ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "./ui/navigation-menu";
import { Skeleton } from "./ui/skeleton";

export const runtime = "edge"; // 'nodejs' (default) | 'edge'

function UserData() {
  const query = useUser();

  if (!query.data?.user) {
    return null;
  }

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link href="/" className={navigationMenuTriggerStyle()} prefetch>
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

        {query.data?.user?.role === "admin" && (
          <>
            <NavigationMenuItem>
              <Link
                href="/admin/presets"
                className={navigationMenuTriggerStyle()}
                prefetch
              >
                PRESETS
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link
                href="/admin/pipelines"
                className={navigationMenuTriggerStyle()}
                prefetch
              >
                PIPELINES
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link
                href="/admin/users"
                className={navigationMenuTriggerStyle()}
                prefetch
              >
                USERS
              </Link>
            </NavigationMenuItem>
          </>
        )}

        <NavigationMenuItem className="ml-10">
          <span className="mr-3">
            Credits: <b className="text-lg">{query.data.user.credits}</b>
          </span>
          <Button variant="destructive">
            <Link href="/credits/top-up" prefetch>
              TOP UP
            </Link>
          </Button>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export default function Header() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full flex justify-between items-center py-3 px-5 text-sm">
        <div className="flex items-center font-semibold mr-2">
          <Link className="flex items-center" href={"/"}>
            <Image src="/logo.svg" alt="Deegva | AI" width={32} height={32} />
            <span>Deegva | AI</span>
          </Link>
        </div>
        <Suspense fallback={<Skeleton className="w-16 h-8" />}>
          <UserData />
        </Suspense>

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
