import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: imageId } = await params;
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

    // Get the image to find its business_id and image_url
    const { data: image, error: imageError } = await supabase
      .from('business_images')
      .select('id, business_id, image_url')
      .eq('id', imageId)
      .single()
    
    if (imageError || !image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Verify that the business was created by this admin
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, created_by_admin, business_owner_id')
      .eq('id', image.business_id)
      .single()
    
    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (!business.created_by_admin || business.business_owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete images from this business' }, { status: 403 })
    }

    // Get file path from storage URL to delete from storage
    const filePath = image.image_url.split('/').slice(-2).join('/')
    
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('business_images')
      .remove([filePath])
    
    if (storageError) {
      console.error('Storage deletion error:', storageError)
      // Continue with DB deletion even if storage deletion fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('business_images')
      .delete()
      .eq('id', imageId)
    
    if (deleteError) {
      console.error('DB deletion error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete image record' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Image deleted successfully' })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: imageId } = await params;
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

    // Get the image to find its business_id
    const { data: image, error: imageError } = await supabase
      .from('business_images')
      .select('id, business_id, image_url')
      .eq('id', imageId)
      .single()
    
    if (imageError || !image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Verify that the business was created by this admin
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, created_by_admin, business_owner_id')
      .eq('id', image.business_id)
      .single()
    
    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (!business.created_by_admin || business.business_owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to update images for this business' }, { status: 403 })
    }

    const { is_primary } = await request.json()

    // If setting as primary, update all other images for this business to not be primary
    if (is_primary) {
      const { error: resetError } = await supabase
        .from('business_images')
        .update({ is_primary: false })
        .eq('business_id', image.business_id)
        .neq('id', imageId)
      
      if (resetError) {
        console.error('Error resetting other primary images:', resetError)
        return NextResponse.json({ error: 'Failed to update image record' }, { status: 500 })
      }
    }

    // Update the image record
    const { data: updatedImage, error: updateError } = await supabase
      .from('business_images')
      .update({ is_primary })
      .eq('id', imageId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update image record' }, { status: 500 })
    }

    return NextResponse.json(updatedImage)
  } catch (error) {
    console.error('Error updating image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}