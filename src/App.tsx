import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useServices } from './hooks/useServices';
import { useCategories } from './hooks/useCategories';
import { filterServices } from './lib/search';
import { Service } from './types';

import { Header } from './components/layout/Header';
import { Hero } from './components/layout/Hero';
import { Footer } from './components/layout/Footer';
import { PromoBanner } from './components/layout/PromoBanner';
import { CategoryPills } from './components/services/CategoryPills';
import { SearchBar } from './components/search/SearchBar';
import { ServiceGrid } from './components/services/ServiceGrid';
import { ServiceModal } from './components/services/ServiceModal';
import { RecentlyViewed } from './components/services/RecentlyViewed';
import { CartDrawer } from './components/cart/CartDrawer';
import { BookingModal } from './components/booking/BookingModal';
import { LoginModal } from './components/auth/LoginModal';
import { ProfileModal } from './components/auth/ProfileModal';
import { BookingsModal } from './components/auth/BookingsModal';
import { PassModal } from './components/subscription/PassModal';
import { NotificationBanner } from './components/notifications/NotificationBanner';
import { InstallBanner } from './components/layout/InstallBanner';
import { Check } from 'lucide-react';

export default function App() {
  const [gender, setGender] = useState<'women' | 'men'>('women');
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [passOpen, setPassOpen] = useState(false);

  // Recently viewed re-render trigger
  const [recentKey, setRecentKey] = useState(0);

  // Toast state
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useAuth();

  const allServices = useServices(gender, category);
  const categories = useCategories(gender);
  const services = filterServices(allServices, searchQuery);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleGenderChange = (newGender: 'women' | 'men') => {
    setGender(newGender);
    setCategory('All');
    setSearchQuery('');
  };

  const handleCategorySelect = (newCategory: string) => {
    setCategory(newCategory);
    setSearchQuery('');
  };

  const handleServiceClose = () => {
    setSelectedService(null);
    setRecentKey((k) => k + 1); // refresh recently viewed strip
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-[var(--color-accent)] selection:text-[var(--color-accent-ink)]" style={{ background: 'var(--color-paper)', color: 'var(--color-ink)' }}>
      <NotificationBanner />
      <PromoBanner />

      <Header
          onOpenLogin={() => setLoginOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenBookings={() => setBookingsOpen(true)}
          onOpenCart={() => setCartOpen(true)}
          onOpenPass={() => setPassOpen(true)}
        />

      <main className="flex-1">
        <Hero gender={gender} onGenderChange={handleGenderChange} />

        <CategoryPills
          categories={categories}
          active={category}
          onSelect={handleCategorySelect}
        />

        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <RecentlyViewed
          key={recentKey}
          onSelect={(s) => setSelectedService(s)}
        />

        <ServiceGrid
          services={services}
          onSelectService={(service) => setSelectedService(service)}
        />
      </main>

      <Footer />

      {/* Modals & Drawers */}
      <ServiceModal
        service={selectedService}
        onClose={handleServiceClose}
      />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onOpenBooking={() => setBookingOpen(true)}
      />

      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        onSuccessToast={showToast}
      />

      <PassModal
        isOpen={passOpen}
        onClose={() => setPassOpen(false)}
        onSuccessToast={showToast}
      />

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
      />

      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        onSuccessToast={showToast}
        onOpenPass={() => setPassOpen(true)}
      />

      <BookingsModal
        isOpen={bookingsOpen}
        onClose={() => setBookingsOpen(false)}
        onBookAgainToast={(msg) => { showToast(msg); setCartOpen(true); }}
      />

      <InstallBanner />

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-sm shadow-2xl animate-in slide-in-from-bottom duration-200">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
