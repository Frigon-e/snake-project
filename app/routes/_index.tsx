import React, { useState } from 'react';
import Hero from '../components/Hero';
import FeaturedPets from '../components/FeaturedPets';
import SearchFilters from '../components/SearchFilters';
import PetShowcase from '../components/PetShowcase';
import PetModal from '../components/PetModal';
import type { Pet } from '~/types/Pet';

export default function HomePage() {
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleSelectPet = (pet: Pet) => {
    setSelectedPet(pet);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPet(null);
  };

  return (
    <div>
      <Hero />
      <FeaturedPets onSelectPet={handleSelectPet} />
      <SearchFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      <PetShowcase
        onSelectPet={handleSelectPet}
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
      />
      <PetModal
        pet={selectedPet}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
