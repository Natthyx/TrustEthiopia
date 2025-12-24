"use client"

import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, ArrowRight, Search } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Footer } from "@/components/footer"

interface BlogPost {
  id: string
  title: string
  excerpt: string
  author: string
  date: string
  image: string
  readTime: string
  is_featured: boolean | null
  is_trending: boolean | null
}

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null)
  const [trendingPosts, setTrendingPosts] = useState<BlogPost[]>([])

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const response = await fetch('/api/blog')
        if (!response.ok) {
          throw new Error('Failed to fetch blog posts')
        }
        
        const data = await response.json()
        
        // Separate featured and trending posts based on database values
        const featured = data.find((post: BlogPost) => post.is_featured) || null;
        const trending = data.filter((post: BlogPost) => post.is_trending);
        const regular = data.filter((post: BlogPost) => !post.is_featured && !post.is_trending);
        
        setFeaturedPost(featured);
        setTrendingPosts(trending);
        setBlogPosts(regular); // Only regular posts in the main list
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching blog posts:', error)
      }
    }

    fetchBlogPosts()
  }, [])

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
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
      <main className="min-h-screen">
        {/* Header */}
        <section className="py-12 px-4 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
          <div className="container-app">
            <h1 className="text-4xl font-bold mb-4">Blog</h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Insights, tips, and guides to help you make the most of Trust Ethiopia
            </p>
          </div>
        </section>

        {/* Search */}
        {/* <section className="py-8 px-4 border-b border-border">
          <div className="container-app">
            <div className="max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </section> */}

        {/* Featured Post */}
        <section className="py-12 px-4">
          <div className="container-app">
            {featuredPost && (
              <Card className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                  <div className="relative h-64 md:h-80 rounded-lg overflow-hidden">
                    <Image src={featuredPost.image} alt="Featured" fill className="object-cover" />
                  </div>
                  <div className="flex flex-col justify-between">
                    <div>
                      <Badge className="mb-4">Featured</Badge>
                      <h2 className="text-2xl font-bold mb-3">{featuredPost.title}</h2>
                      <p className="text-muted-foreground mb-4">
                        {featuredPost.excerpt}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        {featuredPost.author}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />{featuredPost.date}
                      </div>
                      <Button asChild className="ml-auto gap-2">
                        <Link href={`/blog/${featuredPost.id}`}>
                          Read More <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </section>
        
        {/* Trending Posts */}
        {trendingPosts.length > 0 && (
          <section className="py-8 px-4 bg-muted/30">
            <div className="container-app">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Trending Now</h2>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                  Trending
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trendingPosts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative h-48 bg-muted overflow-hidden">
                        <Image
                          src={post.image || "/placeholder.svg"}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold line-clamp-2 mb-2">{post.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{post.excerpt}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            {post.author}
                          </div>
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Blog Grid */}
        <section className="py-12 px-4">
          <div className="container-app">
            <h2 className="text-2xl font-bold mb-8">{trendingPosts.length > 0 ? 'More Articles' : 'Latest Articles'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                    <div className="relative h-40 bg-muted overflow-hidden">
                      <Image
                        src={post.image || "/placeholder.svg"}
                        alt={post.title}
                        fill
                        className="object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-semibold line-clamp-2 mb-2">{post.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{post.excerpt}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3" />
                          {post.author}
                        </div>
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}