// TypeScript interfaces for property data
export interface BaseProperty {
  id?: string
  propertyType: "Kothi" | "Flat" | "Commercial" | "Plot"
  sectorPhase: string
  plotSize: string
  marla: string
  plc: string
  road: string
  cpName: string
  contactNumber: string
  cpFirmName: string
  demand: string
  expectations: string
  date: string
  facing: string
  createdAt?: Date
  updatedAt?: Date
  project: string
}

export interface KothiProperty extends BaseProperty {
  propertyType: "Kothi"
  kothiNumber: string
}

export interface PlotProperty extends BaseProperty {
  propertyType: "Plot"
  plotNumber: string
}

export interface FlatProperty extends BaseProperty {
  propertyType: "Flat"
  project: string
  floor: string
  bhk: string
}

export interface CommercialProperty extends BaseProperty {
  propertyType: "Commercial"
  commercialType?: string
  area?: string
  floor?: string
}

export type Property = KothiProperty | PlotProperty | FlatProperty | CommercialProperty

export interface SearchFilters {
  propertyType?: string
  project?: string
  sectorPhase?: string
  contactNumber?: string
  cpName?: string
}
