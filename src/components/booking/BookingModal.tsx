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
  WHATSAPP_NUMBER,
} from '../../lib/booking';
import { useCartStore, selectCartTotals } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { Calendar, User, Home, Clock, AlertCircle, CheckCircle } from 'lucide-react';

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
  const cartTotals = useCartStore(selectCartTotals);
  const checkout = useCartStore((s) => s.checkout);

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

  const dates = getAvailableDates();

  useEffect(() => {
    if (isOpen) {
      fetchApartments().then(setApartmentList);
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
              slots={slots}
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
