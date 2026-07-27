import React from 'react';
import { Service } from '../../types';
import { ServiceCard } from './ServiceCard';
import { SearchX } from 'lucide-react';

interface ServiceGridProps {
  services: Service[];
  onSelectService: (service: Service) => void;
  loading?: boolean;
}

export const ServiceGrid: React.FC<ServiceGridProps> = ({
  services,
  onSelectService,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="grid max-w-7xl grid-cols-1 gap-6 mx-auto px-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div
            key={n}
            className="h-64 animate-pulse rounded-[var(--radius-card)] p-6"
            style={{ backgroundColor: 'var(--color-paper-2)', border: '1px solid var(--color-rule)' }}
          />
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <div
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--color-paper-2)', border: '1px solid var(--color-rule)', color: 'var(--color-neutral)' }}
        >
          <SearchX className="h-8 w-8" />
        </div>
        <h3 className="mb-1 text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
          No services found
        </h3>
        <p className="max-w-sm text-sm" style={{ color: 'var(--color-muted)' }}>
          Try searching for something else or browse another category.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto my-8 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceCard
            key={service.id || service.serviceId}
            service={service}
            onSelect={onSelectService}
          />
        ))}
      </div>
    </div>
  );
};
