'use client'

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function TrustpilotHero() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/explore?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <section className="relative overflow-hidden bg-background pt-20 pb-32">
      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <h1 className="text-5xl font-bold text-foreground mb-4">Find trusted Ethiopian businesses</h1>
        <p className="text-xl text-muted-foreground mb-12">እውነተኛ ቢዝነስ ያግኙ፣ ልምድዎትን ያካፍሉ፣ ታማኝ ኢትዪዽያን በአንድነት እንገነባ።</p>
        <div className="relative mx-auto max-w-2xl">
          <form onSubmit={handleSearch}>
            <div className="flex items-center gap-2 bg-card rounded-full shadow-md overflow-hidden border border-primary">
              <div className="flex-1 flex items-center pl-6">
                <Search className="h-5 w-5 text-muted-foreground mr-3" />
                <Input
                  type="text"
                  placeholder="Search for services or categories"
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" className="bg-primary hover:bg-primary/90 rounded-full h-12 w-12 mr-1">
                <Search className="h-5 w-5 text-primary-foreground" />
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Used a service recently?{" "}
            <Link href="/auth/register" className="text-primary hover:underline">
              Write a review →
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}