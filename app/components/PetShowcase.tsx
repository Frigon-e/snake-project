import React from 'react';
import type { Pet } from '~/types/Pet';
import { pets } from '~/data/pets';
import PetCard from './PetCard';

interface PetShowcaseProps {
  onSelectPet: (pet: Pet) => void;
  searchTerm: string;
  selectedCategory: string;
}

const PetShowcase: React.FC<PetShowcaseProps> = ({
  onSelectPet,
  searchTerm,
  selectedCategory
}) => {
  const filteredPets = pets.filter(pet => {
    const matchesSearch = searchTerm === '' ||
      pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.scientificName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || pet.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <section id="pets" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-neutral-800 mb-4">
            Our Complete Collection
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Discover our full range of carefully selected exotic pets and reptiles.
            Each animal comes with complete care documentation and our health guarantee.
          </p>
        </div>

        {filteredPets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-neutral-500">
              No pets found matching your criteria. Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <p className="text-neutral-600">
                Showing {filteredPets.length} pet{filteredPets.length !== 1 ? 's' : ''}
                {searchTerm && ` matching "${searchTerm}"`}
                {selectedCategory !== 'all' && ` in ${selectedCategory}s`}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredPets.map((pet, index) => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  onSelect={onSelectPet}
                  animationDelay={index * 100}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default PetShowcase;