'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Search, LogIn, User, Settings, LogOut, AlertTriangle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ModeToggle } from '@/components/mode-toggle'

interface Profile {
  id: string
  name: string | null
  email: string | null
  role: string | null
  avatar_url: string | null
  is_banned: boolean | null
}

export function Navbar() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Check if there's a banned message in the URL
  const isBannedMessage = searchParams.get('message') === 'banned'

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Fetch profile data from the profiles table including banned status
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, name, email, role, is_banned')
            .eq('id', user.id)
            .single()
          
          if (error) {
            console.error('Error fetching profile:', error)
          } else {
            // If user is banned, sign them out immediately
            if (profile.is_banned) {
              await supabase.auth.signOut()
              setProfile(null)
              router.push('/?message=banned')
              return
            }
            
            setProfile({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role,
              avatar_url: null, // We don't have avatar_url in the schema
              is_banned: profile.is_banned
            })
          }
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }

    fetchProfile()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile()
      } else {
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    // Redirect to home page after logout
    router.push('/')
  }

  // Define navigation items
  const navItems = [
    { href: '/categories', label: 'Categories' },
    { href: '/blog', label: 'Blog' },
    { href: '/explore', label: 'Explore' },
  ]

  // Define role-specific links
  const getRoleLink = () => {
    if (!profile) return null
    
    switch (profile.role) {
      case 'business':
        return { href: '/business/dashboard', label: 'Dashboard' }
      case 'admin':
        return { href: '/admin/dashboard', label: 'Admin Panel' }
      default:
        return null
    }
  }

  const roleLink = getRoleLink()

  return (
    <>
      {/* Banned User Banner */}
      {(profile?.is_banned || isBannedMessage) && (
        <div className="bg-red-600 text-white py-2 px-4 text-center text-sm font-medium">
          <div className="container-app flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Your account has been banned. Please contact support for assistance.</span>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container-app">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent" />
              <span className="font-bold text-lg">ReviewTrust</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right Section */}
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" size="sm" className="gap-2">
                <Search className="w-4 h-4" />
              </Button>
              <ModeToggle />

              {!profile ? (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/auth/login" className="gap-2">
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/auth/register">Sign Up</Link>
                  </Button>
                </>
              ) : (
                <>
                  {roleLink && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={roleLink.href}>{roleLink.label}</Link>
                  </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="rounded-full">
                        <div className="w-6 h-6 rounded-full bg-primary/20" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href="/user/profile" className="gap-2">
                          <User className="w-4 h-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/user/settings" className="gap-2">
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="gap-2 cursor-pointer"
                        onClick={handleSignOut}
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-4 mt-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-sm font-medium hover:text-primary transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="border-t pt-4 mt-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Theme</span>
                      <ModeToggle />
                    </div>
                    {!profile ? (
                      <>
                        <Button variant="outline" asChild className="w-full bg-transparent">
                          <Link href="/auth/login">Sign In</Link>
                        </Button>
                        <Button asChild className="w-full">
                          <Link href="/auth/register">Sign Up</Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        {roleLink && (
                          <Button variant="outline" asChild className="w-full bg-transparent">
                            <Link href={roleLink.href}>{roleLink.label}</Link>
                          </Button>
                        )}
                        <Button variant="outline" asChild className="w-full bg-transparent">
                          <Link href="/user/profile">Profile</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </>
  )
}