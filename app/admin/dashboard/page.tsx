"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Users, Building2, Star, MessageSquare, TrendingUp } from "lucide-react"

interface Stat {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  trend: string
}

interface Review {
  id: string
  business_name: string | null
  reviewer_name: string | null
  rating: number | null
  status: string
  created_at: string | null
}

interface Business {
  id: string
  business_name: string | null
  category_name: string | null
  owner_name: string | null
  created_at: string | null
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stat[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [recentReviews, setRecentReviews] = useState<Review[]>([])
  const [pendingBusinesses, setPendingBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/auth/login')
          return
        }

        // Check if user is admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileError || !profile || profile.role !== 'admin') {
          router.push('/admin/login')
          return
        }

        // Fetch all data using API routes
        await Promise.all([
          fetchStats(),
          fetchChartData(),
          fetchRecentReviews(),
          fetchPendingBusinesses()
        ])

        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        router.push('/admin/login')
      }
    }

    fetchData()
  }, [router])

  const fetchStats = async () => {
    try {
      // Fetch statistics using API routes
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch statistics')
      }

      const statsData = await response.json()
      
      setStats([
        { icon: Users, label: "Total Users", value: statsData.users.toString(), trend: "+12%" },
        { icon: Building2, label: "Business Accounts", value: statsData.businesses.toString(), trend: "+8%" },
        { icon: MessageSquare, label: "Reviews This Week", value: statsData.reviewsThisWeek.toString(), trend: "+24%" },
        { icon: TrendingUp, label: "Platform Growth", value: "23%", trend: "+5%" },
      ])
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats([])
    }
  }

  const fetchChartData = async () => {
    try {
      // For chart data, we would need a dedicated API endpoint
      // Return mock data for now as this would require a more complex API
      const mockData = [
        { day: "Mon", reviews: 120, businesses: 24 },
        { day: "Tue", reviews: 200, businesses: 32 },
        { day: "Wed", reviews: 150, businesses: 20 },
        { day: "Thu", reviews: 220, businesses: 35 },
        { day: "Fri", reviews: 280, businesses: 45 },
        { day: "Sat", reviews: 190, businesses: 28 },
        { day: "Sun", reviews: 140, businesses: 18 },
      ]
      
      setChartData(mockData)
    } catch (error) {
      console.error('Error fetching chart data:', error)
      // Return mock data as fallback
      setChartData([
        { day: "Mon", reviews: 120, businesses: 24 },
        { day: "Tue", reviews: 200, businesses: 32 },
        { day: "Wed", reviews: 150, businesses: 20 },
        { day: "Thu", reviews: 220, businesses: 35 },
        { day: "Fri", reviews: 280, businesses: 45 },
        { day: "Sat", reviews: 190, businesses: 28 },
        { day: "Sun", reviews: 140, businesses: 18 },
      ])
    }
  }

  const fetchRecentReviews = async () => {
    try {
      // Fetch reviews using API route
      const response = await fetch('/api/admin/reviews', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }

      const reviewsData = await response.json()
      setRecentReviews(reviewsData)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setRecentReviews([])
    }
  }

  const fetchPendingBusinesses = async () => {
    try {
      // Fetch businesses using API route
      const response = await fetch('/api/admin/businesses', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch businesses')
      }

      const businessesData = await response.json()
      
      // Take first 5 businesses
      const pendingBusinesses = businessesData.slice(0, 5).map((business: any) => ({
        id: business.id,
        business_name: business.business_name,
        category_name: business.category_name || "Pending",
        owner_name: business.owner_name || "Unknown Owner",
        created_at: business.created_at
      }))
      
      setPendingBusinesses(pendingBusinesses)
    } catch (error) {
      console.error('Error fetching businesses:', error)
      setPendingBusinesses([])
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[calc(100vh-4rem)]">
          <Sidebar role="admin" />
          <div className="flex-1 ml-64 p-8">
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar role="admin" />
        <div className="flex-1 ml-64 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Platform overview and management</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, idx) => {
              const Icon = stat.icon
              return (
                <Card key={idx} className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                      <p className="text-2xl font-bold mt-2">{stat.value}</p>
                      <p className="text-xs text-green-600 mt-2">{stat.trend}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Activity Chart */}
          <Card className="p-6 mb-8">
            <h3 className="font-semibold mb-4">Weekly Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                  }}
                />
                <Bar dataKey="reviews" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Reviews */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Recent Reviews</h3>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReviews.length > 0 ? (
                    recentReviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell className="text-sm">{review.business_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {review.rating}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              review.status === "Published"
                                ? "default"
                                : review.status === "Pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {review.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                        No recent reviews
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>

            {/* Pending Businesses */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Business Accounts</h3>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingBusinesses.length > 0 ? (
                    pendingBusinesses.map((business) => (
                      <TableRow key={business.id}>
                        <TableCell className="text-sm">{business.business_name}</TableCell>
                        <TableCell className="text-sm">{business.category_name}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              Review
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                        No businesses found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}