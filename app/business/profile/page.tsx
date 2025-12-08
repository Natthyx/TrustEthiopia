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
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RatingStars } from "@/components/rating-stars"
import { Plus, X, ChevronDown, ChevronRight } from "lucide-react"

interface BusinessData {
  id: string
  business_name: string
  location: string | null
  website: string | null
  description: string | null
  rating_count: number | null
}

interface Category {
  id: string
  name: string
}

interface Subcategory {
  id: string
  name: string
  category_id: string
}

interface BusinessCategory {
  category_id: string
}

interface BusinessSubcategory {
  subcategory_id: string
}

export default function BusinessProfile() {
  const [business, setBusiness] = useState<BusinessData | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [businessCategories, setBusinessCategories] = useState<BusinessCategory[]>([])
  const [businessSubcategories, setBusinessSubcategories] = useState<BusinessSubcategory[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    business_name: "",
    description: "",
    location: "",
    website: "",
    categoryId: "",
    subcategoryId: ""
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/auth/login')
          return
        }

        // Check if user is banned by fetching profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_banned')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          router.push('/auth/login')
          return
        }

        // If user is banned, redirect to public page
        if (profileData.is_banned) {
          // Sign out the user
          await supabase.auth.signOut()
          router.push('/?message=banned')
          return
        }

        // Fetch business data
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('id, business_name, location, website, description, rating_count')
          .eq('business_owner_id', user.id)
          .single()

        if (businessError) {
          console.error('Error fetching business:', businessError)
          router.push('/business/dashboard')
          return
        }

        setBusiness(businessData)
        setFormData({
          business_name: businessData.business_name || "",
          description: businessData.description || "",
          location: businessData.location || "",
          website: businessData.website || "",
          categoryId: "",
          subcategoryId: ""
        })

        // Fetch all categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .order('name')

        if (!categoriesError) {
          setCategories(categoriesData || [])
        }

        // Fetch all subcategories
        const { data: subcategoriesData, error: subcategoriesError } = await supabase
          .from('subcategories')
          .select('id, name, category_id')
          .order('name')

        if (!subcategoriesError) {
          setSubcategories(subcategoriesData || [])
        }

        // Fetch business categories
        const { data: businessCategoriesData, error: businessCategoriesError } = await supabase
          .from('business_categories')
          .select('category_id')
          .eq('business_id', businessData.id)

        if (!businessCategoriesError) {
          setBusinessCategories(businessCategoriesData || [])
        }

        // Fetch business subcategories
        const { data: businessSubcategoriesData, error: businessSubcategoriesError } = await supabase
          .from('business_subcategories')
          .select('subcategory_id')
          .eq('business_id', businessData.id)

        if (!businessSubcategoriesError) {
          setBusinessSubcategories(businessSubcategoriesData || [])
        }

        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        router.push('/auth/login')
      }
    }

    fetchData()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      categoryId: value,
      subcategoryId: "" // Reset subcategory when category changes
    }))
  }

  const handleSubcategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      subcategoryId: value
    }))
  }

  const handleAddCategory = async () => {
    if (!formData.categoryId || !business) return

    try {
      // Add category to business
      const { error, data } = await supabase
        .from('business_categories')
        .upsert({
          business_id: business.id,
          category_id: formData.categoryId
        }, {
          onConflict: 'business_id,category_id'
        })

      if (error) {
        console.error('Error adding category:', error)
        setError(`Failed to add category: ${error.message || 'Please try again.'}`)
        return
      }

      // Update local state
      const newCategory = {
        category_id: formData.categoryId
      }
      
      setBusinessCategories(prev => {
        // Check if category already exists
        if (!prev.some(bc => bc.category_id === formData.categoryId)) {
          return [...prev, newCategory]
        }
        return prev
      })

      // Clear selection
      setFormData(prev => ({
        ...prev,
        categoryId: "",
        subcategoryId: ""
      }))
      
      setSuccess('Category added successfully!')
    } catch (error: any) {
      console.error('Error adding category:', error)
      setError(`An unexpected error occurred: ${error.message || 'Please try again.'}`)
    }
  }

  const handleAddSubcategory = async () => {
    if (!formData.subcategoryId || !business) return

    try {
      // Add subcategory to business
      const { error, data } = await supabase
        .from('business_subcategories')
        .upsert({
          business_id: business.id,
          subcategory_id: formData.subcategoryId
        }, {
          onConflict: 'business_id,subcategory_id'
        })

      if (error) {
        console.error('Error adding subcategory:', error)
        setError(`Failed to add subcategory: ${error.message || 'Please try again.'}`)
        return
      }

      // Update local state
      const newSubcategory = {
        subcategory_id: formData.subcategoryId
      }
      
      setBusinessSubcategories(prev => {
        // Check if subcategory already exists
        if (!prev.some(bs => bs.subcategory_id === formData.subcategoryId)) {
          return [...prev, newSubcategory]
        }
        return prev
      })

      // Clear selection
      setFormData(prev => ({
        ...prev,
        subcategoryId: ""
      }))
      
      setSuccess('Subcategory added successfully!')
    } catch (error: any) {
      console.error('Error adding subcategory:', error)
      setError(`An unexpected error occurred: ${error.message || 'Please try again.'}`)
    }
  }

  const handleRemoveCategory = async (categoryId: string) => {
    if (!business) return

    try {
      // Remove category from business
      const { error, data } = await supabase
        .from('business_categories')
        .delete()
        .match({
          business_id: business.id,
          category_id: categoryId
        })

      if (error) {
        console.error('Error removing category:', error)
        setError(`Failed to remove category: ${error.message || 'Please try again.'}`)
        return
      }

      // Update local state
      setBusinessCategories(prev => prev.filter(bc => bc.category_id !== categoryId))
      setSuccess('Category removed successfully!')
    } catch (error: any) {
      console.error('Error removing category:', error)
      setError(`An unexpected error occurred: ${error.message || 'Please try again.'}`)
    }
  }

  const handleRemoveSubcategory = async (subcategoryId: string) => {
    if (!business) return

    try {
      // Remove subcategory from business
      const { error, data } = await supabase
        .from('business_subcategories')
        .delete()
        .match({
          business_id: business.id,
          subcategory_id: subcategoryId
        })

      if (error) {
        console.error('Error removing subcategory:', error)
        setError(`Failed to remove subcategory: ${error.message || 'Please try again.'}`)
        return
      }

      // Update local state
      setBusinessSubcategories(prev => prev.filter(bs => bs.subcategory_id !== subcategoryId))
      setSuccess('Subcategory removed successfully!')
    } catch (error: any) {
      console.error('Error removing subcategory:', error)
      setError(`An unexpected error occurred: ${error.message || 'Please try again.'}`)
    }
  }

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  const getSubcategoriesForCategory = (categoryId: string) => {
    return subcategories.filter(sub => sub.category_id === categoryId)
  }

  const getSubcategoriesForBusiness = () => {
    return businessSubcategories.map(bs => {
      return subcategories.find(s => s.id === bs.subcategory_id)
    }).filter(Boolean) as Subcategory[]
  }

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user || !business) {
        router.push('/auth/login')
        return
      }

      // Update business data
      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          business_name: formData.business_name,
          description: formData.description,
          location: formData.location,
          website: formData.website
        })
        .eq('id', business.id)
        .eq('business_owner_id', user.id)

      if (updateError) {
        console.error('Error updating business:', updateError)
        setError('Failed to update business information. Please try again.')
        return
      }

      // Update local state
      setBusiness({
        ...business,
        business_name: formData.business_name,
        description: formData.description,
        location: formData.location,
        website: formData.website
      })

      setSuccess('Business information updated successfully!')
    } catch (error) {
      console.error('Error saving changes:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading profile...</p>
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
        <div className="flex-1 ml-64 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Business Profile</h1>
            <p className="text-muted-foreground mt-2">Manage your business information</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Summary */}
            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Profile Summary</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Rating</p>
                    <RatingStars rating={business?.rating_count ? business.rating_count / 5 * 5 : 0} totalReviews={business?.rating_count || 0} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge className="mt-1">Verified</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="text-sm font-medium mt-1">January 2023</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Edit Form */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h3 className="font-semibold mb-6">Edit Business Details</h3>
                
                {success && (
                  <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
                    {success}
                  </div>
                )}
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSaveChanges} className="space-y-4">
                  <div>
                    <Label htmlFor="business_name" className="text-sm font-medium">
                      Business Name
                    </Label>
                    <Input 
                      id="business_name" 
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleInputChange}
                      className="mt-2" 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="categoryId" className="text-sm font-medium">
                      Categories & Subcategories
                    </Label>
                    
                    {/* Category Selection */}
                    <div className="flex gap-2 mt-2">
                      <Select onValueChange={handleCategoryChange} value={formData.categoryId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        type="button" 
                        onClick={handleAddCategory}
                        disabled={!formData.categoryId}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Selected Categories */}
                    {businessCategories.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2">Selected categories:</p>
                        <div className="space-y-2">
                          {businessCategories.map((bc) => {
                            const category = categories.find(c => c.id === bc.category_id)
                            if (!category) return null
                            
                            const categorySubcategories = getSubcategoriesForCategory(category.id)
                            const isExpanded = expandedCategories[category.id] || false
                            
                            return (
                              <div key={bc.category_id} className="border rounded-md">
                                <div className="flex items-center justify-between p-2 bg-muted/50">
                                  <Badge variant="secondary" className="flex items-center gap-1">
                                    {category.name}
                                    <button 
                                      type="button"
                                      onClick={() => handleRemoveCategory(bc.category_id)}
                                      className="hover:bg-secondary-foreground/10 rounded-full p-0.5"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                  
                                  {categorySubcategories.length > 0 && (
                                    <Button 
                                      type="button"
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => toggleCategoryExpansion(category.id)}
                                      className="h-6 w-6 p-0"
                                    >
                                      {isExpanded ? 
                                        <ChevronDown className="w-4 h-4" /> : 
                                        <ChevronRight className="w-4 h-4" />
                                      }
                                    </Button>
                                  )}
                                </div>
                                
                                {/* Subcategory selection for this category */}
                                {isExpanded && categorySubcategories.length > 0 && (
                                  <div className="p-2 border-t">
                                    <div className="flex gap-2 mb-2">
                                      <Select onValueChange={handleSubcategoryChange} value={formData.subcategoryId}>
                                        <SelectTrigger className="flex-1">
                                          <SelectValue placeholder="Select a subcategory" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {categorySubcategories.map((subcategory) => (
                                            <SelectItem key={subcategory.id} value={subcategory.id}>
                                              {subcategory.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Button 
                                        type="button" 
                                        onClick={handleAddSubcategory}
                                        disabled={!formData.subcategoryId}
                                        size="sm"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </Button>
                                    </div>
                                    
                                    {/* Selected subcategories for this category */}
                                    {(() => {
                                      const categoryBusinessSubcategories = getSubcategoriesForBusiness()
                                        .filter(sub => sub.category_id === category.id)
                                      
                                      return categoryBusinessSubcategories.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                          {categoryBusinessSubcategories.map((sub) => (
                                            <Badge key={sub.id} variant="outline" className="flex items-center gap-1 text-xs">
                                              {sub.name}
                                              <button 
                                                type="button"
                                                onClick={() => handleRemoveSubcategory(sub.id)}
                                                className="hover:bg-secondary-foreground/10 rounded-full p-0.5"
                                              >
                                                <X className="w-2 h-2" />
                                              </button>
                                            </Badge>
                                          ))}
                                        </div>
                                      ) : null
                                    })()}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="description" className="text-sm font-medium">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Tell customers about your business..."
                      className="mt-2 h-24"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="location" className="text-sm font-medium">
                      Location
                    </Label>
                    <Input 
                      id="location" 
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="mt-2" 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="website" className="text-sm font-medium">
                      Website
                    </Label>
                    <Input 
                      id="website" 
                      name="website"
                      type="url"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="mt-2" 
                    />
                  </div>
                  
                  <div className="pt-4 border-t border-border flex gap-3">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline">Cancel</Button>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}