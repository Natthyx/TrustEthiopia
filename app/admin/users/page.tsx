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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MoreVertical, Shield, Ban, Check, Eye, Phone } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface User {
  id: string
  name: string | null
  email: string | null
  role: string | null
  is_banned: boolean | null
  created_at: string | null
  review_count: number
  phone: string | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false)
  const [isUnbanDialogOpen, setIsUnbanDialogOpen] = useState(false)
  const [isViewProfileDialogOpen, setIsViewProfileDialogOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Get current admin user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('Error getting current user:', userError)
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
          console.error('User is not admin or profile not found:', profileError)
          router.push('/admin/login')
          return
        }

        // Fetch all users with review counts using API route
        const response = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }

        const usersData = await response.json()
        console.log('Fetched users:', usersData)

        setUsers(usersData)
        setFilteredUsers(usersData)
        setLoading(false)
      } catch (error) {
        console.error('Error in fetchUsers:', error)
        router.push('/auth/login')
      }
    }

    fetchUsers()
  }, [router])

  useEffect(() => {
    // Filter users based on search term
    if (!searchTerm) {
      setFilteredUsers(users)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = users.filter(user => 
        (user.name && user.name.toLowerCase().includes(term)) ||
        (user.email && user.email.toLowerCase().includes(term)) ||
        (user.phone && user.phone.toLowerCase().includes(term))
      )
      setFilteredUsers(filtered)
    }
  }, [searchTerm, users])

  const handleBanUser = async () => {
    if (!selectedUser) return

    try {
      // Update user using API route
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ is_banned: true })
      })

      if (!response.ok) {
        throw new Error('Failed to ban user')
      }

      const updatedUser = await response.json()
      
      // Update local state
      setUsers(prev => 
        prev.map(user => 
          user.id === selectedUser.id ? { ...user, is_banned: true } : user
        )
      )
      
      setIsBanDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error banning user:', error)
      // Show error to user
    }
  }

  const handleUnbanUser = async () => {
    if (!selectedUser) return

    try {
      // Update user using API route
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ is_banned: false })
      })

      if (!response.ok) {
        throw new Error('Failed to unban user')
      }

      const updatedUser = await response.json()
      
      // Update local state
      setUsers(prev => 
        prev.map(user => 
          user.id === selectedUser.id ? { ...user, is_banned: false } : user
        )
      )
      
      setIsUnbanDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error unbanning user:', error)
      // Show error to user
    }
  }

  const handleViewProfile = (user: User) => {
    setSelectedUser(user)
    setIsViewProfileDialogOpen(true)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[calc(100vh-4rem)]">
          <Sidebar role="admin" />
          <div className="flex-1 ml-64 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Users</h1>
              <p className="text-muted-foreground mt-2">Manage platform users</p>
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Users</h1>
              <p className="text-muted-foreground mt-2">Manage platform users</p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search users by name, email, or phone..." 
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Reviews</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || "No name"}</TableCell>
                      <TableCell>{user.email || "No email"}</TableCell>
                      <TableCell>
                        {user.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <span>{user.phone}</span>
                          </div>
                        ) : (
                          "No phone"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.role || "user"}</Badge>
                      </TableCell>
                      <TableCell>{user.review_count}</TableCell>
                      <TableCell>
                        <Badge variant={user.is_banned ? "destructive" : "default"}>
                          {user.is_banned ? "Banned" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown date"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="gap-2"
                              onClick={() => handleViewProfile(user)}
                            >
                              <Eye className="w-4 h-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.is_banned ? (
                              <DropdownMenuItem 
                                className="gap-2 text-green-600"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setIsUnbanDialogOpen(true)
                                }}
                              >
                                <Check className="w-4 h-4" />
                                Unban User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                className="gap-2 text-destructive"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setIsBanDialogOpen(true)
                                }}
                              >
                                <Ban className="w-4 h-4" />
                                Ban User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </main>

      {/* View Profile Dialog */}
      <Dialog open={isViewProfileDialogOpen} onOpenChange={setIsViewProfileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>
              Details for {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedUser.name || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUser.email || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">
                    {selectedUser.phone ? (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <span>{selectedUser.phone}</span>
                      </div>
                    ) : (
                      "Not provided"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium">
                    <Badge variant="secondary">{selectedUser.role || "user"}</Badge>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">
                    <Badge variant={selectedUser.is_banned ? "destructive" : "default"}>
                      {selectedUser.is_banned ? "Banned" : "Active"}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reviews</p>
                  <p className="font-medium">{selectedUser.review_count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">
                    {selectedUser.created_at 
                      ? new Date(selectedUser.created_at).toLocaleDateString() 
                      : "Unknown date"}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsViewProfileDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Are you sure you want to ban {selectedUser?.name || selectedUser?.email}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              This will prevent the user from logging in and accessing their account.
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
                onClick={handleBanUser}
                variant="destructive"
              >
                Ban User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unban User Dialog */}
      <Dialog open={isUnbanDialogOpen} onOpenChange={setIsUnbanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unban User</DialogTitle>
            <DialogDescription>
              Are you sure you want to unban {selectedUser?.name || selectedUser?.email}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              This will restore the user's access to their account.
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
                onClick={handleUnbanUser}
              >
                Unban User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}