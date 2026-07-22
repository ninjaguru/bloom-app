import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useServices } from './hooks/useServices';
import { useCategories } from './hooks/useCategories';
import { filterServices } from './lib/search';
import { Service } from './types';

import { Header } from './components/layout/Header';
import { Hero } from './components/layout/Hero';
import { Footer } from './components/layout/Footer';
import { CategoryPills } from './components/services/CategoryPills';
import { SearchBar } from './components/search/SearchBar';
import { ServiceGrid } from './components/services/ServiceGrid';
import { ServiceModal } from './components/services/ServiceModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { BookingModal } from './components/booking/BookingModal';
import { LoginModal } from './components/auth/LoginModal';
import { ProfileModal } from './components/auth/ProfileModal';
import { NotificationBanner } from './components/notifications/NotificationBanner';
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

  // Toast state
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Authenticate user & sync state
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      <NotificationBanner />

      <Header
        onOpenLogin={() => setLoginOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenCart={() => setCartOpen(true)}
      />

      <main className="flex-1">
        <Hero gender={gender} onGenderChange={handleGenderChange} />

        <CategoryPills
          categories={categories}
          active={category}
          onSelect={handleCategorySelect}
        />

        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <ServiceGrid
          services={services}
          onSelectService={(service) => setSelectedService(service)}
        />
      </main>

      <Footer />

      {/* Modals & Drawers */}
      <ServiceModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
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

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
      />

      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        onSuccessToast={showToast}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-sm shadow-2xl animate-in slide-in-from-bottom duration-200">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
