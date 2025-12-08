import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Create a service role client for admin operations
const createAdminClient = () => {
  // This uses the service_role key which bypasses RLS
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/admin/categories - Fetch all categories and subcategories
export async function GET() {
  try {
    // Create admin client that bypasses RLS
    const supabase = createAdminClient()
    
    // Fetch categories with icon and bg_color
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, icon, bg_color, created_at')
      .order('name')
    
    if (categoriesError) {
      throw categoriesError
    }
    
    // Fetch subcategories
    const { data: subcategories, error: subcategoriesError } = await supabase
      .from('subcategories')
      .select('*')
      .order('name')
    
    if (subcategoriesError) {
      throw subcategoriesError
    }
    
    return NextResponse.json({ categories, subcategories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

// POST /api/admin/categories - Create a new category
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    
    const { name, icon, bg_color } = await request.json()
    
    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, icon, bg_color }])
      .select('id, name, icon, bg_color, created_at')
      .single()
    
    if (error) {
      throw error
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}