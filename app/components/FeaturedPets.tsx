import React from 'react';
import { Star, Eye } from 'lucide-react';
import type { Pet } from '~/types/Pet';
import { pets } from '~/data/pets';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';

interface FeaturedPetsProps {
  onSelectPet: (pet: Pet) => void;
}

const FeaturedPets: React.FC<FeaturedPetsProps> = ({ onSelectPet }) => {
  const featuredPets = pets.filter(pet => pet.featured).slice(0, 3);

  const getAvailabilityColors = (availability: string) => {
    switch (availability) {
      case 'Available':
        return 'bg-status-available-bg text-status-available-text';
      case 'Reserved':
        return 'bg-status-reserved-bg text-status-reserved-text';
      case 'Sold':
        return 'bg-status-sold-bg text-status-sold-text';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  return (
    <section className="py-20 bg-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <Star className="w-6 h-6 text-secondary mr-2" />
            <h2 className="text-4xl font-bold text-neutral-800">Featured Collection</h2>
            <Star className="w-6 h-6 text-secondary ml-2" />
          </div>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Hand-picked exceptional specimens from our premium collection
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {featuredPets.map((pet, index) => (
            <Card
              key={pet.id}
              className="group bg-white hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 border-0 shadow-lg"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="relative overflow-hidden">
                <img
                  src={pet.images[0]}
                  alt={pet.name}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-gradient-to-r from-primary to-primary-dark text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Featured
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getAvailabilityColors(pet.availability)}`}>
                    {pet.availability}
                  </span>
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                  <Button
                    onClick={() => onSelectPet(pet)}
                    variant="secondary"
                    className="opacity-0 group-hover:opacity-100 bg-white text-neutral-800 hover:bg-neutral-50 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-neutral-800 group-hover:text-primary transition-colors">
                    {pet.name}
                  </h3>
                  <span className="text-2xl font-bold text-secondary">
                    ${pet.price}
                  </span>
                </div>

                <p className="text-neutral-600 italic mb-2">{pet.scientificName}</p>
                <p className="text-neutral-700 mb-4 line-clamp-2">{pet.description}</p>

                <div className="flex justify-between items-center text-sm text-neutral-500 mb-4">
                  <span>Origin: {pet.origin}</span>
                  <span>Care: {pet.careLevel}</span>
                </div>

                <Button
                  onClick={() => onSelectPet(pet)}
                  className="w-full bg-gradient-to-r from-primary-dark to-primary text-white hover:from-primary hover:to-primary-light"
                  size="lg"
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedPets;