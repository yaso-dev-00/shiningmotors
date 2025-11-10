
// Link not used here anymore
import { Badge } from "@/components/ui/badge";

interface CategoryProps {
  id: string;
  name: string;
  image: string;
  count: number;
  description: string;
  onClick?: (category: string) => void;
}

const CategoryCard = ({ id, name, image, count, description, onClick }: CategoryProps) => {
  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md transition-all duration-300 hover:shadow-xl"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <Badge className="absolute bottom-3 right-3 bg-sm-black/80 text-white">
          {count} Vehicles
        </Badge>
      </div>
      <div className="p-4">
        <h3 className="mb-2 text-xl font-bold group-hover:text-sm-red">{name}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
};

interface VehicleCategoriesProps {
  onCategorySelect?: (category: string) => void;
}

const VehicleCategories = ({ onCategorySelect }: VehicleCategoriesProps) => {
  const categories = [
    {
      id: "new-luxury-supercars",
      name: "New Luxury and Supercars",
      image: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a",
      count: 85,
      description: "Exclusive high-end vehicles with premium comfort and advanced technology."
    },
    {
      id: "used-luxury-cars",
      name: "Used Luxury Cars",
      image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b",
      count: 47,
      description: "High-performance sports cars and track-ready racing machines."
    },
    {
      id: "performance-racing",
      name: "Performance & racing",
      image: "https://images.pexels.com/photos/210143/pexels-photo-210143.jpeg?auto=compress&cs=tinysrgb&w=600",
      count: 32,
      description: "Rare and collectible classics from the golden eras of automotive history."
    },
    {
      id: "exotic-supercars",
      name: "Exotic & Supercars",
      image: "https://images.pexels.com/photos/8911015/pexels-photo-8911015.jpeg?auto=compress&cs=tinysrgb&w=600",
      count: 24,
      description: "Ultra-rare and exclusive supercars and hypercars from elite manufacturers."
    }
    ,{
      id: "superbikes",
      name: "Superbikes",
      image: "https://images.pexels.com/photos/163210/motorcycles-race-helmets-pilots-163210.jpeg?auto=compress&cs=tinysrgb&w=600",
      count: 32,
      description: "Rare and collectible classics from the golden eras of automotive history."
    },
    {
      id: "vintage-classic",
      name: "Vintage & Classic",
      image: "https://images.pexels.com/photos/315952/pexels-photo-315952.jpeg?auto=compress&cs=tinysrgb&w=600",
      count: 32,
      description: "Rare and collectible classics from the golden eras of automotive history."
    },
    {
      id: "rare-collectible",
      name: "Rare & Collectible",
      image: "https://images.pexels.com/photos/16524381/pexels-photo-16524381/free-photo-of-red-classic-car.jpeg?auto=compress&cs=tinysrgb&w=600",
      count: 32,
      description: "Rare and collectible classics from the golden eras of automotive history."
    },
    {
      id: "campervans-rvs",
      name: "Campervans & RVs",
      image: "https://images.pexels.com/photos/19475233/pexels-photo-19475233/free-photo-of-a-child-running-on-the-beach-in-front-of-a-parked-camper-van.jpeg?auto=compress&cs=tinysrgb&w=600",
      count: 32,
      description: "Rare and collectible classics from the golden eras of automotive history."
    },
    
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          id={category.id}
          name={category.name}
          image={category.image}
          count={category.count}
          description={category.description}
          onClick={onCategorySelect}
        />
      ))}
    </div>
  );
};

export default VehicleCategories;
