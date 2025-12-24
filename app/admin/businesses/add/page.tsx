"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Plus, X, ChevronDown, ChevronRight, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { compressImage } from "@/lib/utils/image-compressor";

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

export default function AddBusinessPage() {
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Business details, Step 2: Images
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
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
  const [businessId, setBusinessId] = useState<string | null>(null); // Store the created business ID
  
  const router = useRouter();
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

        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        router.push('/auth/login');
      }
    };

    fetchData();
  }, [router]);

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

  const handleAddCategory = () => {
    if (!formData.categoryId) return;
    
    if (!selectedCategories.includes(formData.categoryId)) {
      setSelectedCategories(prev => [...prev, formData.categoryId]);
    }
    setFormData(prev => ({ ...prev, categoryId: "", subcategoryId: "" }));
  };

  const handleAddSubcategory = () => {
    if (!formData.subcategoryId) return;
    
    if (!selectedSubcategories.includes(formData.subcategoryId)) {
      setSelectedSubcategories(prev => [...prev, formData.subcategoryId]);
    }
    setFormData(prev => ({ ...prev, subcategoryId: "" }));
  };

  const handleRemoveCategory = (categoryId: string) => {
    setSelectedCategories(prev => prev.filter(id => id !== categoryId));
    // Also remove associated subcategories
    const categorySubcategories = subcategories.filter(sub => sub.category_id === categoryId);
    setSelectedSubcategories(prev => 
      prev.filter(id => !categorySubcategories.some(catSub => catSub.id === id))
    );
  };

  const handleRemoveSubcategory = (subcategoryId: string) => {
    setSelectedSubcategories(prev => prev.filter(id => id !== subcategoryId));
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const getSubcategoriesForCategory = (categoryId: string) => {
    return subcategories.filter(sub => sub.category_id === categoryId);
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Get admin user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First, create the business
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .insert({
          business_name: formData.business_name,
          business_owner_id: user.id, // Admin's ID as the owner for admin-created businesses
          location: formData.location,
          description: formData.description,
          website: formData.website,
          phone: formData.phone,
          address: formData.address,
          google_map_embed: formData.google_map_embed,
          business_hours: formData.businessHours ? JSON.parse(formData.businessHours) : null,
          created_by_admin: true // Mark as created by admin
        })
        .select()
        .single();

      if (businessError) throw businessError;

      // Associate categories with the business
      if (selectedCategories.length > 0) {
        const categoryInserts = selectedCategories.map(categoryId => ({
          business_id: businessData.id,
          category_id: categoryId
        }));

        const { error: categoryError } = await supabase
          .from('business_categories')
          .insert(categoryInserts);

        if (categoryError) throw categoryError;
      }

      // Associate subcategories with the business
      if (selectedSubcategories.length > 0) {
        const subcategoryInserts = selectedSubcategories.map(subcategoryId => ({
          business_id: businessData.id,
          subcategory_id: subcategoryId
        }));

        const { error: subcategoryError } = await supabase
          .from('business_subcategories')
          .insert(subcategoryInserts);

        if (subcategoryError) throw subcategoryError;
      }

      // Store the business ID and move to step 2
      setBusinessId(businessData.id);
      setStep(2);
      setSuccess('Business created successfully!');
      toast.success('Business created successfully!');
    } catch (error: any) {
      setError(`Failed to create business: ${error.message}`);
      toast.error(`Failed to create business: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUploadStep2 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !businessId) return;

    const file = e.target.files[0];
    setUploading(true);
    setError(null);

    try {
      // Compress the image before uploading
      const compressedFile = await compressImage(file, 500); // Limit to 500KB
      const compressedFileWithCorrectType = new File([compressedFile], file.name, { type: 'image/jpeg' });

      // Create FormData
      const formData = new FormData();
      formData.append('file', compressedFileWithCorrectType);

      // Upload file using admin business image API route
      formData.append('business_id', businessId);
      const response = await fetch('/api/admin/business-images/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload image');
      }

      // Update state
      setImages(prev => [result, ...prev]);
      if (images.length === 0) {
        setPrimaryImageId(result.id);
      }

      toast.success('Image uploaded successfully!');
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
      // Delete image using admin API route
      const response = await fetch(`/api/admin/business-images/${imageId}`, {
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
      // Update image using admin API route
      const response = await fetch(`/api/admin/business-images/${imageId}`, {
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

  const handleFinish = () => {
    router.push('/admin/businesses');
  };

  const handleGoBack = () => {
    setStep(1);
    setSuccess(null);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
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
            <h1 className="text-3xl font-bold">Add New Business</h1>
            <p className="text-muted-foreground mt-2">Create a new business listing as an admin</p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`flex-1 h-1 rounded ${step === 1 ? 'bg-primary' : 'bg-primary/30'}`}></div>
              <div className="text-sm font-medium">{step === 1 ? 'Step 1: Business Details' : 'Step 2: Images'}</div>
              <div className={`flex-1 h-1 rounded ${step === 2 ? 'bg-primary' : 'bg-primary/30'}`}></div>
            </div>
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
            
            {step === 1 ? (
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
                    {selectedCategories.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2">Selected categories:</p>
                        <div className="space-y-2">
                          {selectedCategories.map((categoryId) => {
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
                                      const categorySelectedSubcategories = selectedSubcategories
                                        .filter(subId => {
                                          const sub = subcategories.find(s => s.id === subId);
                                          return sub && sub.category_id === category.id;
                                        })
                                        .map(subId => subcategories.find(s => s.id === subId))
                                        .filter(Boolean) as Subcategory[];
                                      
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

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                    {saving ? "Creating..." : "Continue to Images"}
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
            ) : (
              // Step 2: Images
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Business Images</h3>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUploadStep2}
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
                  <Button 
                    type="button" 
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={handleGoBack}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Details
                  </Button>
                  <Button 
                    type="button" 
                    className="w-full sm:w-auto"
                    onClick={handleFinish}
                  >
                    Finish
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}