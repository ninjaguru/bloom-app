import React, { useState, useEffect } from 'react';
import { SmoothDrawer } from '../ui/SmoothDrawer';
import { DatePicker } from './DatePicker';
import { SlotPicker } from './SlotPicker';
import { GradientButton } from '../ui/GradientButton';
import {
  fetchApartments,
  fetchSlotsForApartment,
  getAvailableDates,
  buildWhatsAppMessage,
  filterPastSlots,
  WHATSAPP_NUMBER,
} from '../../lib/booking';
import { useCartStore, selectCartTotals } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import { getAllAddons } from '../../lib/addons';
import { ServiceAddon } from '../../types';
import { Calendar, User, Home, Clock, AlertCircle, CheckCircle, Zap, Plus, Check } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

const INPUT_CLASS =
  'w-full rounded-[var(--radius-input)] px-4 py-2.5 text-sm placeholder-[var(--color-neutral)] focus:outline-none focus:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

const INPUT_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--color-paper-3)',
  border: '1px solid var(--color-rule)',
  color: 'var(--color-ink)',
  outlineColor: 'var(--color-focus)',
  transition: 'border-color var(--dur-short) var(--ease-out)',
};

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
}) => {
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const cartTotals = useCartStore(selectCartTotals);
  const checkout = useCartStore((s) => s.checkout);
  const usePassCredit = useCartStore((s) => s.usePassCredit);
  const setUsePassCredit = useCartStore((s) => s.setUsePassCredit);
  const selectedAddons = useCartStore((s) => s.selectedAddons);
  const setSelectedAddons = useCartStore((s) => s.setSelectedAddons);
  const activeSubscription = useSubscriptionStore((s) => s.activeSubscription);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [apartment, setApartment] = useState('');
  const [flat, setFlat] = useState('');
  const [apartmentList, setApartmentList] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [availableAddons, setAvailableAddons] = useState<ServiceAddon[]>([]);

  const dates = getAvailableDates();
  const remainingCredits = activeSubscription
    ? activeSubscription.creditsTotal - activeSubscription.creditsUsed
    : 0;
  const hasCredits = remainingCredits > 0;

  const visibleSlots = selectedDate ? filterPastSlots(selectedDate, slots) : slots;

  useEffect(() => {
    if (isOpen) {
      fetchApartments().then(setApartmentList);
      getAllAddons().then(setAvailableAddons);
      if (profile) {
        const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
        setName(fullName || '');
        setPhone(profile.phone || '');
        setApartment(profile.apartment || '');
        setFlat(profile.flat || '');
        if (profile.apartment) {
          setLoadingSlots(true);
          fetchSlotsForApartment(profile.apartment).then((res) => {
            setSlots(res);
            setLoadingSlots(false);
          });
        }
      }
    }
  }, [isOpen, profile]);

  const handleApartmentChange = (val: string) => {
    setApartment(val);
    if (val.trim()) {
      setLoadingSlots(true);
      fetchSlotsForApartment(val).then((res) => {
        setSlots(res);
        setLoadingSlots(false);
      });
    }
  };

  useEffect(() => {
    if (selectedSlot && visibleSlots.length > 0 && !visibleSlots.includes(selectedSlot)) {
      setSelectedSlot(null);
    }
  }, [selectedSlot, visibleSlots]);

  const toggleAddon = (addon: ServiceAddon) => {
    const exists = selectedAddons.find((a) => a.id === addon.id);
    if (exists) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const handleConfirm = async () => {
    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!apartment.trim()) {
      setErrorMsg('Please enter your apartment or society name.');
      return;
    }
    if (!flat.trim()) {
      setErrorMsg('Please enter your flat or door number.');
      return;
    }
    if (!selectedDate) {
      setErrorMsg('Please select an appointment date.');
      return;
    }
    if (!selectedSlot) {
      setErrorMsg('Please select a time slot.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    try {
      const address = `${flat.trim()}, ${apartment.trim()}`;
      const bookingDetails = {
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          address,
          apartment: apartment.trim(),
          flat: flat.trim(),
        },
        appointment: {
          date: selectedDate,
          timeSlot: selectedSlot,
        },
      };

      await checkout(bookingDetails);

      const message = buildWhatsAppMessage({
        name: name.trim(),
        phone: phone.trim(),
        apartment: apartment.trim(),
        flat: flat.trim(),
        date: selectedDate,
        slot: selectedSlot,
        cartState: cartTotals,
      });

      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
        '_blank'
      );

      onClose();
      if (onSuccessToast) {
        onSuccessToast(`Booking confirmed for ${selectedDate} · ${selectedSlot}`);
      }
    } catch (err) {
      console.error('Booking error:', err);
      setErrorMsg('Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SmoothDrawer
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      title={
        <div className="flex w-full items-center justify-between">
          <div>
            <h2 className="text-lg font-medium font-outfit" style={{ color: 'var(--color-ink)' }}>
              Book appointment
            </h2>
            <p className="text-xs font-mono-tabular" style={{ color: 'var(--color-muted)' }}>
              {cartTotals.totalItems} service{cartTotals.totalItems !== 1 ? 's' : ''} · ₹
              {cartTotals.total.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      }
    >
      <div className="mx-auto max-w-2xl space-y-6 py-2">
        {/* Bloom Pass Credit */}
        {user && hasCredits && (
          <div
            className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
              usePassCredit
                ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-amber-500/30'
            }`}
            onClick={() => setUsePassCredit(!usePassCredit)}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                usePassCredit ? 'bg-amber-500' : 'bg-amber-500/20'
              }`}>
                <Zap className={`w-5 h-5 ${usePassCredit ? 'text-slate-950' : 'text-amber-400'}`} />
              </div>
              <div>
                <p className="text-sm font-bold text-white font-outfit">Bloom Pass Credit</p>
                <p className="text-xs text-amber-300">{remainingCredits} credit{remainingCredits !== 1 ? 's' : ''} available</p>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              usePassCredit ? 'bg-amber-500 border-amber-500' : 'border-slate-600'
            }`}>
              {usePassCredit && <Check className="w-4 h-4 text-slate-950" />}
            </div>
          </div>
        )}

        {/* Add-ons */}
        {availableAddons.length > 0 && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>
              <Plus className="w-3.5 h-3.5" />
              <span>Add-ons</span>
            </h3>
            <div className="grid gap-2">
              {availableAddons.map((addon) => {
                const isSelected = selectedAddons.some((a) => a.id === addon.id);
                return (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(addon)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-pink-500/10 border-pink-500/40'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected ? 'bg-pink-500 border-pink-500' : 'border-slate-600'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{addon.title}</p>
                        {addon.description && (
                          <p className="text-xs text-slate-400">{addon.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <span className="text-sm font-bold text-pink-400">+₹{addon.price.toLocaleString('en-IN')}</span>
                      {addon.durationMinutes > 0 && (
                        <span className="text-xs text-slate-500 block">{addon.durationMinutes} min</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Customer Info */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>
            <User className="w-3.5 h-3.5" />
            <span>Your details</span>
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Mobile number (10 digits)"
              maxLength={10}
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            />
          </div>
        </div>

        {/* Address Info */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>
            <Home className="w-3.5 h-3.5" />
            <span>Service address</span>
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="relative">
              <input
                type="text"
                list="apartment-list"
                value={apartment}
                onChange={(e) => handleApartmentChange(e.target.value)}
                placeholder="Apartment / society name"
                className={INPUT_CLASS}
                style={INPUT_STYLE}
              />
              <datalist id="apartment-list">
                {apartmentList.map((apt) => (
                  <option key={apt} value={apt} />
                ))}
              </datalist>
            </div>
            <input
              type="text"
              value={flat}
              onChange={(e) => setFlat(e.target.value)}
              placeholder="Flat / door no. (e.g. A-204)"
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            />
          </div>
        </div>

        {/* Date Selection */}
        {apartment.trim() && (
          <div className="animate-in fade-in space-y-2 duration-200">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>
              <Calendar className="w-3.5 h-3.5" />
              <span>Select date</span>
            </h3>
            <DatePicker
              dates={dates}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>
        )}

        {/* Slot Selection */}
        {apartment.trim() && selectedDate && (
          <div className="animate-in fade-in space-y-2 duration-200">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>
              <Clock className="w-3.5 h-3.5" />
              <span>Select time slot</span>
            </h3>
            <SlotPicker
              slots={visibleSlots}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
              loading={loadingSlots}
            />
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div
            className="flex items-center gap-2 rounded-[var(--radius-input)] p-3 text-xs font-medium"
            style={{ backgroundColor: 'var(--color-danger-soft)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
            role="alert"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Footer Confirm */}
        <div className="pt-4" style={{ borderTop: '1px solid var(--color-rule)' }}>
          {usePassCredit && (
            <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
              <Zap className="w-4 h-4 flex-shrink-0" />
              <span>Using 1 Bloom Pass credit — this booking is ₹0</span>
            </div>
          )}
          <GradientButton
            fullWidth
            size="lg"
            disabled={submitting}
            onClick={handleConfirm}
            className="flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <span>Confirming…</span>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Confirm booking &amp; notify via WhatsApp</span>
              </>
            )}
          </GradientButton>
        </div>
      </div>
    </SmoothDrawer>
  );
};
