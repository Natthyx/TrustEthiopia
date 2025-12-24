import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const businessId = formData.get('business_id') as string
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 })
    }

    // Verify that the business exists and was created by this admin
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, created_by_admin, business_owner_id')
      .eq('id', businessId)
      .single()
    
    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Verify that the business was created by this admin
    if (!business.created_by_admin || business.business_owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to upload images to this business' }, { status: 403 })
    }

    // Generate file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${business.id}/${fileName}`
    
    // Upload file to Supabase storage using service role to bypass RLS issues
    const { error: uploadError } = await supabaseAdmin.storage
      .from('business_images')
      .upload(filePath, file)
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }
    
    // Get public URL for the uploaded image
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('business_images')
      .getPublicUrl(filePath)
    
    // Check if this is the first image (to make it primary) - using service role
    const { count: imageCount, error: countError } = await supabaseAdmin
      .from('business_images')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
    
    const isPrimary = !countError && imageCount === 0
    
    // Insert record in business_images table using service role
    const { data: imageData, error: insertError } = await supabaseAdmin
      .from('business_images')
      .insert({
        business_id: business.id,
        image_url: publicUrl,
        is_primary: isPrimary
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Insert error:', insertError)
      // Try to delete the uploaded file since we couldn't create the DB record
      await supabaseAdmin.storage
        .from('business_images')
        .remove([filePath])
      
      return NextResponse.json({ error: 'Failed to save image record' }, { status: 500 })
    }
    
    return NextResponse.json(imageData)
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}