import React from 'react';
import { Award, Check } from 'lucide-react';
import { useLoyaltyStore } from '../../stores/loyaltyStore';
import { useCartStore } from '../../stores/cartStore';
import { canRedeem, clampRedeemPoints, pointsToRupees } from '../../lib/loyalty';
import { useAuthStore } from '../../stores/authStore';

export const LoyaltyToggleRow: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const available = useLoyaltyStore((s) => s.available);
  const loyaltyPointsToRedeem = useCartStore((s) => s.loyaltyPointsToRedeem);
  const applyLoyaltyPoints = useCartStore((s) => s.applyLoyaltyPoints);
  const clearLoyaltyPoints = useCartStore((s) => s.clearLoyaltyPoints);

  if (!user || !canRedeem(available)) return null;

  const maxRedeem = clampRedeemPoints(available);
  const isRedeeming = loyaltyPointsToRedeem > 0;
  const rupeeValue = pointsToRupees(maxRedeem);

  const toggleRedeem = () => {
    if (isRedeeming) {
      clearLoyaltyPoints();
    } else {
      applyLoyaltyPoints(maxRedeem);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
      <div className="flex items-center space-x-2">
        <Award className="w-4 h-4 text-amber-400" />
        <div>
          <span className="font-semibold">{available} Points Available</span>
          <span className="block text-[11px] text-amber-400/80">
            Redeem {maxRedeem} pts for ₹{rupeeValue} discount
          </span>
        </div>
      </div>

      <button
        onClick={toggleRedeem}
        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1 ${
          isRedeeming
            ? 'bg-amber-500 text-slate-950 font-bold'
            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
        }`}
      >
        {isRedeeming && <Check className="w-3.5 h-3.5" />}
        <span>{isRedeeming ? 'Applied' : 'Use Points'}</span>
      </button>
    </div>
  );
};
