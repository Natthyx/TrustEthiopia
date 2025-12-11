"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, CheckCircle, XCircle, Send, Eye, Settings } from "lucide-react"
import { useBannedUserCheck } from '@/hooks/useBannedUserCheck'
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

export default function AdminBlogPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [filteredBlogPosts, setFilteredBlogPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  
  const router = useRouter()
  const supabase = createClient()

  // Check if user is banned
  useBannedUserCheck('user')

  useEffect(() => {
    const fetchBlogPosts = async () => {
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

        // Fetch all blog posts with business info using API
        const response = await fetch('/api/admin/blogs', {
          headers: {
            'Authorization': `Bearer ${await supabase.auth.getSession().then(res => res.data.session?.access_token)}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch blog posts')
        }

        const data = await response.json()
        setBlogPosts(data || [])
        setFilteredBlogPosts(data || [])
        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        toast.error('An unexpected error occurred')
        router.push('/admin/login')
      }
    }

    fetchBlogPosts()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredBlogPosts(blogPosts)
    } else {
      const filtered = blogPosts.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.business?.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredBlogPosts(filtered)
    }
  }, [searchTerm, blogPosts])

  const handleApprove = async (postId: string) => {
    setProcessing(postId)
    try {
      const response = await fetch(`/api/admin/blogs/${postId}/approve`, {
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
      setBlogPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, status: 'approved' } : post
      ))
      
      setFilteredBlogPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, status: 'approved' } : post
      ))
      
      toast.success('Blog post approved successfully!')
    } catch (error) {
      console.error('Error approving blog post:', error)
      toast.error('Failed to approve blog post')
    } finally {
      setProcessing(null)
    }
  }

  const handleWithdraw = async (postId: string) => {
    setProcessing(postId)
    try {
      const response = await fetch(`/api/admin/blogs/${postId}/withdraw`, {
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
      setBlogPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, status: 'withdrawn' } : post
      ))
      
      setFilteredBlogPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, status: 'withdrawn' } : post
      ))
      
      toast.success('Blog post withdrawn successfully!')
    } catch (error) {
      console.error('Error withdrawing blog post:', error)
      toast.error('Failed to withdraw blog post')
    } finally {
      setProcessing(null)
    }
  }

  const handlePublish = async (postId: string) => {
    setProcessing(postId)
    try {
      const response = await fetch(`/api/admin/blogs/${postId}/publish`, {
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
      setBlogPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, status: 'published', published: true } : post
      ))
      
      setFilteredBlogPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, status: 'published', published: true } : post
      ))
      
      toast.success('Blog post published successfully!')
    } catch (error) {
      console.error('Error publishing blog post:', error)
      toast.error('Failed to publish blog post')
    } finally {
      setProcessing(null)
    }
  }

  const handleUnpublish = async (postId: string) => {
    setProcessing(postId)
    try {
      const response = await fetch(`/api/admin/blogs/${postId}/unpublish`, {
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
      setBlogPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, published: false } : post
      ))
      
      setFilteredBlogPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, published: false } : post
      ))
      
      toast.success('Blog post unpublished successfully!')
    } catch (error) {
      console.error('Error unpublishing blog post:', error)
      toast.error('Failed to unpublish blog post')
    } finally {
      setProcessing(null)
    }
  }

  const handleView = (postId: string) => {
    // Navigate to view the blog post detail
    router.push(`/admin/blog/${postId}`)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading blog posts...</p>
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
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold">Blog Management</h1>
                <p className="text-muted-foreground mt-2">
                  Manage blog posts submitted by businesses
                </p>
              </div>
              <Button 
                onClick={() => router.push('/admin/blog/manage')}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                Content Management
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search blog posts..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBlogPosts.length > 0 ? (
                  filteredBlogPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium max-w-xs truncate">{post.title}</TableCell>
                      <TableCell>{post.business?.business_name || "Unknown Business"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            post.status === "published"
                              ? "default"
                              : post.status === "pending"
                                ? "secondary"
                                : post.status === "approved"
                                  ? "outline"
                                  : post.status === "withdrawn"
                                    ? "destructive"
                                    : post.status === "unpublished"
                                      ? "secondary"
                                      : "secondary"
                          }
                        >
                          {post.status === "published" ? "Published" :
                           post.status === "pending" ? "Pending Review" :
                           post.status === "approved" ? "Approved" :
                           post.status === "withdrawn" ? "Withdrawn" :
                           post.status === "unpublished" ? "Unpublished" :
                           "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={post.published ? "default" : "secondary"}>
                          {post.published ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {post.created_at ? new Date(post.created_at).toLocaleDateString() : "Unknown date"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleView(post.id)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          
                          {post.status === "pending" && (
                            <>
                              <Button 
                                size="sm" 
                                className="gap-2 bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(post.id)}
                                disabled={processing === post.id}
                              >
                                {processing === post.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="gap-2"
                                onClick={() => handleWithdraw(post.id)}
                                disabled={processing === post.id}
                              >
                                {processing === post.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                                Withdraw
                              </Button>
                            </>
                          )}
                          
                          {post.status === "approved" && (
                            <Button 
                              size="sm" 
                              className="gap-2 bg-green-600 hover:bg-green-700"
                              onClick={() => handlePublish(post.id)}
                              disabled={processing === post.id}
                            >
                              {processing === post.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                              Publish
                            </Button>
                          )}
                          
                          {post.status === "published" && post.published && (
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="gap-2"
                              onClick={() => handleUnpublish(post.id)}
                              disabled={processing === post.id}
                            >
                              {processing === post.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                              Unpublish
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No blog posts found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </main>
    </>
  )
}