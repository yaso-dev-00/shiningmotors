 

interface CategoryProps {
  id: string;
  name: string;
  image: string;
  count: number;
  onSelect?: (id: string) => void;
}

const CategoryItem = ({ id, name, image, count, onSelect }: CategoryProps) => {
  return (
    <div
      onClick={() => onSelect?.(id)}
      className="group relative flex h-48 cursor-pointer overflow-hidden rounded-lg bg-gray-200 shadow-md transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <img
        src={image}
        alt={name}
        className="absolute h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
      <div className="absolute bottom-0 w-full p-4 text-white">
        <h3 className="mb-1 text-lg font-bold">{name}</h3>
        <p className="text-sm text-gray-200">{count} Products</p>
      </div>
    </div>
  );
};

interface CategoryListProps {
  onCategorySelect?: (category: string) => void;
}

const CategoryList = ({ onCategorySelect }: CategoryListProps) => {
  const categories = [
    {
      id: "oem-parts",
      name: "OEM Parts",
      image: "https://www.garimaglobal.com/blogs/wp-content/uploads/2024/08/Used-Auto-Parts.webp",
      count: 458
    },
    {
      id: "performance-racing-parts",
      name: "Performance and Racing Parts",
      image: "https://images.unsplash.com/photo-1619468129361-605ebea04b44",
      count: 326
    },
    {
      id: "racing-parts",
      name: "Racing Parts",
      image: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5",
      count: 189
    },
    {
      id: "interior",
      name: "Interior",
      image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888",
      count: 217
    },
    {
      id: "exterior",
      name: "Exterior",
      image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d",
      count: 195
    },
    {
      id: "motorcycle",
      name: "Motor Cycle",
      image: "https://images.unsplash.com/photo-1542640244-7e672d6cef4e",
      count: 312
    },
     {
      id: "clearance",
      name: "Clearance",
      image: "https://images.unsplash.com/photo-1542640244-7e672d6cef4e",
      count: 312
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <CategoryItem
          key={category.id}
          {...category}
          onSelect={() => onCategorySelect?.(category.id)}
        />
      ))}
    </div>
  );
};

export default CategoryList;
