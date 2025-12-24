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
import { Search, Star, TrendingUp, Eye, ChevronUp, ChevronDown } from "lucide-react"
import { useBannedUserCheck } from '@/hooks/useBannedUserCheck'
import { toast } from "sonner"

interface BlogPost {
  id: string
  title: string
  content: string
  thumbnail_image: string | null
  published: boolean | null
  status: 'pending' | 'drafted' | 'approved' | 'withdrawn' | 'published' | 'unpublished' | null
  read_count: number | null
  created_at: string | null
  updated_at: string | null
  is_featured: boolean | null
  is_trending: boolean | null
  business: {
    business_name: string
    id: string
  } | null
}

export default function AdminBlogManagementPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [filteredBlogPosts, setFilteredBlogPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  // We no longer need client-side state for featured/trending as it's stored in the database
  // State for featured/trending is now stored in the database, so we use the values from blog posts
  const featuredPosts = blogPosts.filter(post => post.is_featured).map(post => post.id)
  const trendingPosts = blogPosts.filter(post => post.is_trending).map(post => post.id)
  const [processing, setProcessing] = useState<string | null>(null)
  
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

        // Fetch all published blog posts with business info using API
        const response = await fetch('/api/admin/blogs', {
          headers: {
            'Authorization': `Bearer ${await supabase.auth.getSession().then(res => res.data.session?.access_token)}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch blog posts')
        }

        const data = await response.json()
        // Filter only published or unpublished posts (not pending, drafted, approved, withdrawn)
        const visiblePosts = data.filter((post: BlogPost) => 
          post.status === 'published' || post.status === 'unpublished'
        )
        setBlogPosts(visiblePosts || [])
        setFilteredBlogPosts(visiblePosts || [])
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

  const toggleFeatured = async (postId: string) => {
    setProcessing(postId)
    try {
      // Toggle featured status by updating the database
      const isCurrentlyFeatured = blogPosts.find(post => post.id === postId)?.is_featured;
                  
      if (isCurrentlyFeatured) {
        // Remove from featured
        const response = await fetch(`/api/admin/blogs/${postId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${await supabase.auth.getSession().then(res => res.data.session?.access_token)}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ is_featured: false })
        })
              
        if (!response.ok) {
          throw new Error('Failed to update featured status')
        }
              
        // Update local blog posts state
        setBlogPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, is_featured: false } : post
        ))
              
        setFilteredBlogPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, is_featured: false } : post
        ))
      } else {
        // First, unfeature any currently featured post
        const currentlyFeatured = blogPosts.find(post => post.is_featured);
        if (currentlyFeatured) {
          // Unfeature the current featured post
          await fetch(`/api/admin/blogs/${currentlyFeatured.id}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${await supabase.auth.getSession().then(res => res.data.session?.access_token)}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_featured: false })
          });
        }
              
        // Then feature the new post
        const response = await fetch(`/api/admin/blogs/${postId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${await supabase.auth.getSession().then(res => res.data.session?.access_token)}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ is_featured: true })
        })
              
        if (!response.ok) {
          throw new Error('Failed to update featured status')
        }
              
        // Update local blog posts state
        setBlogPosts(prev => {
          return prev.map(post => {
            if (post.id === currentlyFeatured?.id) {
              return { ...post, is_featured: false };
            } else if (post.id === postId) {
              return { ...post, is_featured: true };
            }
            return post;
          });
        });
              
        setFilteredBlogPosts(prev => {
          return prev.map(post => {
            if (post.id === currentlyFeatured?.id) {
              return { ...post, is_featured: false };
            } else if (post.id === postId) {
              return { ...post, is_featured: true };
            }
            return post;
          });
        });
      }
            
      const wasFeatured = blogPosts.find(post => post.id === postId)?.is_featured;
      toast.success(`Blog post ${wasFeatured ? 'removed from' : 'added to'} featured posts`)
    } catch (error) {
      console.error('Error toggling featured status:', error)
      toast.error('Failed to update featured status')
    } finally {
      setProcessing(null)
    }
  }

  const toggleTrending = async (postId: string) => {
    setProcessing(postId)
    try {
      // Toggle trending status by updating the database
      const isCurrentlyTrending = blogPosts.find(post => post.id === postId)?.is_trending;
            
      if (isCurrentlyTrending) {
        // Remove from trending
        const response = await fetch(`/api/admin/blogs/${postId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${await supabase.auth.getSession().then(res => res.data.session?.access_token)}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ is_trending: false })
        })
              
        if (!response.ok) {
          throw new Error('Failed to update trending status')
        }
              
        // Update local blog posts state
        setBlogPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, is_trending: false } : post
        ))
              
        setFilteredBlogPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, is_trending: false } : post
        ))
      } else {
        // Add to trending
        const response = await fetch(`/api/admin/blogs/${postId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${await supabase.auth.getSession().then(res => res.data.session?.access_token)}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ is_trending: true })
        })
              
        if (!response.ok) {
          throw new Error('Failed to update trending status')
        }
              
        // Update local blog posts state
        setBlogPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, is_trending: true } : post
        ))
              
        setFilteredBlogPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, is_trending: true } : post
        ))
      }
            
      const wasTrending = blogPosts.find(post => post.id === postId)?.is_trending;
      toast.success(`Blog post ${wasTrending ? 'removed from' : 'added to'} trending posts`)
    } catch (error) {
      console.error('Error toggling trending status:', error)
      toast.error('Failed to update trending status')
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
            <h1 className="text-3xl font-bold">Blog Content Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage featured posts, trending content, and editorial decisions
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search published blog posts..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Published</p>
                  <p className="text-2xl font-bold mt-2">{blogPosts.length}</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Eye className="w-5 h-5" />
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Featured Posts</p>
                  <p className="text-2xl font-bold mt-2">{featuredPosts.length}</p>
                </div>
                <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                  <Star className="w-5 h-5" />
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Trending Posts</p>
                  <p className="text-2xl font-bold mt-2">{trendingPosts.length}</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Trending</TableHead>
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
                      <TableCell>{post.read_count || 0}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={post.is_featured ? "default" : "outline"}
                          className="gap-2"
                          onClick={() => toggleFeatured(post.id)}
                          disabled={processing === post.id}
                        >
                          {processing === post.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : post.is_featured ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          )}
                          {post.is_featured ? "Featured" : "Feature"}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={post.is_trending ? "default" : "outline"}
                          className="gap-2"
                          onClick={() => toggleTrending(post.id)}
                          disabled={processing === post.id}
                        >
                          {processing === post.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : post.is_trending ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          )}
                          {post.is_trending ? "Trending" : "Trend"}
                        </Button>
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No published blog posts found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
          
          {/* Instructions */}
          <Card className="mt-8 p-6">
            <h3 className="font-semibold mb-2">Content Management Guide</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Featured Posts</strong>: Highlight important content on the main blog page</li>
              <li>• <strong>Trending Posts</strong>: Show popular content based on views and engagement</li>
              <li>• Click "Feature" or "Trend" to add posts to respective sections</li>
              <li>• Click again to remove posts from featured/trending sections</li>
            </ul>
          </Card>
        </div>
      </main>
    </>
  )
}