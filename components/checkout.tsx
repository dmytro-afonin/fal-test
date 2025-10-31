"use client"

import { useCallback } from "react"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { startCheckoutSession } from "@/app/actions/stripe"
import { useRouter } from "next/navigation"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function Checkout({ packageId }: { packageId: string }) {
  const router = useRouter();
  const startCheckoutSessionForPackage = useCallback(async () => {
    const clientSecret = await startCheckoutSession(packageId)
    
    if (!clientSecret) {
      throw new Error("Failed to get Stripe client secret")
    }

    return clientSecret
  }, [packageId])
  const onComplete = () => {
    window.location.href = '/'
  }

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret: startCheckoutSessionForPackage, onComplete }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
