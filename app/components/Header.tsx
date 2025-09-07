import { Link } from "react-router";

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

export default function Header({ searchTerm, setSearchTerm, selectedCategory, setSelectedCategory }: HeaderProps) {
  return (
    <header className="bg-gray-800 text-white p-4">
      <nav className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Exotic Pets</Link>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search pets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2 py-1 rounded text-black"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2 py-1 rounded text-black"
          >
            <option value="all">All Categories</option>
            {/* Add more categories later */}
          </select>
        </div>
        <div>
          <Link to="/" className="p-2">Home</Link>
          <Link to="/pets" className="p-2">Pets</Link>
          <Link to="/contact" className="p-2">Contact</Link>
        </div>
      </nav>
    </header>
  );
}
