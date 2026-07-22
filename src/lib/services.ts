import { db } from './firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';
import { Service } from '../types';

const servicesRef = collection(db, 'services');

/**
 * Subscribe to services filtered by gender and optionally category.
 * Returns an unsubscribe function.
 */
export function subscribeToServices(
  gender: string,
  category: string,
  callback: (services: Service[]) => void
): Unsubscribe {
  const constraints = [where('gender', '==', gender)];

  if (category && category !== 'All') {
    constraints.push(where('category', '==', category));
  }

  const q = query(servicesRef, ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const services: Service[] = [];
      snapshot.forEach((doc) => {
        services.push({ id: doc.id, ...doc.data() } as Service);
      });
      callback(services);
    },
    (error) => {
      console.error('Error fetching services:', error);
      callback([]);
    }
  );
}

/**
 * Fetch active bundles for a gender.
 */
export async function getBundles(gender: string): Promise<Service[]> {
  const bundlesRef = collection(db, 'bundles');
  const snap = await getDocs(
    query(bundlesRef, where('active', '==', true))
  );
  return snap.docs
    .map((d) => ({
      id: d.id,
      serviceId: d.id,
      category: 'Bundle',
      isBundle: true,
      ...d.data(),
    } as Service))
    .filter((b) => b.gender === gender || b.gender === 'both');
}

/**
 * Get unique categories for a gender (one-time fetch).
 */
export async function getCategories(gender: string): Promise<string[]> {
  const q = query(servicesRef, where('gender', '==', gender));
  const snapshot = await getDocs(q);
  const categories = new Set<string>();
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.category) {
      categories.add(data.category);
    }
  });
  return ['All', ...Array.from(categories).sort()];
}
