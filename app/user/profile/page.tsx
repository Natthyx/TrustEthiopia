'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  User, 
  Mail, 
  Calendar, 
  Star, 
  BookOpen, 
  Edit3,
  TrendingUp
} from 'lucide-react'
import { useBannedUserCheck } from '@/hooks/useBannedUserCheck'

interface ProfileData {
  id: string
  name: string | null
  email: string | null
  role: string | null
  created_at: string | null
}

interface AnalyticsData {
  reviews_count: number
  reads_count: number
}

export default function UserProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData>({ reviews_count: 0, reads_count: 0 })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Check if user is banned
  useBannedUserCheck('user')

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/auth/login')
          return
        }

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, email, role, created_at')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          router.push('/auth/login')
          return
        }

        setProfile(profileData)

        // Fetch analytics data
        // Count reviews
        const { count: reviewsCount, error: reviewsError } = await supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('reviewer_id', user.id)

        // Count reads
        const { count: readsCount, error: readsError } = await supabase
          .from('user_reads')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        setAnalytics({
          reviews_count: reviewsCount || 0,
          reads_count: readsCount || 0
        })

        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        router.push('/auth/login')
      }
    }

    fetchUserProfile()
  }, [router])

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading your profile...</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Your Profile</h1>
              <p className="text-muted-foreground">Manage your account and activity</p>
            </div>
            <Button asChild>
              <Link href="/categories">
                <Edit3 className="w-4 h-4 mr-2" />
                Write a Review
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{profile?.name || 'User'}</h3>
                      <Badge variant="secondary" className="mt-1 capitalize">
                        {profile?.role || 'user'}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center text-sm">
                      <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>{profile?.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>
                        Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Cards */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reviews Written</CardTitle>
                    <Star className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.reviews_count}</div>
                    <p className="text-xs text-muted-foreground">Total reviews you've written</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Articles Read</CardTitle>
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.reads_count}</div>
                    <p className="text-xs text-muted-foreground">Blog posts you've read</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Activity Overview
                  </CardTitle>
                  <CardDescription>Your recent engagement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Write a Review</p>
                        <p className="text-sm text-muted-foreground">Share your experience with services</p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/categories">Start</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}