import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, User, Clock, Share2, Heart } from "lucide-react"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Footer } from "@/components/footer"

interface BlogPost {
  id: string
  title: string
  content: string
  author: string
  date: string
  image: string
  readTime: string
  is_featured: boolean | null
  is_trending: boolean | null
}

async function getBlogPost(id: string): Promise<BlogPost | null> {
  try {
    // Call the API route to fetch the blog post
    const response = await fetch(
      `${process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_SITE_URL : 'http://localhost:3000'}/api/blog/${id}`,
      { 
        next: { 
          revalidate: 60 // Revalidate at most once every 60 seconds
        } 
      }
    )
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return null
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const blogPost = await getBlogPost(id)

  if (!blogPost) {
    notFound()
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen py-12">
        <article className="container-app max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <Badge className="mb-4">Guide</Badge>
            <h1 className="text-4xl font-bold mb-4">{blogPost.title}</h1>
            <p className="text-lg text-muted-foreground">
              {blogPost.content.substring(0, 150) + '...'}
            </p>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-border text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              By {blogPost.author}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />{blogPost.date}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />{blogPost.readTime}
            </div>
          </div>

          {/* Featured Image */}
          <div className="relative h-96 rounded-lg overflow-hidden mb-12">
            <Image src={blogPost.image} alt="Article" fill className="object-cover" />
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none mb-12">
            <p>
              {blogPost.content}
            </p>
          </div>

          {/* Author Card */}
          <Card className="p-6 mb-12 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src="/placeholder.svg?key=author" />
                <AvatarFallback>{blogPost.author.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{blogPost.author}</h3>
                <p className="text-sm text-muted-foreground">
                  Content contributor at ReviewTrust. Sharing insights to help users make informed decisions.
                </p>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mb-12 pb-12 border-b border-border">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Heart className="w-4 h-4" />
              Save Article
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>

          {/* Related Articles */}
          {/* <div>
            <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: "Tips for Writing Helpful Reviews",
                  category: "Tutorial",
                  author: "Mike Johnson",
                },
                {
                  title: "The Importance of Customer Reviews",
                  category: "Insights",
                  author: "John Smith",
                },
              ].map((article, idx) => (
                <Card key={idx} className="p-4 hover:shadow-md transition-shadow">
                  <Badge variant="outline" className="mb-2">
                    {article.category}
                  </Badge>
                  <h3 className="font-semibold mb-2">{article.title}</h3>
                  <p className="text-xs text-muted-foreground">By {article.author}</p>
                </Card>
              ))}
            </div>
          </div> */}
        </article>
      </main>
      <Footer />
    </>
  )
}