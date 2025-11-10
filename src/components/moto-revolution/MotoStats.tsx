
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const stats = [
  {
    icon: "🚗",
    label: "Instagram Followers",
    value: 5234
  },
  {
    icon: "🏁",
    label: "#MotoRevolution Posts",
    value: 1289
  },
  {
    icon: "🛠️",
    label: "Partnered Workshops",
    value: 45
  },
  {
    icon: "🎥",
    label: "Content Views",
    value: 982563
  },
  {
    icon: "🔥",
    label: "Top City",
    value: "Mumbai"
  },
  {
    icon: "👥",
    label: "New Members This Week",
    value: 234
  }
];

const MotoStats = () => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Simulate progress calculation
    const currentMembers = 5234;
    const targetMembers = 10000;
    const calculated = (currentMembers / targetMembers) * 100;
    setProgress(calculated);
  }, []);

  return (
    <section className="py-8 px-4 md:px-8 bg-gray-100">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
          Our Revolution in Numbers
        </h2>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <span className="text-4xl mb-4 block">{stat.icon}</span>
                  <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                  <p className="text-2xl font-bold">
                    {typeof stat.value === "number" 
                      ? stat.value.toLocaleString()
                      : stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">
            Next Target: 10,000 Revolutionaries
          </h3>
          <Progress value={progress} className="h-4 mb-2" />
          <p className="text-sm text-gray-600">
            Let's get there together! {Math.round(progress)}% Complete
          </p>
        </div>
      </div>
    </section>
  );
};

export default MotoStats;
