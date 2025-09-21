import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import type { Pet } from '~/types/Pet';
import { Eye, MapPin, Ruler } from 'lucide-react';

interface PetCardProps {
  pet: Pet;
  onSelect: (pet: Pet) => void;
  animationDelay?: number;
}

const PetCard: React.FC<PetCardProps> = ({ pet, onSelect, animationDelay = 0 }) => {
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
    <Card
      className="group overflow-hidden transform hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={() => onSelect(pet)}
    >
      <CardHeader className="p-0">
        <div className="relative">
          <img
            src={pet.images[0]}
            alt={pet.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColors(pet.availability)}`}>
              {pet.availability}
            </span>
          </div>
          {pet.featured && (
            <div className="absolute top-2 left-2">
              <span className="bg-gradient-to-r from-primary to-primary-dark text-white px-2 py-1 rounded-full text-xs font-semibold">
                Featured
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-lg group-hover:text-primary transition-colors">{pet.name}</CardTitle>
          <span className="text-xl font-bold text-secondary">${pet.price}</span>
        </div>
        <p className="text-neutral-500 italic text-sm mb-2">{pet.scientificName}</p>
        <p className="text-neutral-600 text-sm mb-3 line-clamp-2">{pet.description}</p>
        <div className="space-y-1 text-xs text-neutral-500">
          <div className="flex items-center space-x-1">
            <MapPin className="w-3 h-3" />
            <span>Origin: {pet.origin}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Ruler className="w-3 h-3" />
            <span>Size: {pet.size}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4">
        <Button
          className="w-full bg-gradient-to-r from-primary-dark to-primary hover:from-primary hover:to-primary-light"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(pet);
          }}
        >
          <Eye className="mr-2 h-4 w-4" /> View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PetCard;
