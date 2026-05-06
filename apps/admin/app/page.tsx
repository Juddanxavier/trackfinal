"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { CommandIcon, Truck, Package, BarChart3, Users, Globe, Shield } from "lucide-react"

export const metadata = {
  title: 'GT Express - Admin',
}

const features = [
  {
    icon: Truck,
    title: 'Real-time Tracking',
    description: 'Track shipments across multiple carriers in real-time with instant updates.'
  },
  {
    icon: Package,
    title: 'Package Management',
    description: 'Manage all your shipments, quotes, and deliveries from one centralized dashboard.'
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Get detailed insights into your shipping performance with customizable reports.'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Invite team members and manage roles with granular permissions.'
  },
  {
    icon: Globe,
    title: 'Multi-organisation',
    description: 'Support for multiple organisations with easy switching between them.'
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with encrypted data and secure authentication.'
  }
]

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('track_access_token')
    setIsAuthenticated(!!token)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="flex items-center justify-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
                <CommandIcon className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold">GT Express</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Your complete shipment tracking solution for businesses of all sizes.
              Track, manage, and analyze your deliveries in real-time.
            </p>
            <div className="flex gap-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="gap-2">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button size="lg" className="gap-2">
                    Sign In to Continue
                  </Button>
                </Link>
              )}
              <Link href="/register">
                <Button size="lg" variant="outline">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-12">Powerful Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Ready to get started?</h2>
            <p className="text-muted-foreground">
              Start tracking your shipments today with GT Express.
            </p>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg">Go to Dashboard</Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="lg">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground text-sm">
            © 2026 GT Express. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}