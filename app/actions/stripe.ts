"use server";

import { CREDIT_PACKAGES } from "@/lib/credit-packages";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function startCheckoutSession(packageId: string) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const creditPackage = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!creditPackage) {
    throw new Error(`Credit package with id "${packageId}" not found`);
  }

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: creditPackage.name,
            description: creditPackage.description,
          },
          unit_amount: creditPackage.priceInCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      userId: user.id,
      credits: creditPackage.credits.toString(),
      packageId: creditPackage.id,
    },
  });

  return session.client_secret;
}

export async function getCheckoutSessionStatus(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return {
    status: session.status,
    customerEmail: session.customer_details?.email,
  };
}
