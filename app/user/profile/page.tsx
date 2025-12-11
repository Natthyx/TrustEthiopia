'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { RatingStars } from '@/components/rating-stars'
import { 
  User, 
  Mail, 
  Calendar, 
  Star, 
  BookOpen, 
  Edit3,
  TrendingUp,
  MessageSquare
} from 'lucide-react'
import { useBannedUserCheck } from '@/hooks/useBannedUserCheck'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ProfileData {
  id: string
  name: string | null
  email: string | null
  role: string | null
  created_at: string | null
  profile_image_url: string | null
}

interface AnalyticsData {
  reviews_count: number
  reads_count: number
}

interface UserReview {
  id: string
  rating: number
  comment: string | null
  created_at: string | null  // ← Fixed: allow null
  business: {
    id: string
    business_name: string
  }
}

export default function UserProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData>({ reviews_count: 0, reads_count: 0 })
  const [userReviews, setUserReviews] = useState<UserReview[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useBannedUserCheck('user')

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/auth/login')
          return
        }

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, email, role, created_at, profile_image_url')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          router.push('/auth/login')
          return
        }

        setProfile(profileData)

        // Fetch analytics: review & read counts
        const { count: reviewsCount } = await supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('reviewer_id', user.id)

        const { count: readsCount } = await supabase
          .from('user_reads')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        setAnalytics({
          reviews_count: reviewsCount || 0,
          reads_count: readsCount || 0
        })

        // Fetch user's actual reviews with business name
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            id,
            rating,
            comment,
            created_at,
            businesses (
              id,
              business_name
            )
          `)
          .eq('reviewer_id', user.id)
          .order('created_at', { ascending: false })

        if (!reviewsError && reviewsData) {
          const formattedReviews = reviewsData.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            created_at: review.created_at,
            business: {
              id: review.businesses.id,
              business_name: review.businesses.business_name
            }
          }))
          setUserReviews(formattedReviews)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        router.push('/auth/login')
      }
    }

    fetchUserProfile()
  }, [router])

  const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Unknown date'
  return new Date(dateString).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

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
              <p className="text-muted-foreground">Manage your account and view your activity</p>
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
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={profile?.profile_image_url || undefined} alt={profile?.name || "User"} />
                      <AvatarFallback className="text-xl">
                        {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
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
                        Joined {profile?.created_at ? formatDate(profile.created_at) : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics & Reviews */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reviews Written</CardTitle>
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
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

              {/* Your Reviews List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Your Reviews
                  </CardTitle>
                  <CardDescription>
                    {userReviews.length > 0 
                      ? `You have written ${userReviews.length} review${userReviews.length > 1 ? 's' : ''}`
                      : "You haven't written any reviews yet"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userReviews.length > 0 ? (
                    <div className="space-y-4">
                      {userReviews.map((review) => (
                        <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                          <Link 
                            href={`/service/${review.business.id}`} 
                            className="block hover:bg-muted/50 -m-2 p-2 rounded-lg transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-sm">
                                  {review.business.business_name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <RatingStars rating={review.rating} size="sm" />
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(review.created_at)}
                                  </span>
                                </div>
                                {review.comment && (
                                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                    {review.comment}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p>No reviews yet. Be the first to share your experience!</p>
                      <Button asChild className="mt-4">
                        <Link href="/explore">Explore Businesses</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Activity CTA */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Keep Engaging
                  </CardTitle>
                  <CardDescription>Continue sharing your experiences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button asChild>
                      <Link href="/explore">Explore Services</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/categories">Browse Categories</Link>
                    </Button>
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