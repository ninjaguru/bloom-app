import React from 'react';
import { Zap, ChevronRight } from 'lucide-react';
import { CustomerSubscription } from '../../types';
import { useAuthStore } from '../../stores/authStore';

interface ActivePassCardProps {
  subscription: CustomerSubscription;
  onOpenPass: () => void;
}

export const ActivePassCard: React.FC<ActivePassCardProps> = ({ subscription, onOpenPass }) => {
  const endDate = subscription.endDate && 'toDate' in subscription.endDate
    ? subscription.endDate.toDate()
    : null;
  const endStr = endDate
    ? endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '—';
  const remaining = subscription.creditsTotal - subscription.creditsUsed;

  return (
    <button
      onClick={onOpenPass}
      className="w-full rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border border-amber-500/30 p-4 text-left hover:bg-amber-500/20 transition-colors group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <p className="text-sm font-bold text-white font-outfit">
              {subscription.planName}
            </p>
            <p className="text-xs text-amber-300 font-medium">
              {remaining} of {subscription.creditsTotal} credits left · Expires {endStr}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-16 h-2 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
              style={{ width: `${(subscription.creditsUsed / subscription.creditsTotal) * 100}%` }}
            />
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
        </div>
      </div>
    </button>
  );
};
