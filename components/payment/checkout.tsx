"use client";

import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { startCheckoutSession } from "@/app/actions/stripe";
import { NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY } from "@/lib/envs_public";

const stripePromise = loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function Checkout({ packageId }: { packageId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const startCheckoutSessionForPackage = useCallback(async () => {
    const clientSecret = await startCheckoutSession(packageId);

    if (!clientSecret) {
      throw new Error("Failed to get Stripe client secret");
    }

    return clientSecret;
  }, [packageId]);
  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{
          fetchClientSecret: startCheckoutSessionForPackage,
          onComplete: () => {
            console.log("invalidating user cache");
            queryClient.invalidateQueries({ queryKey: ["user"] });
            router.push("/");
          },
        }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
