
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useRef } from "react";

interface Media {
  type: "image" | "video";
  url: string;
}

const MediaSlider = ({ media }: { media: Media[] }) => {
  const swiperRef = useRef<SwiperType | null>(null);

  return (
    <div className="relative bg-black overflow-hidden w-full max-h-[500px]">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        loop
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        className="w-full h-full"
        onSwiper={(swiper) => (swiperRef.current = swiper)}
      >
        {media.map((item, index) => (
          <SwiperSlide
            key={index}
            className="flex justify-center items-center bg-black"
          >
            {item.type === "image" ? (
              <img
                src={item.url}
                alt={`media-${index}`}
                className="max-h-[500px] w-auto h-auto object-contain"
                loading="lazy"
              />
            ) : (
              <video
                src={item.url}
                className="max-h-[500px] w-auto h-auto object-contain"
                autoPlay
                muted
                loop
                playsInline
                controls
                onMouseEnter={(e) => {
                  e.currentTarget.pause();
                  // Optionally disable swipe:
                  // swiperRef.current?.allowTouchMove = false;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.play();
                  // swiperRef.current?.allowTouchMove = true;
                }}
              />
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default MediaSlider;
