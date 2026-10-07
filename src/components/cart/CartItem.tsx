import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { CartTotalsItem } from '../../types';
import { useCartStore } from '../../stores/cartStore';

interface CartItemProps {
  item: CartTotalsItem;
}

export const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeFromCart = useCartStore((s) => s.removeFromCart);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 mb-3 shadow-md sm:flex-row sm:items-center sm:justify-between">
      <div className="sm:flex-1 sm:pr-4">
        <h4 className="text-sm font-semibold text-white font-outfit line-clamp-2 sm:line-clamp-1">
          {item.service.title}
        </h4>
        <p className="text-xs text-slate-400 mt-0.5">
          ₹{item.service.price.toLocaleString('en-IN')} each
        </p>
      </div>

      <div className="flex items-center justify-between sm:justify-end sm:space-x-3">
        {/* Quantity control */}
        <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700/80 rounded-xl px-2 py-1">
          <button
            onClick={() => updateQuantity(item.id, -1)}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-bold text-white min-w-[16px] text-center">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.id, 1)}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Line Total */}
        <div className="text-right min-w-[60px]">
          <span className="text-sm font-bold text-white">
            ₹{item.lineTotal.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Delete */}
        <button
          onClick={() => removeFromCart(item.id)}
          className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
          aria-label="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
