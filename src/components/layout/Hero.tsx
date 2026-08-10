import React from 'react';
import { ShieldCheck, Clock, Award } from 'lucide-react';
import { GenderToggle } from '../gender/GenderToggle';

interface HeroProps {
  gender: 'women' | 'men';
  onGenderChange: (gender: 'women' | 'men') => void;
}

const TRUST_MARKS = [
  { icon: ShieldCheck, label: 'Sterile, single-use kits' },
  { icon: Clock, label: 'On-time, every visit' },
  { icon: Award, label: 'Certified beauticians' },
];

export const Hero: React.FC<HeroProps> = ({ gender, onGenderChange }) => {
  return (
    <section
      className="relative overflow-hidden px-4 pt-14 pb-10 md:pt-20 md:pb-14"
      style={{
        backgroundImage:
          'radial-gradient(60% 50% at 88% 8%, var(--color-accent-bloom), transparent 68%)',
      }}
    >
      <div className="relative mx-auto grid max-w-5xl gap-8 md:grid-cols-[1.35fr_1fr] md:items-end">
        <div className="order-2 md:order-1">
          <p
            className="mb-3 text-xs font-semibold tracking-wide"
            style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}
          >
            AT-HOME · APPOINTMENT IN 45 MIN
          </p>

          <h1
            className="max-w-md text-[2.75rem] leading-[1.05] font-medium sm:text-[3.4rem]"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
          >
            Salon care,{' '}
            <span
              style={{
                color: 'var(--color-accent)',
                textDecoration: 'underline',
                textDecorationColor: 'var(--color-accent-soft)',
                textDecorationThickness: '3px',
                textUnderlineOffset: '4px',
              }}
            >
              delivered
            </span>{' '}
            to your door.
          </h1>

          <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Certified pros bring facials, waxing, massage & grooming to your home — sterile kits, no salon trip required.
          </p>
        </div>

        <div
          className="order-1 md:order-2 flex flex-col gap-3 border-t pt-5 md:border-t-0 md:border-l md:pl-8 md:pt-0"
          style={{ borderColor: 'var(--color-rule)' }}
        >
          {TRUST_MARKS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--color-muted)' }}>
              <Icon className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
              <span>{label}</span>
            </div>
          ))}
          <div className="mt-4 md:mt-0">
            <GenderToggle gender={gender} onChange={onGenderChange} />
          </div>
        </div>
      </div>
    </section>
  );
};
