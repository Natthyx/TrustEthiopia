"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useBannedUserCheck } from '@/hooks/useBannedUserCheck'
import { FileUp, Eye, Save, Send } from "lucide-react"
import { toast } from "sonner"

interface BusinessData {
  id: string
  business_name: string
}

interface BlogPost {
  id: string
  title: string
  content: string
  thumbnail_image: string | null
  published: boolean | null
  status: 'pending' | 'drafted' | 'approved' | 'withdrawn' | 'published' | 'unpublished' | null
  created_at: string | null
  updated_at: string | null
  is_featured: boolean | null
  is_trending: boolean | null
}
export default function BusinessBlogPage() {
  const [business, setBusiness] = useState<BusinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  })
  
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // Check if user is banned
  useBannedUserCheck('business')

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/auth/login')
          return
        }

        // Fetch business data
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('id, business_name')
          .eq('business_owner_id', user.id)
          .single()

        if (businessError) {
          console.error('Error fetching business:', businessError)
          toast.error('Failed to load business data')
        } else {
          setBusiness(businessData)
          // Fetch existing blog posts for this business
          fetchBlogPosts(businessData.id)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        toast.error('An unexpected error occurred')
        router.push('/auth/login')
      }
    }

    fetchBusinessData()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const fetchBlogPosts = async (businessId: string) => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('id, title, content, thumbnail_image, published, status, created_at, updated_at')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Type assertion to match our interface
      const typedData = data as BlogPost[]
      setBlogPosts(typedData || [])
    } catch (error) {
      console.error('Error fetching blog posts:', error)
      toast.error('Failed to load blog posts')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setThumbnailFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent, publish: boolean = false) => {
    e.preventDefault()
    if (!business) return

    setSaving(true)
    
    try {
      let thumbnailUrl = editingPost?.thumbnail_image || null
      
      // Upload thumbnail if provided
      if (thumbnailFile) {
        const fileExt = thumbnailFile.name.split('.').pop()
        const fileName = `${business.id}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('blog_thumbnail')
          .upload(fileName, thumbnailFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('blog_thumbnail')
          .getPublicUrl(fileName)
        
        thumbnailUrl = publicUrl
      }

      if (editingPost) {
        // Update existing blog post
        const { error } = await supabase
          .from('blogs')
          .update({
            title: formData.title,
            content: formData.content,
            thumbnail_image: thumbnailUrl,
            published: publish || false,
            status: publish ? 'pending' : 'drafted',
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPost.id)

        if (error) throw error
        toast.success(`Blog post ${publish ? 'submitted for review' : 'saved as draft'} successfully!`)
      } else {
        // Create new blog post
        const { error } = await supabase
          .from('blogs')
          .insert({
            title: formData.title,
            content: formData.content,
            business_id: business.id,
            thumbnail_image: thumbnailUrl,
            published: false, // Always false initially
            status: publish ? 'pending' : 'drafted',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (error) throw error
        toast.success(`Blog post ${publish ? 'submitted for review' : 'saved as draft'} successfully!`)
      }

      // Reset form
      setFormData({ title: "", content: "" })
      setThumbnailFile(null)
      setThumbnailPreview(null)
      setEditingPost(null)
      
      // Refresh blog posts
      fetchBlogPosts(business.id)
    } catch (error) {
      console.error('Error saving blog post:', error)
      toast.error('Failed to save blog post')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post)
    setFormData({
      title: post.title,
      content: post.content
    })
    setThumbnailPreview(post.thumbnail_image)
    setPreviewMode(false)
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return
    
    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', postId)

      if (error) throw error
      
      toast.success('Blog post deleted successfully!')
      
      // Refresh blog posts
      if (business) {
        fetchBlogPosts(business.id)
      }
      
      // Clear form if we were editing this post
      if (editingPost?.id === postId) {
        setFormData({ title: "", content: "" })
        setThumbnailFile(null)
        setThumbnailPreview(null)
        setEditingPost(null)
      }
    } catch (error) {
      console.error('Error deleting blog post:', error)
      toast.error('Failed to delete blog post')
    }
  }

  const handleCancel = () => {
    setFormData({ title: "", content: "" })
    setThumbnailFile(null)
    setThumbnailPreview(null)
    setEditingPost(null)
    setPreviewMode(false)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[calc(100vh-4rem)]">
          <Sidebar role="business" />
          <div className="flex-1 md:ml-64 p-8 pb-24 md:pb-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading blog dashboard...</p>
            </div>
          </div>
        </main>
      </>
    )
  }

  if (!business) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[calc(100vh-4rem)]">
          <Sidebar role="business" />
          <div className="flex-1 md:ml-64 p-8 pb-24 md:pb-8">
            <div className="text-center max-w-md mx-auto">
              <h2 className="text-2xl font-bold mb-4">Business Not Found</h2>
              <p className="text-muted-foreground mb-6">
                Please set up your business profile first to access the blog dashboard.
              </p>
              <Button onClick={() => router.push('/business/profile')}>
                Go to Business Profile
              </Button>
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
            <h1 className="text-3xl font-bold">Blog Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage blog posts for {business.business_name}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Blog Form */}
            <div className="lg:col-span-2">
              <Card className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-xl font-semibold">
                    {editingPost ? "Edit Blog Post" : "Create New Blog Post"}
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewMode(!previewMode)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {previewMode ? "Edit" : "Preview"}
                    </Button>
                  </div>
                </div>

                {!previewMode ? (
                  <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="Enter blog post title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="thumbnail">Thumbnail Image</Label>
                      <div className="mt-2">
                        {thumbnailPreview && (
                          <div className="mb-4">
                            <img 
                              src={thumbnailPreview} 
                              alt="Thumbnail preview" 
                              className="w-32 h-32 object-cover rounded-lg"
                            />
                          </div>
                        )}
                        <div className="relative">
                          <Input
                            id="thumbnail"
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full flex items-center gap-2"
                          >
                            <FileUp className="w-4 h-4" />
                            {thumbnailFile ? thumbnailFile.name : "Upload Thumbnail"}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Recommended size: 1200x630 pixels
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="content">Content *</Label>
                      <Textarea
                        id="content"
                        name="content"
                        placeholder="Write your blog post content here..."
                        value={formData.content}
                        onChange={handleInputChange}
                        rows={15}
                        required
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                      {editingPost && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                          disabled={saving}
                          className="w-full sm:w-auto"
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        type="submit"
                        variant="outline"
                        disabled={saving}
                        className="w-full sm:w-auto"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? "Saving..." : "Save Draft"}
                      </Button>
                      <Button
                        type="button"
                        onClick={(e) => handleSubmit(e, true)}
                        disabled={saving}
                        className="w-full sm:w-auto"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {saving ? "Publishing..." : "Publish"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <h1 className="text-2xl font-bold">{formData.title || "Untitled Post"}</h1>
                    {thumbnailPreview && (
                      <div className="relative h-64 rounded-lg overflow-hidden">
                        <img 
                          src={thumbnailPreview} 
                          alt="Blog thumbnail" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="prose max-w-none">
                      {formData.content ? (
                        <div dangerouslySetInnerHTML={{ __html: formData.content.replace(/\n/g, '<br />') }} />
                      ) : (
                        <p className="text-muted-foreground italic">No content yet...</p>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Blog Posts List */}
            <div>
              <Card className="p-4">
                <h2 className="text-xl font-semibold mb-4">Your Blog Posts</h2>
                {blogPosts.length > 0 ? (
                  <div className="space-y-4">
                    {blogPosts.map((post) => (
                      <div 
                        key={post.id} 
                        className={`border rounded-lg p-4 cursor-pointer hover:bg-muted transition-colors ${
                          editingPost?.id === post.id ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => handleEdit(post)}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                          <h3 className="font-medium line-clamp-2">{post.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                            post.status === 'published' 
                              ? "bg-green-100 text-green-800" 
                              : post.status === 'approved'
                              ? "bg-blue-100 text-blue-800"
                              : post.status === 'pending'
                              ? "bg-yellow-100 text-yellow-800"
                              : post.status === 'withdrawn'
                              ? "bg-red-100 text-red-800"
                              : post.status === 'unpublished'
                              ? "bg-gray-100 text-gray-800"
                              : "bg-gray-100 text-gray-800" // drafted
                          }`}>
                            {post.status === 'published' ? 'Published' :
                             post.status === 'approved' ? 'Approved' :
                             post.status === 'pending' ? 'Pending Review' :
                             post.status === 'withdrawn' ? 'Withdrawn' :
                             post.status === 'unpublished' ? 'Unpublished' :
                             'Draft'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Created: {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Unknown'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 mt-3">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs w-full sm:w-auto"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(post)
                            }}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="text-xs w-full sm:w-auto"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(post.id)
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No blog posts yet. Create your first post!
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}