"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CategoryCard } from "@/components/category-card"
import { ServiceCard } from "@/components/service-card"
import { ReviewCardLanding } from "@/components/review-card-landing"
import { Star, TrendingUp, Award, Users, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

interface Stat {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}

interface Category {
  id: string
  name: string
  count: number
  icon: string
  description: string
  bg_color?: string
}

interface Service {
  id: string
  name: string
  category: string
  rating: number
  reviewCount: number
  imageUrl: string
}

interface Review {
  id: string
  rating: number
  comment: string | null
  businessName: string
  reviewerName: string
  createdAt: string
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalReviews: number
  hasNext: boolean
  hasPrev: boolean
}

export default function HomePage() {
  const [stats, setStats] = useState<Stat[]>([
    { icon: Users, label: "Happy Users", value: "0" },
    { icon: Star, label: "Verified Reviews", value: "0" },
    { icon: Award, label: "Trusted Businesses", value: "0" },
    { icon: TrendingUp, label: "Monthly Growth", value: "0%" },
  ])
  
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredServices, setFeaturedServices] = useState<Service[]>([])
  const [recentReviews, setRecentReviews] = useState<Review[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalReviews: 0,
    hasNext: false,
    hasPrev: false
  })
  const [loading, setLoading] = useState(true)

  const fetchLandingData = async (page: number = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/landing?page=${page}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch landing page data')
      }
      
      // Format stats with real data
      setStats([
        { icon: Users, label: "Happy Users", value: formatNumber(data.stats.users) },
        { icon: Star, label: "Verified Reviews", value: formatNumber(data.stats.reviews) },
        { icon: Award, label: "Trusted Businesses", value: formatNumber(data.stats.businesses) },
        { icon: TrendingUp, label: "Monthly Growth", value: `${data.stats.monthlyGrowth}%` },
      ])
      
      // Set categories only on first load
      if (categories.length === 0) {
        setCategories(data.categories)
      }
      
      // Set featured services only on first load
      if (featuredServices.length === 0) {
        setFeaturedServices(data.featuredServices)
      }
      
      // Set recent reviews
      setRecentReviews(data.recentReviews || [])
      
      // Set pagination
      setPagination(data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalReviews: 0,
        hasNext: false,
        hasPrev: false
      })
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching landing page data:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLandingData()
  }, [])
  
  // Format large numbers (e.g., 1500000 -> 1.5M)
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M+'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K+'
    }
    return num.toString()
  }

  const handlePrevPage = () => {
    if (pagination.hasPrev) {
      fetchLandingData(pagination.currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (pagination.hasNext) {
      fetchLandingData(pagination.currentPage + 1)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
          <div className="container-app">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">Trusted by millions of users</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-pretty leading-tight">
                Discover Trusted <span className="gradient-text">Reviews</span>
              </h1>
              <p className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto">
                Make informed decisions with authentic reviews from real users. Find the best services in your area.
              </p>
              <div className="flex items-center gap-3 mt-8 justify-center">
                <Button size="lg" asChild>
                  <Link href="/categories">Browse Categories</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/auth/register">Write a Review</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4 bg-background">
          <div className="container-app">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, idx) => {
                const Icon = stat.icon
                return (
                  <Card key={idx} className="p-6 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 px-4 bg-muted/50">
          <div className="container-app">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Browse by Category</h2>
              <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
                Explore services across various industries and find exactly what you need.
              </p>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="h-32 animate-pulse bg-muted" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <CategoryCard key={category.id} {...category} />
                ))}
              </div>
            )}
            <div className="text-center mt-8">
              <Button variant="outline" asChild>
                <Link href="/categories">View All Categories</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Services */}
        <section className="py-16 px-4 bg-background">
          <div className="container-app">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Featured Services</h2>
              <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
                Discover top-rated services based on authentic user reviews.
              </p>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="h-64 animate-pulse bg-muted" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredServices.map((service) => (
                  <ServiceCard key={service.id} {...service} />
                ))}
              </div>
            )}
            <div className="text-center mt-8">
              <Button asChild>
                <Link href="/explore">Explore More Services</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Recent Reviews Section */}
        <section className="py-16 px-4 bg-muted/50">
          <div className="container-app">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Recent Reviews</h2>
              <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
                See what our community is saying about their latest experiences.
              </p>
            </div>
            
            {/* Pagination Controls - Top Right */}
            <div className="flex justify-end mb-4">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={!pagination.hasPrev || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!pagination.hasNext || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Card key={i} className="h-40 animate-pulse bg-muted" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recentReviews.map((review) => (
                  <ReviewCardLanding key={review.id} {...review} />
                ))}
              </div>
            )}
            
            
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-primary to-accent">
          <div className="container-app">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Share Your Experience
              </h2>
              <p className="text-primary-foreground/90 mb-8">
                Help others make better decisions by sharing your honest reviews of services you've experienced.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/auth/register">Write a Review</Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
