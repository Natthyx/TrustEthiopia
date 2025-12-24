import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }
    
    // Get the request body
    const { businessId, imageIds } = await request.json()
    
    if (!businessId || !imageIds || !Array.isArray(imageIds)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Update the business_id for all uploaded images
    const { error: updateError } = await supabaseAdmin
      .from('business_images')
      .update({ business_id: businessId })
      .in('id', imageIds)
    
    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update business images' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating business images:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}