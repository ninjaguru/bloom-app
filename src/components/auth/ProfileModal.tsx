import React, { useState, useEffect } from 'react';
import { X, Award, Share2, Copy, Check, Save, Zap, Bell, BellOff, BellRing, MapPin, Pencil, Trash2, Plus } from 'lucide-react';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { GradientButton } from '../ui/GradientButton';
import { useAuthStore } from '../../stores/authStore';
import { useLoyaltyStore } from '../../stores/loyaltyStore';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import { saveProfile } from '../../lib/auth';
import { fetchApartments } from '../../lib/booking';
import { getReferralShareUrl } from '../../lib/referral';
import { pointsToRupees, getExpiryWarningText } from '../../lib/loyalty';
import { requestNotificationPermission } from '../../lib/notifications';
import { listAddresses, addAddress, updateAddress, deleteAddress } from '../../lib/addresses';
import { ActivePassCard } from '../subscription/ActivePassCard';
import { SavedAddress } from '../../types';

type NotifPermission = NotificationPermission | 'unsupported';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
  onOpenPass?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
  onOpenPass,
}) => {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const loyalty = useLoyaltyStore();
  const activeSubscription = useSubscriptionStore((s) => s.activeSubscription);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [apartment, setApartment] = useState('');
  const [flat, setFlat] = useState('');
  const [apartmentList, setApartmentList] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [notifPermission, setNotifPermission] = useState<NotifPermission>(
    () => (typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')
  );
  const [notifRequesting, setNotifRequesting] = useState(false);

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrLabel, setAddrLabel] = useState('');
  const [addrApartment, setAddrApartment] = useState('');
  const [addrFlat, setAddrFlat] = useState('');
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      fetchApartments().then(setApartmentList);
      listAddresses(user.uid).then(setAddresses);
      if (profile) {
        setFirstName(profile.firstName || '');
        setLastName(profile.lastName || '');
        setPhone(profile.phone || '');
        setApartment(profile.apartment || '');
        setFlat(profile.flat || '');
      }
    }
  }, [isOpen, user, profile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      const data = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        apartment: apartment.trim(),
        flat: flat.trim(),
      };
      await saveProfile(user.uid, data);
      setProfile({ ...profile, ...data });
      onClose();
      if (onSuccessToast) onSuccessToast('Profile saved successfully');
    } catch (err: any) {
      console.error('Save profile error:', err);
      setErrorMsg('Failed to save profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const referralCode = profile?.referralCode || 'BLOOM-...';
  const shareUrl = getReferralShareUrl(referralCode);
  const expiryWarning = getExpiryWarningText(loyalty.nextExpiry);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnableNotifications = async () => {
    setNotifRequesting(true);
    try {
      await requestNotificationPermission(user.uid);
    } finally {
      setNotifPermission(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
      setNotifRequesting(false);
    }
  };

  const openAddAddressForm = () => {
    setEditingAddressId(null);
    setAddrLabel('');
    setAddrApartment('');
    setAddrFlat('');
    setAddressError('');
    setShowAddressForm(true);
  };

  const openEditAddressForm = (addr: SavedAddress) => {
    setEditingAddressId(addr.id);
    setAddrLabel(addr.label);
    setAddrApartment(addr.apartment);
    setAddrFlat(addr.flat);
    setAddressError('');
    setShowAddressForm(true);
  };

  const closeAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
  };

  const handleSaveAddress = async () => {
    if (!addrLabel.trim() || !addrApartment.trim() || !addrFlat.trim()) {
      setAddressError('Fill in label, apartment and flat number.');
      return;
    }
    setAddressSaving(true);
    setAddressError('');
    const data = { label: addrLabel.trim(), apartment: addrApartment.trim(), flat: addrFlat.trim() };
    try {
      if (editingAddressId) {
        const ok = await updateAddress(user.uid, editingAddressId, data);
        if (!ok) throw new Error('update failed');
        setAddresses((prev) => prev.map((a) => (a.id === editingAddressId ? { ...a, ...data } : a)));
      } else {
        const id = await addAddress(user.uid, data);
        if (!id) throw new Error('add failed');
        setAddresses((prev) => [...prev, { id, ...data }]);
      }
      closeAddressForm();
    } catch {
      setAddressError('Could not save address. Try again.');
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const ok = await deleteAddress(user.uid, id);
    if (ok) setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white font-outfit">My Profile & Rewards</h2>
            <p className="text-xs text-slate-400 font-light">
              Manage saved address and view referral coupons
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loyalty Balance Card */}
        <LiquidGlassCard title="Bloom Loyalty Rewards" gradient="amber" badge="VIP Member">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-3xl font-extrabold text-white font-outfit">
                {loyalty.available}
              </span>
              <span className="text-xs text-amber-300 block font-medium">
                Available Loyalty Points
              </span>
              {loyalty.available >= 100 && (
                <span className="text-xs text-emerald-400 font-medium block mt-1">
                  Worth ₹{pointsToRupees(loyalty.available)} discount on next order
                </span>
              )}
            </div>
            <Award className="w-12 h-12 text-amber-400 opacity-80" />
          </div>
          {expiryWarning && (
            <div className="mt-3 text-xs text-rose-300 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
              ⚠️ {expiryWarning}
            </div>
          )}
        </LiquidGlassCard>

        {/* Bloom Pass Card */}
        {activeSubscription && (
          <div onClick={() => { onOpenPass?.(); onClose(); }}>
            <ActivePassCard subscription={activeSubscription} onOpenPass={() => {}} />
          </div>
        )}

        {!activeSubscription && (
          <button
            onClick={() => { onOpenPass?.(); onClose(); }}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border border-amber-500/30 p-4 text-left hover:bg-amber-500/20 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-slate-950" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white font-outfit">Bloom Pass</p>
                <p className="text-xs text-amber-300">Save up to 25% with a monthly pass</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500 text-slate-950">New</span>
            </div>
          </button>
        )}

        {/* Push Notifications Card */}
        {notifPermission !== 'unsupported' && (
          <div className="w-full rounded-2xl bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-purple-500/10 border border-pink-500/30 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                {notifPermission === 'granted' ? (
                  <BellRing className="w-5 h-5 text-white" />
                ) : (
                  <Bell className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white font-outfit">Push Notifications</p>
                <p className="text-xs text-slate-400">
                  {notifPermission === 'granted'
                    ? 'Enabled — you\'ll get booking and offer alerts'
                    : notifPermission === 'denied'
                    ? 'Blocked in your browser settings'
                    : 'Get alerts for bookings, offers & loyalty points'}
                </p>
              </div>
              {notifPermission === 'granted' ? (
                <span className="flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 flex-shrink-0">
                  <Check className="w-3.5 h-3.5" />
                  <span>On</span>
                </span>
              ) : notifPermission === 'denied' ? (
                <span className="flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 flex-shrink-0">
                  <BellOff className="w-3.5 h-3.5" />
                  <span>Blocked</span>
                </span>
              ) : (
                <button
                  onClick={handleEnableNotifications}
                  disabled={notifRequesting}
                  className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-pink-500 text-white text-xs font-bold hover:bg-pink-600 transition-colors disabled:opacity-50"
                >
                  {notifRequesting ? 'Enabling...' : 'Enable'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Referral Card */}
        <LiquidGlassCard title="Refer a Friend & Earn ₹200" gradient="purple" badge="Invite">
          <p className="text-xs text-slate-300 font-light mb-3">
            Share your exclusive code. Your friend gets discounts, and you earn a ₹200 voucher after their first order!
          </p>
          <div className="flex items-center space-x-2 bg-slate-950/80 p-3 rounded-2xl border border-purple-500/30">
            <span className="text-sm font-bold text-purple-300 tracking-wider flex-1 uppercase">
              {referralCode}
            </span>
            <button
              onClick={handleCopyLink}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-200 text-xs font-semibold hover:bg-purple-500/30 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </LiquidGlassCard>

        {/* Saved Form */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400">
            Personal Details & Address
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
            />
          </div>

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Mobile Number (10 digits)"
            maxLength={10}
            className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
            >
              <option value="">— Select Apartment —</option>
              {apartmentList.map((apt) => (
                <option key={apt} value={apt}>
                  {apt}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={flat}
              onChange={(e) => setFlat(e.target.value)}
              placeholder="Flat / Door No."
              className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>

        {/* Saved Addresses */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400">
              Saved Addresses
            </h4>
            {!showAddressForm && (
              <button
                onClick={openAddAddressForm}
                className="flex items-center space-x-1 text-xs font-semibold text-pink-400 hover:text-pink-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Address</span>
              </button>
            )}
          </div>

          {addresses.length === 0 && !showAddressForm && (
            <p className="text-xs text-slate-500">No saved addresses yet.</p>
          )}

          <div className="space-y-2">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <MapPin className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{addr.label}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {addr.flat}, {addr.apartment}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={() => openEditAddressForm(addr)}
                    className="p-1.5 text-slate-400 hover:text-white transition-colors"
                    aria-label="Edit address"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    aria-label="Delete address"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showAddressForm && (
            <div className="space-y-2.5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <input
                type="text"
                value={addrLabel}
                onChange={(e) => setAddrLabel(e.target.value)}
                placeholder="Label (e.g. Home, Office)"
                className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <select
                  value={addrApartment}
                  onChange={(e) => setAddrApartment(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="">— Select Apartment —</option>
                  {apartmentList.map((apt) => (
                    <option key={apt} value={apt}>
                      {apt}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={addrFlat}
                  onChange={(e) => setAddrFlat(e.target.value)}
                  placeholder="Flat / Door No."
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>
              {addressError && <p className="text-xs text-rose-400 font-medium">{addressError}</p>}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveAddress}
                  disabled={addressSaving}
                  className="flex-1 px-3 py-2 rounded-xl bg-pink-500 text-white text-xs font-bold hover:bg-pink-600 transition-colors disabled:opacity-50"
                >
                  {addressSaving ? 'Saving...' : editingAddressId ? 'Update Address' : 'Save Address'}
                </button>
                <button
                  onClick={closeAddressForm}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>
        )}

        <div className="pt-4 border-t border-slate-800">
          <GradientButton
            fullWidth
            size="md"
            disabled={saving}
            onClick={handleSave}
            className="flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Profile'}</span>
          </GradientButton>
        </div>
      </div>
    </div>
  );
};
