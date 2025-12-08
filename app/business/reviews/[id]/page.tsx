"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RatingStars } from "@/components/rating-stars"
import { ArrowLeft } from "lucide-react"

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

export default function ReviewReplyPage() {
  const [review, setReview] = useState<Review | null>(null)
  const [comments, setComments] = useState<ReviewComment[]>([])
  const [replyText, setReplyText] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    const fetchReviewDetails = async () => {
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

        // Fetch the specific review with reviewer info
        const { data: reviewData, error: reviewError } = await supabase
          .from('reviews')
          .select(`
            id,
            rating,
            comment,
            created_at,
            reviewer:profiles(name)
          `)
          .eq('id', params.id as string)
          .eq('reviewee_id', business.id)
          .single()

        if (reviewError) {
          console.error('Error fetching review:', reviewError)
          router.push('/business/reviews')
          return
        }

        setReview(reviewData)

        // Fetch existing comments for this review
        const { data: commentsData, error: commentsError } = await supabase
          .from('review_comments')
          .select(`
            id,
            comment,
            created_at,
            commenter:profiles(name)
          `)
          .eq('review_id', reviewData.id)
          .order('created_at', { ascending: true })

        if (!commentsError) {
          setComments(commentsData || [])
        }

        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        router.push('/auth/login')
      }
    }

    if (params.id) {
      fetchReviewDetails()
    }
  }, [params.id, router])

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !review) return

    setSaving(true)

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        router.push('/auth/login')
        return
      }

      // Add comment to the review
      const { data: newComment, error: commentError } = await supabase
        .from('review_comments')
        .insert({
          review_id: review.id,
          commenter_id: user.id,
          comment: replyText
        })
        .select(`
          id,
          comment,
          created_at,
          commenter:profiles(name)
        `)
        .single()

      if (commentError) {
        console.error('Error adding comment:', commentError)
        // Show error to user
        return
      }

      // Add the new comment to the list
      setComments(prev => [...prev, newComment])
      setReplyText("")
    } catch (error) {
      console.error('Error submitting reply:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[calc(100vh-4rem)]">
          <Sidebar role="business" />
          <div className="flex-1 ml-64 p-8">
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
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.back()} 
              className="gap-2 pl-0 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Reviews
            </Button>
            <h1 className="text-3xl font-bold">Review Reply</h1>
            <p className="text-muted-foreground mt-2">Respond to customer feedback</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Review Details */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{review?.reviewer?.name || "Anonymous"}</h3>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Verified</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {review?.created_at ? new Date(review.created_at).toLocaleDateString() : "Unknown date"}
                    </p>
                    <RatingStars rating={review?.rating || 0} />
                    <p className="text-sm text-muted-foreground mt-3">
                      {review?.comment || "No comment provided"}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Existing Replies */}
              {comments.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-semibold">Previous Replies</h3>
                  {comments.map((comment) => (
                    <Card key={comment.id} className="p-4 bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-medium">{comment.commenter?.name || "Business Owner"}</h4>
                        <span className="text-xs text-muted-foreground">
                          {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : "Unknown date"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.comment}</p>
                    </Card>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              <Card className="p-6 mt-6">
                <h3 className="font-semibold mb-4">Add Your Reply</h3>
                <form onSubmit={handleReplySubmit}>
                  <div className="mb-4">
                    <Label htmlFor="reply" className="text-sm font-medium">
                      Your Response
                    </Label>
                    <Textarea
                      id="reply"
                      placeholder="Write your response to this review..."
                      className="mt-2 h-32"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving || !replyText.trim()}>
                      {saving ? "Sending..." : "Send Reply"}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>

            {/* Help Section */}
            <div>
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Tips for Responding</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></span>
                    Be professional and courteous
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></span>
                    Address specific concerns raised
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></span>
                    Offer solutions when possible
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></span>
                    Keep responses concise and clear
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}