import { createClient } from '@/lib/supabase/server'

/**
 * Check if a user is banned
 * @returns {Promise<{ isBanned: boolean, error?: string }>} Object indicating if user is banned and any error message
 */
export async function checkBannedUser() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { isBanned: false, error: 'No user found' }
    }
    
    // Check if user's email is confirmed
    if (!user.email_confirmed_at) {
      return { isBanned: false, error: 'Email not confirmed' }
    }
    
    // Fetch user profile to check if banned
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_banned')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError)
      return { isBanned: false, error: 'Profile not found' }
    }
    
    // Return banned status
    return { isBanned: profile.is_banned || false }
  } catch (error) {
    console.error('Error checking banned user:', error)
    return { isBanned: false, error: 'Error checking user status' }
  }
}