"use client"

import { Navbar } from "@/components/navbar"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import Link from "next/link"
import { useBannedUserCheck } from "@/hooks/useBannedUserCheck"
import { Footer } from "@/components/footer"
import { 
  Shirt, 
  Hotel, 
  Utensils, 
  TabletSmartphone, 
  Folder, 
  Hospital, 
  ShoppingBag, 
  Briefcase, 
  Drama, 
  Car, 
  Home, 
  Sparkles, 
  Dumbbell, 
  Laptop, 
  Plane, 
  Book, 
  Wallet, 
  PawPrint,
  Stethoscope
} from "lucide-react"

interface Subcategory {
  id: string
  name: string
  category_id: string
}

interface Category {
  id: string
  name: string
  icon: string | null
  bg_color: string | null
  created_at: string | null
  subcategories: Subcategory[]
}

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  useBannedUserCheck("public", false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch categories")
      }

      setCategories(data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching categories:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(
          `/api/explore?search=${encodeURIComponent(searchQuery)}&limit=5`
        )
        const data = await response.json()

        if (response.ok) {
          setSuggestions(data.businesses || [])
          setShowSuggestions(true)
        } else {
          setSuggestions([])
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error)
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const filteredCategories = categories
    .map((category) => ({
      ...category,
      subcategories: category.subcategories.filter(
        (sub) =>
          sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          category.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(
      (cat) =>
        cat.subcategories.length > 0 ||
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

  const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
    "shirt": Shirt,
    "hotel": Hotel,
    "utensils": Utensils,
    "tablet-smartphone": TabletSmartphone,
    "tooth": Stethoscope,
    "folder": Folder,
    "hospital": Hospital,
    "shopping-bag": ShoppingBag,
    "briefcase": Briefcase,
    "drama": Drama,
    "car": Car,
    "home": Home,
    "sparkles": Sparkles,
    "dumbbell": Dumbbell,
    "laptop": Laptop,
    "plane": Plane,
    "book": Book,
    "wallet": Wallet,
    "paw-print": PawPrint,
  }

  const handleSuggestionClick = (business: any) => {
    setSearchQuery("")
    setShowSuggestions(false)
    window.location.href = `/service/${business.id}`
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setShowSuggestions(false)
      window.location.href = `/explore?search=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200)
  }

  const handleFocus = () => {
    if (searchQuery.trim().length >= 2) {
      setShowSuggestions(true)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background" />
      </>
    )
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-background">
        {/* HERO */}
        <div className="bg-slate-50 dark:bg-slate-900/50 py-12">
          <div className="container-app">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">
              What are you looking for?
            </h1>

            <div className="max-w-2xl mx-auto relative">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search for services, categories, or locations"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className="pl-12 h-12"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* CATEGORIES – MASONRY */}
        <div className="container-app py-16">
          <h2 className="text-2xl font-bold mb-8">
            Explore companies by category
          </h2>

          <div className="columns-1 md:columns-2 lg:columns-4 gap-6">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="break-inside-avoid mb-6 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <Link
                  href={`/explore?category=${category.id}`}
                  className={`${category.bg_color || "bg-gray-100"} block px-6 py-8 text-center`}
                >
                  <div className="flex justify-center mb-2">
                    {(() => {
                      const Icon =
                        iconComponents[category.icon || ""] || Folder
                      return <Icon className="w-8 h-8" />
                    })()}
                  </div>
                  <h3 className="text-lg font-semibold">
                    {category.name}
                  </h3>
                </Link>

                {/* Subcategories */}
                <div className="divide-y">
                  {category.subcategories.map((subcategory) => (
                    <Link
                      key={subcategory.id}
                      href={`/explore?category=${category.id}&subcategory=${encodeURIComponent(subcategory.name)}`}
                      className="block px-6 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      {subcategory.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
