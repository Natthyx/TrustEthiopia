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
import { Search, CheckCircle, XCircle, FileText, Eye, Download } from "lucide-react"

interface Document {
  id: string
  document_name: string | null
  document_url: string
  uploaded_at: string | null
  status: string | null
  business: {
    business_name: string | null
  } | null
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        // Get current user
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

        // Fetch all documents with business info using API route
        const response = await fetch('/api/admin/business-documents', {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch documents')
        }

        const documentsData = await response.json()
        setDocuments(documentsData || [])
        setFilteredDocuments(documentsData || [])

        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        router.push('/auth/login')
      }
    }

    fetchDocuments()
  }, [router])

  useEffect(() => {
    // Filter documents based on search term
    if (!searchTerm) {
      setFilteredDocuments(documents)
    } else {
      const filtered = documents.filter(doc => 
        (doc.document_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.business?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredDocuments(filtered)
    }
  }, [searchTerm, documents])

  const handleApprove = async () => {
    if (!selectedDocument) return

    try {
      // Approve document using API route
      const response = await fetch(`/api/admin/business-documents/${selectedDocument.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to approve document')
      }

      const result = await response.json()

      // Update local state
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === selectedDocument.id ? { ...doc, status: 'approved' } : doc
        )
      )
      
      setOpenDialog(false)
      setSelectedDocument(null)
    } catch (error) {
      console.error('Error approving document:', error)
    }
  }

  const handleReject = async () => {
    if (!selectedDocument) return

    try {
      // Reject document using API route
      const response = await fetch(`/api/admin/business-documents/${selectedDocument.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to reject document')
      }

      const result = await response.json()

      // Update local state
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === selectedDocument.id ? { ...doc, status: 'rejected' } : doc
        )
      )
      
      setOpenDialog(false)
      setSelectedDocument(null)
    } catch (error) {
      console.error('Error rejecting document:', error)
    }
  }

  const handleDelete = async (documentId: string) => {
    try {
      // Delete document using API route
      const response = await fetch(`/api/admin/business-documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete document')
      }

      const result = await response.json()

      // Update local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      setFilteredDocuments(prev => prev.filter(doc => doc.id !== documentId))
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  // Function to open document in new tab
  const handleViewDocument = (documentUrl: string) => {
    window.open(documentUrl, '_blank');
  };

  // Function to download document
  const handleDownloadDocument = async (documentUrl: string, documentName: string | null) => {
    try {
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = documentName || 'document';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      // Fallback: open in new tab if download fails
      window.open(documentUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[calc(100vh-4rem)]">
          <Sidebar role="admin" />
          <div className="flex-1 ml-64 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Documents</h1>
              <p className="text-muted-foreground mt-2">Review and approve business documents</p>
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
            <h1 className="text-3xl font-bold">Documents</h1>
            <p className="text-muted-foreground mt-2">Review and approve business documents</p>
          </div>

          {/* Search */}
          <Card className="p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search documents or businesses..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </Card>

          {/* Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          {doc.document_name || "Unnamed Document"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {doc.business?.business_name || "Unknown Business"}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : "Unknown date"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {/* View Document Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDocument(doc.document_url)}
                            title="View Document"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {/* Download Document Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadDocument(doc.document_url, doc.document_name)}
                            title="Download Document"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          
                          {doc.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedDocument(doc)
                                setOpenDialog(true)
                              }}
                            >
                              Review
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(doc.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No documents found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Approval Dialog */}
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Review Document</DialogTitle>
                <DialogDescription>
                  {selectedDocument?.document_name || "Unnamed Document"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <h4 className="font-semibold mb-2">Document Details</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Document:</span> {selectedDocument?.document_name || "Unnamed Document"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Business:</span> {selectedDocument?.business?.business_name || "Unknown Business"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Uploaded:</span> {selectedDocument?.uploaded_at ? new Date(selectedDocument.uploaded_at).toLocaleDateString() : "Unknown date"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button variant="outline" className="flex-1 bg-transparent gap-2" onClick={handleReject}>
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                  <Button className="flex-1 gap-2" onClick={handleApprove}>
                    <CheckCircle className="w-4 h-4" />
                    Approve
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