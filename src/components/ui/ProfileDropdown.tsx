import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Award, ChevronDown } from 'lucide-react';
import { FirebaseUser, CustomerProfile } from '../../types';

interface ProfileDropdownProps {
  user: FirebaseUser | null;
  profile: CustomerProfile | null;
  loyaltyPoints: number;
  onOpenLogin: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  user,
  profile,
  loyaltyPoints,
  onOpenLogin,
  onOpenProfile,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <button
        onClick={onOpenLogin}
        className="px-4 py-2 text-sm font-semibold rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/30 hover:bg-pink-500 hover:text-white transition-all duration-200"
      >
        Sign In
      </button>
    );
  }

  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
    user.displayName ||
    user.email?.split('@')[0] ||
    'Guest';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-200 hover:bg-slate-700/80 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold uppercase">
          {displayName.charAt(0)}
        </div>
        <span className="text-sm font-medium max-w-[120px] truncate">{displayName}</span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in duration-150">
          <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
            <p className="text-xs font-semibold text-slate-400">Signed in as</p>
            <p className="text-sm font-medium text-slate-100 truncate">{user.email || user.phoneNumber || displayName}</p>
            {loyaltyPoints > 0 && (
              <div className="flex items-center space-x-1.5 mt-1.5 text-xs text-amber-400 font-medium">
                <Award className="w-3.5 h-3.5" />
                <span>{loyaltyPoints} Loyalty Points</span>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setIsOpen(false);
              onOpenProfile();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
          >
            <User className="w-4 h-4 text-pink-400" />
            <span>My Profile & Rewards</span>
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors mt-1"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};
