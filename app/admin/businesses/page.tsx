"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, CheckCircle, XCircle, Eye } from "lucide-react"

interface Business {
  id: string
  business_name: string | null
  category_name: string | null
  owner_name: string | null
  owner_email: string | null
  is_banned: boolean | null
  created_at: string | null
  document_count: number
}

interface Document {
  id: string
  document_name: string | null
  document_url: string
  uploaded_at: string | null
  status: string | null
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [businessDocuments, setBusinessDocuments] = useState<Document[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false)
  const [isUnbanDialogOpen, setIsUnbanDialogOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        // Get current admin user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/auth/login')
          return
        }

        // Check if user is admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileError || !profile || profile.role !== 'admin') {
          router.push('/admin/login')
          return
        }

        // Fetch all businesses with owner info using API route
        const response = await fetch('/api/admin/businesses', {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch businesses')
        }

        const businessesData = await response.json()
        console.log('Fetched businesses:', businessesData)

        setBusinesses(businessesData)
        setFilteredBusinesses(businessesData)
        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        router.push('/auth/login')
      }
    }

    fetchBusinesses()
  }, [router])

  useEffect(() => {
    // Filter businesses based on search term
    if (!searchTerm) {
      setFilteredBusinesses(businesses)
    } else {
      const filtered = businesses.filter(business => 
        (business.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.category_name?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredBusinesses(filtered)
    }
  }, [searchTerm, businesses])

  const fetchBusinessDocuments = async (businessId: string) => {
    try {
      // Fetch documents using API route
      const response = await fetch('/api/admin/business-documents', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }

      const allDocuments = await response.json()
      // Filter documents for this business by comparing business IDs
      const businessDocs = allDocuments.filter((doc: any) => doc.business?.id === businessId)
      
      return businessDocs || []
    } catch (error) {
      console.error('Error fetching documents:', error)
      return []
    }
  }

  const handleViewDetails = async (business: Business) => {
    setSelectedBusiness(business)
    
    // Fetch documents for this business
    const documents = await fetchBusinessDocuments(business.id)
    setBusinessDocuments(documents)
    
    setOpenDialog(true)
  }

  const handleBanBusiness = async () => {
    if (!selectedBusiness) return;

    try {
      // Update business using API route
      const response = await fetch(`/api/admin/businesses/${selectedBusiness.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ is_banned: true })
      })

      if (!response.ok) {
        throw new Error('Failed to ban business')
      }

      const updatedBusiness = await response.json()
      
      // Update local state
      setBusinesses(prev => 
        prev.map(business => 
          business.id === selectedBusiness.id ? { ...business, is_banned: true } : business
        )
      )
      
      // If the selected business is the one being banned, update it too
      if (selectedBusiness && selectedBusiness.id === updatedBusiness[0].id) {
        setSelectedBusiness({ ...selectedBusiness, is_banned: true })
      }
      
      setIsBanDialogOpen(false)
      setSelectedBusiness(null)
    } catch (error) {
      console.error('Error banning business:', error)
    }
  }

  const handleUnbanBusiness = async () => {
    if (!selectedBusiness) return;

    try {
      // Update business using API route
      const response = await fetch(`/api/admin/businesses/${selectedBusiness.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ is_banned: false })
      })

      if (!response.ok) {
        throw new Error('Failed to unban business')
      }

      const updatedBusiness = await response.json()
      
      // Update local state
      setBusinesses(prev => 
        prev.map(business => 
          business.id === selectedBusiness.id ? { ...business, is_banned: false } : business
        )
      )
      
      // If the selected business is the one being unbanned, update it too
      if (selectedBusiness && selectedBusiness.id === updatedBusiness[0].id) {
        setSelectedBusiness({ ...selectedBusiness, is_banned: false })
      }
      
      setIsUnbanDialogOpen(false)
      setSelectedBusiness(null)
    } catch (error) {
      console.error('Error unbanning business:', error)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[calc(100vh-4rem)]">
          <Sidebar role="admin" />
          <div className="flex-1 ml-64 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Businesses</h1>
              <p className="text-muted-foreground mt-2">Manage and verify business listings</p>
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar role="admin" />
        <div className="flex-1 ml-64 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Businesses</h1>
            <p className="text-muted-foreground mt-2">Manage and verify business listings</p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search businesses..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBusinesses.length > 0 ? (
                  filteredBusinesses.map((business) => (
                    <TableRow key={business.id}>
                      <TableCell className="font-medium">{business.business_name || "Unnamed Business"}</TableCell>
                      <TableCell>{business.category_name}</TableCell>
                      <TableCell className="text-sm">
                        <div>{business.owner_name}</div>
                        <div className="text-muted-foreground text-xs">{business.owner_email}</div>
                      </TableCell>
                      <TableCell>{business.document_count}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            business.is_banned
                              ? "destructive"
                              : "default"
                          }
                        >
                          {business.is_banned ? "Banned" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {business.created_at ? new Date(business.created_at).toLocaleDateString() : "Unknown date"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleViewDetails(business)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          {business.is_banned ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedBusiness(business)
                                setIsUnbanDialogOpen(true)
                              }}
                              className="gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Unban
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedBusiness(business)
                                setIsBanDialogOpen(true)
                              }}
                              className="gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Ban
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No businesses found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Business Details Dialog */}
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Business Details</DialogTitle>
                <DialogDescription>
                  {selectedBusiness?.business_name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
                {selectedBusiness && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Business Information</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Name:</span>
                          <p className="font-medium">{selectedBusiness.business_name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Category:</span>
                          <p>{selectedBusiness.category_name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Owner:</span>
                          <p>{selectedBusiness.owner_name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Owner Email:</span>
                          <p>{selectedBusiness.owner_email}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <p>
                            <Badge variant={selectedBusiness.is_banned ? "destructive" : "default"}>
                              {selectedBusiness.is_banned ? "Banned" : "Active"}
                            </Badge>
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Member Since:</span>
                          <p>
                            {selectedBusiness.created_at 
                              ? new Date(selectedBusiness.created_at).toLocaleDateString() 
                              : "Unknown date"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Documents ({businessDocuments.length})</h4>
                      {businessDocuments.length > 0 ? (
                        <div className="space-y-3">
                          {businessDocuments.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">{doc.document_name || "Unnamed Document"}</p>
                                <p className="text-xs text-muted-foreground">
                                  Uploaded: {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : "Unknown date"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    doc.status === "approved"
                                      ? "default"
                                      : doc.status === "pending"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                >
                                  {doc.status ? doc.status.charAt(0).toUpperCase() + doc.status.slice(1) : "Pending"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No documents uploaded</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={() => setOpenDialog(false)}>Close</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Ban Business Dialog */}
          <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ban Business</DialogTitle>
                <DialogDescription>
                  Are you sure you want to ban {selectedBusiness?.business_name}?
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  This will prevent the business from accessing their account and listing their services.
                </p>
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    className="flex-1 bg-transparent" 
                    onClick={() => setIsBanDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleBanBusiness}
                    variant="destructive"
                  >
                    Ban Business
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Unban Business Dialog */}
          <Dialog open={isUnbanDialogOpen} onOpenChange={setIsUnbanDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Unban Business</DialogTitle>
                <DialogDescription>
                  Are you sure you want to unban {selectedBusiness?.business_name}?
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  This will restore the business's access to their account.
                </p>
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    className="flex-1 bg-transparent" 
                    onClick={() => setIsUnbanDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleUnbanBusiness}
                  >
                    Unban Business
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </>
  )
}