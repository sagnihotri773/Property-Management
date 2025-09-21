"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { addProperty, updateProperty } from "@/lib/firebase-operations"
import type { Property } from "@/lib/types"
import { Home, Building, Store, MapPin } from "lucide-react"

interface PropertyFormProps {
  initialData?: Partial<Property>
  isEditing?: boolean
}

export default function PropertyForm({ initialData, isEditing = false }: PropertyFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [propertyType, setPropertyType] = useState<string>(initialData?.propertyType || "")

  const [formData, setFormData] = useState({
    // Common fields
    sectorPhase: initialData?.sectorPhase || "",
    plotSize: initialData?.plotSize || "",
    marla: initialData?.marla || "",
    plc: initialData?.plc || "",
    road: initialData?.road || "",
    cpName: initialData?.cpName || "",
    contactNumber: initialData?.contactNumber || "",
    cpFirmName: initialData?.cpFirmName || "",
    demand: initialData?.demand || "",
    expectations: initialData?.expectations || "",
    date: initialData?.date || new Date().toISOString().split("T")[0],
    facing: initialData?.facing || "",

    // Kothi/Plot specific
    kothiNumber: (initialData as any)?.kothiNumber || "",
    plotNumber: (initialData as any)?.plotNumber || "",

    // Flat specific
    project: (initialData as any)?.project || "",
    floor: (initialData as any)?.floor || "",
    bhk: (initialData as any)?.bhk || "",

    // Commercial specific
    commercialType: (initialData as any)?.commercialType || "",
    area: (initialData as any)?.area || "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyType) {
      toast({
        title: "Error",
        description: "Please select a property type",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const propertyData: any = {
        propertyType,
        sectorPhase: formData.sectorPhase,
        plotSize: formData.plotSize,
        marla: formData.marla,
        plc: formData.plc,
        road: formData.road,
        cpName: formData.cpName,
        contactNumber: formData.contactNumber,
        cpFirmName: formData.cpFirmName,
        demand: formData.demand,
        expectations: formData.expectations,
        date: formData.date,
        facing: formData.facing,
      }

      // Add type-specific fields
      if (propertyType === "Kothi") {
        propertyData.kothiNumber = formData.kothiNumber
      } else if (propertyType === "Plot") {
        propertyData.plotNumber = formData.plotNumber
      } else if (propertyType === "Flat") {
        propertyData.project = formData.project
        propertyData.floor = formData.floor
        propertyData.bhk = formData.bhk
      } else if (propertyType === "Commercial") {
        propertyData.commercialType = formData.commercialType
        propertyData.area = formData.area
        propertyData.floor = formData.floor
      }

      if (isEditing && initialData?.id) {
        await updateProperty(initialData.id, propertyData)
        toast({
          title: "Success",
          description: `${propertyType} property updated successfully!`,
        })
      } else {
        await addProperty(propertyData)
        toast({
          title: "Success",
          description: `${propertyType} property added successfully!`,
        })
      }

      router.push("/properties")
    } catch (error) {
      console.error(`Error ${isEditing ? "updating" : "adding"} property:`, error)
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "add"} property. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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

  const renderTypeSpecificFields = () => {
    switch (propertyType) {
      case "Kothi":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="kothiNumber">Kothi Number *</Label>
              <Input
                id="kothiNumber"
                value={formData.kothiNumber}
                onChange={(e) => handleInputChange("kothiNumber", e.target.value)}
                placeholder="Enter kothi number"
                required
              />
            </div>
          </div>
        )

      case "Plot":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="plotNumber">Plot Number *</Label>
              <Input
                id="plotNumber"
                value={formData.plotNumber}
                onChange={(e) => handleInputChange("plotNumber", e.target.value)}
                placeholder="Enter plot number"
                required
              />
            </div>
          </div>
        )

      case "Flat":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="project">Project *</Label>
              <Input
                id="project"
                value={formData.project}
                onChange={(e) => handleInputChange("project", e.target.value)}
                placeholder="Enter project name"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="floor">Floor *</Label>
                <Input
                  id="floor"
                  value={formData.floor}
                  onChange={(e) => handleInputChange("floor", e.target.value)}
                  placeholder="Enter floor number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="bhk">BHK *</Label>
                <Select value={formData.bhk} onValueChange={(value) => handleInputChange("bhk", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select BHK" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1BHK">1 BHK</SelectItem>
                    <SelectItem value="2BHK">2 BHK</SelectItem>
                    <SelectItem value="3BHK">3 BHK</SelectItem>
                    <SelectItem value="4BHK">4 BHK</SelectItem>
                    <SelectItem value="5BHK">5 BHK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case "Commercial":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="commercialType">Commercial Type</Label>
                <Select
                  value={formData.commercialType}
                  onValueChange={(value) => handleInputChange("commercialType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Shop">Shop</SelectItem>
                    <SelectItem value="Office">Office</SelectItem>
                    <SelectItem value="Showroom">Showroom</SelectItem>
                    <SelectItem value="Warehouse">Warehouse</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="area">Area (sq ft)</Label>
                <Input
                  id="area"
                  value={formData.area}
                  onChange={(e) => handleInputChange("area", e.target.value)}
                  placeholder="Enter area in sq ft"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="floor">Floor</Label>
              <Input
                id="floor"
                value={formData.floor}
                onChange={(e) => handleInputChange("floor", e.target.value)}
                placeholder="Enter floor number"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              {propertyType && getPropertyIcon(propertyType)}
              {isEditing ? "Edit Property" : "Add New Property"}
            </CardTitle>
            <CardDescription>
              Fill in the details below to {isEditing ? "update" : "add"} a property record
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Property Type Selection */}
              <div>
                <Label htmlFor="propertyType">Property Type *</Label>
                <Select value={propertyType} onValueChange={setPropertyType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kothi">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Kothi
                      </div>
                    </SelectItem>
                    <SelectItem value="Flat">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Flat
                      </div>
                    </SelectItem>
                    <SelectItem value="Commercial">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        Commercial
                      </div>
                    </SelectItem>
                    <SelectItem value="Plot">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Plot
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type-specific fields */}
              {propertyType && (
                <Card className="bg-card/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getPropertyIcon(propertyType)}
                      {propertyType} Specific Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>{renderTypeSpecificFields()}</CardContent>
                </Card>
              )}

              {/* Common fields */}
              <Card className="bg-card/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Property Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sectorPhase">Sector/Phase *</Label>
                      <Input
                        id="sectorPhase"
                        value={formData.sectorPhase}
                        onChange={(e) => handleInputChange("sectorPhase", e.target.value)}
                        placeholder="Enter sector or phase"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="plotSize">Plot Size *</Label>
                      <Input
                        id="plotSize"
                        value={formData.plotSize}
                        onChange={(e) => handleInputChange("plotSize", e.target.value)}
                        placeholder="Enter plot size"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="marla">Marla *</Label>
                      <Input
                        id="marla"
                        value={formData.marla}
                        onChange={(e) => handleInputChange("marla", e.target.value)}
                        placeholder="Enter marla"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="plc">PLC *</Label>
                      <Input
                        id="plc"
                        value={formData.plc}
                        onChange={(e) => handleInputChange("plc", e.target.value)}
                        placeholder="Enter PLC"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="road">Road *</Label>
                      <Input
                        id="road"
                        value={formData.road}
                        onChange={(e) => handleInputChange("road", e.target.value)}
                        placeholder="Enter road details"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="facing">Facing *</Label>
                    <Select
                      value={formData.facing}
                      onValueChange={(value) => handleInputChange("facing", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select facing direction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="North">North</SelectItem>
                        <SelectItem value="South">South</SelectItem>
                        <SelectItem value="East">East</SelectItem>
                        <SelectItem value="West">West</SelectItem>
                        <SelectItem value="North-East">North-East</SelectItem>
                        <SelectItem value="North-West">North-West</SelectItem>
                        <SelectItem value="South-East">South-East</SelectItem>
                        <SelectItem value="South-West">South-West</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Contact and Business Details */}
              <Card className="bg-card/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Contact & Business Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cpName">CP Name *</Label>
                      <Input
                        id="cpName"
                        value={formData.cpName}
                        onChange={(e) => handleInputChange("cpName", e.target.value)}
                        placeholder="Enter contact person name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactNumber">Contact Number *</Label>
                      <Input
                        id="contactNumber"
                        value={formData.contactNumber}
                        onChange={(e) => handleInputChange("contactNumber", e.target.value)}
                        placeholder="Enter contact number"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cpFirmName">CP Firm Name *</Label>
                    <Input
                      id="cpFirmName"
                      value={formData.cpFirmName}
                      onChange={(e) => handleInputChange("cpFirmName", e.target.value)}
                      placeholder="Enter firm name"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="demand">Demand *</Label>
                      <Input
                        id="demand"
                        value={formData.demand}
                        onChange={(e) => handleInputChange("demand", e.target.value)}
                        placeholder="Enter demand amount"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange("date", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="expectations">Expectations</Label>
                    <Textarea
                      id="expectations"
                      value={formData.expectations}
                      onChange={(e) => handleInputChange("expectations", e.target.value)}
                      placeholder="Enter expectations or additional notes"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Saving..." : isEditing ? "Update Property" : "Add Property"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
