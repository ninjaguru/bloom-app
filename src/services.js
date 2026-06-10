import { db } from './firebase.js';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs
} from 'firebase/firestore';

const servicesRef = collection(db, 'services');

let currentUnsubscribe = null;

/**
 * Subscribe to services filtered by gender and optionally category.
 * Returns an unsubscribe function.
 */
export function subscribeToServices(gender, category, callback) {
  // Unsubscribe from previous listener
  if (currentUnsubscribe) {
    currentUnsubscribe();
    currentUnsubscribe = null;
  }

  let constraints = [where('gender', '==', gender)];

  if (category && category !== 'All') {
    constraints.push(where('category', '==', category));
  }

  const q = query(servicesRef, ...constraints);

  currentUnsubscribe = onSnapshot(q, (snapshot) => {
    const services = [];
    snapshot.forEach((doc) => {
      services.push({ id: doc.id, ...doc.data() });
    });
    callback(services);
  }, (error) => {
    console.error('Error fetching services:', error);
    callback([]);
  });

  return currentUnsubscribe;
}

/**
 * Get unique categories for a gender (one-time fetch).
 */
export async function getCategories(gender) {
  const q = query(servicesRef, where('gender', '==', gender));
  const snapshot = await getDocs(q);
  const categories = new Set();
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.category) {
      categories.add(data.category);
    }
  });
  return ['All', ...Array.from(categories).sort()];
}
