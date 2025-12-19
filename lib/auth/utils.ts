import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import { AuthUser, UserRole } from './types'

/**
 * Get the current authenticated user
 */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const supabase = createSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  // Get user profile to determine role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .eq('id', user.id)
    .single()
  
  if (profileError || !profile) {
    return null
  }
  
  return {
    id: user.id,
    email: user.email!,
    role: profile.role as UserRole,
    name: profile.name,
    avatar_url: null
  }
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser()
  return !!user
}

/**
 * Check user role
 */
export const hasRole = async (role: UserRole): Promise<boolean> => {
  const user = await getCurrentUser()
  return user?.role === role || false
}

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  const supabase = createSupabaseClient()
  await supabase.auth.signOut()
}


export async function updateUserPhone(userId: string, phone: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseClient()
  
  try {
    // Validate phone number format (E.164)
    const phoneRegex = /^\+[1-9][0-9]{1,14}$/
    if (!phoneRegex.test(phone)) {
      return { success: false, error: 'Invalid phone number format. Please use E.164 format (e.g., +1234567890).' }
    }
    
    // Update phone in auth user
    const { error: authError } = await supabase.auth.updateUser({
      phone: phone
    })
    
    if (authError) {
      console.error('Auth phone update error:', authError)
      return { success: false, error: 'Failed to update phone number in authentication system.' }
    }
    
    // Update phone in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ phone: phone })
      .eq('id', userId)
    
    if (profileError) {
      console.error('Profile phone update error:', profileError)
      return { success: false, error: 'Failed to update phone number in profile.' }
    }
    
    return { success: true }
  } catch (err) {
    console.error('Unexpected phone update error:', err)
    return { success: false, error: 'An unexpected error occurred while updating phone number.' }
  }
}

/**
 * Check if user has a phone number linked
 */
export async function userHasPhone(userId: string): Promise<boolean> {
  const supabase = await createSupabaseClient()
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', userId)
      .single()
    
    if (error || !profile) {
      return false
    }
    
    return !!profile.phone
  } catch (err) {
    console.error('Error checking user phone:', err)
    return false
  }
}