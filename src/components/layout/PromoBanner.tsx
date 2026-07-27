import React, { useEffect, useState } from 'react';
import { Tag, X } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

const FALLBACK_PROMOS = [
  '🌿 Free home service consultation with every booking',
  '💎 Use code BLOOM200 for ₹200 off your first booking',
  '⭐ 100% hygienic — single-use sterilised kits for every service',
  '🎁 Refer a friend and earn ₹200 off your next booking',
];

export const PromoBanner: React.FC = () => {
  const [promos, setPromos] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    getDocs(query(collection(db, 'promos'), where('active', '==', true), limit(5)))
      .then((snap) => {
        const texts = snap.docs.map((d) => d.data().text as string).filter(Boolean);
        setPromos(texts.length > 0 ? texts : FALLBACK_PROMOS);
      })
      .catch(() => setPromos(FALLBACK_PROMOS));
  }, []);

  if (dismissed || promos.length === 0) return null;

  const marqueeText = promos.join('   ·   ');

  return (
    <div className="relative w-full bg-gradient-to-r from-pink-950/80 via-purple-950/60 to-pink-950/80 border-b border-pink-500/20 overflow-hidden">
      <div className="flex items-center">
        {/* Icon anchor */}
        <div className="flex-shrink-0 flex items-center space-x-1.5 px-3 py-2 bg-pink-500/20 border-r border-pink-500/20 z-10">
          <Tag className="w-3 h-3 text-pink-400" />
          <span className="text-xs font-bold text-pink-300 uppercase tracking-wider">Offers</span>
        </div>

        {/* Fade masks */}
        <div className="absolute left-[72px] top-0 bottom-0 w-8 bg-gradient-to-r from-pink-950/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-7 top-0 bottom-0 w-8 bg-gradient-to-l from-pink-950/80 to-transparent z-10 pointer-events-none" />

        {/* Scrolling text */}
        <div className="flex-1 overflow-hidden py-2 px-4">
          <div
            className="whitespace-nowrap text-xs text-pink-200/80 font-medium animate-marquee"
            style={{ animationDuration: `${Math.max(20, marqueeText.length * 0.08)}s` }}
          >
            {marqueeText}&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;{marqueeText}
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 px-2 py-2 text-pink-400/60 hover:text-pink-300 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
