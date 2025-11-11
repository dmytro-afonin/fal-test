import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { SUPABASE_SERVICE_ROLE_KEY } from "@/lib/envs";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/lib/envs_public";
import { createClient } from "@/lib/supabase/server";

const supabaseAdmin = createAdminClient(
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

// GET all users (admin only)
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all users with their profiles using admin client
    const { data: userProfiles, error } = await supabaseAdmin
      .from("user_profiles")
      .select("id, credits, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 },
      );
    }

    // Get emails for all users
    const usersWithEmail = await Promise.all(
      (userProfiles || []).map(async (userProfile) => {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
          userProfile.id,
        );
        return {
          id: userProfile.id,
          email: authUser?.user?.email || "Unknown",
          credits: userProfile.credits,
          role: userProfile.role || "user",
          created_at: userProfile.created_at,
        };
      }),
    );

    return NextResponse.json(usersWithEmail);
  } catch (error) {
    console.error("Error in users route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
