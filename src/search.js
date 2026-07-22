export function filterServices(services, query) {
  if (!query || !query.trim()) return services;
  const q = query.trim().toLowerCase();
  return services.filter(
    (s) =>
      (s.title || '').toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q)
  );
}

export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
