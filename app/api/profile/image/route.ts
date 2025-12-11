// app/api/profile/image/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get the file from the request
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload JPG, PNG, GIF, or WebP.' }, { status: 400 })
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
    }
    
    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile_images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }
    
    // Get public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('profile_images')
      .getPublicUrl(fileName)
    
    // Update profile with the image URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_image_url: publicUrl })
      .eq('id', user.id)
    
    if (updateError) {
      console.error('Update error:', updateError)
      // If profile update fails, try to delete the uploaded image
      await supabase.storage.from('profile_images').remove([fileName])
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      imageUrl: publicUrl,
      message: 'Profile image updated successfully' 
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get current profile to find existing image
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('profile_image_url')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }
    
    // If no profile image, nothing to delete
    if (!profile.profile_image_url) {
      return NextResponse.json({ 
        success: true, 
        message: 'No profile image to delete' 
      })
    }
    
    // Extract file path from URL
    const imageUrl = profile.profile_image_url
    const filePath = imageUrl.split('/').slice(-2).join('/')
    
    // Delete image from storage
    const { error: deleteError } = await supabase.storage
      .from('profile_images')
      .remove([filePath])
    
    if (deleteError) {
      console.error('Delete error:', deleteError)
      // Continue with profile update even if storage delete fails
    }
    
    // Update profile to remove image URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_image_url: null })
      .eq('id', user.id)
    
    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Profile image deleted successfully' 
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}