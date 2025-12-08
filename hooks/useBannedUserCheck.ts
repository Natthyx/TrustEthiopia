import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook to check if a user is banned and redirect if they are
 * @param role - The role of the user ('user' or 'business')
 * @param redirectOnBanned - Whether to redirect banned users to public pages
 */
export function useBannedUserCheck(role: 'user' | 'business' | 'public' = 'user', redirectOnBanned: boolean = true) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkBannedStatus = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          // No user logged in, nothing to check
          return
        }

        // Check if user is banned by fetching profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_banned')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          return
        }

        // If user is banned and we should redirect, sign them out and redirect
        if (profileData.is_banned && redirectOnBanned) {
          // Sign out the user
          await supabase.auth.signOut()
          router.push('/?message=banned')
          return
        }
      } catch (error) {
        console.error('Error checking banned status:', error)
      }
    }

    checkBannedStatus()
  }, [router, role, redirectOnBanned])
}