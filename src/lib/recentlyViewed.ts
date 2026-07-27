import { Service } from '../types';

const KEY = 'bloom_recently_viewed';
const MAX = 5;

interface RecentItem {
  id: string;
  serviceId?: string;
  title: string;
  category: string;
  price: number;
  imageUrl?: string;
  durationMinutes: number;
  rating: number;
  reviewCount: number;
  gender: 'women' | 'men' | 'both';
}

function toRecentItem(service: Service): RecentItem {
  return {
    id: service.id,
    serviceId: service.serviceId,
    title: service.title,
    category: service.category,
    price: service.price,
    imageUrl: service.imageUrl,
    durationMinutes: service.durationMinutes,
    rating: service.rating,
    reviewCount: service.reviewCount,
    gender: service.gender,
  };
}

export function getRecentlyViewed(): RecentItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function addRecentlyViewed(service: Service): void {
  try {
    const key = service.serviceId || service.id;
    const current = getRecentlyViewed().filter(
      (s) => (s.serviceId || s.id) !== key
    );
    const updated = [toRecentItem(service), ...current].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable
  }
}

export function clearRecentlyViewed(): void {
  localStorage.removeItem(KEY);
}
