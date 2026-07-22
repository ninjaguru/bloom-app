import { useEffect, useState } from 'react';
import { subscribeToServices, getBundles } from '../lib/services';
import { Service } from '../types';

export function useServices(gender: 'women' | 'men', category: string): Service[] {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    let isCancelled = false;
    let unsub: (() => void) | null = null;

    const loadData = async () => {
      let bundles: Service[] = [];
      if (category === 'All') {
        try {
          bundles = await getBundles(gender);
        } catch (err) {
          console.warn('Error fetching bundles:', err);
        }
      }

      unsub = subscribeToServices(gender, category, (fetchedServices) => {
        if (!isCancelled) {
          setServices([...bundles, ...fetchedServices]);
        }
      });
    };

    loadData();

    return () => {
      isCancelled = true;
      if (unsub) unsub();
    };
  }, [gender, category]);

  return services;
}
