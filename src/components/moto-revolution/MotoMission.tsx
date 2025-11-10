
import { Check } from "lucide-react";

const missions = [
  "Support independent racers, workshops, tuners, and detailing artists",
  "Promote motorsport events, exhibitions, and car meets",
  "Unite car lovers across generations and genres",
  "Inspire the next generation to embrace racing, engineering, and speed"
];

const MotoMission = () => {
  return (
    <section className="py-8 px-4 md:px-8 bg-white">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Our Mission</h2>
        <div className="space-y-4">
          {missions.map((mission, index) => (
            <div 
              key={index}
              className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex-shrink-0">
                <Check className="h-6 w-6 text-sm-red" />
              </div>
              <p className="text-lg">{mission}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MotoMission;
