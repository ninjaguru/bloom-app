import { Service } from '../types';

export function filterServices(services: Service[], query: string): Service[] {
  if (!query || !query.trim()) return services;
  const q = query.trim().toLowerCase();
  return services.filter(
    (s) =>
      (s.title || '').toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q)
  );
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
