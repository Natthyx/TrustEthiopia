import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Target, Heart, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* Hero */}
        <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
          <div className="container-app max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">About ReviewTrust</h1>
            <p className="text-lg text-muted-foreground">
              Empowering consumers and businesses through authentic, transparent reviews
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 px-4">
          <div className="container-app max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              At ReviewTrust, we believe that authentic reviews create better experiences for everyone. We're committed
              to building a transparent platform where customers can share honest feedback and businesses can improve
              based on real user insights.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our goal is to empower informed decisions and foster trust between consumers and service providers
              worldwide.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container-app">
            <h2 className="text-2xl font-bold mb-12 text-center">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Heart, title: "Authenticity", description: "Real reviews from real users" },
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
        <section className="py-16 px-4">
          <div className="container-app">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Reviews Published", value: "2.5M+" },
                { label: "Verified Businesses", value: "50K+" },
                { label: "Active Users", value: "15M+" },
                { label: "Countries", value: "180+" },
              ].map((stat, idx) => (
                <Card key={idx} className="p-6 text-center">
                  <p className="text-2xl font-bold text-primary">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-2">{stat.label}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-gradient-to-r from-primary to-accent text-primary-foreground">
          <div className="container-app max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
            <p className="mb-8 text-primary-foreground/80">
              Be part of a movement that's changing how we discover and trust services
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">Get Started Today</Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  )
}
