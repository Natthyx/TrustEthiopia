"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RatingStars } from "./rating-stars"
import { createClient } from '@/lib/supabase/client'
import { toast } from "sonner"

interface WriteReviewInlineProps {
  businessName?: string
  businessId?: string
  onReviewSubmitted?: (newReview: {
    id: string
    rating: number
    comment: string | null
    reviewer_name: string
    reviewer_avatar?: string | null
    created_at: string
    is_verified: boolean
    likes: number
    replies: any[]
  }) => void
  hasUserReviewed?: boolean
}

export function WriteReviewInline({ 
  businessName = "Service",
  businessId,
  onReviewSubmitted,
  hasUserReviewed = false
}: WriteReviewInlineProps) {
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState("")
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const handleSubmit = async () => {
    if (!businessId) {
      toast.error("Business information is missing")
      return
    }

    setSubmitting(true)
    
    try {
      const supabase = createClient()

      // Get current logged-in user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        toast.error("You must be logged in to submit a review")
        setSubmitting(false)
        return
      }

      // Fetch user's profile name for optimistic update
      let reviewerName = 'Anonymous User'
      let reviewerAvatar = null
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, profile_image_url')
          .eq('id', user.id)
          .single()

        if (profile?.name) {
          reviewerName = profile.name
        } else if (user.email) {
          // Fallback to part of email if name not set
          reviewerName = user.email.split('@')[0]
        }
        
        reviewerAvatar = profile?.profile_image_url || null
      }

      // Insert review
      const { error } = await supabase
        .from('reviews')
        .insert({
          rating,
          comment: content || null,
          reviewee_id: businessId,
          reviewer_id: user.id,
          is_verified: false
        })

      if (error) {
        const isDuplicate =
          error.code === "23505" ||
          error.message?.includes("duplicate key value") ||
          error.message?.includes("reviews_reviewer_id_reviewee_id_key")

        if (isDuplicate) {
          toast.error("You have already submitted a review for this business.")
          setSubmitting(false)
          return
        }

        console.error("Error submitting review:", error)
        toast.error("Failed to submit review. Please try again.")
        setSubmitting(false)
        return
      }

      // Optimistic update: Add the review instantly to the UI
      onReviewSubmitted?.({
        id: `temp-${Date.now()}`, // temporary ID (real one will come via realtime)
        rating,
        comment: content || null,
        reviewer_name: reviewerName,
        reviewer_avatar: reviewerAvatar,
        created_at: new Date().toISOString(),
        is_verified: false,
        likes: 0,
        replies: []
      })

      // Success feedback
      toast.success("Review submitted successfully!")

      // Reset form
      setRating(0)
      setContent("")
      setStep(1)
      setIsVisible(false)

    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isVisible) {
    return (
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Customer Reviews</h2>
        <Button 
          onClick={() => setIsVisible(true)} 
          disabled={hasUserReviewed}
          title={hasUserReviewed ? "You have already reviewed this business" : undefined}
        >
          {hasUserReviewed ? "Already Reviewed" : "Write a Review"}
        </Button>
      </div>
    )
  }

  // Full form UI
  return (
    <div className="mb-8 p-6 border rounded-lg bg-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Write a Review</h3>
        <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
          Cancel
        </Button>
      </div>

      <div className="space-y-6">
        {/* STEP 1: Rating */}
        {step === 1 && (
          <>
            <div>
              <Label className="text-base font-medium mb-3 block">
                How would you rate your experience with {businessName}?
              </Label>
              <div className="flex justify-center py-4">
                <RatingStars 
                  rating={rating} 
                  interactive 
                  onChange={setRating} 
                  size="lg" 
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1 bg-transparent"
                onClick={() => setIsVisible(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                disabled={rating === 0} 
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {/* STEP 2: Write Review */}
        {step === 2 && (
          <>
            <div>
              <Label htmlFor="content" className="text-sm font-medium">
                Your Review
              </Label>
              <Textarea
                id="content"
                placeholder="Share details about your experience..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-2 h-32"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {content.length}/500 characters
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1 bg-transparent"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button 
                className="flex-1" 
                disabled={!content.trim() || submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
