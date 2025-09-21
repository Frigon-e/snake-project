export interface Pet {
  id: string;
  name: string;
  species: string;
  scientificName: string;
  price: number;
  images: string[];
  origin: string;
  size: string;
  category: string;
  description: string;
  temperament: string;
  lifespan: string;
  diet: string;
  habitat: string;
  careLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  availability: 'Available' | 'Reserved' | 'Sold';
  featured: boolean;
}

export interface ContactForm {
  name: string;
  email: string;
  phone: string;
  petId: string;
  message: string;
}
