
import { ServiceCategory } from "@/components/services/ServiceCategories";

export const serviceCategories: ServiceCategory[] = [
  {
    id: "general-maintenance",
    name: "General Maintenance",
    description: "Your one-stop destination for reliable car servicing, oil changes, filter replacements, and periodic health checks — done professionally."
  },
  {
    id: "mechanical-electrical",
    name: "Mechanical & Electrical",
    description: "Fix engine, gearbox, wiring, battery, sensors, or any mechanical/electrical issue with expert attention and modern tools."
  },
  {
    id: "ac-cooling",
    name: "AC & Cooling Systems",
    description: "Stay cool year-round with advanced AC service, compressor repair, coolant top-ups, and HVAC diagnostics for all vehicles."
  },
  {
    id: "tyres-alignment",
    name: "Tyres & Alignment",
    description: "From wheel alignment to drift tyres and racing slicks, get premium support for tyre changes, balancing, and handling upgrades."
  },
  {
    id: "customization",
    name: "Customization & Performance",
    description: "Build your dream machine — rally car, supercar, or showstopper — with top tuners and performance upgrade specialists."
  },
  {
    id: "diagnostics",
    name: "Advanced Diagnostics",
    description: "When no one else can figure it out, we can. High-tech diagnostic scans and problem-solving for complex or modified vehicles."
  },
  {
    id: "detailing",
    name: "Detailing & Painting",
    description: "Experience premium finishes, ceramic coating, dry ice cleaning, and detailing that makes your car look and feel brand new."
  },
  {
    id: "vintage-restoration",
    name: "Vintage & Classic Car Restoration",
    description: "Restore muscle cars, old icons, and historic vehicles with authentic detailing, legacy parts, and true craftsmanship."
  },
  {
    id: "legal-services",
    name: "Legal & Government Services",
    description: "Renew insurance, RC cards, FC certificates, apply for licenses — we take care of the paperwork, so you can focus on the drive."
  },
  {
    id: "security",
    name: "Vehicle Security",
    description: "Secure your ride with GPS, auto shut-off, onboard Wi-Fi, and custom solutions for high-risk, luxury, and VIP vehicles."
  },
  {
    id: "fleet-maintenance",
    name: "Fleet Maintenance",
    description: "For owners of multiple vehicles or collectors — we offer annual and scheduled maintenance contracts for complete peace of mind."
  },
  {
    id: "electronics",
    name: "In-Car Electronics",
    description: "Install music systems, reverse cams, dash cams, mood lighting, sensors, and more — customized to your lifestyle."
  },
  {
    id: "transport",
    name: "Vehicle Transport",
    description: "Flatbed, enclosed, or air cargo — we ship rare, race, and rally cars across India and globally with full protection."
  },
  {
    id: "inspection",
    name: "Inspection & Certification",
    description: "Buying or selling a car? Let us inspect, certify, and guide you with full transparency and expert validation."
  },
  {
    id: "emergency",
    name: "Emergency SOS",
    description: "Tap the SOS button for immediate help during breakdowns, emergencies, or road mishaps — with live response and local aid."
  },
  {
    id: "kids-services",
    name: "Young Drivers & Kids",
    description: "Electric ride-ons, go-karts, track events, and workshops to get children and young enthusiasts into car culture safely."
  },
  {
    id: "driving-schools",
    name: "Driving Schools",
    description: "Learn to drive or race — from basic licenses to rally or circuit training, everything is accessible directly via the app."
  },
  {
    id: "academy",
    name: "Shining Motors Academy",
    description: "A complete learning hub for mechanics, tuners, dealers, and enthusiasts — including global course recommendations."
  },
  {
    id: "rentals",
    name: "Rentals",
    description: "Rent daily or exotic cars with or without drivers — including expert chauffeurs, rally pros, or self-drive packages."
  },
  {
    id: "creator-access",
    name: "Creator Access",
    description: "Media professionals, YouTubers, influencers, magazines, and photographers can offer services and sell content directly on the app."
  }
];

// Get category by ID
export const getCategoryById = (id: string): ServiceCategory | undefined => {
  return serviceCategories.find(category => category.id === id);
};
