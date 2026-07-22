import { useEffect, useState } from 'react';
import { getCategories } from '../lib/services';

export function useCategories(gender: 'women' | 'men'): string[] {
  const [categories, setCategories] = useState<string[]>(['All']);

  useEffect(() => {
    let isCancelled = false;

    getCategories(gender)
      .then((cats) => {
        if (!isCancelled) {
          setCategories(cats);
        }
      })
      .catch((err) => {
        console.warn('Error fetching categories:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [gender]);

  return categories;
}
