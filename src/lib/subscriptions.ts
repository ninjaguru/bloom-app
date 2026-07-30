import { db } from './firebase';
import {
  collection, getDocs, addDoc, doc, updateDoc, getDoc,
  query, where, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { SubscriptionPlan, CustomerSubscription } from '../types';

export async function getSubscriptionPlans(gender: string): Promise<SubscriptionPlan[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'subscriptionPlans'), where('active', '==', true))
    );
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as SubscriptionPlan))
      .filter((p) => p.gender === gender || p.gender === 'both');
  } catch {
    return [];
  }
}

export async function getActiveSubscription(customerUid: string): Promise<CustomerSubscription | null> {
  if (!customerUid) return null;
  try {
    const snap = await getDocs(
      query(
        collection(db, 'customerSubscriptions'),
        where('customerUid', '==', customerUid),
        where('active', '==', true),
        orderBy('createdAt', 'desc')
      )
    );
    if (snap.empty) return null;
    const sub = { id: snap.docs[0].id, ...snap.docs[0].data() } as CustomerSubscription;
    const endDate = sub.endDate && 'toDate' in sub.endDate ? sub.endDate.toDate() : null;
    if (endDate && endDate < new Date()) {
      await deactivateSubscription(sub.id);
      return null;
    }
    return sub;
  } catch {
    return null;
  }
}

export async function purchaseSubscription(customerUid: string, plan: SubscriptionPlan): Promise<string | null> {
  if (!customerUid) return null;
  try {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + plan.durationDays);

    const docRef = await addDoc(collection(db, 'customerSubscriptions'), {
      customerUid,
      planId: plan.id,
      planName: plan.name,
      creditsTotal: plan.credits,
      creditsUsed: 0,
      startDate: Timestamp.fromDate(start),
      endDate: Timestamp.fromDate(end),
      active: true,
      autoRenew: false,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.warn('purchaseSubscription failed:', err);
    return null;
  }
}

export async function useSubscriptionCredit(subscriptionId: string): Promise<boolean> {
  try {
    const ref = doc(db, 'customerSubscriptions', subscriptionId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    const sub = snap.data() as CustomerSubscription;
    if (sub.creditsUsed >= sub.creditsTotal) return false;

    const endDate = sub.endDate && 'toDate' in sub.endDate ? sub.endDate.toDate() : null;
    if (endDate && endDate < new Date()) {
      await updateDoc(ref, { active: false });
      return false;
    }

    await updateDoc(ref, { creditsUsed: sub.creditsUsed + 1 });
    if (sub.creditsUsed + 1 >= sub.creditsTotal) {
      await updateDoc(ref, { active: false });
    }
    return true;
  } catch {
    return false;
  }
}

async function deactivateSubscription(subscriptionId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'customerSubscriptions', subscriptionId), { active: false });
  } catch {}
}
