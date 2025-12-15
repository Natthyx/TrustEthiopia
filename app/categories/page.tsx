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
} from 'lucide-react'

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

  // Check if user is banned (for public pages, we don't redirect immediately)
  useBannedUserCheck('public', false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch categories')
      }

      setCategories(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setLoading(false)
    }
  }

  const filteredCategories = categories.map((category) => ({
    ...category,
    subcategories: category.subcategories.filter(
      (sub) =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  })).filter((cat) => cat.subcategories.length > 0 || cat.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Map category icon values to Lucide React components
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

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background">
          <div className="bg-slate-50 dark:bg-slate-900/50 py-12">
            <div className="container-app">
              <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">What are you looking for?</h1>
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-base border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="container-app py-16">
            <h2 className="text-2xl font-bold mb-8">Explore companies by category</h2>
            <div className="text-center py-8">
              <p>Loading categories...</p>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="bg-slate-50 dark:bg-slate-900/50 py-12">
          <div className="container-app">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">What are you looking for?</h1>
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="container-app py-16">
          <h2 className="text-2xl font-bold mb-8">Explore companies by category</h2>

          {filteredCategories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No categories found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Category Header */}
                  <Link 
                    href={`/explore?category=${category.id}`}
                    className={`${category.bg_color || "bg-gray-100"} dark:bg-slate-800 px-6 py-8 text-center block hover:opacity-90 transition-opacity`}
                  >
                    <div className="text-4xl mb-2 flex justify-center">
                      {(() => {
                        const IconComponent = iconComponents[category.icon || ""] || Folder;
                        return <IconComponent className="w-8 h-8" />;
                      })()}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{category.name}</h3>
                  </Link>

                  {/* Subcategories List */}
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {category.subcategories.map((subcategory) => (
                      <Link
                        key={subcategory.id}
                        href={`/explore?category=${category.id}&subcategory=${encodeURIComponent(subcategory.name)}`}
                        className="block px-6 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {subcategory.name}
                      </Link>
                    ))}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}