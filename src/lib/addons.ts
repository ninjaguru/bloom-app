import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ServiceAddon } from '../types';

export async function getServiceAddons(serviceId: string): Promise<ServiceAddon[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'serviceAddons'), where('serviceId', '==', serviceId), where('active', '==', true))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceAddon));
  } catch {
    return [];
  }
}

export async function getAllAddons(): Promise<ServiceAddon[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'serviceAddons'), where('active', '==', true))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceAddon));
  } catch {
    return [];
  }
}
