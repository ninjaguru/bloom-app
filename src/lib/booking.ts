import { db } from './firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { CartTotals, BookingDetails } from '../types';

export const FALLBACK_APARTMENTS = [
  'Adarsh Palm Retreat',
  'Adarsh Palm Meadows',
  'Assetz Marq',
  'Brigade Cosmopolis',
  'Brigade Gateway',
  'Brigade Orchards',
  'Casagrand Ultima',
  'Concorde Sylvan View',
  'DNR Reflection',
  'Embassy Springs',
  'Godrej Reflections',
  'Godrej Splendour',
  'L&T Raintree Boulevard',
  'Mahindra Windchimes',
  'Mantri Webcity',
  'Nitesh Caesars Palace',
  'Prestige Lakeside Habitat',
  'Prestige Shantiniketan',
  'Prestige White Meadows',
  'Purva Fountainhead',
  'Purva Skywood',
  'Rajapushpa Provincia',
  'RMZ Latitude',
  'Salarpuria Greenage',
  'Salarpuria Sattva Misty Charm',
  'Shriram Summitt',
  'Sobha Dream Acres',
  'Sumadhura Epitome',
  'Tata New Haven',
  'Vaishnavi Terraces',
  'Brigade Caladium',
  'Mantri Espana',
  'Nester Piccadily',
  'Prestige Misty Waters',
  'Purva Skydale',
  'Salarpuria Sattva Magnus',
  'SJR Watermark',
  'Sobha City',
  'Brigade Utopia',
  'Gopalan Grandeur',
  'Mana Glen',
  'Prestige Sunrise Park',
  'Prestige Tranquility',
  'Rohan Prerna',
  'Vaishnavi Serene',
];

export const FALLBACK_SLOTS = [
  '8:00 – 10:00 AM',
  '10:00 AM – 12:00 PM',
  '12:00 – 2:00 PM',
  '2:00 – 4:00 PM',
  '4:00 – 6:00 PM',
  '6:00 – 8:00 PM',
];

export const WHATSAPP_NUMBER = '919916953366';

export async function fetchApartments(): Promise<string[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'societies'), where('active', '==', true), orderBy('name', 'asc'))
    );
    const names = snap.empty
      ? FALLBACK_APARTMENTS
      : snap.docs.map((d) => d.data().name as string).filter(Boolean);
    return names;
  } catch {
    return FALLBACK_APARTMENTS;
  }
}

export async function fetchSlotsForApartment(apartmentName: string): Promise<string[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'slots'), where('active', '==', true))
    );
    if (snap.empty) return FALLBACK_SLOTS;

    const all = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as any))
      .filter((s) => {
        const societies = s.societies;
        if (!societies || societies.length === 0) return true;
        return societies.some(
          (soc: string) => soc.trim().toLowerCase() === apartmentName.trim().toLowerCase()
        );
      })
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

    return all.length ? all.map((s) => s.timeSlot) : FALLBACK_SLOTS;
  } catch {
    return FALLBACK_SLOTS;
  }
}

export interface DateItem {
  value: string;
  label: string;
  sublabel: string;
}

export function getAvailableDates(): DateItem[] {
  const dates: DateItem[] = [];
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      value: d.toISOString().split('T')[0],
      label: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : dayNames[d.getDay()],
      sublabel: `${d.getDate()} ${monthNames[d.getMonth()]}`,
    });
  }
  return dates;
}

export function buildWhatsAppMessage({
  name,
  phone,
  apartment,
  flat,
  date,
  slot,
  cartState,
}: {
  name: string;
  phone: string;
  apartment: string;
  flat: string;
  date: string;
  slot: string;
  cartState: CartTotals;
}): string {
  const serviceLines = cartState.items
    .map((item) => `  • ${item.service.title} (×${item.quantity}) — ₹${item.lineTotal.toLocaleString('en-IN')}`)
    .join('\n');

  const lines = [
    '🌿 *New Bloom at Home Booking*',
    '',
    `*Customer:* ${name}`,
    `*Phone:* ${phone}`,
    `*Address:* ${flat}, ${apartment}`,
    '',
    `*Date:* ${date}`,
    `*Time:* ${slot}`,
    '',
    '*Services:*',
    serviceLines,
  ];

  if (cartState.couponCode && cartState.discountAmount > 0) {
    lines.push(`Coupon (${cartState.couponCode}): -₹${cartState.discountAmount.toLocaleString('en-IN')}`);
  }

  lines.push(`*Total: ₹${cartState.total.toLocaleString('en-IN')}*`);

  return lines.join('\n');
}
