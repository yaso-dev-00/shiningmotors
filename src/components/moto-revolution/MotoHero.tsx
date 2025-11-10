
import { Button } from "@/components/ui/button";

const MotoHero = () => {
  const scrollToJoin = () => {
    const joinSection = document.getElementById('join-section');
    joinSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/assets/racing-hero.jpg")',
          filter: 'brightness(0.6)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30" />
      
      <div className="relative h-full flex flex-col items-center justify-center text-center text-white px-4">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
          Join the MotoRevolution
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl animate-fade-in delay-100">
          We Support Motorsports. We Drive Passion Forward.
        </p>
        <Button
          onClick={scrollToJoin}
          size="lg"
          className="bg-sm-red hover:bg-sm-red-light text-white text-lg animate-fade-in delay-200"
        >
          Join the Revolution
        </Button>
      </div>
    </div>
  );
};

export default MotoHero;
