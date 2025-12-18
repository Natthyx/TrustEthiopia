"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { ServiceCard } from "@/components/service-card"
import { ServiceListItem } from "@/components/service-list-item"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Search, Filter, Star, Grid, List } from "lucide-react"
import { useSearchParams } from 'next/navigation'
import { Footer } from "@/components/footer"
import Link from "next/link"

interface Service {
  id: string
  name: string
  imageUrl: string
  category: string
  rating: number
  reviewCount: number
  location?: string
  description?: string
}

interface Category {
  id: string
  name: string
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNext: boolean
  hasPrev: boolean
}

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("rating")
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  })
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const searchParams = useSearchParams()
  
  // Get parameters from URL
  const subcategoryParam = searchParams.get('subcategory')
  const categoryParam = searchParams.get('category')
  const searchQueryParam = searchParams.get('search')

  // Use URL parameter as the source of truth for selected category
  const selectedCategory = categoryParam || "all"

  // Initialize search query from URL parameter
  useEffect(() => {
    if (searchQueryParam) {
      setSearchQuery(searchQueryParam)
    }
  }, [searchQueryParam])

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1)
  }, [categoryParam, subcategoryParam, searchQuery, sortBy])

  useEffect(() => {
    fetchBusinesses()
  }, [searchQuery, selectedCategory, sortBy, subcategoryParam, currentPage, categoryParam])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch categories')
      }
      
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchBusinesses = async () => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory)
      if (subcategoryParam) params.append('subcategory', subcategoryParam)
      if (sortBy) params.append('sort', sortBy)
      params.append('page', currentPage.toString())
      params.append('limit', '12')
      
      const response = await fetch(`/api/explore?${params.toString()}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch businesses')
      }
      
      // Transform data to match ServiceCard expectations
      const transformedServices = data.businesses.map((business: any) => ({
        id: business.id,
        name: business.name,
        imageUrl: business.imageUrl || "/placeholder-service-image.svg", // Use real image URL
        category: business.category || "Service", // Use real category
        rating: business.rating || 0,
        reviewCount: business.reviewCount || 0,
        location: business.location || business.address || "",
        description: business.description || ""
      }))
      
      setServices(transformedServices)
      setPagination(data.pagination)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching businesses:', error)
      setLoading(false)
    }
  }

  const handleCategoryChange = (value: string) => {
    // Update URL when category changes
    const params = new URLSearchParams(window.location.search)
    if (value === 'all') {
      params.delete('category')
    } else {
      params.set('category', value)
    }
    // Reset to first page when category changes
    params.set('page', '1')
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Update URL with search query
    const params = new URLSearchParams(window.location.search)
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim())
    } else {
      params.delete('search')
    }
    // Reset to first page when search changes
    params.set('page', '1')
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Navbar/>
      <main className="min-h-screen">
        <div className="container-app py-8">
          {/* Header with Breadcrumbs */}
          <div className="mb-8">
            {/* Breadcrumb Navigation */}
            {(categoryParam || subcategoryParam || searchQueryParam) && (
              <nav className="mb-4">
                <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="/explore" className="hover:text-primary transition-colors">
                      Explore
                    </Link>
                  </li>
                  {(categoryParam && categories.length > 0) && (
                    <>
                      <li>/</li>
                      <li>
                        {subcategoryParam ? (
                          <Link 
                            href={`/explore?category=${categoryParam}`} 
                            className="hover:text-primary transition-colors"
                          >
                            {categories.find(cat => cat.id === categoryParam)?.name || 'Category'}
                          </Link>
                        ) : (
                          <span className="text-foreground">
                            {categories.find(cat => cat.id === categoryParam)?.name || 'Category'}
                          </span>
                        )}
                      </li>
                    </>
                  )}
                  {subcategoryParam && (
                    <>
                      <li>/</li>
                      <li>
                        <span className="text-foreground">
                          {subcategoryParam}
                        </span>
                      </li>
                    </>
                  )}
                  {searchQueryParam && (
                    <>
                      <li>/</li>
                      <li>
                        <span className="text-foreground">
                          Search: "{searchQueryParam}"
                        </span>
                      </li>
                    </>
                  )}
                </ol>
              </nav>
            )}
            
            <h1 className="text-3xl font-bold mb-2">
              {searchQueryParam 
                ? `Search Results for "${searchQueryParam}"`
                : subcategoryParam 
                ? subcategoryParam 
                : categoryParam && categories.length > 0
                ? `Best in ${categories.find(cat => cat.id === categoryParam)?.name || 'Category'}`
                : 'Explore Services'}
            </h1>
            <p className="text-muted-foreground">
              {searchQueryParam 
                ? `Found ${pagination.totalCount} businesses matching "${searchQueryParam}"`
                : subcategoryParam 
                ? `Discover and review businesses in ${subcategoryParam}` 
                : categoryParam && categories.length > 0
                ? `Discover the best businesses in ${categories.find(cat => cat.id === categoryParam)?.name || 'this category'}`
                : 'Discover and review thousands of businesses'}
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <form onSubmit={handleSearch} className="w-full">
                <Input
                  placeholder="Search services, locations, categories..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="reviews">Most Reviewed</SelectItem>
                <SelectItem value="recent">Recently Added</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button 
                variant={viewMode === "grid" ? "default" : "outline"} 
                size="icon"
                onClick={() => setViewMode("grid")}
                className="h-10 w-10"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === "list" ? "default" : "outline"} 
                size="icon"
                onClick={() => setViewMode("list")}
                className="h-10 w-10"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden bg-transparent">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-8 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Rating</h3>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((r) => (
                        <label key={r} className="flex items-center gap-3 text-sm">
                          <input type="checkbox" className="rounded" />
                          <span className="flex items-center gap-2">
                            {r} <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Results Grid */}
          {!loading && (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service) => (
                    <ServiceCard key={service.id} {...service} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {services.map((service) => (
                    <ServiceListItem key={service.id} {...service} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!loading && services.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No services found matching your criteria.</p>
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <Button 
                variant="outline" 
                disabled={!pagination.hasPrev}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
              >
                Previous
              </Button>
              
              {/* Show page numbers with ellipsis for large page counts */}
              {pagination.totalPages <= 7 ? (
                // Show all pages if 7 or fewer
                Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <Button 
                    key={page} 
                    variant={page === pagination.currentPage ? "default" : "outline"}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                ))
              ) : (
                // Show ellipsis for larger page counts
                <>
                  {/* First page */}
                  <Button 
                    variant={1 === pagination.currentPage ? "default" : "outline"}
                    onClick={() => handlePageChange(1)}
                  >
                    1
                  </Button>
                  
                  {/* Ellipsis if current page is far from start */}
                  {pagination.currentPage > 3 && (
                    <span className="px-2 py-2">...</span>
                  )}
                  
                  {/* Pages around current page */}
                  {Array.from({ length: 3 }, (_, i) => pagination.currentPage - 1 + i)
                    .filter(page => page > 1 && page < pagination.totalPages)
                    .map(page => (
                      <Button 
                        key={page} 
                        variant={page === pagination.currentPage ? "default" : "outline"}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    ))}
                  
                  {/* Ellipsis if current page is far from end */}
                  {pagination.currentPage < pagination.totalPages - 2 && (
                    <span className="px-2 py-2">...</span>
                  )}
                  
                  {/* Last page */}
                  <Button 
                    variant={pagination.totalPages === pagination.currentPage ? "default" : "outline"}
                    onClick={() => handlePageChange(pagination.totalPages)}
                  >
                    {pagination.totalPages}
                  </Button>
                </>
              )}
              
              <Button 
                variant="outline" 
                disabled={!pagination.hasNext}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}