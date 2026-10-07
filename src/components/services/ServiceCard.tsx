import React from 'react';
import { Star, Clock, Plus, Check } from 'lucide-react';
import { Service } from '../../types';
import { SpotlightCard } from '../ui/SpotlightCards';
import { GradientButton } from '../ui/GradientButton';
import { useCartStore } from '../../stores/cartStore';

interface ServiceCardProps {
  service: Service;
  onSelect: (service: Service) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onSelect }) => {
  const addToCart = useCartStore((s) => s.addToCart);
  const cartItems = useCartStore((s) => s.items);

  const serviceIdKey = service.serviceId || service.id;
  const isInCart = Boolean(cartItems[serviceIdKey]);
  const cartQuantity = cartItems[serviceIdKey]?.quantity || 0;

  return (
    <SpotlightCard className="group flex h-full flex-col justify-between">
      <div>
        {/* Top Badges */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <span
            className="rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-semibold"
            style={{ backgroundColor: 'var(--color-paper-3)', color: 'var(--color-muted)', border: '1px solid var(--color-rule)' }}
          >
            {service.category}
          </span>
          {service.isBundle && (
            <span
              className="rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-bold"
              style={{ backgroundColor: 'var(--color-gold)', color: 'var(--color-accent-ink)' }}
            >
              Bundle deal
            </span>
          )}
        </div>

        {/* Image / Banner if present */}
        {service.imageUrl && (
          <div
            className="relative mb-4 h-36 w-full overflow-hidden rounded-[var(--radius-card)]"
            style={{ backgroundColor: 'var(--color-paper-3)' }}
          >
            <img
              src={service.imageUrl}
              alt={service.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Title */}
        <h3
          onClick={() => onSelect(service)}
          className="mb-2 line-clamp-2 cursor-pointer text-lg font-medium font-outfit hover:text-[var(--color-accent)]"
          style={{ color: 'var(--color-ink)', transition: 'color var(--dur-short) var(--ease-out)' }}
        >
          {service.title}
        </h3>

        {/* Details: Duration & Rating */}
        <div className="mb-4 flex items-center gap-4 text-xs" style={{ color: 'var(--color-muted)' }}>
          {service.durationMinutes > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" style={{ color: 'var(--color-neutral)' }} />
              <span>{service.durationMinutes} mins</span>
            </div>
          )}
          {service.rating > 0 && (
            <div className="flex items-center gap-1 font-semibold" style={{ color: 'var(--color-gold)' }}>
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>{service.rating.toFixed(1)}</span>
              {service.reviewCount > 0 && (
                <span className="font-normal" style={{ color: 'var(--color-neutral)' }}>
                  ({service.reviewCount})
                </span>
              )}
            </div>
          )}
        </div>

        {service.description && (
          <p className="mb-4 line-clamp-2 text-xs" style={{ color: 'var(--color-muted)' }}>
            {service.description}
          </p>
        )}
      </div>

      {/* Footer: Pricing & Add button */}
      <div className="mt-2 flex items-center justify-between border-t pt-4" style={{ borderColor: 'var(--color-rule)' }}>
        <div className="flex items-baseline gap-2 font-mono-tabular">
          <span className="text-xl font-semibold" style={{ color: 'var(--color-ink)' }}>
            ₹{service.price.toLocaleString('en-IN')}
          </span>
          {service.originalPrice && service.originalPrice > service.price && (
            <span className="text-xs line-through" style={{ color: 'var(--color-neutral)' }}>
              ₹{service.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <GradientButton
          size="sm"
          variant={isInCart ? 'secondary' : 'primary'}
          onClick={(e) => {
            e.stopPropagation();
            addToCart(service);
          }}
          className="flex items-center space-x-1"
        >
          {isInCart ? (
            <>
              <Check className="w-4 h-4" />
              <span>Added ({cartQuantity})</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </>
          )}
        </GradientButton>
      </div>
    </SpotlightCard>
  );
};
