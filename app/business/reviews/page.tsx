"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { ReviewCard } from "@/components/review-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string | null
  reviewer: {
    name: string | null
  } | null
}

interface ReviewComment {
  id: string
  comment: string
  created_at: string | null
  commenter: {
    name: string | null
  } | null
}

export default function BusinessReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [sort, setSort] = useState("newest")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/auth/login')
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
          router.push('/auth/login')
          return
        }

        // If user is banned, redirect to public page
        if (profileData.is_banned) {
          // Sign out the user
          await supabase.auth.signOut()
          router.push('/?message=banned')
          return
        }

        // Get business for this user
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .select('id')
          .eq('business_owner_id', user.id)
          .single()

        if (businessError || !business) {
          console.error('Error fetching business:', businessError)
          router.push('/business/dashboard')
          return
        }

        // Fetch reviews for this business with reviewer info
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            id,
            rating,
            comment,
            created_at,
            reviewer:profiles(name)
          `)
          .eq('reviewee_id', business.id)
          .order('created_at', { ascending: false })

        if (reviewsError) {
          console.error('Error fetching reviews:', reviewsError)
        } else {
          setReviews(reviewsData || [])
          setFilteredReviews(reviewsData || [])
        }

        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        router.push('/auth/login')
      }
    }

    fetchReviews()
  }, [router])

  useEffect(() => {
    let result = [...reviews]

    // Apply filter
    if (filter === "unanswered") {
      // This would require checking if there are replies, but for now we'll filter by rating
      result = result.filter(review => review.rating <= 3)
    } else if (filter === "negative") {
      result = result.filter(review => review.rating <= 3)
    } else if (filter === "positive") {
      result = result.filter(review => review.rating >= 4)
    }

    // Apply sorting
    if (sort === "oldest") {
      result.sort((a, b) => 
        new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime()
      )
    } else if (sort === "helpful") {
      // For now, we'll sort by rating as a proxy for helpfulness
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    }

    setFilteredReviews(result)
  }, [filter, sort, reviews])

  const handleReply = (reviewId: string) => {
    // Navigate to reply page or open modal
    router.push(`/business/reviews/${reviewId}`)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[calc(100vh-4rem)]">
          <Sidebar role="business" />
          <div className="flex-1 ml-64 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Customer Reviews</h1>
              <p className="text-muted-foreground mt-2">Respond to reviews and manage feedback</p>
            </div>
            <div className="flex items-center justify-center h-64">
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
        <Sidebar role="business" />
        <div className="flex-1 ml-64 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Customer Reviews</h1>
            <p className="text-muted-foreground mt-2">Respond to reviews and manage feedback</p>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-8">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Reviews" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="unanswered">Unanswered</SelectItem>
                <SelectItem value="negative">Negative (1-3 stars)</SelectItem>
                <SelectItem value="positive">Positive (4-5 stars)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Newest First" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="helpful">Most Helpful</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reviews */}
          {filteredReviews.length > 0 ? (
            <div className="space-y-6">
              {filteredReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  author={review.reviewer?.name || "Anonymous"}
                  rating={review.rating}
                  title={`Rating: ${review.rating} stars`}
                  content={review.comment || "No comment provided"}
                  date={review.created_at ? new Date(review.created_at).toLocaleDateString() : "Unknown date"}
                  verified
                  likes={0}
                  showReplyButton
                  onReply={() => handleReply(review.id)}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No reviews found matching your criteria.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setFilter("all")
                  setSort("newest")
                }}
              >
                Clear Filters
              </Button>
            </Card>
          )}
        </div>
      </main>
    </>
  )
}