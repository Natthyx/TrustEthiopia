"use client"

import { useState, useEffect } from "react"
import { WriteReviewInline } from "@/components/write-review-inline"
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ReviewCard } from "@/components/review-card"
import { RatingStars } from "@/components/rating-stars"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Globe, Clock, ChevronDown } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { toast } from "sonner"
import { Review } from "@/types/review"
import { Footer } from "./footer"
import RatingBars from "./rating-bars"

interface Business {
  id: string
  name: string
  location: string | null
  address: string | null
  phone: string | null
  website: string | null
  google_map_embed: string | null
  businessHours: any | null
  description: string | null
  rating: number
  reviewCount: number
  createdAt: string | null
  updatedAt: string | null
  categories: { id: string; name: string; icon: string | null; bg_color: string | null }[]
  subcategories: { id: string; name: string }[]
  images: { id: string; image_url: string; is_primary: boolean }[] // Add images property
}

interface ServiceClientWrapperProps {
  business: Business
  reviews: Review[]
  businessHours: { day: string; hours: string }[]
}

export function ServiceClientWrapper({ business, reviews, businessHours }: ServiceClientWrapperProps) {
  const [localReviews, setLocalReviews] = useState<Review[]>(reviews)
  const [hasUserReviewed, setHasUserReviewed] = useState(false)
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({})
  const [userCommentLikes, setUserCommentLikes] = useState<Record<string, boolean>>({})
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsPage, setReviewsPage] = useState(1)
  const [hasMoreReviews, setHasMoreReviews] = useState(true)
  const reviewsPerPage = 5

  // Calculate rating distribution and average
  const calculateRatingDistribution = () => {
    if (!localReviews || localReviews.length === 0) {
      // Default distribution if no reviews
      return {
        distribution: [
          { stars: "5-star", percentage: 0, fill: 0 },
          { stars: "4-star", percentage: 0, fill: 0 },
          { stars: "3-star", percentage: 0, fill: 0 },
          { stars: "2-star", percentage: 0, fill: 0 },
          { stars: "1-star", percentage: 0, fill: 0 },
        ],
        average: 0,
        total: 0
      };
    }

    const totalReviews = localReviews.length;
    const ratingCounts = [0, 0, 0, 0, 0]; // For ratings 1-5
    let totalRating = 0;

    localReviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingCounts[review.rating - 1]++;
        totalRating += review.rating;
      }
    });

    const distribution = ratingCounts.map((count, index) => {
      const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
      return {
        stars: `${index + 1}-star`,
        percentage,
        fill: percentage
      };
    }).reverse(); // Reverse to show 5-star first
    
    const average = totalReviews > 0 ? totalRating / totalReviews : 0;
    
    return {
      distribution,
      average,
      total: totalReviews
    };
  }

  // Track view with real IP using server action
  useEffect(() => {
  const trackView = async () => {
    try {
      await fetch('/api/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: business.id })
      })
    } catch (err) {
      // Silent fail — views are not critical
      console.log('View tracking failed (non-critical)')
    }
  }

  trackView()
}, [business.id])

  // Load user data: review status + likes
  useEffect(() => {
    const loadUserData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Has reviewed?
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('id')
        .eq('reviewee_id', business.id)
        .eq('reviewer_id', user.id)
        .maybeSingle()
      if (reviewData) setHasUserReviewed(true)

      // Review likes
      const { data: reviewLikes } = await supabase
        .from('user_likes')
        .select('review_id')
        .eq('user_id', user.id)
      if (reviewLikes) {
        const map = reviewLikes.reduce((acc, l) => ({ ...acc, [l.review_id]: true }), {} as Record<string, boolean>)
        setUserLikes(map)
      }

      // Comment likes
      const { data: commentLikes } = await supabase
        .from('user_comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
      if (commentLikes) {
        const map = commentLikes.reduce((acc, l) => ({ ...acc, [l.comment_id]: true }), {} as Record<string, boolean>)
        setUserCommentLikes(map)
      }
    }
    loadUserData()
  }, [business.id])

  // Fetch reviews with pagination
  const fetchReviews = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setReviewsLoading(true)
      }
      
      const supabase = createClient()
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          is_verified,
          likes_count,
          profiles(name, profile_image_url),
          review_comments(
            id,
            comment,
            created_at,
            likes_count,
            profiles(name)
          )
        `)
        .eq('reviewee_id', business.id)
        .order('created_at', { ascending: false })
        .range((page - 1) * reviewsPerPage, page * reviewsPerPage - 1)

      if (error) {
        console.error('Error fetching reviews:', error)
        return
      }

      const processed = data.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        reviewer_name: review.profiles?.name || 'Anonymous User',
        reviewer_avatar: review.profiles?.profile_image_url || null,
        created_at: review.created_at,
        is_verified: review.is_verified || false,
        likes: review.likes_count ?? 0,
        replies: (review.review_comments || []).map((c: any) => ({
          id: c.id,
          author: c.profiles?.name || 'Business Owner',
          content: c.comment,
          date: c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Unknown date',
          likes: c.likes_count ?? 0,
          isLiked: false
        }))
      }))

      // Apply current user's like status to replies
      const withReplyLikes = processed.map(review => ({
        ...review,
        replies: review.replies.map(reply => ({
          ...reply,
          isLiked: !!userCommentLikes[reply.id]
        }))
      }))

      if (append) {
        setLocalReviews(prev => [...prev, ...withReplyLikes])
      } else {
        setLocalReviews(withReplyLikes)
      }
      
      // Check if there are more reviews
      setHasMoreReviews(data.length === reviewsPerPage)
      setReviewsPage(page)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setReviewsLoading(false)
    }
  }

  // Load more reviews
  const loadMoreReviews = () => {
    fetchReviews(reviewsPage + 1, true)
  }

  // Fetch reviews real-time (updated version)
  useEffect(() => {
    fetchReviews(1, false)

    const supabase = createClient()
    const channel = supabase
      .channel('reviews-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `reviewee_id=eq.${business.id}` }, () => fetchReviews(1, false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'review_comments' }, () => fetchReviews(1, false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_likes' }, () => fetchReviews(1, false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_comment_likes' }, () => fetchReviews(1, false))
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [business.id, userCommentLikes])

  // Handle review like/unlike
  const handleLike = async (reviewId: string) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be logged in to like reviews")
        return
      }

      const { data: existing } = await supabase
        .from('user_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('review_id', reviewId)
        .maybeSingle()

      if (existing) {
        // Unlike
        await supabase.from('user_likes').delete().eq('id', existing.id)

        const currentReview = localReviews.find(r => r.id === reviewId)
        const newCount = Math.max(0, (currentReview?.likes ?? 0) - 1)
        await supabase
          .from('reviews')
          .update({ likes_count: newCount })
          .eq('id', reviewId)

        setUserLikes(prev => {
          const u = { ...prev }
          delete u[reviewId]
          return u
        })
        setLocalReviews(prev => prev.map(r =>
          r.id === reviewId ? { ...r, likes: newCount } : r
        ))

        toast.success("Review unliked!")
      } else {
        // Like
        await supabase.from('user_likes').insert({
          user_id: user.id,
          review_id: reviewId
        })

        const currentReview = localReviews.find(r => r.id === reviewId)
        const newCount = (currentReview?.likes ?? 0) + 1
        await supabase
          .from('reviews')
          .update({ likes_count: newCount })
          .eq('id', reviewId)

        setUserLikes(prev => ({ ...prev, [reviewId]: true }))
        setLocalReviews(prev => prev.map(r =>
          r.id === reviewId ? { ...r, likes: newCount } : r
        ))

        toast.success("Review liked!")
      }
    } catch (error) {
      console.error('Error handling review like:', error)
      toast.error("Failed to update like")
    }
  }

  // Handle reply (comment) like/unlike – FIXED VERSION
  const handleCommentLike = async (commentId: string) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be logged in to like replies")
        return
      }

      // Find current reply likes from local state
      const currentReply = localReviews
        .flatMap(review => review.replies || [])
        .find(r => r.id === commentId)

      const currentLikes = currentReply?.likes ?? 0

      const { data: existing } = await supabase
        .from('user_comment_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('comment_id', commentId)
        .maybeSingle()

      if (existing) {
        // Unlike
        await supabase.from('user_comment_likes').delete().eq('id', existing.id)

        const newCount = Math.max(0, currentLikes - 1)

        const { error: updateError } = await supabase
          .from('review_comments')
          .update({ likes_count: newCount })
          .eq('id', commentId)

        if (updateError) {
          console.error('Failed to update comment likes_count:', updateError)
          toast.error("Failed to unlike reply")
          return
        }

        setUserCommentLikes(prev => {
          const u = { ...prev }
          delete u[commentId]
          return u
        })

        setLocalReviews(prev => prev.map(review => ({
          ...review,
          replies: (review.replies || []).map(r =>
            r.id === commentId
              ? { ...r, likes: newCount, isLiked: false }
              : r
          )
        })))

        toast.success("Reply unliked")
      } else {
        // Like
        await supabase.from('user_comment_likes').insert({
          user_id: user.id,
          comment_id: commentId
        })

        const newCount = currentLikes + 1

        const { error: updateError } = await supabase
          .from('review_comments')
          .update({ likes_count: newCount })
          .eq('id', commentId)

        if (updateError) {
          console.error('Failed to update comment likes_count:', updateError)
          toast.error("Failed to like reply")
          return
        }

        setUserCommentLikes(prev => ({ ...prev, [commentId]: true }))

        setLocalReviews(prev => prev.map(review => ({
          ...review,
          replies: (review.replies || []).map(r =>
            r.id === commentId
              ? { ...r, likes: newCount, isLiked: true }
              : r
          )
        })))

        toast.success("Reply liked!")
      }
    } catch (error) {
      console.error('Error handling reply like:', error)
      toast.error("Something went wrong")
    }
  }

  const formatReviewDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date'
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    return date.toLocaleDateString('en-US', { timeZone: 'UTC' })
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* Details & Reviews */}
        <section className="py-12">
          <div className="container-app">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4">
                      {business.images && business.images.length > 0 && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={business.images.find(img => img.is_primary)?.image_url || business.images[0].image_url} 
                            alt={business.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <h1 className="text-3xl font-bold">{business.name}</h1>
                        <div className="flex-column items-center gap-4 mt-3">
                          {(() => {
                            const ratingData = calculateRatingDistribution();
                            return (
                              <RatingStars rating={ratingData.average} totalReviews={ratingData.total} />
                            );
                          })()}
                          {business.categories.map((category) => (
                            <Badge key={category.id} variant="secondary">{category.name}</Badge>
                          ))}
                          <div className="flex gap-4 mt-4">
                            {business.website && (
                              <a 
                                href={business.website.startsWith('http') ? business.website : `https://${business.website}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                              >
                                <Globe className="w-4 h-4" />
                                Visit Website
                              </a>
                            )}
                      </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>

                {/* Reviews Section */}
                <div>
                  

                  <WriteReviewInline 
                    businessName={business.name}
                    businessId={business.id}
                    hasUserReviewed={hasUserReviewed}
                    onReviewSubmitted={(newReview) => {
                      setLocalReviews(prev => [newReview, ...prev])
                      setHasUserReviewed(true)
                    }}
                  />

                  <div className="space-y-6">
                    {localReviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        author={review.reviewer_name || 'Anonymous User'}
                        avatar={review.reviewer_avatar || undefined}
                        rating={review.rating}
                        title={review.comment ? review.comment.substring(0, 60) + (review.comment.length > 60 ? '...' : '') : 'No comment'}
                        content={review.comment || ''}
                        date={formatReviewDate(review.created_at)}
                        verified={!!review.is_verified}
                        likes={review.likes}
                        replies={(review.replies || []).map(reply => ({
                          ...reply,
                          onLike: () => handleCommentLike(reply.id)
                        }))}
                        reviewId={review.id}
                        isLiked={userLikes[review.id] || false}
                        onLike={() => handleLike(review.id)}
                      />
                    ))}
                  </div>

                  <div className="mt-8 text-center">
                    {hasMoreReviews ? (
                      <Button 
                        variant="outline" 
                        onClick={loadMoreReviews}
                        disabled={reviewsLoading}
                      >
                        {reviewsLoading ? "Loading..." : "Load More Reviews"}
                      </Button>
                    ) : localReviews.length > 0 ? (
                      <p className="text-muted-foreground">You've reached the end of reviews.</p>
                    ) : (
                      <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                    )}
                  </div>
                </div>
                {/* Contact Info */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {business.address && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Address</p>
                          <p className="text-sm text-muted-foreground">{business.address}</p>
                        </div>
                      </div>
                    )}
                    {business.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Phone</p>
                          <p className="text-sm text-muted-foreground">{business.phone}</p>
                        </div>
                      </div>
                    )}
                    {business.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Website</p>
                          <a 
                            href={business.website.startsWith('http') ? business.website : `https://${business.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {business.website}
                          </a>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Hours</p>
                        <p className="text-sm text-muted-foreground">
                          {businessHours.find(h => h.day === 'Monday')?.hours || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Business Hours</h3>
                  <ul className="space-y-2 text-sm">
                    {businessHours.map((hour) => (
                      <li key={hour.day} className="flex justify-between">
                        <span>{hour.day}</span>
                        <span>{hour.hours}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6 sticky top-4">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Ratings</h3>
                  {(() => {
                    const ratingData = calculateRatingDistribution();
                    return (
                      <RatingBars 
                        ratingDistribution={ratingData.distribution} 
                        averageRating={ratingData.average} 
                        totalReviews={ratingData.total} 
                      />
                    );
                  })()}
                </Card>
                
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Location</h3>
                  <div className="aspect-video bg-muted rounded-lg relative overflow-hidden">
                    {business.google_map_embed ? (
                      <div 
                        dangerouslySetInnerHTML={{ __html: business.google_map_embed }} 
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>No map available</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}