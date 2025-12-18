"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { TrustpilotHero } from "@/components/trustpilot-hero"
import { TrustpilotCategories } from "@/components/trustpilot-categories"
import { TrustpilotReviews } from "@/components/trustpilot-reviews"
import { BestInSection } from "@/components/best-in-section"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Footer } from "@/components/footer"

interface Category {
  id: string
  name: string
  count: number
  icon: string
  description: string
  bg_color?: string
}

interface Review {
  id: string
  rating: number
  comment: string | null
  businessName: string
  reviewerName: string
  createdAt: string
}

interface BestBusiness {
  id: string
  business_name: string
  website: string | null
  rating: number
  review_count: number
}

interface BestInCategory {
  categoryName: string
  categoryId: string | null
  subcategoryId: string | null
  subcategoryName: string | null
  businesses: BestBusiness[]
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalReviews: number
  hasNext: boolean
  hasPrev: boolean
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [recentReviews, setRecentReviews] = useState<Review[]>([])
  const [bestInCategories, setBestInCategories] = useState<BestInCategory[]>([])
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
      
      // Set categories only on first load
      if (categories.length === 0) {
        setCategories(data.categories)
      }
      
      // Set recent reviews
      setRecentReviews(data.recentReviews || [])
      
      // Set best in categories
      if (data.bestInCategories) {
        setBestInCategories(data.bestInCategories)
      }
      
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
      <main className="min-h-screen bg-background">
        <TrustpilotHero />
        
        {/* Categories Section */}
        <section className="py-16 px-4 bg-background">
          <div className="container-app mx-auto px-4">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <TrustpilotCategories categories={categories} />
            )}
          </div>
        </section>
        
        {/* Business Growth Promotion Section */}
        <section className="px-4 bg-background py-12">
          <div className="container-app mx-auto px-4">
            <div className="bg-primary rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Looking to grow your business?</h3>
                <p className="text-white/80">Strengthen your reputation with reviews on Trust Ethiopia.</p>
              </div>
              <Button variant="outline" className="bg-foreground hover:bg-foreground/90 text-white border-primary-foreground rounded-full px-8 w-full md:w-auto" asChild>
                <Link href="/auth/register?role=business">Get started</Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Best In Section */}
        {bestInCategories.length > 0 && (
          <section className="py-16 px-4 bg-background">
            <div className="container-app mx-auto px-4">
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <BestInSection categories={bestInCategories} />
              )}
            </div>
          </section>
        )}

        {/* About Trust Ethiopia */}
        <section className="py-16 px-4 bg-primary text-white">
          <div className="container-app max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Help millions make
              the right choice</h2>
            <p className="mb-8 text-white/80">
              Share your experience on Trust Ethiopia, where reviews
              make a difference.
            </p>
          </div>
        </section>
        {/* About Trust Ethiopia */}
        <section className="py-16 px-4 text-muted-foreground">
          <div className="container-app max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome to TRUST ETHIOPIA</h2>
            <p className="mb-8 text-muted-foreground">
              Your reliable guide to honest businesses across Ethiopia. We help you find trusted
              businesses, and service providers based on real reviews and community
              feedback. Together, we're building a fairer,
              more accountable marketplace.
            </p>
          </div>
        </section>
        {/* Recent Reviews Section */}
        <section className="py-16 px-4 bg-background">
          <div className="container-app mx-auto px-4">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <TrustpilotReviews 
                reviews={recentReviews} 
                pagination={pagination}
                onPageChange={fetchLandingData}
              />
            )}
          </div>
        </section>
        <Footer />
      </main>
    </>
  )
}
