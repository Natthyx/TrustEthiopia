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

  // 2. Fetch businesses with owner info
  const { data: businessesData, error: businessesError } = await supabaseAdmin
    .from("businesses")
    .select(`
      id,
      business_name,
      business_owner_id,
      is_banned,
      created_at
    `)
    .order('created_at', { ascending: false });

  if (businessesError) {
    return NextResponse.json({ error: businessesError.message }, { status: 500 });
  }

  // Process businesses data
  const processedBusinesses = await Promise.all(
    businessesData.map(async (business) => {
      // Get owner profile
      const { data: ownerProfile, error: ownerError } = await supabaseAdmin
        .from('profiles')
        .select('name, email')
        .eq('id', business.business_owner_id)
        .single();

      // Get document count
      const { count: documentCount } = await supabaseAdmin
        .from('business_documents')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id);

      // Get business categories
      const { data: businessCategories, error: categoriesError } = await supabaseAdmin
        .from('business_categories')
        .select('category:categories(name)')
        .eq('business_id', business.id);

      // Get primary category
      const categoryName = businessCategories?.[0]?.category?.name || "Uncategorized";

      return {
        id: business.id,
        business_name: business.business_name,
        category_name: categoryName,
        owner_name: ownerProfile?.name || "Unknown",
        owner_email: ownerProfile?.email || "Unknown",
        is_banned: business.is_banned,
        created_at: business.created_at,
        document_count: documentCount || 0
      };
    })
  );

  return NextResponse.json(processedBusinesses);
}