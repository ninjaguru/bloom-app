import React, { useEffect, useState } from 'react';
import { Check, Sparkles, Award, Zap, AlertTriangle } from 'lucide-react';
import { SmoothDrawer } from '../ui/SmoothDrawer';
import { GradientButton } from '../ui/GradientButton';
import { useAuthStore } from '../../stores/authStore';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import { getSubscriptionPlans, purchaseSubscription, getActiveSubscription } from '../../lib/subscriptions';
import { SubscriptionPlan } from '../../types';

interface PassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
  onOpenLogin?: () => void;
}

export const PassModal: React.FC<PassModalProps> = ({ isOpen, onClose, onSuccessToast, onOpenLogin }) => {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const plans = useSubscriptionStore((s) => s.plans);
  const setPlans = useSubscriptionStore((s) => s.setPlans);
  const setActiveSubscription = useSubscriptionStore((s) => s.setActiveSubscription);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const gender = (profile as any)?.gender || 'women';

  useEffect(() => {
    if (isOpen && plans.length === 0) {
      setLoading(true);
      setErrorMsg(null);
      getSubscriptionPlans(gender)
        .then((data) => {
          setPlans(data);
          if (data.length === 0) {
            setErrorMsg('No Bloom Pass plans available right now. Please try again later.');
          }
        })
        .catch(() => setErrorMsg('Could not load plans. Please try again.'))
        .finally(() => setLoading(false));
    }
  }, [isOpen, gender]);

  const handlePurchase = async (plan: SubscriptionPlan) => {
    if (!user) {
      onClose();
      onOpenLogin?.();
      return;
    }
    setPurchasing(plan.id);
    setErrorMsg(null);
    const subId = await purchaseSubscription(user.uid, plan);
    setPurchasing(null);
    if (subId) {
      const sub = await getActiveSubscription(user.uid);
      setActiveSubscription(sub);
      onClose();
      if (onSuccessToast) onSuccessToast(`Bloom Pass "${plan.name}" activated!`);
    } else {
      setErrorMsg('Purchase failed. Check that your notification permissions are enabled, then try again.');
    }
  };

  return (
    <SmoothDrawer isOpen={isOpen} onClose={onClose} position="bottom" title={
      <div className="flex items-center space-x-2">
        <Award className="w-5 h-5 text-amber-400" />
        <span>Bloom Pass — Save Big</span>
      </div>
    }>
      <div className="space-y-6 py-2">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600 flex items-center justify-center mb-3 shadow-lg shadow-amber-500/20">
            <Zap className="w-8 h-8 text-slate-950" />
          </div>
          <h2 className="text-xl font-bold text-white font-outfit">Unlock Premium Savings</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Pre-pay for services and save up to 25%. Credits never expire while your pass is active.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!user && !loading && (
          <div className="text-center p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <p className="text-sm text-slate-300 mb-4">Sign in to purchase a Bloom Pass</p>
            <GradientButton fullWidth size="md" onClick={() => { onClose(); onOpenLogin?.(); }}>
              Sign In to Continue
            </GradientButton>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => {
            const savings = plan.originalPrice
              ? Math.round((1 - plan.price / plan.originalPrice) * 100)
              : 0;

            return (
              <div
                key={plan.id}
                className="relative rounded-2xl border bg-slate-900/80 p-5 transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5"
                style={{ borderColor: 'var(--color-rule)' }}
              >
                {plan.tag && (
                  <span className="absolute -top-2 -right-2 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 shadow-md">
                    {plan.tag}
                  </span>
                )}

                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-bold text-white font-outfit">{plan.name}</h3>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>

                <div className="mb-3">
                  <span className="text-2xl font-extrabold text-white">₹{plan.price.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-slate-500 ml-1">/mo</span>
                  {savings > 0 && (
                    <span className="text-[11px] font-bold text-emerald-400 ml-2">Save {savings}%</span>
                  )}
                </div>

                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {plan.credits} credits
                  </span>
                  <span className="text-xs text-slate-500">{plan.durationDays} days</span>
                </div>

                <p className="text-xs text-slate-400 mb-3">{plan.description}</p>

                <ul className="space-y-1.5 mb-5">
                  {plan.features?.map((f, i) => (
                    <li key={i} className="flex items-start space-x-1.5 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <GradientButton
                  fullWidth
                  size="sm"
                  variant="primary"
                  disabled={purchasing === plan.id}
                  onClick={() => handlePurchase(plan)}
                >
                  {purchasing === plan.id ? 'Activating...' : 'Get This Pass'}
                </GradientButton>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-slate-600 text-center">
          Pass will be activated immediately. Credits are non-refundable. See terms for details.
        </p>
      </div>
    </SmoothDrawer>
  );
};
