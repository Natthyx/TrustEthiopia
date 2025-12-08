"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Download, Trash2, CheckCircle, Clock, Upload } from "lucide-react"
import { FileUploader } from "@/components/file-uploader"

interface Document {
  id: string
  document_name: string | null
  document_url: string
  uploaded_at: string | null
  status: string | null
}

export default function BusinessDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
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

        // Get business for this user
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .select('id')
          .eq('business_owner_id', user.id)
          .single()

        if (businessError || !business) {
          console.error('Error fetching business:', businessError)
          router.push('/business/dashboard')
          return
        }

        // Fetch documents for this business
        const { data: documentsData, error: documentsError } = await supabase
          .from('business_documents')
          .select('id, document_name, document_url, uploaded_at, status')
          .eq('business_id', business.id)
          .order('uploaded_at', { ascending: false })

        if (documentsError) {
          console.error('Error fetching documents:', documentsError)
        } else {
          setDocuments(documentsData || [])
        }

        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        router.push('/auth/login')
      }
    }

    fetchDocuments()
  }, [router])

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return

    setUploading(true)

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        router.push('/auth/login')
        return
      }

      // Get business for this user
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('business_owner_id', user.id)
        .single()

      if (businessError || !business) {
        console.error('Error fetching business:', businessError)
        return
      }

      // Upload each file
      for (const file of files) {
        // Upload file to Supabase Storage (in this case we'll simulate by storing the file info)
        // In a real implementation, you would upload to Supabase Storage
        
        // For now, we'll just create a document record with pending status
        const { error: insertError } = await supabase
          .from('business_documents')
          .insert({
            business_id: business.id,
            document_name: file.name,
            document_url: `/documents/${file.name}`, // This would be the actual URL in a real implementation
            status: 'pending'
          })

        if (insertError) {
          console.error('Error uploading document:', insertError)
        }
      }

      // Refresh documents list
      const { data: documentsData, error: documentsError } = await supabase
        .from('business_documents')
        .select('id, document_name, document_url, uploaded_at, status')
        .eq('business_id', business.id)
        .order('uploaded_at', { ascending: false })

      if (!documentsError) {
        setDocuments(documentsData || [])
      }
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('business_documents')
        .delete()
        .eq('id', documentId)

      if (error) {
        console.error('Error deleting document:', error)
        return
      }

      // Refresh documents list
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[calc(100vh-4rem)]">
          <Sidebar role="business" />
          <div className="flex-1 ml-64 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Documents</h1>
              <p className="text-muted-foreground mt-2">Upload and manage business documents</p>
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
        <Sidebar role="business" />
        <div className="flex-1 ml-64 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Documents</h1>
            <p className="text-muted-foreground mt-2">Upload and manage business documents</p>
          </div>

          {/* Upload Section */}
          <Card className="p-6 mb-8">
            <h3 className="font-semibold mb-4">Upload Document</h3>
            <FileUploader 
              acceptedFormats={["pdf", "jpg", "png", "doc", "docx"]} 
              multiple={true} 
              onFilesSelected={handleFileUpload}
            />
            {uploading && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Uploading documents...
              </div>
            )}
          </Card>

          {/* Documents List */}
          <Card>
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold">Your Documents</h3>
            </div>
            {documents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          {doc.document_name || "Unnamed Document"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : "Unknown date"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={doc.status === "approved" ? "default" : "secondary"} 
                          className="gap-1"
                        >
                          {doc.status === "approved" ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : doc.status === "rejected" ? (
                            <Trash2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {doc.status ? doc.status.charAt(0).toUpperCase() + doc.status.slice(1) : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2 text-destructive"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No documents uploaded yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Upload your business documents to get started.</p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </>
  )
}