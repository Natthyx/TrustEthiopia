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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  const [documentName, setDocumentName] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0])
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile || !documentName.trim()) {
      alert("Please provide both a document name and select a file.")
      return
    }

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

      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${business.id}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('business_documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('business_documents')
        .getPublicUrl(fileName)
      
      // Insert document record with the actual URL
      const { error: insertError } = await supabase
        .from('business_documents')
        .insert({
          business_id: business.id,
          document_name: documentName.trim(),
          document_url: publicUrl,
          status: 'pending'
        })

      if (insertError) {
        console.error('Error uploading document:', insertError)
        throw insertError
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
      
      // Reset form
      setDocumentName("")
      setSelectedFile(null)
    } catch (error) {
      console.error('Error uploading files:', error)
      alert("Failed to upload document. Please try again.")
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
          <div className="flex-1 md:ml-64 p-8 pb-24 md:pb-8 w-full overflow-x-hidden">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold">Documents</h1>
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
        <div className="flex-1 md:ml-64 p-8 pb-24 md:pb-8 w-full overflow-x-hidden">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Documents</h1>
            <p className="text-muted-foreground mt-2">Upload and manage business documents</p>
          </div>

          {/* Upload Section */}
          <Card className="p-4 mb-8">
            <h3 className="font-semibold mb-4">Upload Document</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <Label htmlFor="documentName">Document Name *</Label>
                <Input
                  id="documentName"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Enter document name"
                  required
                  className="w-full"
                />
              </div>
              
              <div>
                <Label>File Upload *</Label>
                <FileUploader 
                  acceptedFormats={["pdf", "jpg", "png", "doc", "docx"]} 
                  multiple={false} 
                  onFilesSelected={handleFileSelect}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-2 truncate">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
              
              <Button 
                type="submit" 
                disabled={uploading || !selectedFile || !documentName.trim()}
                className="w-full sm:w-auto"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Document"}
              </Button>
            </form>
          </Card>

          {/* Documents List */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Your Documents</h3>
            </div>
            {documents.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap text-xs sm:text-sm">File Name</TableHead>
                      <TableHead className="whitespace-nowrap text-xs sm:text-sm">Uploaded</TableHead>
                      <TableHead className="whitespace-nowrap text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="text-right whitespace-nowrap text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[100px] sm:min-w-[120px]">
                            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate max-w-[80px] sm:max-w-[120px]">{doc.document_name || "Unnamed Document"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : "Unknown date"}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={doc.status === "approved" ? "default" : "secondary"} 
                            className="gap-1 whitespace-nowrap text-xs"
                          >
                            {doc.status === "approved" ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : doc.status === "rejected" ? (
                              <Trash2 className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            <span className="truncate max-w-[60px] sm:max-w-[80px]">
                              {doc.status ? doc.status.charAt(0).toUpperCase() + doc.status.slice(1) : "Pending"}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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