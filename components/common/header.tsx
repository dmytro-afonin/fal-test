"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import AuthButton from "../auth/auth-button";
import { ThemeSwitcher } from "./theme-switcher";

export const runtime = "edge"; // 'nodejs' (default) | 'edge'

function UserAvatar() {
  const query = useUser();
  const router = useRouter();

  if (!query.data?.user) {
    return null;
  }

  const user = query.data.user;
  const firstLetter = user.email?.[0]?.toUpperCase() || "U";

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="User menu"
        >
          {firstLetter}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer"
          variant="destructive"
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserData() {
  const query = useUser();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!query.data?.user) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/studio" || path === "/") {
      return pathname === "/studio" || pathname === "/";
    }
    if (path === "/admin") {
      // Don't mark admin as active - it's a dropdown, not a direct link
      return false;
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const navLinks = [{ href: "/studio", label: "STUDIO" }];

  return (
    <>
      {/* Desktop Navigation */}
      <NavigationMenu
        className="hidden md:flex"
        viewport={false}
        delayDuration={0}
      >
        <NavigationMenuList>
          {navLinks.map((link) => (
            <NavigationMenuItem key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  navigationMenuTriggerStyle(),
                  isActive(link.href) && "bg-accent text-accent-foreground",
                )}
                prefetch
              >
                {link.label}
              </Link>
            </NavigationMenuItem>
          ))}

          {query.data?.user?.role === "admin" && (
            <NavigationMenuItem>
              <NavigationMenuTrigger className={navigationMenuTriggerStyle()}>
                ADMIN
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[200px] gap-1 p-2">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/admin/presets"
                        className="block select-none rounded-sm px-3 py-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        prefetch
                      >
                        Presets
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/admin/pipelines"
                        className="block select-none rounded-sm px-3 py-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        prefetch
                      >
                        Pipelines
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/admin/users"
                        className="block select-none rounded-sm px-3 py-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        prefetch
                      >
                        Users
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          )}
        </NavigationMenuList>
      </NavigationMenu>

      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-background border-b z-50 md:hidden">
          <nav className="flex flex-col p-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}

            {query.data?.user?.role === "admin" && (
              <div className="pt-2 border-t mt-2">
                <p className="px-4 py-2 text-sm font-semibold text-muted-foreground">
                  ADMIN
                </p>
                <Link
                  href="/admin/presets"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  Presets
                </Link>
                <Link
                  href="/admin/pipelines"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  Pipelines
                </Link>
                <Link
                  href="/admin/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  Users
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}

export default function Header() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 relative">
      <div className="w-full flex justify-between items-center py-3 px-5 text-sm">
        <div className="flex items-center font-semibold mr-2">
          <Link className="flex items-center" href={"/studio"}>
            <Image src="/logo.svg" alt="Deegva | AI" width={32} height={32} />
            <span className="hidden sm:inline">Deegva | AI</span>
          </Link>
        </div>
        <Suspense fallback={<Skeleton className="w-16 h-8" />}>
          <UserData />
        </Suspense>

        <div className="flex items-center gap-2">
          <Suspense fallback={<Skeleton className="h-9 w-9 rounded-md" />}>
            <UserAvatar />
          </Suspense>
          <AuthButton />
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
}
