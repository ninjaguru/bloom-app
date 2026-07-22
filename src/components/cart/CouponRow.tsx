import React, { useState } from 'react';
import { Tag, Check, X } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';

export const CouponRow: React.FC = () => {
  const [code, setCode] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const coupon = useCartStore((s) => s.coupon);
  const validateAndApply = useCartStore((s) => s.validateAndApplyCoupon);
  const clearCoupon = useCartStore((s) => s.clearCoupon);

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setStatusMsg(null);

    const res = await validateAndApply(code);
    setLoading(false);
    setStatusMsg({ success: res.success, text: res.message });
    if (res.success) {
      setCode('');
    }
  };

  if (coupon) {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs">
        <div className="flex items-center space-x-2">
          <Tag className="w-4 h-4 text-pink-400" />
          <span>
            Coupon <strong className="font-bold">{coupon.code}</strong> applied (
            {coupon.type === 'percent' ? `${coupon.value}% off` : `₹${coupon.value} off`})
          </span>
        </div>
        <button
          onClick={() => {
            clearCoupon();
            setStatusMsg(null);
          }}
          className="p-1 hover:text-white transition-colors"
          aria-label="Remove coupon"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Coupon code"
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 uppercase"
          />
        </div>
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-pink-300 border border-slate-700 hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Applying...' : 'Apply'}
        </button>
      </div>
      {statusMsg && (
        <p
          className={`text-xs font-medium ${
            statusMsg.success ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {statusMsg.text}
        </p>
      )}
    </div>
  );
};
