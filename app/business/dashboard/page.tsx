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
  rating_count: number | null
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
  const [loading, setLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [setupData, setSetupData] = useState({
    businessName: "",
    location: "",
    website: ""
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

        // Fetch business data
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('id, business_name, location, website, rating_count, description')
          .eq('business_owner_id', user.id)
          .single()

        if (businessError) {
          console.error('Error fetching business:', businessError)
          // If no business found, check if we have business info in user metadata
          const { data: userDetails, error: metaError } = await supabase.auth.getUser()
          
          if (!metaError && userDetails?.user?.user_metadata) {
            const metadata = userDetails.user.user_metadata
            if (metadata.role === 'business' && metadata.businessName) {
              // Show setup form with prefilled data from metadata
              setSetupData({
                businessName: metadata.businessName || "",
                location: metadata.location || "",
                website: metadata.website || ""
              })
              setShowSetup(true)
            }
          }
        } else {
          setBusiness(businessData)
          
          // Fetch recent reviews
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
          
          if (!reviewsError) {
            setReviews(reviewsData || [])
          }
        }

        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        router.push('/auth/login')
      }
    }

    fetchBusinessData()

    // Listen for auth state changes to redirect when logged out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const handleSetupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSetupData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        router.push('/auth/login')
        return
      }

      // Create business record
      const { data: newBusiness, error: businessError } = await supabase
        .from('businesses')
        .insert({
          business_name: setupData.businessName,
          business_owner_id: user.id,
          location: setupData.location || null,
          website: setupData.website || null,
          description: null,
          is_banned: false,
          rating_count: 0
        })
        .select()
        .single()

      if (businessError) {
        console.error('Business creation error:', businessError)
        // Show error to user
        return
      }

      setBusiness(newBusiness)
      setShowSetup(false)
    } catch (error) {
      console.error('Error creating business:', error)
    }
  }

  // Calculate average rating from reviews
  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0
    const total = reviews.reduce((sum, review) => sum + review.rating, 0)
    return total / reviews.length
  }

  // Prepare data for charts
  const ratingData = [
    { stars: 5, count: reviews.filter(r => r.rating === 5).length },
    { stars: 4, count: reviews.filter(r => r.rating === 4).length },
    { stars: 3, count: reviews.filter(r => r.rating === 3).length },
    { stars: 2, count: reviews.filter(r => r.rating === 2).length },
    { stars: 1, count: reviews.filter(r => r.rating === 1).length },
  ]

  const viewsData = [
    { month: "Jan", views: 2400, clicks: 1240 },
    { month: "Feb", views: 2210, clicks: 1221 },
    { month: "Mar", views: 2290, clicks: 1229 },
    { month: "Apr", views: 2000, clicks: 2200 },
    { month: "May", views: 2181, clicks: 2500 },
    { month: "Jun", views: 2500, clicks: 2100 },
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
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Business Setup</h1>
              <p className="text-muted-foreground mt-2">
                Please confirm your business information to get started.
              </p>
            </div>

            <Card className="max-w-2xl p-6">
              <form onSubmit={handleCreateBusiness} className="space-y-6">
                <div>
                  <Label htmlFor="businessName" className="text-sm font-medium">
                    Business Name *
                  </Label>
                  <Input 
                    id="businessName" 
                    name="businessName"
                    placeholder="Acme Inc." 
                    className="mt-2" 
                    value={setupData.businessName}
                    onChange={handleSetupChange}
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="location" className="text-sm font-medium">
                    Location
                  </Label>
                  <Input 
                    id="location" 
                    name="location"
                    placeholder="New York, NY" 
                    className="mt-2" 
                    value={setupData.location}
                    onChange={handleSetupChange}
                  />
                </div>
                
                <div>
                  <Label htmlFor="website" className="text-sm font-medium">
                    Website
                  </Label>
                  <Input 
                    id="website" 
                    name="website"
                    type="url"
                    placeholder="https://example.com" 
                    className="mt-2" 
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

  // If we don't have a business and we're not showing setup, show a message
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Business Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, {business?.business_name || "Business Owner"}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Star, label: "Average Rating", value: calculateAverageRating().toFixed(1), color: "text-yellow-500" },
              { icon: MessageSquare, label: "Total Reviews", value: reviews.length.toString(), color: "text-blue-500" },
              { icon: Users, label: "Profile Views", value: "4.5K", color: "text-purple-500" },
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
            {/* Rating Distribution */}
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

            {/* Views & Clicks */}
            <Card className="p-6 lg:col-span-2">
              <h3 className="font-semibold mb-4">Profile Views & Clicks</h3>
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
                  <Line type="monotone" dataKey="views" stroke="var(--color-primary)" strokeWidth={2} />
                  <Line type="monotone" dataKey="clicks" stroke="var(--color-accent)" strokeWidth={2} />
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
                            <span className="text-sm font-medium ml-2">
                              {review.reviewer?.name || "Anonymous"}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {review.comment || "No comment provided"}
                          </p>
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