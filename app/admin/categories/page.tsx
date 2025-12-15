"use client"

import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2, Plus, Eye } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

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

interface Category {
  id: string
  name: string
  icon: string | null
  bg_color: string | null
  created_at: string | null
}

interface Subcategory {
  id: string
  name: string
  category_id: string
  created_at: string | null
}

export default function AdminCategoriesPage() {
  const [showForm, setShowForm] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isSubcategoryDialogOpen, setIsSubcategoryDialogOpen] = useState(false)
  const [newSubcategoryName, setNewSubcategoryName] = useState("")

  const [formData, setFormData] = useState({
    categoryName: "",
    categoryIcon: "shirt",
    categoryBgColor: "bg-gray-100",
  })

  // Predefined background colors for selection
  const bgColors = [
    { name: "Red", value: "bg-red-100" },
    { name: "Orange", value: "bg-orange-100" },
    { name: "Yellow", value: "bg-yellow-100" },
    { name: "Green", value: "bg-green-100" },
    { name: "Blue", value: "bg-blue-100" },
    { name: "Indigo", value: "bg-indigo-100" },
    { name: "Purple", value: "bg-purple-100" },
    { name: "Pink", value: "bg-pink-100" },
    { name: "Gray", value: "bg-gray-100" },
  ]

  // Predefined icons for selection
  const icons = [
    { name: "Clothing Store", value: "shirt", icon: Shirt },
    { name: "Hotel", value: "hotel", icon: Hotel },
    { name: "Restaurant", value: "utensils", icon: Utensils },
    { name: "Mobile & Accessories", value: "tablet-smartphone", icon: TabletSmartphone },
    { name: "Dental Clinic", value: "tooth", icon: Stethoscope },
    { name: "Folder", value: "folder", icon: Folder },
    { name: "Healthcare", value: "hospital", icon: Hospital },
    { name: "Shopping", value: "shopping-bag", icon: ShoppingBag },
    { name: "Services", value: "briefcase", icon: Briefcase },
    { name: "Entertainment", value: "drama", icon: Drama },
    { name: "Car", value: "car", icon: Car },
    { name: "Home", value: "home", icon: Home },
    { name: "Beauty", value: "sparkles", icon: Sparkles },
    { name: "Fitness", value: "dumbbell", icon: Dumbbell },
    { name: "Tech", value: "laptop", icon: Laptop },
    { name: "Travel", value: "plane", icon: Plane },
    { name: "Education", value: "book", icon: Book },
    { name: "Money", value: "wallet", icon: Wallet },
    { name: "Pets", value: "paw-print", icon: PawPrint },
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch categories')
      }

      setCategories(data.categories || [])
      setSubcategories(data.subcategories || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load categories')
      setLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!formData.categoryName.trim()) {
      toast.error('Category name is required')
      return
    }

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.categoryName.trim(),
          icon: formData.categoryIcon,
          bg_color: formData.categoryBgColor
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create category')
      }

      toast.success('Category created successfully')
      setFormData({ 
        ...formData, 
        categoryName: "",
        categoryIcon: "shirt",
        categoryBgColor: "bg-gray-100"
      })
      fetchData()
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error('Failed to create category')
    }
  }

  const handleCreateSubcategory = async () => {
    if (!selectedCategory || !newSubcategoryName.trim()) {
      toast.error('Subcategory name is required')
      return
    }

    try {
      const response = await fetch('/api/admin/subcategories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newSubcategoryName.trim(),
          category_id: selectedCategory.id
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subcategory')
      }

      toast.success('Subcategory created successfully')
      setNewSubcategoryName("")
      fetchData()
    } catch (error) {
      console.error('Error creating subcategory:', error)
      toast.error('Failed to create subcategory')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete category')
      }

      toast.success('Category deleted successfully')
      fetchData()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  }

  const handleDeleteSubcategory = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/subcategories/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete subcategory')
      }

      toast.success('Subcategory deleted successfully')
      fetchData()
      // Close dialog if no subcategories left for this category
      const remainingSubcategories = subcategories.filter(s => s.id !== id && s.category_id === selectedCategory?.id)
      if (remainingSubcategories.length === 0) {
        setIsSubcategoryDialogOpen(false)
      }
    } catch (error) {
      console.error('Error deleting subcategory:', error)
      toast.error('Failed to delete subcategory')
    }
  }

  const getSubcategoriesByCategory = (categoryId: string) => {
    return subcategories.filter(sub => sub.category_id === categoryId)
  }

  const openSubcategoryDialog = (category: Category) => {
    setSelectedCategory(category)
    setIsSubcategoryDialogOpen(true)
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar role="admin" />
        <div className="flex-1 ml-64 p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Categories</h1>
              <p className="text-muted-foreground mt-2">Manage service categories</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Category
            </Button>
          </div>

          {/* Add Category Form */}
          {showForm && (
            <Card className="p-6 mb-8">
              <h3 className="font-semibold mb-4">Add New Category</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="catname" className="text-sm font-medium">
                    Category Name
                  </Label>
                  <Input 
                    id="catname" 
                    placeholder="e.g., Healthcare" 
                    className="mt-2" 
                    value={formData.categoryName}
                    onChange={(e) => setFormData({...formData, categoryName: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium">
                    Category Icon
                  </Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {icons.map((icon) => {
                      const IconComponent = icon.icon;
                      return (
                        <Button
                          key={icon.value}
                          variant={formData.categoryIcon === icon.value ? "default" : "outline"}
                          className="h-12 flex items-center justify-center"
                          onClick={() => setFormData({...formData, categoryIcon: icon.value})}
                        >
                          <IconComponent className="w-5 h-5" />
                        </Button>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">
                    Background Color
                  </Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {bgColors.map((color) => (
                      <Button
                        key={color.value}
                        variant="outline"
                        className={`h-10 ${color.value} ${formData.categoryBgColor === color.value ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => setFormData({...formData, categoryBgColor: color.value})}
                      >
                        {color.name}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button size="sm" onClick={handleCreateCategory}>Add Category</Button>
                </div>
                
                <div className="pt-4">
                  <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Categories Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>BG Color</TableHead>
                  <TableHead>Subcategories</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Loading categories...
                    </TableCell>
                  </TableRow>
                ) : categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No categories found
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((cat) => {
                    const catSubcategories = getSubcategoriesByCategory(cat.id)
                    return (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell>
                          <span className="text-2xl">{cat.icon || "📁"}</span>
                        </TableCell>
                        <TableCell>
                          <div className={`inline-block px-2 py-1 rounded text-xs ${cat.bg_color || "bg-gray-100"}`}>
                            {cat.bg_color || "Default"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{catSubcategories.length} subcategories</span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openSubcategoryDialog(cat)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive"
                            onClick={() => handleDeleteCategory(cat.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </main>

      {/* Subcategories Dialog */}
      <Dialog open={isSubcategoryDialogOpen} onOpenChange={setIsSubcategoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory?.name} - Subcategories
            </DialogTitle>
          </DialogHeader>
          
          {selectedCategory && (
            <div className="space-y-4">
              {/* Add Subcategory Form */}
              <div className="flex gap-2">
                <Input
                  placeholder="New subcategory name"
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleCreateSubcategory} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
              
              {/* Subcategories Table */}
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subcategory</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getSubcategoriesByCategory(selectedCategory.id).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          No subcategories found
                        </TableCell>
                      </TableRow>
                    ) : (
                      getSubcategoriesByCategory(selectedCategory.id).map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>{sub.name}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive h-8 w-8 p-0"
                              onClick={() => handleDeleteSubcategory(sub.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}