'use client'

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export function TrustpilotHero() {
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Fetch search suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setIsLoading(true)
      try {
        // Call the search API endpoint
        const response = await fetch(`/api/explore?search=${encodeURIComponent(searchQuery)}&limit=5`)
        const data = await response.json()
        
        if (response.ok) {
          setSuggestions(data.businesses || [])
          setShowSuggestions(true)
        } else {
          setSuggestions([])
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }

    // Debounce the search to avoid too many API calls
    const debounceTimer = setTimeout(() => {
      fetchSuggestions()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Close suggestions and navigate to search results
      setShowSuggestions(false)
      router.push(`/explore?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSuggestionClick = (business: any) => {
    setSearchQuery("")
    setShowSuggestions(false)
    router.push(`/service/${business.id}`)
  }

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicks on suggestions
    setTimeout(() => setShowSuggestions(false), 200)
  }

  const handleFocus = () => {
    if (searchQuery.trim().length >= 2) {
      setShowSuggestions(true)
    }
  }

  return (
    <section className="relative overflow-hidden bg-background pt-20 pb-10 md:pt-35 md:pb-35">
      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <h1 className="text-5xl font-bold text-foreground mb-4">Find trusted Ethiopian businesses</h1>
        <p className="text-xl text-muted-foreground mb-12">እውነተኛ ቢዝነስ ያግኙ፣ ልምድዎትን ያካፍሉ፣ ታማኝ ኢትዪዽያን በአንድነት እንገነባ።</p>
        <div className="relative mx-auto max-w-2xl">
          <form onSubmit={handleSearch}>
            <div className="flex items-center gap-2 bg-card rounded-full shadow-md overflow-hidden border border-primary">
              <div className="flex-1 flex items-center pl-6 relative">
                <Search className="h-5 w-5 text-muted-foreground mr-3" />
                <Input
                  type="text"
                  placeholder="Search for services, categories, or locations"
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base pr-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                {isLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <Button type="submit" className="bg-primary hover:bg-primary/90 rounded-full h-12 w-12 mr-1">
                <Search className="h-5 w-5 text-primary-foreground" />
              </Button>
            </div>
          </form>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-card border border-border rounded-lg shadow-lg">
              {suggestions.map((business) => (
                <div
                  key={business.id}
                  className="px-4 py-3 hover:bg-muted cursor-pointer flex items-center gap-3"
                  onClick={() => handleSuggestionClick(business)}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                    {business.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{business.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {business.location || business.address 
                        ? `${business.location || business.address}` 
                        : business.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showSuggestions && suggestions.length === 0 && searchQuery.trim().length >= 2 && !isLoading && (
            <div className="absolute z-10 w-full mt-2 bg-card border border-border rounded-lg shadow-lg">
              <div className="px-4 py-3 text-muted-foreground">
                No results found
              </div>
            </div>
          )}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Used a service recently?{" "}
            <Link href="/auth/register" className="text-primary hover:underline">
              Write a review →
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}