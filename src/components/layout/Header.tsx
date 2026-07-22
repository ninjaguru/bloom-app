import React from 'react';
import { ShoppingBag, Flower } from 'lucide-react';
import { ProfileDropdown } from '../ui/ProfileDropdown';
import { NotificationBell } from '../notifications/NotificationBell';
import { useAuthStore } from '../../stores/authStore';
import { useLoyaltyStore } from '../../stores/loyaltyStore';
import { useCartStore } from '../../stores/cartStore';
import { logout } from '../../lib/auth';

interface HeaderProps {
  onOpenLogin: () => void;
  onOpenProfile: () => void;
  onOpenCart: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenLogin,
  onOpenProfile,
  onOpenCart,
}) => {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const loyaltyPoints = useLoyaltyStore((s) => s.available);
  const totalItems = useCartStore((s) => s.totals.totalItems);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2 cursor-pointer group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform duration-200">
            <Flower className="w-5 h-5 animate-pulse" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-outfit">
            Bloom<span className="text-pink-400"> at Home</span>
          </span>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <NotificationBell />

          <ProfileDropdown
            user={user}
            profile={profile}
            loyaltyPoints={loyaltyPoints}
            onOpenLogin={onOpenLogin}
            onOpenProfile={onOpenProfile}
            onLogout={logout}
          />

          {/* Cart Toggle */}
          <button
            onClick={onOpenCart}
            className="relative p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-300 hover:bg-pink-500/20 hover:border-pink-500 transition-all duration-200 group"
            aria-label="Open cart"
          >
            <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-1.5 text-xs font-bold text-white shadow-md animate-in zoom-in">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
