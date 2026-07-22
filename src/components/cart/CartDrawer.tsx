import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { SmoothDrawer } from '../ui/SmoothDrawer';
import { CartItem } from './CartItem';
import { CouponRow } from './CouponRow';
import { LoyaltyToggleRow } from './LoyaltyToggleRow';
import { GradientButton } from '../ui/GradientButton';
import { useCartStore, selectCartTotals } from '../../stores/cartStore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBooking: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onOpenBooking,
}) => {
  const totals = useCartStore(selectCartTotals);

  return (
    <SmoothDrawer
      isOpen={isOpen}
      onClose={onClose}
      position="right"
      title={
        <div className="flex items-center space-x-2">
          <ShoppingBag className="w-5 h-5 text-pink-400" />
          <span>Your Service Cart ({totals.totalItems})</span>
        </div>
      }
    >
      {totals.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-200 mb-1">Your cart is empty</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            Explore our luxury salon services and add items to your cart to book an appointment.
          </p>
        </div>
      ) : (
        <div className="flex flex-col h-full justify-between space-y-6">
          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto pr-1">
            {totals.items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>

          {/* Footer & Totals */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <CouponRow />
            <LoyaltyToggleRow />

            <div className="space-y-2 text-xs text-slate-400 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-200">
                  ₹{totals.subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-pink-400 font-medium">
                  <span>Coupon Discount ({totals.couponCode})</span>
                  <span>-₹{totals.discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {totals.loyaltyDiscount > 0 && (
                <div className="flex justify-between text-amber-400 font-medium">
                  <span>Loyalty Discount</span>
                  <span>-₹{totals.loyaltyDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
                <span>Total</span>
                <span className="text-pink-400">
                  ₹{totals.total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <GradientButton
              fullWidth
              size="lg"
              onClick={() => {
                onClose();
                onOpenBooking();
              }}
              className="flex items-center justify-center space-x-2"
            >
              <span>Proceed to Booking</span>
              <ArrowRight className="w-5 h-5" />
            </GradientButton>
          </div>
        </div>
      )}
    </SmoothDrawer>
  );
};
