
import { Button } from "@/components/ui/button";

const MotoClosing = () => {
  return (
    <section className="py-16 px-4 md:px-8 bg-black text-white">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">
          This is just the beginning. The road ahead is ours to build.
        </h2>
        <Button
          size="lg"
          className="bg-sm-red hover:bg-sm-red-light text-white text-lg"
          onClick={() => {
            const joinSection = document.getElementById('join-section');
            joinSection?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Support the Movement
        </Button>
      </div>
    </section>
  );
};

export default MotoClosing;
