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
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { toast } from "sonner"
import { Review } from "@/types/review"

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

  // Fetch reviews real-time
  useEffect(() => {
    const fetchReviews = async () => {
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
          profiles(name),
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

      if (error) {
        console.error('Error fetching reviews:', error)
        return
      }

      const processed = data.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        reviewer_name: review.profiles?.name || 'Anonymous User',
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

      setLocalReviews(withReplyLikes)
    }

    fetchReviews()

    const supabase = createClient()
    const channel = supabase
      .channel('reviews-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `reviewee_id=eq.${business.id}` }, fetchReviews)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'review_comments' }, fetchReviews)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_likes' }, fetchReviews)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_comment_likes' }, fetchReviews)
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
        {/* Hero & Images */}
        <section className="bg-muted">
          <div className="container-app py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="md:col-span-2 relative h-96 rounded-lg overflow-hidden">
                <Image src="/placeholder-service-image.svg" alt={business.name} fill className="object-cover" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative h-[180px] rounded-lg overflow-hidden">
                    <Image
                      src={`/placeholder-service-image.svg?height=180&width=180&query=service-${i}`}
                      alt={`${business.name} Gallery ${i}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Details & Reviews */}
        <section className="py-12">
          <div className="container-app">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h1 className="text-3xl font-bold">{business.name}</h1>
                      <div className="flex items-center gap-4 mt-3">
                        <RatingStars rating={business.rating} totalReviews={business.reviewCount} />
                        {business.categories.map((category) => (
                          <Badge key={category.id} variant="secondary">{category.name}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-4">
                    {business.description || `${business.name} is dedicated to providing quality service to our customers.`}
                  </p>
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
                          <p className="text-sm text-muted-foreground">{business.website}</p>
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

                {/* Reviews Section */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Customer Reviews</h2>
                    <Button variant="outline" className="gap-2">
                      Sort by <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>

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
                    <Button variant="outline">Load More Reviews</Button>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
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
    </>
  )
}