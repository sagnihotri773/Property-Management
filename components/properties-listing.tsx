"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getAllProperties, deleteProperty } from "@/lib/firebase-operations"
import type { Property, SearchFilters } from "@/lib/types"
import {
  Home,
  Building,
  Store,
  MapPin,
  Search,
  Plus,
  Edit,
  Trash2,
  Phone,
  Calendar,
  IndianRupee,
  Navigation,
  Filter,
  X,
} from "lucide-react"

export default function PropertiesListing() {
  const { toast } = useToast()
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<SearchFilters>({
    propertyType: "All types",
    sectorPhase: "All sectors",
    cpName: "All CPs",
    project: "All projects",
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadProperties()
  }, [])

  useEffect(() => {
    filterProperties()
  }, [properties, searchTerm, filters])

  const loadProperties = async () => {
    try {
      setLoading(true)
      const data = await getAllProperties()
      setProperties(data)
    } catch (error) {
      console.error("Error loading properties:", error)
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterProperties = () => {
    let filtered = properties

    // Text search across multiple fields
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (property) =>
          property.sectorPhase?.toLowerCase().includes(term) ||
          property.cpName?.toLowerCase().includes(term) ||
          property.contactNumber?.includes(term) ||
          property.cpFirmName?.toLowerCase().includes(term) ||
          (property as any).project?.toLowerCase().includes(term),
      )
    }

    // Apply filters
    if (filters.propertyType !== "All types") {
      filtered = filtered.filter((property) => property.propertyType === filters.propertyType)
    }
    if (filters.sectorPhase !== "All sectors") {
      filtered = filtered.filter((property) => property.sectorPhase === filters.sectorPhase)
    }
    if (filters.cpName !== "All CPs") {
      filtered = filtered.filter((property) => property.cpName === filters.cpName)
    }
    if (filters.project !== "All projects") {
      filtered = filtered.filter((property) => (property as any).project === filters.project)
    }

    setFilteredProperties(filtered)
  }

  const handleDelete = async (id: string, propertyType: string) => {
    if (window.confirm(`Are you sure you want to delete this ${propertyType} property?`)) {
      try {
        await deleteProperty(id)
        toast({
          title: "Success",
          description: "Property deleted successfully",
        })
        loadProperties()
      } catch (error) {
        console.error("Error deleting property:", error)
        toast({
          title: "Error",
          description: "Failed to delete property",
          variant: "destructive",
        })
      }
    }
  }

  const getPropertyIcon = (type: string) => {
    switch (type) {
      case "Kothi":
        return <Home className="h-5 w-5" />
      case "Flat":
        return <Building className="h-5 w-5" />
      case "Commercial":
        return <Store className="h-5 w-5" />
      case "Plot":
        return <MapPin className="h-5 w-5" />
      default:
        return null
    }
  }

  const getPropertyColor = (type: string) => {
    switch (type) {
      case "Kothi":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Flat":
        return "bg-green-100 text-green-800 border-green-200"
      case "Commercial":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "Plot":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const clearFilters = () => {
    setFilters({ propertyType: "All types", sectorPhase: "All sectors", cpName: "All CPs", project: "All projects" })
    setSearchTerm("")
    setShowFilters(false)
  }

  const getUniqueValues = (field: keyof Property) => {
    const values = properties.map((p) => p[field]).filter(Boolean)
    return [...new Set(values)] as string[]
  }

  const getUniqueProjects = () => {
    const projects = properties
      .filter((p) => p.propertyType === "Flat")
      .map((p) => (p as any).project)
      .filter(Boolean)
    return [...new Set(projects)] as string[]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading properties...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Properties</h1>
            <p className="text-muted-foreground">
              {filteredProperties.length} of {properties.length} properties
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Link href="/add-property">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by sector, CP name, contact number, project..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {Object.keys(filters).some(
                  (key) =>
                    filters[key as keyof SearchFilters] !== "All types" &&
                    filters[key as keyof SearchFilters] !== "All sectors" &&
                    filters[key as keyof SearchFilters] !== "All CPs" &&
                    filters[key as keyof SearchFilters] !== "All projects",
                ) && (
                  <Badge variant="secondary" className="ml-1">
                    {
                      Object.keys(filters).filter(
                        (key) =>
                          filters[key as keyof SearchFilters] !== "All types" &&
                          filters[key as keyof SearchFilters] !== "All sectors" &&
                          filters[key as keyof SearchFilters] !== "All CPs" &&
                          filters[key as keyof SearchFilters] !== "All projects",
                      ).length
                    }
                  </Badge>
                )}
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Property Type</label>
                    <Select
                      value={filters.propertyType}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, propertyType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All types">All types</SelectItem>
                        <SelectItem value="Kothi">Kothi</SelectItem>
                        <SelectItem value="Flat">Flat</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="Plot">Plot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Sector/Phase</label>
                    <Select
                      value={filters.sectorPhase}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, sectorPhase: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All sectors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All sectors">All sectors</SelectItem>
                        {getUniqueValues("sectorPhase").map((sector) => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">CP Name</label>
                    <Select
                      value={filters.cpName}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, cpName: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All CPs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All CPs">All CPs</SelectItem>
                        {getUniqueValues("cpName").map((cp) => (
                          <SelectItem key={cp} value={cp}>
                            {cp}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Project</label>
                    <Select
                      value={filters.project}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, project: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All projects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All projects">All projects</SelectItem>
                        {getUniqueProjects().map((project) => (
                          <SelectItem key={project} value={project}>
                            {project}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2 bg-transparent">
                    <X className="h-4 w-4" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-muted-foreground mb-4">
                {properties.length === 0 ? (
                  <>
                    <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No properties found</h3>
                    <p>Get started by adding your first property</p>
                  </>
                ) : (
                  <>
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No matching properties</h3>
                    <p>Try adjusting your search or filters</p>
                  </>
                )}
              </div>
              {properties.length === 0 && (
                <Link href="/add-property">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Property
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <Card key={property.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={`${getPropertyColor(property.propertyType)} flex items-center gap-1`}>
                      {getPropertyIcon(property.propertyType)}
                      {property.propertyType}
                    </Badge>
                    <div className="flex gap-1">
                      <Link href={`/edit-property/${property.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(property.id!, property.propertyType)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-lg">
                    {property.propertyType === "Flat" && (property as any).project && (
                      <div className="text-primary">{(property as any).project}</div>
                    )}
                    {property.propertyType === "Kothi" && (property as any).kothiNumber && (
                      <div>Kothi #{(property as any).kothiNumber}</div>
                    )}
                    {property.propertyType === "Plot" && (property as any).plotNumber && (
                      <div>Plot #{(property as any).plotNumber}</div>
                    )}
                    {property.propertyType === "Commercial" && <div>Commercial Property</div>}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {property.sectorPhase}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Property Details */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Size:</span>
                      <div className="font-medium">{property.plotSize}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Marla:</span>
                      <div className="font-medium">{property.marla}</div>
                    </div>
                    {property.propertyType === "Flat" && (
                      <>
                        <div>
                          <span className="text-muted-foreground">Floor:</span>
                          <div className="font-medium">{(property as any).floor}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">BHK:</span>
                          <div className="font-medium">{(property as any).bhk}</div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Facing */}
                  <div className="flex items-center gap-2 text-sm">
                    <Navigation className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Facing:</span>
                    <span className="font-medium">{property.facing}</span>
                  </div>

                  {/* Demand */}
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-600">{property.demand}</span>
                  </div>

                  {/* Contact Info */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm mb-1">
                      <span className="font-medium">{property.cpName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {property.contactNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">{property.cpFirmName}</div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(property.date).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
