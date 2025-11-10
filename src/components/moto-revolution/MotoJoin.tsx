
import { Button } from "@/components/ui/button";
import { Instagram } from "lucide-react";

const steps = [
  {
    text: "Follow @shiningmotors on Instagram",
    action: () => window.open("https://instagram.com/shiningmotors", "_blank")
  },
  {
    text: "Tag #MotoRevolution in your posts",
    action: null
  },
  {
    text: "Support and visit local races/workshops",
    action: null
  },
  {
    text: "Share the story and invite others to join",
    action: null
  }
];

const MotoJoin = () => {
  return (
    <section id="join-section" className="py-8 px-4 md:px-8 bg-gray-100">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">How to Join the Revolution</h2>
        
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={step.action ? () => step.action?.() : undefined}
            >
              <p className="text-lg">{step.text}</p>
            </div>
          ))}
        </div>
        
        <Button
          size="lg"
          className="bg-sm-red hover:bg-sm-red-light text-white text-wrap w-fit "
          onClick={() => window.open("https://instagram.com/shiningmotors", "_blank")}
        >
          <Instagram className="w-5 h-5 mr-2" />
          I'm In – Join the Revolution
        </Button>
      </div>
    </section>
  );
};

export default MotoJoin;
