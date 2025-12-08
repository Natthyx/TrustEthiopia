import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import { NextResponse } from 'next/server'

// Create a public client for read-only operations
const createPublicClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// GET /api/categories - Fetch all categories and subcategories for public view
export async function GET() {
  try {
    const supabase = createPublicClient()
    
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
    
    // Combine categories with their subcategories
    const combinedCategories = categories.map(cat => ({
      ...cat,
      subcategories: subcategories.filter(sub => sub.category_id === cat.id)
    }))
    
    return NextResponse.json(combinedCategories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}