import { Check } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CREDIT_PACKAGES } from "@/lib/credit-packages";
import { createClient } from "@/lib/supabase/server";

export default async function TopUpPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Top Up Credits</h1>
          <p className="text-muted-foreground">
            Choose a credit package that fits your needs
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className={pkg.popular ? "border-primary shadow-lg" : ""}
            >
              {pkg.popular && (
                <div className="flex justify-center pt-4">
                  <Badge>Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle>{pkg.name}</CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">
                    ${(pkg.priceInCents / 100).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {pkg.credits} credits
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ${((pkg.priceInCents / 100 / pkg.credits) * 100).toFixed(2)}{" "}
                    per 100 credits
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{pkg.credits} credits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Never expires</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>All pipelines</span>
                  </li>
                </ul>
                <Link href={`/credits/checkout?package=${pkg.id}`}>
                  <Button
                    className="w-full"
                    variant={pkg.popular ? "default" : "outline"}
                  >
                    Purchase
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
