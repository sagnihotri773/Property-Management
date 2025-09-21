"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Building,
  Home,
  MapPin,
  Store,
  Plus,
  List,
  Upload,
  Download,
  TrendingUp,
  Calendar,
  IndianRupee,
  Users,
} from "lucide-react"
import { getAllProperties } from "@/lib/firebase-operations"
import type { Property } from "@/lib/types"

interface DashboardStats {
  total: number
  kothi: number
  flat: number
  commercial: number
  plot: number
  recentCount: number
  totalDemandValue: number
  uniqueContacts: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    kothi: 0,
    flat: 0,
    commercial: 0,
    plot: 0,
    recentCount: 0,
    totalDemandValue: 0,
    uniqueContacts: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recentProperties, setRecentProperties] = useState<Property[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const properties = await getAllProperties()

      // Calculate statistics
      const kothi = properties.filter((p) => p.propertyType === "Kothi").length
      const flat = properties.filter((p) => p.propertyType === "Flat").length
      const commercial = properties.filter((p) => p.propertyType === "Commercial").length
      const plot = properties.filter((p) => p.propertyType === "Plot").length

      // Recent properties (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const recent = properties.filter((p) => new Date(p.date) >= sevenDaysAgo)

      // Calculate total demand value (extract numbers from demand strings)
      const totalDemandValue = properties.reduce((sum, property) => {
        const demandStr = property.demand?.toLowerCase() || ""
        const numbers = demandStr.match(/[\d.]+/)
        if (numbers) {
          const value = Number.parseFloat(numbers[0])
          if (demandStr.includes("crore")) return sum + value * 10000000
          if (demandStr.includes("lakh")) return sum + value * 100000
          return sum + value
        }
        return sum
      }, 0)

      // Unique contacts
      const uniqueContacts = new Set(properties.map((p) => p.contactNumber)).size

      setStats({
        total: properties.length,
        kothi,
        flat,
        commercial,
        plot,
        recentCount: recent.length,
        totalDemandValue,
        uniqueContacts,
      })

      // Get 5 most recent properties
      setRecentProperties(properties.slice(0, 5))
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(1)}Cr`
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`
    }
    return `₹${value}`
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Property Management System</h1>
          <p className="text-muted-foreground text-lg">Manage your real estate properties efficiently</p>
          {!loading && (
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>Last updated: {new Date().toLocaleString()}</span>
              <span>•</span>
              <span>{stats.total} total properties</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-primary">
                <TrendingUp className="h-5 w-5" />
                Total Properties
              </CardTitle>
              <CardDescription>All property records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{loading ? "..." : stats.total}</div>
              <p className="text-sm text-muted-foreground">
                {loading ? "Loading..." : `${stats.recentCount} added this week`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-secondary">
                <IndianRupee className="h-5 w-5" />
                Total Value
              </CardTitle>
              <CardDescription>Combined demand value</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">
                {loading ? "..." : formatCurrency(stats.totalDemandValue)}
              </div>
              <p className="text-sm text-muted-foreground">Estimated market value</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Users className="h-5 w-5" />
                Unique Contacts
              </CardTitle>
              <CardDescription>Different contact persons</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{loading ? "..." : stats.uniqueContacts}</div>
              <p className="text-sm text-green-600">Active contacts</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Calendar className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Properties added recently</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">{loading ? "..." : stats.recentCount}</div>
              <p className="text-sm text-blue-600">Last 7 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5 text-primary" />
                Add Property
              </CardTitle>
              <CardDescription>Create new property record</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/add-property">
                <Button className="w-full">Add New Property</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <List className="h-5 w-5 text-primary" />
                View Properties
              </CardTitle>
              <CardDescription>Browse all properties</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/properties">
                <Button variant="outline" className="w-full bg-transparent">
                  View All
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="h-5 w-5 text-secondary" />
                Import Data
              </CardTitle>
              <CardDescription>Upload Excel file</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/import">
                <Button variant="secondary" className="w-full">
                  Import Excel
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="h-5 w-5 text-secondary" />
                Export Data
              </CardTitle>
              <CardDescription>Download Excel file</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/export">
                <Button variant="secondary" className="w-full">
                  Export Excel
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Property Types Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Home className="h-6 w-6" />
                Kothi Properties
              </CardTitle>
              <CardDescription className="text-blue-600">Independent houses and villas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{loading ? "..." : stats.kothi}</div>
              <p className="text-sm text-blue-600">Total Kothi properties</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Building className="h-6 w-6" />
                Flat Properties
              </CardTitle>
              <CardDescription className="text-green-600">Apartments and flats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{loading ? "..." : stats.flat}</div>
              <p className="text-sm text-green-600">Total Flat properties</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Store className="h-6 w-6" />
                Commercial
              </CardTitle>
              <CardDescription className="text-purple-600">Shops and offices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">{loading ? "..." : stats.commercial}</div>
              <p className="text-sm text-purple-600">Total Commercial properties</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <MapPin className="h-6 w-6" />
                Plot Properties
              </CardTitle>
              <CardDescription className="text-orange-600">Land and plots</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{loading ? "..." : stats.plot}</div>
              <p className="text-sm text-orange-600">Total Plot properties</p>
            </CardContent>
          </Card>
        </div>

        {!loading && recentProperties.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Properties
              </CardTitle>
              <CardDescription>Latest property additions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProperties.map((property) => (
                  <div key={property.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-background rounded-md">
                        {property.propertyType === "Kothi" && <Home className="h-4 w-4 text-blue-600" />}
                        {property.propertyType === "Flat" && <Building className="h-4 w-4 text-green-600" />}
                        {property.propertyType === "Commercial" && <Store className="h-4 w-4 text-purple-600" />}
                        {property.propertyType === "Plot" && <MapPin className="h-4 w-4 text-orange-600" />}
                      </div>
                      <div>
                        <div className="font-medium">
                          {property.propertyType === "Flat" && (property as any).project
                            ? (property as any).project
                            : `${property.propertyType} Property`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {property.sectorPhase} • {property.cpName} • {property.demand}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{new Date(property.date).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link href="/properties">
                  <Button variant="outline" className="w-full bg-transparent">
                    View All Properties
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
