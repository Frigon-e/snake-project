import React from 'react';
import { ArrowDown } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-900 via-primary-dark to-secondary-dark">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-2 h-2 bg-green-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-orange-400 rounded-full animate-bounce opacity-40"></div>
        <div className="absolute bottom-40 left-20 w-2 h-2 bg-green-300 rounded-full animate-ping opacity-50"></div>
        <div className="absolute bottom-20 right-10 w-4 h-4 bg-orange-300 rounded-full animate-pulse opacity-30"></div>
        <div className="absolute top-60 left-1/2 w-2 h-2 bg-green-500 rounded-full animate-bounce opacity-40"></div>
      </div>

      {/* Hero content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Discover Your Perfect
            <span className="block bg-gradient-to-r from-green-400 via-orange-400 to-green-400 bg-clip-text text-transparent animate-gradient-shift" style={{backgroundSize: '200% 200%'}}>
              Exotic Companion
            </span>
          </h2>

          <p className="text-xl sm:text-2xl text-stone-200 mb-8 max-w-3xl mx-auto leading-relaxed">
            Premium reptiles and exotic pets from trusted breeders.
            Expert care guides, health guarantees, and lifetime support included.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <a
              href="#pets"
              className="group bg-gradient-to-r from-primary-dark to-primary text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-primary hover:to-primary-light transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Browse Our Collection
              <ArrowDown className="inline-block ml-2 w-5 h-5 group-hover:translate-y-1 transition-transform" />
            </a>

            <a
              href="#contact"
              className="group border-2 border-secondary text-secondary px-8 py-4 rounded-full font-semibold text-lg hover:bg-secondary hover:text-white transform hover:scale-105 transition-all duration-300"
            >
              Expert Consultation
            </a>
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-3xl font-bold text-green-400 group-hover:scale-110 transition-transform">500+</div>
              <div className="text-stone-300 text-sm">Happy Customers</div>
            </div>
            <div className="group">
              <div className="text-3xl font-bold text-orange-400 group-hover:scale-110 transition-transform">15+</div>
              <div className="text-stone-300 text-sm">Years Experience</div>
            </div>
            <div className="group">
              <div className="text-3xl font-bold text-green-400 group-hover:scale-110 transition-transform">100%</div>
              <div className="text-stone-300 text-sm">Health Guarantee</div>
            </div>
            <div className="group">
              <div className="text-3xl font-bold text-orange-400 group-hover:scale-110 transition-transform">24/7</div>
              <div className="text-stone-300 text-sm">Expert Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ArrowDown className="w-6 h-6 text-white opacity-60" />
      </div>
    </section>
  );
};

export default Hero;