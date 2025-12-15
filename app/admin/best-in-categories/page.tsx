"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Save, X } from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
}

interface Subcategory {
  id: string
  name: string
  category_id: string
  categories?: {
    name: string
  }
}

interface FeaturedSubcategory {
  id: string
  subcategory_id: string
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
  subcategories?: {
    name: string
    categories?: {
      name: string
    }
  }
}

export default function BestInCategoriesAdminPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([])
  const [featuredSubcategories, setFeaturedSubcategories] = useState<FeaturedSubcategory[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<FeaturedSubcategory | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState<Omit<FeaturedSubcategory, 'id' | 'created_at' | 'updated_at'>>({
    subcategory_id: '',
    is_active: true
  })
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')

  // Fetch initial data
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Get access token for authorization
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      
      if (!accessToken) {
        throw new Error('No access token available')
      }
      
      // Fetch categories and subcategories via API (same endpoint returns both)
      const categoriesResponse = await fetch('/api/admin/categories', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!categoriesResponse.ok) {
        const errorText = await categoriesResponse.text();
        throw new Error(`Failed to fetch categories: ${errorText || categoriesResponse.statusText}`);
      }
      
      const categoriesData = await categoriesResponse.json()
      setCategories(categoriesData.categories || [])
      setSubcategories(categoriesData.subcategories || [])
      
      // Fetch featured subcategories via API
      const featuredResponse = await fetch('/api/admin/best-in-categories', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!featuredResponse.ok) {
        const errorText = await featuredResponse.text();
        throw new Error(`Failed to fetch featured subcategories: ${errorText || featuredResponse.statusText}`);
      }
      
      const featuredData = await featuredResponse.json()
      setFeaturedSubcategories(featuredData || [])
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error("Failed to load data")
      setLoading(false)
    }
  }

  // Filter subcategories based on selected category
  useEffect(() => {
    if (selectedCategoryId) {
      const filtered = subcategories.filter(sub => sub.category_id === selectedCategoryId)
      setFilteredSubcategories(filtered)
      
      // Reset subcategory selection if it's not in the filtered list
      if (formData.subcategory_id && !filtered.some(sub => sub.id === formData.subcategory_id)) {
        setFormData(prev => ({ ...prev, subcategory_id: '' }))
      }
    } else {
      setFilteredSubcategories([])
      setFormData(prev => ({ ...prev, subcategory_id: '' }))
    }
  }, [selectedCategoryId, subcategories, formData.subcategory_id])

  // Open dialog for adding new item
  const handleAddNew = () => {
    setEditingItem(null)
    setFormData({
      subcategory_id: '',
      is_active: true
    })
    setSelectedCategoryId('')
    setFilteredSubcategories([])
    setIsDialogOpen(true)
  }

  // Open dialog for editing item
  const handleEdit = async (item: FeaturedSubcategory) => {
    setEditingItem(item)
    setFormData({
      subcategory_id: item.subcategory_id,
      is_active: item.is_active ?? true
    })
    
    // Find the category for this subcategory
    const subcategory = subcategories.find(sub => sub.id === item.subcategory_id)
    if (subcategory) {
      setSelectedCategoryId(subcategory.category_id)
    }
    
    setIsDialogOpen(true)
  }

  // Save item (create or update)
  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.subcategory_id) {
        toast.error("Please select a subcategory")
        return
      }
      
      // Get access token for authorization
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      
      if (!accessToken) {
        throw new Error('No access token available')
      }
      
      const payload = {
        ...formData,
        is_active: formData.is_active ?? true
      }
      
      if (editingItem) {
        // Update existing item
        const response = await fetch(`/api/admin/best-in-categories?id=${editingItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ id: editingItem.id, ...payload })
        })
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update featured subcategory: ${errorText || response.statusText}`);
        }
        
        toast.success("Featured subcategory updated successfully")
      } else {
        // Create new item
        const response = await fetch('/api/admin/best-in-categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(payload)
        })
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create featured subcategory: ${errorText || response.statusText}`);
        }
        
        toast.success("Featured subcategory created successfully")
      }
      
      setIsDialogOpen(false)
      fetchData() // Refresh the list
    } catch (error) {
      console.error('Error saving featured subcategory:', error)
      toast.error(`Failed to ${editingItem ? 'update' : 'create'} featured subcategory`)
    }
  }

  // Delete item
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return
    }
    
    try {
      // Get access token for authorization
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      
      if (!accessToken) {
        throw new Error('No access token available')
      }
      
      const response = await fetch(`/api/admin/best-in-categories?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete featured subcategory: ${errorText || response.statusText}`);
      }
      
      toast.success("Featured subcategory deleted successfully")
      fetchData() // Refresh the list
    } catch (error) {
      console.error('Error deleting featured subcategory:', error)
      toast.error("Failed to delete featured subcategory")
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar role="admin" />
        <div className="flex-1 ml-64 p-8">
          <div className="container-app py-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold">Featured Subcategories</h1>
                <p className="text-muted-foreground">Manage which subcategories are featured on the homepage</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? 'Edit Featured Subcategory' : 'Add New Featured Subcategory'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="category_id" className="text-right">
                        Category
                      </Label>
                      <Select 
                        value={selectedCategoryId} 
                        onValueChange={setSelectedCategoryId}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="subcategory_id" className="text-right">
                        Subcategory
                      </Label>
                      <Select 
                        value={formData.subcategory_id} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory_id: value }))}
                        disabled={!selectedCategoryId}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredSubcategories.map(subcategory => (
                            <SelectItem 
                              key={subcategory.id} 
                              value={subcategory.id}
                            >
                              {subcategory.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="is_active" className="text-right">
                        Active
                      </Label>
                      <div className="col-span-3 flex items-center">
                        <Switch
                          id="is_active"
                          checked={formData.is_active ?? true}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Featured Subcategories List</CardTitle>
                <CardDescription>
                  Manage which subcategories appear in the "Best In" section on the homepage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subcategory</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {featuredSubcategories.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.subcategories?.name || 'Unknown'}</TableCell>
                          <TableCell>{item.subcategories?.categories?.name || 'Unknown'}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              (item.is_active ?? true) 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {(item.is_active ?? true) ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEdit(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {featuredSubcategories.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No featured subcategories found. Add your first entry.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}