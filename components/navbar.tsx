'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu,  LogIn, User, Settings, LogOut, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'

interface Profile {
  id: string
  name: string | null
  email: string | null
  role: string | null
  profile_image_url: string | null
  is_banned: boolean | null
}

export function Navbar() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [isBannedMessage, setIsBannedMessage] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('id, name, email, role, is_banned, profile_image_url')
            .eq('id', user.id)
            .single()
          
          if (error) {
            console.error('Error fetching profile:', error)
          } else {
            // Check for banned status in URL params only on client side
            const urlParams = new URLSearchParams(window.location.search)
            const bannedParam = urlParams.get('message') === 'banned'
            
            if (profileData.is_banned || bannedParam) {
              setIsBannedMessage(true)
              if (profileData.is_banned) {
                await supabase.auth.signOut()
                setProfile(null)
                router.push('/?message=banned')
                return
              }
            }
            
            setProfile({
              id: profileData.id,
              name: profileData.name,
              email: profileData.email,
              role: profileData.role,
              profile_image_url: profileData.profile_image_url,
              is_banned: profileData.is_banned
            })
          }
        } else {
          // Check for banned status in URL params for logged out users
          const urlParams = new URLSearchParams(window.location.search)
          const bannedParam = urlParams.get('message') === 'banned'
          if (bannedParam) {
            setIsBannedMessage(true)
          }
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile()
      } else {
        setProfile(null)
        setLoading(false)
        // Check for banned status when user logs out
        const urlParams = new URLSearchParams(window.location.search)
        const bannedParam = urlParams.get('message') === 'banned'
        setIsBannedMessage(bannedParam)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    router.push('/')
  }

  const navItems = [
    { href: '/categories', label: 'Categories' },
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About' },
  ]

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

  // While loading, show a clean skeleton (no login buttons)
  if (loading) {
    return (
      <>
        {isBannedMessage && (
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
              <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/trustethiiopia.png" 
                alt="Trust Ethiopia Logo" 
                width={100} 
                height={80} 
                className="object-contain"
              />
            </Link>

              {/* Desktop: Show placeholder avatar */}
              <div className="hidden md:flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              </div>

              {/* Mobile: Show menu icon only */}
              <div className="md:hidden">
                <Button variant="ghost" size="sm">
                  <Menu className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>
        </nav>
      </>
    )
  }

  return (
    <>
      {isBannedMessage && (
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
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/trustethiiopia.png" 
                alt="Trust Ethiopia Logo" 
                width={100} 
                height={80} 
                className="object-contain"
              />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4">

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
                      <Button variant="ghost" size="sm" className="rounded-full p-0">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={profile.profile_image_url || undefined} alt={profile.name || "User"} />
                          <AvatarFallback>
                            {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                          </AvatarFallback>
                        </Avatar>
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
                        className="gap-2 cursor-pointer text-red-600"
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

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                {/* Adding a visually hidden title to fix the accessibility error */}
                <VisuallyHidden.Root>Navigation Menu</VisuallyHidden.Root>
                <div className="flex flex-col gap-4 mt-8 pl-4">
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
                    {!profile ? (
                      <div className="flex flex-col gap-2">
                        <Link 
                          href="/auth/login" 
                          className="text-sm text-primary hover:text-primary/80 transition-colors py-2"
                          onClick={() => setIsOpen(false)}
                        >
                          Sign In
                        </Link>
                        <Link 
                          href="/auth/register" 
                          className="text-sm text-primary hover:text-primary/80 transition-colors py-2"
                          onClick={() => setIsOpen(false)}
                        >
                          Sign Up
                        </Link>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {roleLink && (
                          <Link 
                            href={roleLink.href} 
                            className="text-sm text-primary hover:text-primary/80 transition-colors py-2"
                            onClick={() => setIsOpen(false)}
                          >
                            {roleLink.label}
                          </Link>
                        )}
                        <Link 
                          href="/user/profile" 
                          className="text-sm text-primary hover:text-primary/880 transition-colors py-2"
                          onClick={() => setIsOpen(false)}
                        >
                          Profile
                        </Link>
                        <button 
                          className="text-sm text-red-600 hover:text-red-700 transition-colors py-2 text-left"
                          onClick={() => {
                            handleSignOut();
                            setIsOpen(false);
                          }}
                        >
                          Sign Out
                        </button>
                      </div>
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