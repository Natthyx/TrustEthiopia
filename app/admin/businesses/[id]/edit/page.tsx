"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BusinessHoursInput } from "@/components/business-hours-input";
import { Plus, X, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

interface BusinessImage {
  id: string;
  business_id: string;
  image_url: string;
  is_primary: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface FormData {
  business_name: string;
  description: string;
  location: string;
  website: string;
  categoryId: string;
  subcategoryId: string;
  phone: string;
  address: string;
  google_map_embed: string;
  businessHours: string; // JSON string
}

interface Business {
  id: string;
  business_name: string | null;
  location: string | null;
  website: string | null;
  description: string | null;
  phone: string | null;
  address: string | null;
  google_map_embed: string | null;
  business_hours: any | null;
  created_at: string | null;
  created_by_admin: boolean | null;
}

export default function EditBusinessPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [businessCategories, setBusinessCategories] = useState<string[]>([]);
  const [businessSubcategories, setBusinessSubcategories] = useState<string[]>([]);
  const [images, setImages] = useState<BusinessImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [primaryImageId, setPrimaryImageId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    business_name: "",
    description: "",
    location: "",
    website: "",
    categoryId: "",
    subcategoryId: "",
    phone: "",
    address: "",
    google_map_embed: "",
    businessHours: "{}"
  });
  
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get admin user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/auth/login');
          return;
        }

        // Check if user is admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || !profile || profile.role !== 'admin') {
          router.push('/admin/login');
          return;
        }

        // Fetch business data
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select(`
            id,
            business_name,
            location,
            website,
            description,
            phone,
            address,
            google_map_embed,
            business_hours,
            created_at,
            created_by_admin
          `)
          .eq('id', businessId)
          .single();

        if (businessError || !businessData) {
          console.error('Error fetching business:', businessError);
          router.push('/admin/businesses');
          return;
        }

        setBusiness(businessData);
        setFormData({
          business_name: businessData.business_name || "",
          description: businessData.description || "",
          location: businessData.location || "",
          website: businessData.website || "",
          categoryId: "",
          subcategoryId: "",
          phone: businessData.phone || "",
          address: businessData.address || "",
          google_map_embed: businessData.google_map_embed || "",
          businessHours: businessData.business_hours ? JSON.stringify(businessData.business_hours) : "{}"
        });

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');

        if (!categoriesError && categoriesData) {
          setCategories(categoriesData);
        }

        // Fetch subcategories
        const { data: subcategoriesData, error: subcategoriesError } = await supabase
          .from('subcategories')
          .select('id, name, category_id')
          .order('name');

        if (!subcategoriesError && subcategoriesData) {
          setSubcategories(subcategoriesData);
        }

        // Fetch business categories
        const { data: businessCategoriesData } = await supabase
          .from('business_categories')
          .select('category_id')
          .eq('business_id', businessData.id);
        
        if (businessCategoriesData) {
          setBusinessCategories(businessCategoriesData.map(item => item.category_id));
        }

        // Fetch business subcategories
        const { data: businessSubcategoriesData, error: businessSubcategoriesError } = await supabase
          .from('business_subcategories')
          .select('subcategory_id')
          .eq('business_id', businessData.id);

        if (!businessSubcategoriesError && businessSubcategoriesData) {
          setBusinessSubcategories(businessSubcategoriesData.map(item => item.subcategory_id));
        }

        // Fetch business images
        const { data: imagesData, error: imagesError } = await supabase
          .from('business_images')
          .select('*')
          .eq('business_id', businessData.id)
          .order('created_at', { ascending: false });

        if (!imagesError && imagesData) {
          setImages(imagesData);
          const primaryImage = imagesData.find(img => img.is_primary);
          if (primaryImage) {
            setPrimaryImageId(primaryImage.id);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        router.push('/auth/login');
      }
    };

    fetchData();
  }, [router, businessId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, categoryId: value, subcategoryId: "" }));
  };

  const handleSubcategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, subcategoryId: value }));
  };

  const handleAddCategory = async () => {
    if (!formData.categoryId || !business) return;

    try {
      const { error } = await supabase
        .from('business_categories')
        .upsert({
          business_id: business.id,
          category_id: formData.categoryId
        }, { onConflict: 'business_id,category_id' });

      if (error) throw error;

      setBusinessCategories(prev => {
        if (!prev.some(id => id === formData.categoryId)) {
          return [...prev, formData.categoryId];
        }
        return prev;
      });

      setFormData(prev => ({ ...prev, categoryId: "", subcategoryId: "" }));
      toast.success('Category added successfully!');
    } catch (error: any) {
      toast.error(`Failed to add category: ${error.message}`);
    }
  };

  const handleAddSubcategory = async () => {
    if (!formData.subcategoryId || !business) return;

    try {
      const { error } = await supabase
        .from('business_subcategories')
        .upsert({
          business_id: business.id,
          subcategory_id: formData.subcategoryId
        }, { onConflict: 'business_id,subcategory_id' });

      if (error) throw error;

      setBusinessSubcategories(prev => {
        if (!prev.some(id => id === formData.subcategoryId)) {
          return [...prev, formData.subcategoryId];
        }
        return prev;
      });

      setFormData(prev => ({ ...prev, subcategoryId: "" }));
      toast.success('Subcategory added successfully!');
    } catch (error: any) {
      toast.error(`Failed to add subcategory: ${error.message}`);
    }
  };

  const handleRemoveCategory = async (categoryId: string) => {
    if (!business) return;

    try {
      const { error } = await supabase
        .from('business_categories')
        .delete()
        .match({ business_id: business.id, category_id: categoryId });

      if (error) throw error;

      setBusinessCategories(prev => prev.filter(id => id !== categoryId));
      toast.success('Category removed successfully!');
    } catch (error: any) {
      toast.error(`Failed to remove category: ${error.message}`);
    }
  };

  const handleRemoveSubcategory = async (subcategoryId: string) => {
    if (!business) return;

    try {
      const { error } = await supabase
        .from('business_subcategories')
        .delete()
        .match({ business_id: business.id, subcategory_id: subcategoryId });

      if (error) throw error;

      setBusinessSubcategories(prev => prev.filter(id => id !== subcategoryId));
      toast.success('Subcategory removed successfully!');
    } catch (error: any) {
      toast.error(`Failed to remove subcategory: ${error.message}`);
    }
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const getSubcategoriesForCategory = (categoryId: string) => {
    return subcategories.filter(sub => sub.category_id === categoryId);
  };

  const getSubcategoriesForBusiness = () => {
    return businessSubcategories
      .map(subId => subcategories.find(s => s.id === subId))
      .filter(Boolean) as Subcategory[];
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !business) return;

      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          business_name: formData.business_name,
          description: formData.description,
          location: formData.location,
          website: formData.website,
          phone: formData.phone,
          address: formData.address,
          google_map_embed: formData.google_map_embed,
          business_hours: formData.businessHours ? JSON.parse(formData.businessHours) : null
        })
        .eq('id', business.id);

      if (updateError) throw updateError;

      setBusiness(prev => prev ? {
        ...prev,
        business_name: formData.business_name,
        description: formData.description,
        location: formData.location,
        website: formData.website,
        phone: formData.phone,
        address: formData.address,
        google_map_embed: formData.google_map_embed,
        business_hours: formData.businessHours ? JSON.parse(formData.businessHours) : null
      } : null);

      setSuccess('Business information updated successfully!');
      toast.success('Business information updated successfully!');
    } catch (error: any) {
      setError(`Failed to save: ${error.message}`);
      toast.error(`Failed to save: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploading(true);
    setError(null);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload file using admin API route
      const response = await fetch('/api/admin/business-images/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload image');
      }

      // Update the business_id for the uploaded image
      const updateResponse = await fetch('/api/admin/business-images/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: businessId,
          imageIds: [result.id]
        })
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Failed to update business images');
      }

      // Refresh images list
      const { data: imagesData, error: imagesError } = await supabase
        .from('business_images')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (!imagesError && imagesData) {
        setImages(imagesData);
        if (images.length === 0) {
          setPrimaryImageId(imagesData[0]?.id || null);
        }
        toast.success('Image uploaded successfully!');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(`Failed to upload image: ${error.message}`);
    } finally {
      setUploading(false);
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    try {
      // Delete image using API route
      const response = await fetch(`/api/business/images/${imageId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete image');
      }

      // Update state
      setImages(prev => prev.filter(img => img.id !== imageId));
      if (primaryImageId === imageId) {
        setPrimaryImageId(null);
        // Set new primary if there are remaining images
        if (images.length > 1) {
          const newPrimary = images.find(img => img.id !== imageId);
          if (newPrimary) {
            setPrimaryImageId(newPrimary.id);
          }
        }
      }

      toast.success('Image deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast.error(`Failed to delete image: ${error.message}`);
    }
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    try {
      // Update image using API route
      const response = await fetch(`/api/business/images/${imageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_primary: true }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to set primary image');
      }

      // Update state - unset previous primary, set new one
      setImages(prev => 
        prev.map(img => ({
          ...img,
          is_primary: img.id === imageId
        }))
      );
      setPrimaryImageId(imageId);

      toast.success('Primary image updated!');
    } catch (error: any) {
      console.error('Error setting primary image:', error);
      toast.error(`Failed to set primary image: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading business...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar role="admin" />
        <div className="flex-1 md:ml-64 p-8 pb-24 md:pb-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Edit Business</h1>
            <p className="text-muted-foreground mt-2">Manage business details and images</p>
          </div>

          <div className="max-w-4xl">
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
            
            <form onSubmit={handleSaveChanges} className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Business Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="business_name" className="text-sm font-medium">
                        Business Name *
                      </Label>
                      <Input 
                        id="business_name" 
                        name="business_name"
                        value={formData.business_name}
                        onChange={handleInputChange}
                        className="mt-2" 
                        required
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

                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone Number
                      </Label>
                      <Input 
                        id="phone" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="mt-2" 
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address" className="text-sm font-medium">
                        Address
                      </Label>
                      <Textarea 
                        id="address" 
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="mt-2" 
                        placeholder="123 Main Street, City, State ZIP"
                      />
                    </div>

                    <div>
                      <Label htmlFor="google_map_embed" className="text-sm font-medium">
                        Google Maps Embed Code
                      </Label>
                      <Textarea 
                        id="google_map_embed" 
                        name="google_map_embed"
                        value={formData.google_map_embed}
                        onChange={handleInputChange}
                        className="mt-2 font-mono text-xs" 
                        placeholder='Paste your Google Maps embed code here, e.g.: <iframe src="https://www.google.com/maps/embed?pb=..."></iframe>'
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Copy and paste the embed code from Google Maps. This will be displayed on your business page.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Tell customers about your business..."
                    className="mt-2 h-32"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Business Hours</h3>
                <BusinessHoursInput 
                  value={formData.businessHours}
                  onChange={(value) => setFormData(prev => ({ ...prev, businessHours: value }))}
                />
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Categories & Subcategories</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="categoryId" className="text-sm font-medium">
                      Add Category
                    </Label>
                    
                    {/* Category Selection - Responsive layout */}
                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
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
                        className="w-full sm:w-auto"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Selected Categories */}
                  {businessCategories.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-2">Selected categories:</p>
                      <div className="space-y-2">
                        {businessCategories.map((categoryId) => {
                          const category = categories.find(c => c.id === categoryId);
                          if (!category) return null;
                          
                          const categorySubcategories = getSubcategoriesForCategory(category.id);
                          const isExpanded = expandedCategories[category.id] || false;
                          
                          return (
                            <div key={categoryId} className="border rounded-md">
                              <div className="flex items-center justify-between p-2 bg-muted/50">
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  {category.name}
                                  <button 
                                    type="button"
                                    onClick={() => handleRemoveCategory(categoryId)}
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
                                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
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
                                      className="w-full sm:w-auto"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  
                                  {/* Selected subcategories for this category */}
                                  {(() => {
                                    const categorySelectedSubcategories = getSubcategoriesForBusiness()
                                      .filter(sub => sub.category_id === category.id);
                                    
                                    return categorySelectedSubcategories.length > 0 ? (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {categorySelectedSubcategories.map((sub) => (
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
                                    ) : null;
                                  })()}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Business Images</h3>
                
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="flex-1 w-full"
                    />
                    <Button 
                      type="button" 
                      disabled={uploading}
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      {uploading ? "Uploading..." : "Upload Image"}
                    </Button>
                  </div>
                  
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                      {images.map((image) => (
                        <div key={image.id} className="relative group">
                          <div className="relative aspect-square rounded-lg overflow-hidden border">
                            <img 
                              src={image.image_url} 
                              alt="Business" 
                              className="w-full h-full object-cover"
                            />
                            {image.is_primary && (
                              <Badge className="absolute top-2 left-2 text-xs">Profile Picture</Badge>
                            )}
                          </div>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {!image.is_primary && (
                              <Button
                                type="button"
                                size="sm"
                                variant="default"
                                onClick={() => handleSetPrimaryImage(image.id)}
                                className="h-8 px-2 text-xs"
                              >
                                Set as Profile
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteImage(image.id, image.image_url)}
                              className="h-8 px-2 text-xs"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  onClick={() => router.push('/admin/businesses')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}