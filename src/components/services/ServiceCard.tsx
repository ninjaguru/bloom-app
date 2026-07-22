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
    <SpotlightCard className="flex flex-col justify-between h-full group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-pink-300 border border-slate-700/80">
            {service.category}
          </span>
          {service.isBundle && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm">
              Bundle Deal
            </span>
          )}
        </div>

        {/* Image / Banner if present */}
        {service.imageUrl && (
          <div className="relative w-full h-36 rounded-xl overflow-hidden mb-4 bg-slate-800">
            <img
              src={service.imageUrl}
              alt={service.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Title */}
        <h3
          onClick={() => onSelect(service)}
          className="text-lg font-bold text-white hover:text-pink-400 transition-colors cursor-pointer line-clamp-2 mb-2 font-outfit"
        >
          {service.title}
        </h3>

        {/* Details: Duration & Rating */}
        <div className="flex items-center space-x-4 text-xs text-slate-400 mb-4">
          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{service.durationMinutes} mins</span>
          </div>
          {service.rating > 0 && (
            <div className="flex items-center space-x-1 text-amber-400 font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{service.rating.toFixed(1)}</span>
              {service.reviewCount > 0 && (
                <span className="text-slate-500 font-normal">({service.reviewCount})</span>
              )}
            </div>
          )}
        </div>

        {service.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-4 font-light">
            {service.description}
          </p>
        )}
      </div>

      {/* Footer: Pricing & Add button */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 mt-2">
        <div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-extrabold text-white">
              ₹{service.price.toLocaleString('en-IN')}
            </span>
            {service.originalPrice && service.originalPrice > service.price && (
              <span className="text-xs text-slate-500 line-through">
                ₹{service.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
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
              <Check className="w-4 h-4 text-pink-400" />
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
