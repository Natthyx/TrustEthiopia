'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getRedirectPath } from '@/lib/auth/redirects'
import { RegisterUserData, RegisterBusinessData } from '@/lib/auth/types'

/**
 * Register a new user
 */
export async function registerUser(data: RegisterUserData) {
  const supabase = await createClient()

  try {
    // Sign up the user
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          name: data.name,
          role: "user",
        }
      },
    })

    if (error) {
      console.error('Registration error:', error)
      if (error.message.includes('anonymous')) {
        return { error: 'User registration is temporarily disabled. Please contact support.' }
      }
      return { error: error.message }
    }

    // If user exists but requires confirmation
    if (authData.user && !authData.user.identities) {
      return { error: 'Account already exists. Please sign in instead.' }
    }
    

    // Success → return OK so we can redirect cleanly after
    return { success: true }

  } catch (err) {
    console.error('Unexpected registration error:', err)
    return { error: 'An unexpected error occurred during registration. Please try again.' }
  }
}

/**
 * Register a new business
 */
export async function registerBusiness(data: RegisterBusinessData) {
  const supabase = await createClient()

  try {
    // Sign up the business user
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          name: data.name,
          role: "business",
        }
      },
    })

    if (error) {
      console.error('Business registration error:', error)
      if (error.message.includes('anonymous')) {
        return { error: 'Business registration is temporarily disabled. Please contact support.' }
      }
      return { error: error.message }
    }

    // If user exists but requires confirmation
    if (authData.user && !authData.user.identities) {
      return { error: 'Account already exists. Please sign in instead.' }
    }

    // Success → return OK so we can redirect cleanly after
    return { success: true }

  } catch (err) {
    console.error('Unexpected business registration error:', err)
    return { error: 'An unexpected error occurred during business registration. Please try again.' }
  }
}

/**
 * Login user
 */
export async function loginUser(email: string, password: string) {
  const supabase = await createClient()
  
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('Login error:', error)
      return { error: error.message }
    }
    
    // Get user role for redirect
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Failed to get user data after login:', userError)
      return { error: 'Failed to authenticate user. Please try again.' }
    }
    
    // Check if user's email is confirmed
    if (!user.email_confirmed_at) {
      return { error: 'Please confirm your email address before logging in.' }
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_banned')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError)
      // This is a critical error - user exists but profile doesn't
      return { error: 'User profile not found. Please contact support.' }
    }
    
    // Check if user is banned
    if (profile.is_banned) {
      return { error: 'Your account has been banned. Please contact support for assistance.' }
    }
    
    // If this is a business user, check if they have a business record
    // If not, we might need to create one (but we'll handle this on the client side)
    
    const redirectPath = getRedirectPath({
      id: user.id,
      email: user.email!,
      role: profile.role as any,
    })
    
    revalidatePath('/', 'layout')
    // Return redirect path instead of calling redirect directly
    return { success: true, redirectPath }
  } catch (err) {
    console.error('Unexpected login error:', err)
    return { error: 'An unexpected error occurred during login. Please try again.' }
  }
}

/**
 * Handle email verification callback
 */
export async function handleEmailVerification() {
  try {
    // Revalidate the home path in case needed
    revalidatePath('/', 'layout');

    // Success → redirect user to login with message
    return {
      success: true,
      redirectPath: '/auth/login?message=email_verified'
    }
  } catch (err) {
    console.error('Email verification handling error:', err);
    return {
      success: false,
      redirectPath: '/auth/login?error=verification_failed'
    }
  }
}