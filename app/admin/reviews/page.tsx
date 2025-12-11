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
import { Star, ShieldAlert, CheckCircle, Eye, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Review {
  id: string
  business_name: string | null
  reviewer_name: string | null
  rating: number | null
  comment: string | null
  is_verified: boolean | null
  created_at: string | null
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
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

        // Fetch all reviews with business and user info
        await fetchReviews()

        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        router.push('/admin/login')
      }
    }

    fetchData()
  }, [router])

  const fetchReviews = async () => {
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
      setReviews(reviewsData)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('Failed to fetch reviews')
      setReviews([])
    }
  }

  const handleVerifyReview = async (reviewId: string) => {
    setVerifying(reviewId)
    
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_verified: true })
      })

      if (!response.ok) {
        throw new Error('Failed to verify review')
      }

      // Update local state
      setReviews(reviews.map(review => 
        review.id === reviewId ? { ...review, is_verified: true } : review
      ))

      toast.success('Review verified successfully')
    } catch (error) {
      console.error('Error verifying review:', error)
      toast.error('Failed to verify review')
    } finally {
      setVerifying(null)
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return
    }

    setDeleting(reviewId)
    
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete review')
      }

      // Update local state
      setReviews(reviews.filter(review => review.id !== reviewId))

      toast.success('Review deleted successfully')
    } catch (error) {
      console.error('Error deleting review:', error)
      toast.error('Failed to delete review')
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date'
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
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
            <h1 className="text-3xl font-bold">Review Management</h1>
            <p className="text-muted-foreground mt-2">Moderate and manage platform reviews</p>
          </div>

          {/* Reviews Table */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">All Reviews</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldAlert className="w-4 h-4" />
                <span>{reviews.filter(r => !r.is_verified).length} pending moderation</span>
              </div>
            </div>
            
            {reviews.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">{review.business_name}</TableCell>
                      <TableCell>{review.reviewer_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {review.rating}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {review.comment || "-"}
                      </TableCell>
                      <TableCell>{formatDate(review.created_at)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={review.is_verified ? "default" : "secondary"}
                        >
                          {review.is_verified ? "Verified" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!review.is_verified && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerifyReview(review.id)}
                              disabled={verifying === review.id}
                            >
                              {verifying === review.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-white"></div>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Verify
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteReview(review.id)}
                            disabled={deleting === review.id}
                          >
                            {deleting === review.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Eye className="w-12 h-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 font-medium">No reviews found</h3>
                <p className="text-muted-foreground mt-1">
                  There are no reviews in the system yet.
                </p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </>
  )
}