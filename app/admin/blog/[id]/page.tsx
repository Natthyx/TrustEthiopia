"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useBannedUserCheck } from '@/hooks/useBannedUserCheck'
import { ArrowLeft, CheckCircle, XCircle, Send, Archive } from "lucide-react"
import { toast } from "sonner"

interface BlogPost {
  id: string
  title: string
  content: string
  thumbnail_image: string | null
  published: boolean | null
  status: 'pending' | 'drafted' | 'approved' | 'withdrawn' | 'published' | 'unpublished' | null
  created_at: string | null
  updated_at: string | null
  business: {
    business_name: string
    id: string
  } | null
}

export default function AdminBlogDetailPage() {
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  // Check if user is banned
  useBannedUserCheck('user')

  useEffect(() => {
    const fetchBlogPost = async () => {
      try {
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

        // Fetch the specific blog post with business info using API
        const response = await fetch(`/api/admin/blogs/${params.id as string}`, {
          headers: {
            'Authorization': `Bearer ${await supabase.auth.getSession().then(res => res.data.session?.access_token)}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch blog post')
        }

        const data = await response.json()
        setBlogPost(data || null)
        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        toast.error('An unexpected error occurred')
        router.push('/admin/blog')
      }
    }

    if (params.id) {
      fetchBlogPost()
    }
  }, [params.id, router])

  const handleApprove = async () => {
    if (!blogPost) return
    
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/blogs/${blogPost.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await supabase.auth.getSession().then(res => res.data.session?.access_token)}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to approve blog post')
      }

      // Update local state
      setBlogPost(prev => prev ? { ...prev, status: 'approved' } : null)
      
      toast.success('Blog post approved successfully!')
    } catch (error) {
      console.error('Error approving blog post:', error)
      toast.error('Failed to approve blog post')
    } finally {
      setProcessing(false)
    }
  }

  const handleWithdraw = async () => {
    if (!blogPost) return
    
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/blogs/${blogPost.id}/withdraw`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await supabase.auth.getSession().then(res => res.data.session?.access_token)}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to withdraw blog post')
      }

      // Update local state
      setBlogPost(prev => prev ? { ...prev, status: 'withdrawn' } : null)
      
      toast.success('Blog post withdrawn successfully!')
    } catch (error) {
      console.error('Error withdrawing blog post:', error)
      toast.error('Failed to withdraw blog post')
    } finally {
      setProcessing(false)
    }
  }

  const handlePublish = async () => {
    if (!blogPost) return
    
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/blogs/${blogPost.id}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await supabase.auth.getSession().then(res => res.data.session?.access_token)}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to publish blog post')
      }

      // Update local state
      setBlogPost(prev => prev ? { ...prev, status: 'published', published: true } : null)
      
      toast.success('Blog post published successfully!')
    } catch (error) {
      console.error('Error publishing blog post:', error)
      toast.error('Failed to publish blog post')
    } finally {
      setProcessing(false)
    }
  }

  const handleUnpublish = async () => {
    if (!blogPost) return
    
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/blogs/${blogPost.id}/unpublish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await supabase.auth.getSession().then(res => res.data.session?.access_token)}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to unpublish blog post')
      }

      // Update local state
      setBlogPost(prev => prev ? { ...prev, published: false } : null)
      
      toast.success('Blog post unpublished successfully!')
    } catch (error) {
      console.error('Error unpublishing blog post:', error)
      toast.error('Failed to unpublish blog post')
    } finally {
      setProcessing(false)
    }
  }

  const handleRepublish = async () => {
    if (!blogPost) return
    
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/blogs/${blogPost.id}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await supabase.auth.getSession().then(res => res.data.session?.access_token)}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to republish blog post')
      }

      // Update local state
      setBlogPost(prev => prev ? { ...prev, status: 'published', published: true } : null)
      
      toast.success('Blog post republished successfully!')
    } catch (error) {
      console.error('Error republishing blog post:', error)
      toast.error('Failed to republish blog post')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading blog post...</p>
          </div>
        </main>
      </>
    )
  }

  if (!blogPost) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Blog Post Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The requested blog post could not be found.
            </p>
            <Button onClick={() => router.push('/admin/blog')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog Management
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
        <Sidebar role="admin" />
        <div className="flex-1 ml-64 p-8">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => router.push('/admin/blog')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog Management
            </Button>
            
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold">{blogPost.title}</h1>
                <p className="text-muted-foreground mt-2">
                  Submitted by {blogPost.business?.business_name || 'Unknown Business'}
                </p>
              </div>
              
              <span className={`text-sm px-3 py-1 rounded-full ${
                blogPost.status === 'published' ? "bg-green-100 text-green-800" :
                blogPost.status === 'pending' ? "bg-blue-100 text-blue-800" :
                blogPost.status === 'approved' ? "bg-purple-100 text-purple-800" :
                blogPost.status === 'withdrawn' ? "bg-red-100 text-red-800" :
                blogPost.status === 'unpublished' ? "bg-gray-100 text-gray-800" :
                "bg-yellow-100 text-yellow-800"
              }`}>
                {blogPost.status === 'published' ? "Published" :
                 blogPost.status === 'pending' ? "Pending Review" :
                 blogPost.status === 'approved' ? "Approved" :
                 blogPost.status === 'withdrawn' ? "Withdrawn" :
                 blogPost.status === 'unpublished' ? "Unpublished" :
                 "Draft"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="p-6">
                {blogPost.thumbnail_image && (
                  <div className="relative h-64 rounded-lg overflow-hidden mb-6">
                    <img 
                      src={blogPost.thumbnail_image} 
                      alt="Blog thumbnail" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="prose max-w-none">
                  {blogPost.content ? (
                    <div dangerouslySetInnerHTML={{ __html: blogPost.content.replace(/\n/g, '<br />') }} />
                  ) : (
                    <p className="text-muted-foreground italic">No content available.</p>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-6 pt-4 border-t border-border">
                  <span>
                    Created: {blogPost.created_at ? new Date(blogPost.created_at).toLocaleString() : 'Unknown'}
                  </span>
                  <span>
                    Last Updated: {blogPost.updated_at ? new Date(blogPost.updated_at).toLocaleString() : 'Unknown'}
                  </span>
                </div>
              </Card>
            </div>

            <div>
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Actions</h2>
                
                <div className="space-y-3">
                  {blogPost.status === 'pending' && (
                    <>
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={handleApprove}
                        disabled={processing}
                      >
                        {processing ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Approve Post
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={handleWithdraw}
                        disabled={processing}
                      >
                        {processing ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Withdraw Post
                      </Button>
                    </>
                  )}
                  
                  {blogPost.status === 'approved' && (
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={handlePublish}
                      disabled={processing}
                    >
                      {processing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Publish Post
                    </Button>
                  )}
                  
                  {blogPost.status === 'published' && blogPost.published && (
                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onClick={handleUnpublish}
                      disabled={processing}
                    >
                      {processing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Archive className="w-4 h-4 mr-2" />
                      )}
                      Unpublish Post
                    </Button>
                  )}
                  
                  {blogPost.status === 'unpublished' && (
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={handleRepublish}
                      disabled={processing}
                    >
                      {processing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Republish Post
                    </Button>
                  )}
                </div>
                
                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="font-medium mb-2">Post Information</h3>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Status:</span> {blogPost.status}</p>
                    <p><span className="text-muted-foreground">Published:</span> {blogPost.published ? 'Yes' : 'No'}</p>
                    <p><span className="text-muted-foreground">Business ID:</span> {blogPost.business?.id || 'Unknown'}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}