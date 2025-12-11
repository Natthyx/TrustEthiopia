"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Star, Users, MessageSquare, TrendingUp, Plus } from "lucide-react"
import { useBannedUserCheck } from '@/hooks/useBannedUserCheck'

interface BusinessData {
  id: string
  business_name: string
  location: string | null
  website: string | null
  description: string | null
}

interface ReviewData {
  id: string
  rating: number
  comment: string | null
  created_at: string | null
  reviewer: {
    name: string | null
  } | null
}

export default function BusinessDashboard() {
  const [business, setBusiness] = useState<BusinessData | null>(null)
  const [reviews, setReviews] = useState<ReviewData[]>([])
  const [viewCount, setViewCount] = useState<number>(0)
  const [viewsData, setViewsData] = useState<{ month: string; views: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [setupData, setSetupData] = useState({
    businessName: "",
    location: "",
    website: "",
    description: null,
    is_banned: false
  })
  const router = useRouter()
  const supabase = createClient()

  // Check if user is banned
  useBannedUserCheck('business')

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/auth/login')
          return
        }

        // Fetch business data (no rating_count)
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('id, business_name, location, website, description')
          .eq('business_owner_id', user.id)
          .single()

        if (businessError) {
          console.error('Error fetching business:', businessError)
          // Show setup form if no business exists
          const { data: userDetails } = await supabase.auth.getUser()
          const metadata = userDetails?.user?.user_metadata
          if (metadata?.role === 'business' && metadata.businessName) {
            setSetupData({
              businessName: metadata.businessName || "",
              location: metadata.location || "",
              website: metadata.website || "",
              description: null,
              is_banned: false
            })
            setShowSetup(true)
          }
        } else {
          setBusiness(businessData)
          
          // Fetch recent reviews + calculate real rating
          const { data: reviewsData, error: reviewsError } = await supabase
            .from('reviews')
            .select(`
              id,
              rating,
              comment,
              created_at,
              reviewer:profiles(name)
            `)
            .eq('reviewee_id', businessData.id)
            .order('created_at', { ascending: false })
            .limit(5)
          
          if (!reviewsError && reviewsData) {
            setReviews(reviewsData)
          }
          
          // Fetch view count
          const { count: viewCountData, error: viewCountError } = await supabase
            .from('business_views')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessData.id)
          
          if (!viewCountError && viewCountData !== null) {
            setViewCount(viewCountData)
          }
          
          // Fetch views data for the chart (last 6 months) - CORRECTED VERSION
          const now = new Date()
          const sixMonthsAgo = new Date()
          sixMonthsAgo.setMonth(now.getMonth() - 5)
          sixMonthsAgo.setDate(1)
          sixMonthsAgo.setHours(0, 0, 0, 0)

          const { data: viewsDataResult, error: viewsDataError } = await supabase
            .from('business_views')
            .select('viewed_at')
            .eq('business_id', businessData.id)
            .gte('viewed_at', sixMonthsAgo.toISOString())
          
          if (!viewsDataError) {
            // Define correct month order
            const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

            // Initialize all 6 months with 0
            const monthlyViews: Record<string, number> = {}
            for (let i = 5; i >= 0; i--) {
              const date = new Date(now)
              date.setMonth(now.getMonth() - i)
              const monthKey = date.toLocaleString('default', { month: 'short' })
              monthlyViews[monthKey] = 0
            }

            // Count actual views
            viewsDataResult?.forEach(view => {
              if (view.viewed_at) {
                const month = new Date(view.viewed_at).toLocaleString('default', { month: 'short' })
                if (monthlyViews.hasOwnProperty(month)) {
                  monthlyViews[month]++
                }
              }
            })

            // Convert to ordered array
            const chartData = Object.entries(monthlyViews)
              .map(([month, views]) => ({ month, views }))
              .sort((a, b) => {
                // Sort by correct chronological order (oldest to newest)
                const now = new Date()
                const aIndex = monthOrder.indexOf(a.month)
                const bIndex = monthOrder.indexOf(b.month)
                const currentIndex = now.getMonth()
                
                // Adjust indices to handle year wrap-around
                const aAdjusted = aIndex <= currentIndex ? aIndex + 12 : aIndex
                const bAdjusted = bIndex <= currentIndex ? bIndex + 12 : bIndex
                
                return aAdjusted - bAdjusted
              })

            setViewsData(chartData)
            setViewCount(viewsDataResult?.length || 0)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        router.push('/auth/login')
      }
    }

    fetchBusinessData()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleSetupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSetupData(prev => ({ ...prev, [name]: value }))
  }

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: newBusiness, error } = await supabase
        .from('businesses')
        .insert({
          business_name: setupData.businessName,
          business_owner_id: user.id,
          location: setupData.location || null,
          website: setupData.website || null,
          description: null,
          is_banned: false
        })
        .select()
        .single()

      if (error) throw error

      setBusiness(newBusiness)
      setShowSetup(false)
    } catch (error) {
      console.error('Error creating business:', error)
    }
  }

  // Calculate average rating from actual reviews
  const averageRating = reviews.length > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 0

  // Rating distribution for pie chart
  const ratingData = [
    { stars: 5, count: reviews.filter(r => r.rating === 5).length },
    { stars: 4, count: reviews.filter(r => r.rating === 4).length },
    { stars: 3, count: reviews.filter(r => r.rating === 3).length },
    { stars: 2, count: reviews.filter(r => r.rating === 2).length },
    { stars: 1, count: reviews.filter(r => r.rating === 1).length },
  ]

  const COLORS = ["#FCD34D", "#DBEAFE", "#FCA5A5", "#D1D5DB", "#9CA3AF"]

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        </main>
      </>
    )
  }

  if (showSetup) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[calc(100vh-4rem)]">
          <Sidebar role="business" />
          <div className="flex-1 ml-64 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Business Setup</h1>
              <p className="text-muted-foreground mt-2">
                Please confirm your business information to get started.
              </p>
            </div>

            <Card className="max-w-2xl p-6">
              <form onSubmit={handleCreateBusiness} className="space-y-6">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input 
                    id="businessName" 
                    name="businessName"
                    placeholder="Acme Inc." 
                    value={setupData.businessName}
                    onChange={handleSetupChange}
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    name="location"
                    placeholder="New York, NY" 
                    value={setupData.location}
                    onChange={handleSetupChange}
                  />
                </div>
                
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input 
                    id="website" 
                    name="website"
                    type="url"
                    placeholder="https://example.com" 
                    value={setupData.website}
                    onChange={handleSetupChange}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Business
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </main>
      </>
    )
  }

  if (!business) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">Business Setup Required</h2>
            <p className="text-muted-foreground mb-6">
              Please set up your business information to access your dashboard.
            </p>
            <Button onClick={() => setShowSetup(true)}>
              Set Up Business
            </Button>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar role="business" />
        <div className="flex-1 ml-64 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Business Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, {business.business_name}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Star, label: "Average Rating", value: averageRating.toFixed(1), color: "text-yellow-500" },
              { icon: MessageSquare, label: "Total Reviews", value: reviews.length.toString(), color: "text-blue-500" },
              { icon: Users, label: "Profile Views", value: viewCount.toString(), color: "text-purple-500" },
              { icon: TrendingUp, label: "Avg Response Time", value: "2h 30m", color: "text-green-500" },
            ].map((stat, idx) => {
              const Icon = stat.icon
              return (
                <Card key={idx} className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                      <p className="text-2xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg bg-primary/10 ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 lg:col-span-1">
              <h3 className="font-semibold mb-4">Rating Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={ratingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {ratingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 lg:col-span-2">
              <h3 className="font-semibold mb-4">Profile Views</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={viewsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="var(--color-primary)" 
                    strokeWidth={2} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Recent Reviews */}
          <div className="mb-8">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Recent Reviews</h3>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-sm font-medium">
                              {review.reviewer?.name || "Anonymous"}
                            </span>
                          <div className="flex items-center gap-2 mb-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                            <p className="text-sm text-muted-foreground">
                            {review.comment || "No comment provided"}
                          </p>
                          </div>
                          
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {review.created_at
                            ? new Date(review.created_at).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No reviews yet. Encourage your customers to leave reviews!
                </p>
              )}
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}