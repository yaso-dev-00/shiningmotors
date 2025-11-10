
import React, { useState, useRef, useEffect } from "react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import type { CarouselApi } from "@/components/ui/carousel";

interface HeroSlide {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  actionText?: string;
  actionLink?: string;
}

const heroSlides: HeroSlide[] = [
  {
    id: "1",
    title: "Premium Automotive Services",
    description: "Expert maintenance, customization, and repair services for all vehicle types",
    imageUrl: "https://images.unsplash.com/photo-1562141960-c9a7f5c0c660?q=80&w=1920&auto=format&fit=crop",
    actionText: "Book Service",
    actionLink: "/services/book"
  },
  {
    id: "2",
    title: "Performance Upgrades",
    description: "Transform your vehicle with professional tuning and performance enhancements",
    imageUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1920&auto=format&fit=crop",
    actionText: "Explore Options",
    actionLink: "/services/customization"
  },
  {
    id: "3",
    title: "Luxury Detailing",
    description: "Premium cleaning and restoration services to keep your vehicle looking its best",
    imageUrl: "https://images.unsplash.com/photo-1600045125493-f01d1f5a4a0a?q=80&w=1920&auto=format&fit=crop",
    actionText: "Schedule Now",
    actionLink: "/services/detailing"
  }
];

const ServiceHeroCarousel = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [emblaRef, setEmblaRef] = useState<CarouselApi | null>(null);

  const handleSelectSlide = (index: number) => {
    setActiveSlide(index);
    emblaRef?.scrollTo(index);
  };

  // Update active slide when carousel API changes
  useEffect(() => {
    if (!emblaRef) return;

    const updateSlide = () => {
      setActiveSlide(emblaRef.selectedScrollSnap());
    };

    emblaRef.on("select", updateSlide);
    updateSlide(); // Initial update

    return () => {
      emblaRef.off("select", updateSlide);
    };
  }, [emblaRef]);

  return (
    <div className="relative w-full overflow-hidden bg-black">
      <Carousel
        opts={{
          loop: true,
          align: "center",
        }}
        className="w-full"
        setApi={setEmblaRef}
      >
        <CarouselContent>
          {heroSlides.map((slide, index) => (
            <CarouselItem key={slide.id}>
              <div className="relative w-full h-[65vh] md:h-[75vh]">
                <motion.div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{ 
                    backgroundImage: `url(${slide.imageUrl})`,
                  }}
                  initial={{ filter: "brightness(0.5) blur(8px)", scale: 1.1 }}
                  animate={{ 
                    filter: index === activeSlide ? "brightness(0.5) blur(0px)" : "brightness(0.5) blur(8px)",
                    scale: index === activeSlide ? 1 : 1.1
                  }}
                  transition={{ duration: 1.2 }}
                />
                
                {/* 3D Floating Elements - Decorative Shapes */}
                {index === activeSlide && (
                  <>
                    <motion.div
                      className="absolute top-[20%] left-[10%] w-20 h-20 rounded-full bg-sm-red opacity-20 hidden md:block"
                      initial={{ x: -100, opacity: 0 }}
                      animate={{ x: 0, opacity: 0.2 }}
                      transition={{ duration: 1.5, delay: 0.2 }}
                      style={{ filter: "blur(40px)" }}
                    />
                    <motion.div
                      className="absolute bottom-[30%] right-[15%] w-32 h-32 rounded-full bg-sm-red opacity-10 hidden md:block"
                      initial={{ x: 100, opacity: 0 }}
                      animate={{ x: 0, opacity: 0.1 }}
                      transition={{ duration: 1.5, delay: 0.4 }}
                      style={{ filter: "blur(60px)" }}
                    />
                  </>
                )}
                
                <motion.div
                  className="relative z-10 flex flex-col justify-center items-start h-full max-w-4xl mx-auto px-6 md:px-10"
                  key={`content-${index}-${activeSlide}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ 
                    opacity: index === activeSlide ? 1 : 0,
                    y: index === activeSlide ? 0 : 30
                  }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                >
                  <motion.h1 
                    className="text-3xl md:text-5xl font-bold text-white mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                  >
                    {slide.title}
                  </motion.h1>
                  
                  <motion.p 
                    className="text-lg md:text-xl text-gray-200 mb-8 max-w-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.6 }}
                  >
                    {slide.description}
                  </motion.p>
                  
                  {slide.actionText && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.8 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        className="bg-sm-red hover:bg-sm-red-light text-white px-8 py-6 text-lg relative overflow-hidden group"
                      >
                        <span className="relative z-10">{slide.actionText}</span>
                        <span className="absolute inset-0 w-0 bg-white bg-opacity-20 transition-all duration-300 group-hover:w-full"></span>
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {heroSlides.map((_, index) => (
          <motion.button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-500 ${
              index === activeSlide ? "bg-sm-red w-8" : "bg-white/50"
            }`}
            onClick={() => handleSelectSlide(index)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            animate={{ 
              width: index === activeSlide ? 32 : 12,
              opacity: index === activeSlide ? 1 : 0.5
            }}
            transition={{ duration: 0.4 }}
          />
        ))}
      </div>
    </div>
  );
};

export default ServiceHeroCarousel;
