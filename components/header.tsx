import Link from "next/link";
import { ThemeSwitcher } from "./theme-switcher";
import { AuthButton } from "./auth-button";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "./ui/navigation-menu";
import { createClient } from "@/lib/supabase/server";
import { Button } from "./ui/button";

export async function Header() {

  const supabase = await createClient()

  const {data: { user }} = await supabase.auth.getUser()
  let profile;
  if (user) {
    const { data } = await supabase.from("user_profiles").select("credits").eq("id", user.id).single()
    profile = data;
  }

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
            {profile && (
              <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link href={"/"}>GALLERY</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem asChild className={navigationMenuTriggerStyle()}>
                  <Link href={"/credits"}>CREDITS</Link>
                </NavigationMenuItem>


                <NavigationMenuItem className="ml-10">
                  <span className="mr-3">Credits: <b className="text-lg">{profile?.credits}</b></span>
                  <Button asChild variant={'destructive'}>
                    <Link href={"/credits/top-up"}>TOP UP</Link>
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
