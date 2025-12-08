import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ReviewCard } from "@/components/review-card"
import { RatingStars } from "@/components/rating-stars"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Globe, Clock, ChevronDown } from "lucide-react"
import Image from "next/image"
import { useBannedUserCheck } from "@/hooks/useBannedUserCheck"

export default function ServiceDetailPage() {
  // Check if user is banned (for public pages, we don't redirect immediately)
  useBannedUserCheck('public', false)

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* Hero & Images */}
        <section className="bg-muted">
          <div className="container-app py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="md:col-span-2 relative h-96 rounded-lg overflow-hidden">
                <Image src="/hospital-professional.jpg" alt="Service" fill className="object-cover" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative h-[180px] rounded-lg overflow-hidden">
                    <Image
                      src={`/helpful-service.png?height=180&width=180&query=service ${i}`}
                      alt={`Gallery ${i}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Details & Reviews */}
        <section className="py-12">
          <div className="container-app">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h1 className="text-3xl font-bold">Excellence Healthcare Center</h1>
                      <div className="flex items-center gap-4 mt-3">
                        <RatingStars rating={4.8} totalReviews={1243} />
                        <Badge variant="secondary">Healthcare</Badge>
                      </div>
                    </div>
                    <Button size="lg">Write a Review</Button>
                  </div>
                  
                  <p className="text-muted-foreground mt-4">
                    Excellence Healthcare Center is dedicated to providing top-quality medical care with compassion and expertise. 
                    Our team of experienced professionals is committed to your health and well-being.
                  </p>
                </div>

                {/* Contact Info */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-sm text-muted-foreground">123 Medical Plaza, Suite 100<br />New York, NY 10001</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">(555) 123-4567</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Website</p>
                        <p className="text-sm text-muted-foreground">www.excellencehc.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Hours</p>
                        <p className="text-sm text-muted-foreground">Mon-Fri: 8AM-6PM<br />Sat: 9AM-2PM</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Reviews Section */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Customer Reviews</h2>
                    <Button variant="outline" className="gap-2">
                      Sort by <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                      <ReviewCard
                        key={i}
                        author={`Customer ${i}`}
                        rating={5}
                        title="Outstanding Service"
                        content="The staff at Excellence Healthcare Center is incredibly professional and caring. 
                        I received excellent treatment and would highly recommend them to anyone."
                        date="2 days ago"
                        verified
                        likes={24}
                      />
                    ))}
                  </div>

                  <div className="mt-8 text-center">
                    <Button variant="outline">Load More Reviews</Button>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Business Hours</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span>Monday</span>
                      <span>8:00 AM - 6:00 PM</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Tuesday</span>
                      <span>8:00 AM - 6:00 PM</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Wednesday</span>
                      <span>8:00 AM - 6:00 PM</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Thursday</span>
                      <span>8:00 AM - 6:00 PM</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Friday</span>
                      <span>8:00 AM - 6:00 PM</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Saturday</span>
                      <span>9:00 AM - 2:00 PM</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Sunday</span>
                      <span>Closed</span>
                    </li>
                  </ul>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Location</h3>
                  <div className="aspect-video bg-muted rounded-lg relative overflow-hidden">
                    <Image 
                      src="/map-placeholder.png" 
                      alt="Location map" 
                      fill 
                      className="object-cover"
                    />
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}