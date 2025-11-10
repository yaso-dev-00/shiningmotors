
import { motion } from "framer-motion";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

// Function to get random image
const getRandomImage = (randomImages: string[]) =>
  randomImages[Math.floor(Math.random() * randomImages.length)];

export default function CategoryScroller({categories,randomImages,route}:{categories:{value:string,label:string}[],randomImages:string[],route:string}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
   const categoriesWithImage=categories.map((category) => ({
    ...category,
    image: getRandomImage(randomImages),
  }));
  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: dir === "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative w-full">
      {/* <button
        onClick={() => scroll("left")}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white p-1 rounded-full shadow md:hidden"
      >
        <ChevronLeft size={24} />
      </button> */}

      <motion.div
        ref={scrollRef}
        className="flex gap-2 md:gap-4  py-2 overflow-x-auto scrollbar-hide"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 50 }}
      >
        {categoriesWithImage.map((cat) => (
          <motion.div
            key={cat.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push((`/${route}/category/${cat.value}`) as any)}
            className="min-w-[130px] md:min-w-[160px] w-[120px] md:w-[160px] bg-white shadow-md rounded-xl cursor-pointer overflow-hidden flex-shrink-0"
          >
          <img
  src={cat.image}
  alt={cat.label}
  className="w-full h-[70px] md:h-32 object-cover"
/>
            <div className="box-border p-1 md:p-2 flex text-center items-center justify-center">
              <div className="text-sm font-medium text-ellipsis line-clamp-2 ">{cat.label}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* <button
        onClick={() => scroll("right")}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white p-1 rounded-full shadow md:hidden"
      >
        <ChevronRight size={24} />
      </button> */}
    </div>
  );
}
