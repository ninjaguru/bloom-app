import React, { useEffect, useState } from 'react';
import {
  X,
  Calendar,
  ShoppingBag,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  getDocs,
  getCountFromServer,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
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

const PAGE_SIZE = 5;

const STATUS_STYLES: Record<string, { cls: string; dot: string; label: string }> = {
  confirmed: {
    cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
    dot: 'bg-emerald-400',
    label: 'Confirmed',
  },
  completed: {
    cls: 'text-blue-300 bg-blue-500/10 border-blue-500/25',
    dot: 'bg-blue-400',
    label: 'Completed',
  },
  cancelled: {
    cls: 'text-rose-300 bg-rose-500/10 border-rose-500/25',
    dot: 'bg-rose-400',
    label: 'Cancelled',
  },
};

const DEFAULT_STATUS = STATUS_STYLES.confirmed;

function parseApptDate(dateStr: string): Date | null {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function extractIndexUrl(err: unknown): string | null {
  const msg = err instanceof Error ? err.message : String(err);
  const m = msg.match(/https:\/\/console\.firebase\.google\.com[^\s"']+/);
  return m ? m[0] : null;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-slate-800" />
        <div className="h-5 w-20 rounded-full bg-slate-800" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-24 rounded-full bg-slate-800" />
        <div className="h-6 w-28 rounded-full bg-slate-800" />
        <div className="h-6 w-20 rounded-full bg-slate-800" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
        <div className="h-6 w-16 rounded bg-slate-800" />
        <div className="h-8 w-28 rounded-full bg-slate-800" />
      </div>
    </div>
  );
}

export const BookingsModal: React.FC<BookingsModalProps> = ({
  isOpen,
  onClose,
  onBookAgainToast,
}) => {
  const user = useAuthStore((s) => s.user);
  const addToCart = useCartStore((s) => s.addToCart);

  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [cursors, setCursors] = useState<{
    first: QueryDocumentSnapshot;
    last: QueryDocumentSnapshot;
  } | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [indexUrl, setIndexUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    setLoading(true);
    setErrorMsg('');
    setIndexUrl(null);
    setPage(1);
    setOrders([]);
    setCursors(null);
    setHasMore(false);

    const ordersRef = collection(db, 'orders');
    const pageQuery = query(
      ordersRef,
      where('customerUid', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    );

    getDocs(pageQuery)
      .then((snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
        setHasMore(snap.docs.length === PAGE_SIZE);
        if (snap.docs.length > 0) {
          setCursors({ first: snap.docs[0], last: snap.docs[snap.docs.length - 1] });
        }
      })
      .catch((err) => {
        console.error('Load bookings error:', err);
        const idx = extractIndexUrl(err);
        if (idx) setIndexUrl(idx);
        setErrorMsg('Could not load your bookings. Please try again.');
      });

    getCountFromServer(query(ordersRef, where('customerUid', '==', user.uid)))
      .then((snap) => setTotalCount(snap.data().count))
      .catch(() => setTotalCount(null));

    setLoading(false);
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const goToPage = (dir: 'next' | 'prev') => {
    if (loading || !cursors || !user) return;
    setLoading(true);
    setErrorMsg('');
    setIndexUrl(null);

    const ordersRef = collection(db, 'orders');
    const q =
      dir === 'next'
        ? query(
            ordersRef,
            where('customerUid', '==', user.uid),
            orderBy('createdAt', 'desc'),
            startAfter(cursors.last),
            limit(PAGE_SIZE)
          )
        : query(
            ordersRef,
            where('customerUid', '==', user.uid),
            orderBy('createdAt', 'desc'),
            endBefore(cursors.first),
            limitToLast(PAGE_SIZE)
          );

    getDocs(q)
      .then((snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
        setPage((p) => (dir === 'next' ? p + 1 : Math.max(1, p - 1)));
        setHasMore(snap.docs.length === PAGE_SIZE);
        setCursors(
          snap.docs.length > 0
            ? { first: snap.docs[0], last: snap.docs[snap.docs.length - 1] }
            : null
        );
      })
      .catch((err) => {
        console.error('Load bookings error:', err);
        const idx = extractIndexUrl(err);
        if (idx) setIndexUrl(idx);
        setErrorMsg('Could not load your bookings. Please try again.');
      })
      .finally(() => setLoading(false));
  };

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

  const totalPages = totalCount != null ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md animate-in fade-in"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-outfit leading-tight">My Bookings</h2>
              {totalCount != null && totalCount > 0 && (
                <p className="text-xs text-slate-400">
                  {totalCount} booking{totalCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
          {loading && orders.length === 0 && (
            <div className="space-y-3.5 py-2">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {!loading && errorMsg && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                <RefreshCw className="w-6 h-6 text-rose-400" />
              </div>
              <p className="text-sm font-medium text-slate-300">{errorMsg}</p>
              <p className="text-xs text-slate-500 mt-1">
                Make sure you're signed in with the same account used to book.
              </p>
              {indexUrl && (
                <a
                  href={indexUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-pink-400 hover:text-pink-300"
                >
                  Create the required database index
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {!loading && !errorMsg && orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/15 to-purple-500/15 border border-pink-500/20 flex items-center justify-center mb-4">
                <ShoppingBag className="w-7 h-7 text-pink-400" />
              </div>
              <p className="text-base font-semibold text-slate-200 font-outfit">No bookings yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
                Your upcoming salon appointments will show up here once you book.
              </p>
              <GradientButton size="sm" onClick={onClose} className="mt-5">
                Browse Services
              </GradientButton>
            </div>
          )}

          {orders.map((order) => {
            const date = order.createdAt?.toDate?.();
            const placedStr = date
              ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : null;
            const apptDate = order.appointment?.date ? parseApptDate(order.appointment.date) : null;
            const apptDateStr = apptDate
              ? apptDate.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })
              : placedStr;
            const style = STATUS_STYLES[order.status] || DEFAULT_STATUS;

            return (
              <div
                key={order.id}
                className="group rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-slate-700 transition-colors overflow-hidden"
              >
                <div className="h-0.5 bg-gradient-to-r from-pink-500/70 via-purple-500/50 to-transparent" />

                <div className="p-4 space-y-3">
                  {/* Date + status row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center">
                        <Calendar className="w-4.5 h-4.5 text-pink-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-100">{apptDateStr || '—'}</p>
                        {order.appointment?.timeSlot ? (
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {order.appointment.timeSlot}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500">Placed {placedStr}</p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${style.cls}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {style.label}
                    </span>
                  </div>

                  {/* Services */}
                  <div className="flex flex-wrap gap-1.5">
                    {order.items.map((item, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300"
                      >
                        {item.title} {item.quantity > 1 ? `×${item.quantity}` : ''}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Total</p>
                      <span className="text-lg font-extrabold text-amber-400 font-outfit leading-none">
                        ₹{(order.total || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
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

        {/* Pagination footer */}
        {!loading && !errorMsg && orders.length > 0 && totalPages != null && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/50">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>
                Page {page} of {totalPages}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage('prev')}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300 bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>
              <button
                onClick={() => goToPage('next')}
                disabled={!hasMore || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300 bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
