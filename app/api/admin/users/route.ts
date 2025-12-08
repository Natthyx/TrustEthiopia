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

  // 2. Fetch using service_role
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(`
      id,
      name,
      email,
      role,
      is_banned,
      created_at
    `)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Add review counts for each user
  const usersWithCounts = await Promise.all(
    data.map(async (user) => {
      const { count: reviewCount } = await supabaseAdmin
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('reviewer_id', user.id);
        
      return {
        ...user,
        review_count: reviewCount || 0
      };
    })
  );

  return NextResponse.json(usersWithCounts);
}