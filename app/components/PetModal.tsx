import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, MapPin, Ruler, Clock, Utensils, Home, Heart, Phone, Mail } from 'lucide-react';
import type { Pet, ContactForm } from '~/types/Pet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';

interface PetModalProps {
  pet: Pet | null;
  isOpen: boolean;
  onClose: () => void;
}

const PetModal: React.FC<PetModalProps> = ({ pet, isOpen, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    petId: '',
    message: ''
  });

  // Reset state when pet changes
  React.useEffect(() => {
    if (pet) {
      setCurrentImageIndex(0);
      setShowContactForm(false);
      setContactForm({
        name: '',
        email: '',
        phone: '',
        petId: pet.id,
        message: `I'm interested in ${pet.name} (${pet.species}). Please provide more information.`
      });
    }
  }, [pet]);

  if (!pet) return null;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % pet.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + pet.images.length) % pet.images.length);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for your inquiry! We will contact you soon.');
    setShowContactForm(false);
  };

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

  const getCareColors = (careLevel: string) => {
    switch (careLevel) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-orange-100 text-orange-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-60 w-full max-h-[90vh] overflow-y-auto p-0 bg-white">
          {/* Header */}
          <DialogHeader className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 z-10">
            <DialogTitle className="text-2xl font-bold text-neutral-800">{pet.name}</DialogTitle>
            <p className="text-neutral-500 italic">{pet.scientificName}</p>
          </DialogHeader>

          <div className="grid lg:grid-cols-2 gap-8 p-6">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={pet.images[currentImageIndex]}
                  alt={`${pet.name} - Image ${currentImageIndex + 1}`}
                  className="w-full h-96 object-cover rounded-xl"
                />
                {pet.images.length > 1 && (
                  <>
                    <Button
                      onClick={prevImage}
                      variant="secondary"
                      size="icon"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      onClick={nextImage}
                      variant="secondary"
                      size="icon"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </>
                )}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {pet.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Thumbnail strip */}
              {pet.images.length > 1 && (
                <div className="flex space-x-2">
                  {pet.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pet Details */}
            <div className="space-y-6">
              {/* Price and Availability */}
              <div className="flex justify-between items-center">
                <div className="text-3xl font-bold text-secondary">${pet.price}</div>
                <span className={`px-4 py-2 rounded-full font-semibold ${getAvailabilityColors(pet.availability)}`}>
                  {pet.availability}
                </span>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">Description</h3>
                <p className="text-neutral-600">{pet.description}</p>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="font-medium text-neutral-700">Origin</span>
                    </div>
                    <p className="text-neutral-600">{pet.origin}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Ruler className="w-4 h-4 text-primary" />
                      <span className="font-medium text-neutral-700">Size</span>
                    </div>
                    <p className="text-neutral-600">{pet.size}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Heart className="w-4 h-4 text-primary" />
                      <span className="font-medium text-neutral-700">Temperament</span>
                    </div>
                    <p className="text-neutral-600">{pet.temperament}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-medium text-neutral-700">Lifespan</span>
                    </div>
                    <p className="text-neutral-600">{pet.lifespan}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Care Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-2 flex items-center">
                    <Utensils className="w-5 h-5 text-primary mr-2" />
                    Diet
                  </h3>
                  <p className="text-neutral-600">{pet.diet}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-2 flex items-center">
                    <Home className="w-5 h-5 text-primary mr-2" />
                    Habitat Requirements
                  </h3>
                  <p className="text-neutral-600">{pet.habitat}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-neutral-800">Care Level</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCareColors(pet.careLevel)}`}>
                      {pet.careLevel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Actions */}
              <div className="space-y-3 pt-4 border-t border-neutral-200">
                <Button
                  onClick={() => setShowContactForm(true)}
                  disabled={pet.availability === 'Sold'}
                  className="w-full bg-gradient-to-r from-primary-dark to-primary text-white hover:from-primary hover:to-primary-light"
                  size="lg"
                >
                  {pet.availability === 'Sold' ? 'This Pet is Sold' : 'Inquire About This Pet'}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="flex items-center justify-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>Call Now</span>
                  </Button>
                  <Button variant="outline" className="flex items-center justify-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Email Us</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Form Modal */}
      <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
        <DialogContent className="max-w-md z-[60] bg-white">
          <DialogHeader>
            <DialogTitle>Contact About {pet.name}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                required
                value={contactForm.name}
                onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={contactForm.email}
                onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={contactForm.phone}
                onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                required
                rows={4}
                value={contactForm.message}
                onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-primary-dark to-primary hover:from-primary hover:to-primary-light">
              Send Inquiry
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PetModal;