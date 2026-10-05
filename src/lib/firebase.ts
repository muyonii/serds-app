import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  User 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  Timestamp
} from "firebase/firestore";

// Web app's Firebase configuration from user's Firebase Console
export const firebaseConfig = {
  apiKey: "AIzaSyDEYbuXx_cfXZwtM-Ui_GioI5rk8PFqiAM",
  authDomain: "serds-app.firebaseapp.com",
  projectId: "serds-app",
  storageBucket: "serds-app.firebasestorage.app",
  messagingSenderId: "952568116597",
  appId: "1:952568116597:web:24c69ef4ae7c74a1e18f3c",
  measurementId: "G-79E28GBBZE"
};

// Singleton initialization
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

export interface FirestoreIncident {
  id?: string;
  code: string;
  type: string;
  priority: 'critical' | 'urgent' | 'standard';
  location: string;
  reportedTime: string;
  patientName: string;
  recommendedUnit?: string;
  distanceKm?: number;
  etaMins?: number;
  routeAlgorithm?: string;
  status: 'pending' | 'dispatched' | 'en_route' | 'on_scene' | 'cancelled';
  coords: [number, number];
  details?: string;
  createdAt?: any;
}

export interface FirestoreUserProfile {
  uid: string;
  fullName: string;
  displayName: string;
  email: string;
  phone?: string;
  bloodType?: string;
  birthdate?: string;
  heightCm?: number;
  weightKg?: number;
  allergies?: Array<{ id: string; allergen: string; reaction: string; severity: string }>;
  emergencyContact?: {
    name: string;
    relation: string;
    phone: string;
  };
  role?: 'citizen' | 'dispatcher' | 'responder' | 'admin';
  agency?: string;
  badgeNumber?: string;
  responderRole?: string;
  station?: string;
  vehicleUnit?: string;
  callSign?: string;
  avatarUrl?: string;
  updatedAt?: any;
}

/**
 * Real-time listener for CAD Emergency Incidents
 */
export function subscribeToIncidents(callback: (incidents: FirestoreIncident[]) => void) {
  try {
    const q = query(
      collection(db, "incidents"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const list: FirestoreIncident[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          code: data.code || '10-79',
          type: data.type || 'General Emergency SOS',
          priority: data.priority || 'critical',
          location: data.location || 'Unknown Location',
          reportedTime: data.reportedTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          patientName: data.patientName || 'Citizen Caller',
          recommendedUnit: data.recommendedUnit || 'Ambulance Unit 04',
          distanceKm: data.distanceKm || 0.48,
          etaMins: data.etaMins || 2.0,
          routeAlgorithm: data.routeAlgorithm || 'Dijkstra',
          status: data.status || 'dispatched',
          coords: data.coords || [14.6780, 120.5390],
          details: data.details || '',
          createdAt: data.createdAt
        };
      });
      callback(list);
    }, (error) => {
      console.warn("[Firestore] Incidents listener error:", error.message);
    });
  } catch (err) {
    console.warn("[Firestore] Error initiating incidents listener:", err);
    return () => {};
  }
}

/**
 * Save new emergency dispatch to Firestore
 */
export async function saveIncidentToFirestore(incident: Omit<FirestoreIncident, 'id' | 'createdAt'>): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, "incidents"), {
      ...incident,
      createdAt: serverTimestamp(),
      reportedTime: incident.reportedTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    return docRef.id;
  } catch (err: any) {
    console.warn("[Firestore] Failed to save incident to Firestore:", err.message);
    return null;
  }
}

/**
 * Update incident status in Firestore (e.g. cancelled, on_scene, en_route)
 */
export async function updateFirestoreIncidentStatus(incidentId: string, status: FirestoreIncident['status']): Promise<boolean> {
  try {
    const ref = doc(db, "incidents", incidentId);
    await updateDoc(ref, { status, updatedAt: serverTimestamp() });
    return true;
  } catch (err) {
    console.warn("[Firestore] Failed to update incident status:", err);
    return false;
  }
}

/**
 * Sync user profile to Firestore
 */
export async function syncUserProfileToFirestore(profile: FirestoreUserProfile): Promise<boolean> {
  try {
    const ref = doc(db, "users", profile.uid);
    await setDoc(ref, {
      ...profile,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn("[Firestore] Failed to sync user profile:", err);
    return false;
  }
}

/**
 * Fetch user profile from Firestore
 */
export async function fetchUserProfileFromFirestore(uid: string): Promise<FirestoreUserProfile | null> {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as FirestoreUserProfile;
    }
  } catch (err) {
    console.warn("[Firestore] Failed to fetch user profile:", err);
  }
  return null;
}

/**
 * Save safety broadcast check-in
 */
export async function saveSafetyBroadcastToFirestore(data: {
  userId?: string;
  callerName: string;
  recipientsNotified: number;
  status: string;
}): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, "safetyBroadcasts"), {
      ...data,
      timestamp: serverTimestamp(),
      createdAtIso: new Date().toISOString()
    });
    return docRef.id;
  } catch (err) {
    console.warn("[Firestore] Failed to log safety broadcast:", err);
    return null;
  }
}

export const DEFAULT_SYSTEM_ALLERGENS: string[] = [
  // Medications & Drugs
  'Penicillin / Amoxicillin',
  'Cephalosporins (Keflex, Rocephin)',
  'Sulfa Drugs (Bactrim, Septra)',
  'Aspirin / NSAIDs (Ibuprofen, Naproxen)',
  'Opioids (Morphine, Codeine, Tramadol)',
  'Iodine / Radiocontrast Dye',
  'Local Anesthetics (Lidocaine, Novocaine)',
  'General Anesthetics (Propofol, Ketamine)',
  'Fluoroquinolones (Ciprofloxacin, Levofloxacin)',
  'Macrolides (Azithromycin, Erythromycin)',
  'Tetracyclines (Doxycycline, Minocycline)',
  'Vancomycin',
  'ACE Inhibitors (Lisinopril, Enalapril)',
  'Anticonvulsants (Carbamazepine, Phenytoin)',
  'Insulin',
  'Tetanus Toxoid Vaccine',
  'Muscle Relaxants (Succinylcholine)',
  'Chemotherapy Agents',
  'Statins (Atorvastatin)',

  // Foods & Ingredients
  'Peanuts',
  'Tree Nuts (Walnuts, Almonds, Cashews, Pistachios)',
  'Shellfish (Shrimp, Crab, Lobster, Prawns)',
  'Finfish (Salmon, Tuna, Cod, Tilapia)',
  'Cow\'s Milk / Dairy / Lactose',
  'Eggs (Egg Whites & Yolks)',
  'Wheat / Gluten (Celiac / Wheat Allergy)',
  'Soy & Soybeans',
  'Sesame & Sesame Oil',
  'Mustard & Mustard Seed',
  'Celery & Celeriac',
  'Sulfites (Wine / Food Preservatives)',
  'Corn & Corn Byproducts',
  'Strawberries & Berries',
  'Citrus Fruits (Oranges, Lemons, Grapefruits)',
  'Kiwifruit',
  'Bananas',
  'Avocados',
  'Tomatoes & Nightshades',
  'Garlic & Onions',
  'Monosodium Glutamate (MSG)',
  'Tartrazine (Yellow Dye #5)',
  'Red Meat / Alpha-Gal (Mammalian Meat)',

  // Environmental, Inhalation & Biological
  'Latex & Natural Rubber',
  'Honey Bee Stings',
  'Wasp & Yellow Jacket Stings',
  'Fire Ant Bites / Stings',
  'Hornet Stings',
  'Cat Dander & Saliva',
  'Dog Dander & Saliva',
  'Horse Dander',
  'Dust Mites & Household Dust',
  'Mold Spores (Aspergillus, Cladosporium)',
  'Grass Pollen (Bermuda, Rye, Timothy)',
  'Tree Pollen (Birch, Oak, Cedar, Pine)',
  'Weed Pollen (Ragweed, Mugwort)',
  'Cockroach Allergens',
  'Nickel & Metal Alloys',
  'Poison Ivy / Poison Oak (Urushiol)',
  'Synthetic Fragrances & Perfumes',
  'Sunlight / Solar Urticaria',
  'Cold Temperature / Cold Urticaria'
];

/**
 * Fetch the master allergy list from the Firebase Firestore 'allergies_catalog' collection.
 * Merges with extensive defaults so all common allergens are present.
 */
export async function fetchAllergiesCatalogFromFirestore(): Promise<string[]> {
  try {
    const colRef = collection(db, "allergies_catalog");
    const q = query(colRef, orderBy("name", "asc"));
    const snap = await getDocs(q);
    
    const items: string[] = [];
    if (!snap.empty) {
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.name && !items.includes(data.name)) items.push(data.name);
      });
    }

    // Merge system defaults
    for (const name of DEFAULT_SYSTEM_ALLERGENS) {
      if (!items.includes(name)) {
        items.push(name);
      }
    }

    return items.sort((a, b) => a.localeCompare(b));
  } catch (err) {
    console.warn("[Firestore] Failed to fetch allergies catalog, using defaults:", err);
    return DEFAULT_SYSTEM_ALLERGENS.slice().sort((a, b) => a.localeCompare(b));
  }
}

/**
 * Add a new allergy to the Firebase 'allergies_catalog' collection
 */
export async function addAllergyToCatalogInFirestore(name: string, category: string = 'general'): Promise<boolean> {
  try {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const colRef = collection(db, "allergies_catalog");
    await addDoc(colRef, {
      name: trimmed,
      category,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.warn("[Firestore] Failed to add allergy to catalog:", err);
    return false;
  }
}

/**
 * Listen in real time to the Firebase allergies collection
 */
export function subscribeToAllergiesCatalog(callback: (allergies: string[]) => void): () => void {
  try {
    const colRef = collection(db, "allergies_catalog");
    const q = query(colRef, orderBy("name", "asc"));
    return onSnapshot(q, (snap) => {
      const items: string[] = [];
      if (!snap.empty) {
        snap.forEach(docSnap => {
          const data = docSnap.data();
          if (data.name && !items.includes(data.name)) items.push(data.name);
        });
      }
      for (const def of DEFAULT_SYSTEM_ALLERGENS) {
        if (!items.includes(def)) {
          items.push(def);
        }
      }
      callback(items.sort((a, b) => a.localeCompare(b)));
    }, (err) => {
      console.warn("[Firestore] Allergies subscription notice:", err);
      callback(DEFAULT_SYSTEM_ALLERGENS.slice().sort((a, b) => a.localeCompare(b)));
    });
  } catch {
    callback(DEFAULT_SYSTEM_ALLERGENS.slice().sort((a, b) => a.localeCompare(b)));
    return () => {};
  }
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInAnonymously
};
export type { User };
