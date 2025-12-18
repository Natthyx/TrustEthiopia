"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Target, Heart, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/footer"
import Image from 'next/image'

interface Stat {
  label: string
  value: string
}

export default function AboutPage() {
  const [stats, setStats] = useState<Stat[]>([
    { label: "Reviews Published", value: "0" },
    { label: "Verified Businesses", value: "0" },
    { label: "Active Users", value: "0" },
    { label: "Cities", value: "0" },
  ])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/landing')
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch stats')
        }
        
        // Format large numbers (e.g., 1500000 -> 1.5M)
        const formatNumber = (num: number): string => {
          if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M+'
          }
          if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K+'
          }
          return num.toString()
        }
        
        setStats([
          { label: "Active Users", value: formatNumber(data.stats.users) },
          { label: "Reviews Published", value: formatNumber(data.stats.reviews) },
          { label: "Verified Businesses", value: formatNumber(data.stats.businesses) },
          { label: "Cities", value: "50+" }, // Updated to reflect Ethiopian cities
        ])
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    fetchStats()
  }, [])

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* Hero */}
        <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
        <div className="flex justify-center mb-8">
            <Image 
              src="/intro.png" 
              alt="Addis Ababa, Ethiopia" 
              width={350} 
              height={300} 
              className="object-contain"
            />
          </div>
          <div className="container-app max-w-3xl mx-auto text-center">
            <h1 className="text-3xl text-muted-foreground leading-relaxed mb-4">እንኳን ወደ TRUST ETHIOPIA በደህና መጡ።</h1>
            <p className="text-muted-foreground leading-relaxed mb-4">
            በመላው ኢትዪዽያ ባሉ ቢዝነሶች ታማኝ የሆነውን ለእርሶ ለማስመረጥ ተቀዳሚ ምርጫዎ። እርሶ በሚፈልጉት መንገድ የሚጠቅሞትን ታማኝ ቢዝነስ ለማገናኘት ከተጠቃሚዎች እና ከታማኝ ደንበኞች በተሰበሱ አስተያየቶች እንዲመርጡ እናግዞታለን።
            ፍትሃዊነት እና ተጠያቂነት ያለውን ገበያ በአንድነት እንገነባለን።
            </p>
          </div>
        </section>

        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="container-app max-w-4xl mx-auto text-center">
            <p className="text-lg mb-8 text-primary-foreground/80">
              Trust Ethiopia is a user-powered review
              platform and symbol of trust.
            </p>
            <h2 className="text-3xl font-bold mb-4">We are Trust Ethiopia</h2>
            </div>
        </section>

        {/* Mission */}
        <section className="py-16 px-4">
          <div className="container-app max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Our Vision</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To become Ethiopia's most trusted platform for transparent business reviews - empowering people to make better choices and encouraging
                businesses to grow through accountability and customer satisfaction.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              በኢትዩዽያ ውስጥ የታመነ እና በግልፅነት የተመሰረተ የግምገማ መድረክ መሆን፤ ሰዎች ትክክለኛ ውሳኔ 
              እንዲወስኑ እና ንግዶች በተጠያቂነት እና በደንበኞች እርካታ እንዲያሳዩ ማነቃቃት።
            </p>

            <div className="flex justify-center mb-8 mt-8">
            <Image 
              src="/meeting.jpeg" 
              alt="Meeting" 
              width={550} 
              height={500} 
              className="object-contain"
            />
            </div>
            
            <p className="text-muted-foreground leading-relaxed mb-4">
              We believe every customer has a voice, and every business deserves a chance to grow through honest feedback. Our platform
              connects people with real experiences-helping others make informed choices about where to shop, eat, stay, and receive services.
              From any business Trust Ethiopia is your reliable guide to discovering businesses that care about quality and reputation.
              Join us in shaping a more trusted Ethiopia-one review at a time.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container-app">
            <h2 className="text-2xl font-bold mb-12 text-center">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Heart, title: "Authenticity", description: "Real reviews from real Ethiopians" },
                { icon: Target, title: "Transparency", description: "Clear policies and fair practices" },
                { icon: Users, title: "Community", description: "Building trust together" },
                { icon: TrendingUp, title: "Excellence", description: "Continuous improvement" },
              ].map((value, idx) => {
                const Icon = value.icon
                return (
                  <Card key={idx} className="p-6 text-center">
                    <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 px-4 bg-background">
          <div className="container-app">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">By the Numbers</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our platform continues to grow, connecting Ethiopians with trusted services across the country.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, idx) => (
                <Card key={idx} className="p-6 text-center">
                  <p className="text-3xl font-bold text-primary mb-2">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="container-app max-w-4xl mx-auto text-center">
            <p className="mb-8 text-primary-foreground/80">
              Trust Ethiopia is a user-powered review platform dedicated to building a culture of trust, transparency and accountability in Ethiopia's business community. From any business Trust Ethiopia is your reliable guide to discovering businesses that care about quality and reputation. Join us in shaping a more trusted Ethiopia-one review at a time.
            </p>
            </div>
        </section>

        <section className="py-16 px-4">
          <div className="flex justify-center mb-8">
            <Image 
              src="/addis-ababa.jpg" 
              alt="Addis Ababa, Ethiopia" 
              width={550} 
              height={500} 
              className="object-contain"
            />
          </div>
          <div className="container-app max-w-4xl mx-auto text-center">
            <p className="text-center">እኛ የተሞላ ድምጽ ያለው ደንበኛ እንደሆነ እና ለንግድ ተቋማት በፍትሃዊ እውቀት የሚመራ ግምገማ እንደ ውጤት ማብራሪያ መሆኑን እናመናለን። 
              በእውነተኛ ተሞክሮ ላይ የተመሰረቱ ግምገማዎች በማግኘት ሰዎች ትክክለኛ ውሳኔ እንዲወስኑ እና ንግዶች ጥራታቸውን እንዲያሻሽሉ እናበረታታለን። ከሆቴሎች እና ሬስቶራንቶች እስከ የሞባይል መደብሮች እና የድንቅ አካል ሕክምና እና 
              ተመሳሳይ ተሞክሮ ላይ የተመሰረተ መረጃ እንዲያገኙ እናገራለን።</p>
              <div className="flex justify-center">
              <Image 
              src="/trustethiiopia.png" 
              alt="Trust Ethiopia Logo" 
              width={120} 
              height={80} 
              className="object-contain"
            /></div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="container-app max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
            <p className="mb-8 text-primary-foreground/80">
              From any business Trust Ethiopia is your reliable guide to discovering businesses that care about quality and
            reputation. Join us in shaping a more trusted Ethiopia-one review at a time.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/register">Get Started Today</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}