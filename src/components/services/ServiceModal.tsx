import React, { useState, useRef } from 'react';
import { X, Clock, Star, Plus, Check, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Service, RitualStep } from '../../types';
import { GradientButton } from '../ui/GradientButton';
import { useCartStore } from '../../stores/cartStore';

interface ServiceModalProps {
  service: Service | null;
  onClose: () => void;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({ service, onClose }) => {
  const addToCart = useCartStore((s) => s.addToCart);
  const cartItems = useCartStore((s) => s.items);

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right');
  const slideKey = useRef(0);

  if (!service) return null;

  const key = service.serviceId || service.id;
  const isInCart = Boolean(cartItems[key]);
  const cartQuantity = cartItems[key]?.quantity || 0;

  const steps: RitualStep[] = service.ritualSteps || [];
  const hasSteps = steps.length > 0;

  const handlePrevStep = () => {
    setSlideDir('left');
    slideKey.current += 1;
    setActiveStepIndex((prev) => (prev > 0 ? prev - 1 : steps.length - 1));
  };

  const handleNextStep = () => {
    setSlideDir('right');
    slideKey.current += 1;
    setActiveStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : 0));
  };

  const currentStep = hasSteps ? steps[activeStepIndex] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Main Service Image Header */}
        <div className="relative h-44 sm:h-52 w-full bg-gradient-to-tr from-slate-950 via-slate-900 to-pink-950/40">
          {service.imageUrl ? (
            <img
              src={service.imageUrl}
              alt={service.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-pink-500/30">
              <Sparkles className="w-20 h-20" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full bg-black/60 p-2 text-white hover:bg-black transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body — scrollable */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {service.category}
              </span>
              {service.isBundle && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Bundle Deal
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold text-white font-outfit mb-2">
              {service.title}
            </h2>

            <div className="flex items-center space-x-4 text-xs text-slate-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>{service.durationMinutes} minutes</span>
              </div>
              {service.rating > 0 && (
                <div className="flex items-center space-x-1 text-amber-400 font-semibold">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{service.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          {service.description && (
            <p className="text-sm text-slate-300 font-light leading-relaxed">
              {service.description}
            </p>
          )}

          {/* Service Ritual & Procedure Carousel */}
          {hasSteps && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Service Ritual & Procedure</span>
                </h4>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Step {activeStepIndex + 1} of {steps.length}
                </span>
              </div>

              {/* Carousel Card */}
              <div
                key={slideKey.current}
                className={`relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl p-4 animate-in duration-300 ${
                  slideDir === 'right' ? 'slide-in-from-right-8' : 'slide-in-from-left-8'
                }`}
              >
                {/* Carousel Image */}
                <div className="relative h-48 w-full rounded-xl overflow-hidden bg-slate-900 mb-4 border border-slate-800">
                  {currentStep?.imageUrl ? (
                    <img
                      src={currentStep.imageUrl}
                      alt={currentStep.title}
                      className="w-full h-full object-cover transition-all duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-pink-950/20 via-slate-900 to-purple-950/20 text-slate-500">
                      <Sparkles className="w-10 h-10 text-pink-500/40 mb-2" />
                      <span className="text-xs">Step {activeStepIndex + 1} Procedure</span>
                    </div>
                  )}

                  {/* Nav Arrows */}
                  {steps.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevStep}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 backdrop-blur-md p-2 text-white hover:bg-pink-500 transition-colors shadow-lg"
                        aria-label="Previous step"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleNextStep}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 backdrop-blur-md p-2 text-white hover:bg-pink-500 transition-colors shadow-lg"
                        aria-label="Next step"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Step Info */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h5 className="text-base font-bold text-white font-outfit">
                      {currentStep?.title}
                    </h5>
                    {currentStep?.durationMinutes && (
                      <span className="text-xs text-slate-400">
                        {currentStep.durationMinutes} mins
                      </span>
                    )}
                  </div>
                  {currentStep?.description && (
                    <p className="text-xs text-slate-300 font-light leading-relaxed">
                      {currentStep.description}
                    </p>
                  )}
                </div>

                {/* Step Indicator Dots */}
                {steps.length > 1 && (
                  <div className="flex items-center justify-center space-x-1.5 mt-4 pt-2 border-t border-slate-900">
                    {steps.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveStepIndex(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          idx === activeStepIndex
                            ? 'w-6 bg-pink-500'
                            : 'w-1.5 bg-slate-800 hover:bg-slate-700'
                        }`}
                        aria-label={`Go to step ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pricing & Add to Cart Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div>
              <span className="text-xs text-slate-400 block">Total Price</span>
              <span className="text-2xl font-extrabold text-white">
                ₹{service.price.toLocaleString('en-IN')}
              </span>
            </div>

            <GradientButton
              size="md"
              variant={isInCart ? 'secondary' : 'primary'}
              onClick={() => {
                addToCart(service);
                onClose();
              }}
            >
              {isInCart ? (
                <div className="flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-pink-400" />
                  <span>In Cart ({cartQuantity})</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Add to Cart</span>
                </div>
              )}
            </GradientButton>
          </div>
        </div>
      </div>
    </div>
  );
};
