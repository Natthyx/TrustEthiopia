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
    // Check if user already exists with this email
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', data.email)
      .maybeSingle()
    
    if (fetchError) {
      console.error('Error checking existing user:', fetchError)
      // Continue with registration even if check fails
    } else if (existingUser) {
      return { error: 'An account is already associated with this email address. Please sign in instead.' }
    }
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
      if (error.message.includes('identity already exists')) {
        return { error: 'An account is already associated with this email address. Please sign in instead.' }
      }
      return { error: error.message }
    }

    if (authData.user && !authData.user.identities?.length) {
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
 * Register a new business (email + password)
 */
export async function registerBusiness(data: RegisterBusinessData) {
  const supabase = await createClient()

  try {
    // Check if user already exists with this email
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', data.email)
      .maybeSingle()
    
    if (existingUser) {
      return { error: 'An account is already associated with this email address. Please sign in instead.' }
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          name: data.name,
          role: 'business',
          businessName: data.businessName,
          location: data.location,
          website: data.website,
        }
      },
    })

    if (error) {
      console.error('Business registration error:', error)
      if (error.message.includes('identity already exists')) {
        return { error: 'An account is already associated with this email address. Please sign in instead.' }
      }
      return { error: error.message }
    }

    if (authData.user && !authData.user.identities?.length) {
      return { error: 'Account already exists. Please sign in instead.' }
    }

    // Create business record immediately after successful signup
    if (authData.user && data.businessName) {
      const { error: businessError } = await supabase
        .from('businesses')
        .insert({
          business_name: data.businessName,
          business_owner_id: authData.user.id,
          location: data.location || null,
          website: data.website || null,
        })

      if (businessError) {
        console.error('Failed to create business record:', businessError)
        // Don't fail registration — user can add business later
      }
    }

    return { success: true }
  } catch (err) {
    console.error('Unexpected business registration error:', err)
    return { error: 'An unexpected error occurred during business registration. Please try again.' }
  }
}

/**
 * Sign up with phone number (supports user and business)
 */
export async function signupWithPhone(
  phone: string,
  name: string,
  role: 'user' | 'business',
  email?: string,
  businessName?: string,
  location?: string,
  website?: string
) {
  const supabase = await createClient()
  
  try {
    // Check if user already exists with this phone
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle()
    
    if (existingUser) {
      return { error: 'An account is already associated with this phone number. Please sign in instead.' }
    }

    const phoneRegex = /^\+[1-9][0-9]{1,14}$/
    if (!phoneRegex.test(phone)) {
      return { error: 'Invalid phone number format. Please use E.164 format (e.g., +1234567890).' }
    }
    
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        shouldCreateUser: true,
        data: {
          name,
          email,
          phone,
          role,
          businessName,
          location,
          website,
        }
      }
    })
    
    if (error) {
      console.error('Phone signup error:', error)
      if (error.message.includes('identity already exists')) {
        return { error: 'An account is already associated with this phone number. Please sign in instead.' }
      }
      return { error: error.message }
    }
    
    return { success: true, message: "OTP sent! Check your phone." }
  } catch (err) {
    console.error('Unexpected phone signup error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Login user with email and password
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
 * Send OTP to phone number
 */
export async function sendPhoneOTP(phone: string) {
  const supabase = await createClient()
  
  try {
    // Validate phone number format (E.164)
    const phoneRegex = /^\+[1-9][0-9]{1,14}$/
    if (!phoneRegex.test(phone)) {
      return { error: 'Invalid phone number format. Please use E.164 format (e.g., +1234567890).' }
    }
    
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        shouldCreateUser: false // For login, don't create user
      }
    })
    
    if (error) {
      console.error('Phone OTP send error:', error)
      // Handle specific error cases
      if (error.message.includes('rate limit')) {
        return { error: 'Too many attempts. Please try again later.' }
      }
      return { error: error.message }
    }
    
    return { success: true }
  } catch (err) {
    console.error('Unexpected phone OTP error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Verify phone OTP (and create business record if needed)
 */
export async function verifyPhoneOTP(phone: string, token: string) {
  const supabase = await createClient()
  
  try {
    const phoneRegex = /^\+[1-9][0-9]{1,14}$/
    if (!phoneRegex.test(phone)) {
      return { error: 'Invalid phone number format.' }
    }
    
    if (!token || token.length !== 6) {
      return { error: 'Invalid verification code.' }
    }
    
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    })
    
    if (error) {
      console.error('Phone OTP verification error:', error)
      if (error.message.includes('invalid')) return { error: 'Invalid verification code.' }
      if (error.message.includes('expired')) return { error: 'Verification code has expired. Please request a new one.' }
      return { error: error.message }
    }
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Failed to authenticate user. Please try again.' }
    }

    // Check/create profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_banned')
      .eq('id', user.id)
      .single()

    if (!profile) {
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: user.user_metadata?.name || null,
          email: user.user_metadata?.email || null,
          phone: user.user_metadata?.phone || null,
          role: user.user_metadata?.role || 'user',
          is_banned: false,
        })

      if (createError) {
        console.error('Profile creation error:', createError)
        return { error: 'Failed to create user profile. Please contact support.' }
      }
    }

    if (profile?.is_banned) {
      return { error: 'Your account has been banned. Please contact support for assistance.' }
    }

    // If business user, create business record from metadata
    if (user.user_metadata?.role === 'business' && user.user_metadata?.businessName) {
      const { error: businessError } = await supabase
        .from('businesses')
        .upsert({
          business_name: user.user_metadata.businessName,
          business_owner_id: user.id,
          location: user.user_metadata.location || null,
          website: user.user_metadata.website || null,
        }, { onConflict: 'business_owner_id' })

      if (businessError) {
        console.error('Failed to create business record:', businessError)
        // Don't fail login
      }
    }

    const redirectPath = getRedirectPath({
      id: user.id,
      email: user.email || '',
      role: (profile?.role || user.user_metadata?.role || 'user') as any,
    })

    revalidatePath('/', 'layout')
    return { success: true, redirectPath }
  } catch (err) {
    console.error('Unexpected phone OTP verification error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
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

// // Request email change (sends verification email)
// export async function requestEmailChange(newEmail: string) {
//   const supabase = await createClient()
  
//   try {
//     const { data: { user } } = await supabase.auth.getUser()
//     if (!user) return { error: 'Not authenticated' }

//     // Optional: check if email already in use
//     const { data: existing } = await supabase
//       .from('profiles')
//       .select('id')
//       .eq('email', newEmail)
//       .maybeSingle()

//     if (existing) return { error: 'Email already in use' }

//     const { error } = await supabase.auth.updateUser({
//       email: newEmail
//     })

//     if (error) return { error: error.message }

//     return { success: true, message: 'Verification email sent!' }
//   } catch (err) {
//     return { error: 'Failed to request email change' }
//   }
// }

// // Request phone change (sends OTP)
// export async function requestPhoneChange(newPhone: string) {
//   const supabase = await createClient()
  
//   try {
//     const phoneRegex = /^\+[1-9][0-9]{1,14}$/
//     if (!phoneRegex.test(newPhone)) {
//       return { error: 'Invalid phone format' }
//     }

//     const { data: { user } } = await supabase.auth.getUser()
//     if (!user) return { error: 'Not authenticated' }

//     const { data: existing } = await supabase
//       .from('profiles')
//       .select('id')
//       .eq('phone', newPhone)
//       .maybeSingle()

//     if (existing) return { error: 'Phone already in use' }

//     const { error } = await supabase.auth.updateUser({
//       phone: newPhone
//     })

//     if (error) return { error: error.message }

//     return { success: true, message: 'OTP sent to new phone!' }
//   } catch (err) {
//     return { error: 'Failed to request phone change' }
//   }
// }

// // Verify email change (called after user enters code from email)
// export async function verifyEmailChange(token: string) {
//   const supabase = await createClient()
  
//   try {
//     const { data: { user }, error: verifyError } = await supabase.auth.verifyOtp({
//       type: 'email_change',
//       token,
//     })
    
//     if (verifyError || !user) return { error: 'Invalid or expired code' }

//     // Update profiles table with new verified email
//     const { error: updateError } = await supabase
//       .from('profiles')
//       .update({ email: user.email })
//       .eq('id', user.id)

//     if (updateError) {
//       console.error('Failed to update profile email:', updateError)
//       return { error: 'Failed to save new email' }
//     }

//     return { success: true, newEmail: user.email }
//   } catch (err) {
//     return { error: 'Verification failed' }
//   }
// }

// // Verify phone change
// export async function verifyPhoneChange(phone: string, token: string) {
//   const supabase = await createClient()
  
//   try {
//     const { data: { user }, error } = await supabase.auth.verifyOtp({
//       phone,
//       token,
//       type: 'phone_change'
//     })

//     if (error || !user) return { error: 'Invalid or expired code' }

//     const { error: updateError } = await supabase
//       .from('profiles')
//       .update({ phone })
//       .eq('id', user.id)

//     if (updateError) return { error: 'Failed to save new phone' }

//     return { success: true, newPhone: phone }
//   } catch (err) {
//     return { error: 'Verification failed' }
//   }
// }