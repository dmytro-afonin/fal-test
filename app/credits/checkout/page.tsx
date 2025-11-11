import { redirect } from "next/navigation";
import Checkout from "@/components/payment/checkout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CREDIT_PACKAGES } from "@/lib/credit-packages";
import { createClient } from "@/lib/supabase/server";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ package?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const packageId = params.package;
  if (!packageId) {
    redirect("/credits/top-up");
  }

  const creditPackage = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!creditPackage) {
    redirect("/credits/top-up");
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Your Purchase</h1>
          <p className="text-muted-foreground">
            You&apos;re purchasing {creditPackage.credits} credits for $
            {(creditPackage.priceInCents / 100).toFixed(2)}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Checkout packageId={packageId} />
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review your purchase</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Package</span>
                  <span className="text-sm font-medium">
                    {creditPackage.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Credits</span>
                  <span className="text-sm font-medium">
                    {creditPackage.credits}
                  </span>
                </div>
                <div className="border-t pt-4 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold">
                    ${(creditPackage.priceInCents / 100).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
