// Firebase CRUD operations for properties
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"
import type { Property, SearchFilters } from "./types"

const COLLECTION_NAME = "properties"

// Add a new property
export async function addProperty(property: Omit<Property, "id">): Promise<string> {
  try {
    console.log("[v0] Adding property:", property)
    const propertyWithTimestamp = {
      ...property,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
    const docRef = await addDoc(collection(db, COLLECTION_NAME), propertyWithTimestamp)
    console.log("[v0] Property added with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Error adding property:", error)
    throw error
  }
}

// Get all properties
export async function getAllProperties(): Promise<Property[]> {
  try {
    const querySnapshot = await getDocs(query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc")))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Property[]
  } catch (error) {
    console.error("Error fetching properties:", error)
    throw error
  }
}

// Search properties with filters
export async function searchProperties(filters: SearchFilters): Promise<Property[]> {
  try {
    let q = query(collection(db, COLLECTION_NAME))

    if (filters.propertyType) {
      q = query(q, where("propertyType", "==", filters.propertyType))
    }
    if (filters.project) {
      q = query(q, where("project", "==", filters.project))
    }
    if (filters.sectorPhase) {
      q = query(q, where("sectorPhase", "==", filters.sectorPhase))
    }
    if (filters.contactNumber) {
      q = query(q, where("contactNumber", "==", filters.contactNumber))
    }
    if (filters.cpName) {
      q = query(q, where("cpName", "==", filters.cpName))
    }

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Property[]
  } catch (error) {
    console.error("Error searching properties:", error)
    throw error
  }
}

// Get a single property by ID
export async function getPropertyById(id: string): Promise<Property | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Property
  } catch (error) {
    console.error("Error fetching property:", error)
    throw error
  }
}

// Update a property
export async function updateProperty(id: string, updates: Partial<Property>): Promise<void> {
  try {
    const propertyRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(propertyRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error("Error updating property:", error)
    throw error
  }
}

// Delete a property
export async function deleteProperty(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id))
  } catch (error) {
    console.error("Error deleting property:", error)
    throw error
  }
}

// Bulk add properties (for Excel import)
export async function bulkAddProperties(properties: Omit<Property, "id">[]): Promise<void> {
  try {
    console.log("[v0] Starting bulk add of", properties.length, "properties")

    // Process properties sequentially to avoid overwhelming Firebase
    for (let i = 0; i < properties.length; i++) {
      const property = properties[i]
      console.log("[v0] Processing property", i + 1, "of", properties.length)

      try {
        await addProperty(property)
      } catch (error) {
        console.error(`[v0] Failed to add property ${i + 1}:`, error)
        throw new Error(`Failed to add property ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    console.log("[v0] Bulk add completed successfully")
  } catch (error) {
    console.error("Error bulk adding properties:", error)
    throw error
  }
}
