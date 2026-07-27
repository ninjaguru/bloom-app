import React, { useEffect, useState } from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { getRecentlyViewed } from '../../lib/recentlyViewed';
import { Service } from '../../types';

interface RecentlyViewedProps {
  onSelect: (service: Service) => void;
}

export const RecentlyViewed: React.FC<RecentlyViewedProps> = ({ onSelect }) => {
  const [items, setItems] = useState(getRecentlyViewed());

  // Re-read on mount so modal-close triggers a refresh
  useEffect(() => {
    setItems(getRecentlyViewed());
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-2">
      <div className="flex items-center space-x-2 mb-3">
        <Clock className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Recently Viewed
        </span>
      </div>
      <div className="flex space-x-3 overflow-x-auto pb-1 scrollbar-none">
        {items.map((item) => (
          <button
            key={item.serviceId || item.id}
            onClick={() => onSelect(item as Service)}
            className="flex-shrink-0 flex items-center space-x-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-pink-500/40 hover:bg-slate-800/80 transition-all duration-200 group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <span className="text-pink-400 text-xs font-bold">
                  {item.category.charAt(0)}
                </span>
              )}
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate max-w-[120px] group-hover:text-white">
                {item.title}
              </p>
              <p className="text-xs text-slate-500">
                ₹{item.price.toLocaleString('en-IN')}
              </p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-pink-400 flex-shrink-0 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};
