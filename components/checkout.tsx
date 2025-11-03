"use client";

import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCallback } from "react";
import { startCheckoutSession } from "@/app/actions/stripe";
import { onComplete } from "@/app/credits/checkout/actions";
import { NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY } from "@/lib/envs_public";

const stripePromise = loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function Checkout({ packageId }: { packageId: string }) {
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
          onComplete,
        }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
