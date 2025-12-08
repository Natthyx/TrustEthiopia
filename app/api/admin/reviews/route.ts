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
    // Fetch recent reviews with business and user info
    const { data: reviews, error } = await supabaseAdmin
      .from("reviews")
      .select(`
        id,
        rating,
        created_at,
        businesses(business_name),
        profiles(name)
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    // Process reviews data
    const processedReviews = reviews.map(review => ({
      id: review.id,
      business_name: review.businesses?.business_name || "Unknown Business",
      reviewer_name: review.profiles?.name || "Anonymous",
      rating: review.rating,
      status: "Published",
      created_at: review.created_at
    }));

    return NextResponse.json(processedReviews);
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}