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
        <div className="flex items-center justify-between w-full">
          <div>
            <h2 className="text-lg font-bold text-white font-outfit">Book Appointment</h2>
            <p className="text-xs text-slate-400 font-normal">
              {cartTotals.totalItems} service{cartTotals.totalItems !== 1 ? 's' : ''} · ₹
              {cartTotals.total.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      }
    >
      <div className="max-w-2xl mx-auto space-y-6 py-2">
        {/* Customer Info */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center space-x-1">
            <User className="w-3.5 h-3.5" />
            <span>Your Details</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Mobile Number (10 digits)"
              maxLength={10}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>

        {/* Address Info */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center space-x-1">
            <Home className="w-3.5 h-3.5" />
            <span>Service Address</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <input
                type="text"
                list="apartment-list"
                value={apartment}
                onChange={(e) => handleApartmentChange(e.target.value)}
                placeholder="Apartment / Society Name"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
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
              placeholder="Flat / Door No. (e.g. A-204)"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>

        {/* Date Selection */}
        {apartment.trim() && (
          <div className="space-y-2 animate-in fade-in duration-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Select Date</span>
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
          <div className="space-y-2 animate-in fade-in duration-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Select Time Slot</span>
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
          <div className="flex items-center space-x-2 text-rose-400 text-xs font-medium p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Footer Confirm */}
        <div className="pt-4 border-t border-slate-800">
          <GradientButton
            fullWidth
            size="lg"
            disabled={submitting}
            onClick={handleConfirm}
            className="flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <span>Confirming...</span>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Confirm Booking & Notify via WhatsApp</span>
              </>
            )}
          </GradientButton>
        </div>
      </div>
    </SmoothDrawer>
  );
};
