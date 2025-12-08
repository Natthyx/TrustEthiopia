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

// DELETE /api/admin/categories/[id] - Delete a category
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = createAdminClient()
    
    // Await the params promise to get the actual id
    const { id } = await params
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}