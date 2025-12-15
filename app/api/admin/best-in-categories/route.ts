import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@supabase/supabase-js"
import { Database } from "@/lib/supabase/database.types"
import { NextResponse } from "next/server"

// Ensure only admins can call this
async function isAdmin(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return false

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
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false
  
  // Check if user is admin by checking their profile
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  return !error && profile?.role === "admin"
}

export async function GET(req: Request) {
  // 1. Validate admin identity
  const admin = await isAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // 2. Fetch featured subcategories entries
  const { data, error } = await supabaseAdmin
    .from("featured_subcategories")
    .select(`
      *,
      subcategories(
        name,
        categories(
          name
        )
      )
    `)
    .order('created_at')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: Request) {
  // 1. Validate admin identity
  const admin = await isAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // 2. Get request body
  const body = await req.json()

  // 3. Insert new featured subcategory entry
  const { data, error } = await supabaseAdmin
    .from("featured_subcategories")
    .insert(body)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(req: Request) {
  // 1. Validate admin identity
  const admin = await isAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // 2. Get request body
  const body = await req.json()
  const { id, ...updateData } = body

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 })
  }

  // 3. Update featured subcategory entry
  const { data, error } = await supabaseAdmin
    .from("featured_subcategories")
    .update(updateData)
    .eq("id", id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  // 1. Validate admin identity
  const admin = await isAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // 2. Get ID from query parameters
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 })
  }

  // 3. Delete featured subcategory entry
  const { error } = await supabaseAdmin
    .from("featured_subcategories")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: "Successfully deleted" })
}