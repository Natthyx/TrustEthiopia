import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/database.types";
import { NextResponse } from "next/server";

// Ensure only admins can call this
async function isAdmin(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return false;

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { 
      global: { 
        headers: { 
          Authorization: `Bearer ${token}` 
        } 
      } 
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;
  
  // Check if user is admin by checking their profile
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return !error && profile?.role === "admin";
}

export async function GET(req: Request) {
  // 1. Validate admin identity
  const admin = await isAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Fetch user statistics
    const { count: userCount, error: userError } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "user");

    if (userError) throw userError;

    // Fetch business statistics
    const { count: businessCount, error: businessError } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "business");

    if (businessError) throw businessError;

    // Fetch review statistics for this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const { count: reviewCount, error: reviewError } = await supabaseAdmin
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneWeekAgo.toISOString());

    if (reviewError) throw reviewError;

    // Return statistics
    return NextResponse.json({
      users: userCount || 0,
      businesses: businessCount || 0,
      reviewsThisWeek: reviewCount || 0
    });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}