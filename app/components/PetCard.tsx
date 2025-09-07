import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Pet } from '../types/Pet';
import { Eye, MapPin, Ruler } from 'lucide-react';
import { Link } from 'react-router';

interface PetCardProps {
  pet: Pet;
}

const PetCard: React.FC<PetCardProps> = ({ pet }) => {
  return (
    <Card className="group overflow-hidden transform hover:-translate-y-1 transition-all duration-300">
      <CardHeader className="p-0">
        <div className="relative">
          <img
            src={pet.images[0]}
            alt={pet.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-lg">{pet.name}</CardTitle>
          <span className="text-xl font-bold text-secondary-dark">${pet.price}</span>
        </div>
        <p className="text-neutral-500 italic text-sm mb-3">{pet.scientificName}</p>
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
        <Button asChild className="w-full">
          <Link to={`/pets/${pet.id}`}>
            <Eye className="mr-2 h-4 w-4" /> View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PetCard;
