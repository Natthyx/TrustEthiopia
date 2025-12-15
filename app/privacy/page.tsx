import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen py-12 px-4">
        <article className="container-app max-w-3xl">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 2025</p>

          <div className="prose prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-3">1. Introduction</h2>
              <p>
                ReviewTrust ("we", "us", "our") operates the ReviewTrust website and mobile application (the "Service").
                This page informs you of our policies regarding the collection, use, and disclosure of personal data
                when you use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">2. Information Collection</h2>
              <p>
                We collect several different types of information for various purposes to provide and improve our
                Service to you.
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Personal Data: name, email address, phone number, demographic information</li>
                <li>Usage Data: browser type, pages visited, time and date of visits</li>
                <li>Device Information: device type, operating system, unique device identifiers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">3. Use of Data</h2>
              <p>ReviewTrust uses the collected data for various purposes including:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>To provide and maintain our Service</li>
                <li>To send you technical notices and support messages</li>
                <li>To gather analysis or valuable information to improve our Service</li>
                <li>To monitor and analyze trends and usage</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">4. Security</h2>
              <p>
                The security of your data is important to us but remember that no method of transmission over the
                Internet or method of electronic storage is 100% secure. We strive to use commercially acceptable means
                to protect your personal data, but we cannot guarantee its absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">5. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at privacy@reviewtrust.com</p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
