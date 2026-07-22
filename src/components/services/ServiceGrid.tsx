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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div
            key={n}
            className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse p-6"
          />
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
          <SearchX className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-slate-200 mb-1">No services found</h3>
        <p className="text-sm text-slate-400 max-w-sm">
          Try searching for something else or browse another category.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
