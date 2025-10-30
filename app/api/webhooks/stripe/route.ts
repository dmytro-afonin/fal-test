import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import type Stripe from "stripe"

// Use service role key for admin operations
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  const body = await request.text();

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const credits = Number.parseInt(session.metadata?.credits || "0");
    const packageId = session.metadata?.packageId;

    if (!userId || !credits) {
      console.error("Missing metadata in checkout session:", session.id)
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
    }

    console.log("Processing payment for user:", userId, "credits:", credits)

    // Add credits to user account
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from("user_profiles")
      .select("credits")
      .eq("id", userId)
      .single()

    if (fetchError) {
      console.error("Error fetching user profile:", fetchError)
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }

    const newCredits = (profile?.credits || 0) + credits

    const { error: updateError } = await supabaseAdmin
      .from("user_profiles")
      .update({ credits: newCredits, updated_at: new Date().toISOString() })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating credits:", updateError)
      return NextResponse.json({ error: "Failed to update credits" }, { status: 500 })
    }

    await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      type: "purchase",
      amount: credits,
      balance_after: newCredits,
      description: `Credit purchase - ${packageId}`,
      metadata: {
        stripe_session_id: session.id,
        package_id: packageId,
        amount_paid: session.amount_total,
      },
    })

    console.log("Successfully added", credits, "credits to user", userId, "New balance:", newCredits)
  }

  return NextResponse.json({ received: true })
}
