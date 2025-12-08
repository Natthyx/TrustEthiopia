import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import { NextResponse } from 'next/server'

// Create a service role client for admin operations
const createAdminClient = () => {
  // This uses the service_role key which bypasses RLS
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/admin/subcategories - Create a new subcategory
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    
    const { name, category_id } = await request.json()
    
    if (!name || !category_id) {
      return NextResponse.json({ error: "Subcategory name and category ID are required" }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('subcategories')
      .insert([{ name, category_id }])
      .select('*')
      .single()
    
    if (error) {
      throw error
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating subcategory:', error)
    return NextResponse.json({ error: "Failed to create subcategory" }, { status: 500 })
  }
}