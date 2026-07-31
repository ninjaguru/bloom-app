import React, { useEffect, useState } from 'react';
import { X, Calendar, ShoppingBag, RefreshCw } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';
import { Service } from '../../types';
import { GradientButton } from '../ui/GradientButton';

interface OrderItem {
  serviceId: string;
  title: string;
  category: string;
  price: number;
  quantity: number;
  lineTotal: number;
  durationMinutes: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: { toDate?: () => Date } | null;
  appointment: { date?: string; timeSlot?: string };
  customer: { name?: string; address?: string };
}

interface BookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookAgainToast?: (msg: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  completed: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  cancelled: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

export const BookingsModal: React.FC<BookingsModalProps> = ({
  isOpen,
  onClose,
  onBookAgainToast,
}) => {
  const user = useAuthStore((s) => s.user);
  const addToCart = useCartStore((s) => s.addToCart);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen || !user) return;
    setLoading(true);
    setErrorMsg('');
    getDocs(
      query(collection(db, 'orders'), where('customerUid', '==', user.uid))
    )
      .then((snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
        items.sort((a, b) => {
          const ta = a.createdAt?.toDate?.()?.getTime() || 0;
          const tb = b.createdAt?.toDate?.()?.getTime() || 0;
          return tb - ta;
        });
        setOrders(items);
      })
      .catch((err) => {
        console.error('Load bookings error:', err);
        setErrorMsg('Could not load your bookings. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleBookAgain = (order: Order) => {
    order.items.forEach((item) => {
      const service: Service = {
        id: item.serviceId,
        serviceId: item.serviceId,
        title: item.title,
        category: item.category || '',
        price: item.price,
        durationMinutes: item.durationMinutes || 0,
        rating: 0,
        reviewCount: 0,
        gender: 'women',
      };
      for (let i = 0; i < item.quantity; i++) addToCart(service);
    });
    onClose();
    if (onBookAgainToast) {
      onBookAgainToast(`${order.items.length} service${order.items.length !== 1 ? 's' : ''} added to cart`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md animate-in fade-in"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-pink-400" />
            <h2 className="text-lg font-bold text-white font-outfit">My Bookings</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <div className="w-8 h-8 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading bookings…</p>
            </div>
          )}

          {!loading && errorMsg && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium text-rose-400">{errorMsg}</p>
              <p className="text-xs text-slate-600 mt-1">
                Make sure you're signed in with the same account used to book.
              </p>
            </div>
          )}

          {!loading && !errorMsg && orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="w-12 h-12 text-slate-700 mb-4" />
              <p className="text-sm font-medium text-slate-400">No bookings yet</p>
              <p className="text-xs text-slate-600 mt-1">Your confirmed bookings will appear here</p>
            </div>
          )}

          {!loading && orders.map((order) => {
            const date = order.createdAt?.toDate?.();
            const dateStr = date
              ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—';
            const statusCls = STATUS_COLORS[order.status] || STATUS_COLORS.confirmed;

            return (
              <div
                key={order.id}
                className="rounded-2xl bg-slate-950/60 border border-slate-800 overflow-hidden"
              >
                {/* Top bar */}
                <div className="h-0.5 bg-gradient-to-r from-pink-500/60 via-purple-500/40 to-transparent" />

                <div className="p-4 space-y-3">
                  {/* Date + status row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-300">
                        {order.appointment?.date
                          ? new Date(order.appointment.date).toLocaleDateString('en-IN', {
                              weekday: 'short', day: 'numeric', month: 'short',
                            })
                          : dateStr}
                      </p>
                      {order.appointment?.timeSlot && (
                        <p className="text-xs text-slate-500">{order.appointment.timeSlot}</p>
                      )}
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border capitalize ${statusCls}`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Services */}
                  <div className="flex flex-wrap gap-1.5">
                    {order.items.map((item, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300"
                      >
                        {item.title} {item.quantity > 1 ? `×${item.quantity}` : ''}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <span className="text-base font-extrabold text-amber-400 font-outfit">
                      ₹{(order.total || 0).toLocaleString('en-IN')}
                    </span>
                    <GradientButton
                      size="sm"
                      onClick={() => handleBookAgain(order)}
                      className="flex items-center space-x-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Book Again</span>
                    </GradientButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
