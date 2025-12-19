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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // 1. Validate admin identity
  const admin = await isAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Await params to get the actual values
  const { id } = await params;
  
  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(body)
    .eq("id", id)
    .select(`
      id,
      name,
      email,
      role,
      is_banned,
      created_at,
      phone
    `);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(data);
}