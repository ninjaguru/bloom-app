import { db } from './firebase';
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  getDocs, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { SavedAddress } from '../types';

export async function listAddresses(uid: string): Promise<SavedAddress[]> {
  if (!uid) return [];
  try {
    const snap = await getDocs(
      query(collection(db, 'customers', uid, 'addresses'), orderBy('createdAt', 'asc'))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavedAddress));
  } catch (err) {
    console.warn('listAddresses failed:', err);
    return [];
  }
}

export async function addAddress(
  uid: string,
  data: { label: string; apartment: string; flat: string }
): Promise<string | null> {
  if (!uid) return null;
  try {
    const docRef = await addDoc(collection(db, 'customers', uid, 'addresses'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.warn('addAddress failed:', err);
    return null;
  }
}

export async function updateAddress(
  uid: string,
  addressId: string,
  data: { label: string; apartment: string; flat: string }
): Promise<boolean> {
  if (!uid || !addressId) return false;
  try {
    await updateDoc(doc(db, 'customers', uid, 'addresses', addressId), data);
    return true;
  } catch (err) {
    console.warn('updateAddress failed:', err);
    return false;
  }
}

export async function deleteAddress(uid: string, addressId: string): Promise<boolean> {
  if (!uid || !addressId) return false;
  try {
    await deleteDoc(doc(db, 'customers', uid, 'addresses', addressId));
    return true;
  } catch (err) {
    console.warn('deleteAddress failed:', err);
    return false;
  }
}
