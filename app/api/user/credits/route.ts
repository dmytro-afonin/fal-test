import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile with credits
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("credits")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("[v0] Error fetching user profile:", profileError)
      return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 })
    }

    return NextResponse.json({ credits: profile.credits })
  } catch (error) {
    console.error("[v0] Error in credits route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
