import React from 'react';
import { Search, Phone, Mail } from 'lucide-react';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory
}) => {
  const categories = [
    { value: 'all', label: 'All Pets' },
    { value: 'snake', label: 'Snakes' },
    { value: 'lizard', label: 'Lizards' },
    { value: 'gecko', label: 'Geckos' },
    { value: 'turtle', label: 'Turtles' },
    { value: 'spider', label: 'Spiders' },
    { value: 'amphibian', label: 'Amphibians' }
  ];

  return (
    <header className="bg-neutral-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar with contact info */}
        <div className="py-2 border-b border-neutral-700 text-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <a href="tel:+1234567890" className="hover:text-secondary-light transition-colors">
                  (123) 456-7890
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:info@exoticscales.com" className="hover:text-secondary-light transition-colors">
                  info@exoticscales.com
                </a>
              </div>
            </div>
            <div className="text-neutral-300">
              Mon-Sat: 10AM-8PM | Sun: 12PM-6PM
            </div>
          </div>
        </div>

        {/* Main navigation */}
        <div className="py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-light to-secondary bg-clip-text text-transparent">
                Exotic Scales
              </h1>
              <p className="text-sm text-neutral-400">Premium Reptiles & Exotic Pets</p>
            </div>

            {/* Search and filters */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search pets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#pets" className="hover:text-secondary-light transition-colors">Our Pets</a>
              <a href="#care-guides" className="hover:text-secondary-light transition-colors">Care Guides</a>
              <a href="#contact" className="hover:text-secondary-light transition-colors">Contact</a>
              <a href="#about" className="hover:text-secondary-light transition-colors">About</a>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
