
import { Card, CardContent } from "@/components/ui/card";

const futureEvents = [
  {
    icon: "🏁",
    title: "MotoRevolution Rallies & Events",
    description: "Experience the thrill of motorsports events across India"
  },
  {
    icon: "🧢",
    title: "Exclusive Merchandise",
    description: "Wear your passion with pride"
  },
  {
    icon: "🔧",
    title: "Partnered Garage & Workshop Network",
    description: "Connect with the best in the business"
  },
  {
    icon: "🎖️",
    title: "Premium Member Access & Rewards",
    description: "Exclusive benefits for dedicated supporters"
  }
];

const MotoTimeline = () => {
  return (
    <section className="py-8 px-4 md:px-8 bg-white">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Coming Soon</h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          {futureEvents.map((event, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <span className="text-4xl">{event.icon}</span>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                    <p className="text-gray-600">{event.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MotoTimeline;
