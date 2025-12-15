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
import { toast } from "sonner"

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string | null
  is_verified: boolean | null
  reviewer: {
    name: string | null
    profile_image_url: string | null
  } | null
  likes_count?: number | null
  review_comments?: Array<{
    id: string
    comment: string
    created_at: string | null
    commenter: {
      name: string | null
    } | null
  }> | null
}

export default function BusinessReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [sort, setSort] = useState("newest")
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({})
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

        // Fetch reviews for this business with reviewer info and replies
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            id,
            rating,
            comment,
            created_at,
            is_verified,
            likes_count,
            reviewer:profiles(name, profile_image_url),
            review_comments(
              id,
              comment,
              created_at,
              commenter:profiles(name)
            )
          `)
          .eq('reviewee_id', business.id)
          .order('created_at', { ascending: false })

        if (reviewsError) {
          console.error('Error fetching reviews:', reviewsError)
        } else {
          // Process reviews with replies
          const processedReviews = reviewsData?.map(review => ({
            ...review,
            replies: review.review_comments || []
          })) || []
          
          setReviews(processedReviews)
          setFilteredReviews(processedReviews)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        router.push('/auth/login')
      }
    }

    fetchReviews()
  }, [router])

  // Check user likes status
  useEffect(() => {
    const checkUserLikes = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Get all reviews this user has liked
          const { data: userLikesData, error } = await supabase
            .from('user_likes')
            .select('review_id')
            .eq('user_id', user.id)
          
          if (!error && userLikesData) {
            const likesMap: Record<string, boolean> = {}
            userLikesData.forEach(like => {
              likesMap[like.review_id] = true
            })
            setUserLikes(likesMap)
          }
        }
      } catch (error) {
        console.error('Error checking user likes:', error)
      }
    }
    
    checkUserLikes()
  }, [])

  // Handle like/unlike functionality
  const handleLike = async (reviewId: string) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("You must be logged in to like reviews")
        return
      }
      
      // Check if user has already liked this review
      const { data: existingLike, error: checkError } = await supabase
        .from('user_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('review_id', reviewId)
        .maybeSingle()
      
      if (checkError) {
        console.error('Error checking like status:', checkError)
        toast.error("Failed to like review")
        return
      }
      
      if (existingLike) {
        // Unlike - remove the like
        const { error: deleteError } = await supabase
          .from('user_likes')
          .delete()
          .eq('id', existingLike.id)
        
        if (deleteError) {
          console.error('Error unliking review:', deleteError)
          toast.error("Failed to unlike review")
          return
        }
        
        // Decrement review likes count
        const { error: updateError } = await supabase
          .from('reviews')
          .update({ likes_count: Math.max(0, (reviews.find(r => r.id === reviewId)?.likes_count || 0) - 1) })
          .eq('id', reviewId)
        
        if (updateError) {
          console.error('Error updating likes count:', updateError)
        }
        
        // Update local state
        setUserLikes(prev => {
          const newLikes = { ...prev }
          delete newLikes[reviewId]
          return newLikes
        })
        
        toast.success("Review unliked!")
      } else {
        // Like - add the like
        const { error: insertError } = await supabase
          .from('user_likes')
          .insert({
            user_id: user.id,
            review_id: reviewId
          })
        
        if (insertError) {
          console.error('Error liking review:', insertError)
          toast.error("Failed to like review")
          return
        }
        
        // Increment review likes count
        const { error: updateError } = await supabase
          .from('reviews')
          .update({ likes_count: (reviews.find(r => r.id === reviewId)?.likes_count || 0) + 1 })
          .eq('id', reviewId)
        
        if (updateError) {
          console.error('Error updating likes count:', updateError)
        }
        
        // Update local state
        setUserLikes(prev => ({ ...prev, [reviewId]: true }))
        
        toast.success("Review liked!")
      }
    } catch (error) {
      console.error('Error handling like:', error)
      toast.error("Failed to like review")
    }
  }

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
          <div className="flex-1 md:ml-64 p-8 pb-24 md:pb-8">
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
        <div className="flex-1 md:ml-64 p-8 pb-24 md:pb-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Customer Reviews</h1>
            <p className="text-muted-foreground mt-2">Respond to reviews and manage feedback</p>
          </div>

          {/* Filters - Responsive layout */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-40">
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
              <SelectTrigger className="w-full sm:w-40">
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
                  avatar={review.reviewer?.profile_image_url || undefined}
                  rating={review.rating}
                  title={`Rating: ${review.rating} stars`}
                  content={review.comment || "No comment provided"}
                  date={review.created_at ? new Date(review.created_at).toLocaleDateString() : "Unknown date"}
                  verified={review.is_verified || false}
                  likes={review.likes_count || 0}
                  replies={(review.review_comments || []).map((comment: any) => ({
                    author: comment.commenter?.name || "Business Owner",
                    content: comment.comment,
                    date: comment.created_at ? new Date(comment.created_at).toLocaleDateString() : "Unknown date"
                  }))}
                  showReplyButton
                  onReply={() => handleReply(review.id)}
                  reviewId={review.id}
                  isLiked={userLikes[review.id] || false}
                  onLike={() => handleLike(review.id)}
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