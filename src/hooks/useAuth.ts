import { useEffect } from 'react';
import { onAuthChange, loadProfile } from '../lib/auth';
import { ensureReferralCode, attributeReferral } from '../lib/referral';
import { getLoyaltyBalance } from '../lib/loyalty';
import { useAuthStore } from '../stores/authStore';
import { useNotificationsStore } from '../stores/notificationsStore';
import { useLoyaltyStore } from '../stores/loyaltyStore';
import { useCartStore } from '../stores/cartStore';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { AppNotification } from '../types';

export function useAuth() {
  const setUser = useAuthStore((s) => s.setUser);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setNotifications = useNotificationsStore((s) => s.setNotifications);
  const setLoyaltyBalance = useLoyaltyStore((s) => s.setBalance);
  const setLoyaltyLoading = useLoyaltyStore((s) => s.setLoading);
  const clearLoyaltyPoints = useCartStore((s) => s.clearLoyaltyPoints);

  useEffect(() => {
    let notifUnsubscribe: (() => void) | null = null;

    const unsubscribeAuth = onAuthChange(async (user) => {
      if (notifUnsubscribe) {
        notifUnsubscribe();
        notifUnsubscribe = null;
      }

      if (user) {
        setUser(user);
        try {
          const profile = await loadProfile(user.uid);
          setProfile(profile);
          await ensureReferralCode(user.uid);
          await attributeReferral(user.uid);

          // Subscribe notifications
          const notifQuery = query(
            collection(db, 'customers', user.uid, 'notifications'),
            orderBy('createdAt', 'desc'),
            limit(20)
          );
          notifUnsubscribe = onSnapshot(notifQuery, (snap) => {
            const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
            setNotifications(items);
          });

          // Fetch loyalty balance
          setLoyaltyLoading(true);
          const loyalty = await getLoyaltyBalance(user.uid);
          setLoyaltyBalance(loyalty.available, loyalty.nextExpiry);
          setLoyaltyLoading(false);
        } catch (err) {
          console.warn('Error loading user data:', err);
          setLoyaltyLoading(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        setNotifications([]);
        setLoyaltyBalance(0, null);
        clearLoyaltyPoints();
      }
    });

    return () => {
      unsubscribeAuth();
      if (notifUnsubscribe) notifUnsubscribe();
    };
  }, [setUser, setProfile, setNotifications, setLoyaltyBalance, setLoyaltyLoading, clearLoyaltyPoints]);
}
