
// Sample data for shop products

export const categoryData = {
  "oem-parts": {
    label: "OEM Parts",
    subCategories: {
      "Engine Components": ["Cylinder Heads", "Pistons", "Gaskets", "Oil Pumps", "Timing Kits", "Engine Mounts", "Oil Pans", "Crankshafts", "Camshafts", "Oil Filters", "Diesel Filters", "Air Filters", "Carbon Cabin Filters"],
      "Transmission & Gearbox": ["Manual & Automatic Gearboxes", "Clutch Kits", "Torque Converters", "Synchros", "Flywheels", "Gear Oils", "Selectors"],
      "Cooling System": ["Radiators", "Fans", "Hoses", "Water Pumps", "Coolant Reservoirs", "Thermostats"],
      "Fuel System": ["Fuel Injectors", "Fuel Pumps", "Fuel Tanks", "Carburetors", "Fuel Pressure Regulators", "Fuel Rails"],
      "Exhaust & Emissions": ["Exhaust Manifolds", "Catalytic Converters", "Silencers", "Mufflers", "O2 Sensors", "Resonators"],
      "Braking System (OEM)": ["Brake Pads", "Brake Discs", "Brake Calipers", "Master Cylinders", "ABS Units", "Brake Lines", "Brake Boosters"],
      "Suspension & Steering": ["Control Arms", "Bush Kits", "Ball Joints", "Tie Rod Ends", "Steering Racks", "Columns", "Power Steering Pumps", "Mounts & Stabilizers"],
      "Electricals & Sensors": ["Alternators", "Starters", "Batteries", "ECUs", "Relays", "Fuses", "Switches", "Horns", "ABS/O2/Knock/Crank/Temperature Sensors"],
      "Lights (OEM Style)": ["Headlamps", "Tail Lamps", "Turn Indicators", "Fog Lights", "Parking Lights", "Number Plate Lights", "Bulbs", "Sockets", "Reflectors"],
      "Body Panels, Wipers & Mirrors": ["Fenders", "Bumpers", "Grilles", "Bonnet", "Doors", "Windshield Wipers", "Wiper Arms", "Wiper Motors", "Side Mirrors", "Mirror Covers", "Glass Sets"],
      "HVAC (Air Conditioning & Heating)": ["AC Compressors", "Condensers", "Blowers", "Heater Cores", "Cabin Filters", "AC Vents"],
      "Interior OEM Parts": ["Dashboard Panels", "Switches", "Instrument Clusters", "Seat Frames", "Seat Belts", "Gear Shifters", "Handbrakes"],
      "Drive System": ["Driveshafts", "Axles", "CV Joints", "U-Joints", "Bearings", "Wheel Hubs", "Differentials"],
      "Rubber & Mounting": ["Engine Mounts", "Gearbox Mounts", "Door Beading", "Grommets", "Firewall Seals"]
    },
    filters: [
      { "name": "Vehicle Brand & Model", "options": [] },
      { "name": "Fuel Type", "options": ["Petrol", "Diesel", "Electric", "Hybrid"] },
      { "name": "Year of Manufacture", "options": [] },
      { "name": "Transmission Type", "options": [] },
      { "name": "Part Type", "options": ["Mechanical", "Electrical", "Body"] },
      { "name": "Condition", "options": ["New", "Refurbished", "Certified Used"] },
      { "name": "Seller Type", "options": [] },
      { "name": "Price Range", "options": [] },
      { "name": "Fast-Moving Tags", "options": ["Essentials", "Top Seller", "Frequently Bought"] },
      { "name": "Availability", "options": [] },
      { "name": "Warranty Duration", "options": [] }
    ]
  },
  "performance-racing-parts": {
    label: "Performance & Racing Parts",
    subCategories: {
      "Engine Internals": ["Pistons", "Cranks", "Rods", "Bearings", "Camshafts"],
      "Forced Induction": ["Turbochargers", "Superchargers", "Intercoolers", "Wastegates", "BOVs"],
      "ECU & Electronics": ["Standalone ECUs", "Flash Tuners", "MAP Sensors", "Wiring Harnesses"],
      "Intake & Fuel": ["Throttle Bodies", "Injectors", "Performance Air Filters", "Fuel Rails"],
      "Exhaust Systems": ["Headers", "Downpipes", "High-Flow Cats", "Midpipes"],
      "Gearbox & Drivetrain": ["Short Shifters", "Racing Clutches", "Flywheels", "LSDs"],
      "Suspension Mods": ["Track Coilovers", "Camber Kits", "Spherical Bushings"],
      "Cooling": ["Aluminum Radiators", "Oil Coolers", "Racing Fans"],
      "AWD Mods": ["Transfer Cases", "Propshafts", "Custom AWD Conversions"]
    },
    filters: [
      { "name": "Engine Type / Tuning Stage", "options": [] },
      { "name": "HP Gain Range", "options": [] },
      { "name": "Vehicle Compatibility", "options": [] },
      { "name": "Racing Class", "options": [] },
      { "name": "Installation Difficulty", "options": [] },
      { "name": "Material", "options": [] },
      { "name": "Brand / Warranty", "options": [] }
    ]
    
    
  },
  "motorsports-competition": {
    label: "Motorsports & Competition Hardware",
    subCategories: {
      "Safety & Equipment": ["Roll Cages (Bolt-in / Weld-in)", "Racing Seats (FIA-Approved)", "Seat Mounts & Harnesses", "Helmets (FIA Spec, Rally, Track)", "Racing Suits (Fireproof, Lightweight)", "Gloves", "Shoes", "Balaclavas", "HANS Devices & Neck Supports", "Fire Extinguishers / Cutoff Switches", "Fuel Cells", "Quick Fills", "Dry Breaks", "Rally Trip Computers", "Pit Stop Equipment & Organizers", "Performance Steering Wheels"]
    },
    filters:[
      { "name": "FIA Approved", "options": ["Yes", "No"] },
      { "name": "Sport Type", "options": ["Rally", "Circuit", "Drift", "Drag"] },
      { "name": "Size", "options": [] },
      { "name": "Weight", "options": [] },
      { "name": "Material", "options": [] },
      { "name": "Color / Ventilation", "options": [] },
      { "name": "Vendor / Race Garage", "options": [] },
      { "name": "Warranty / Compliance", "options": [] }
    ]
  },
  "brakes-suspension": {
    label: "Brakes & Suspension",
    subCategories: {
      "Braking Components": ["Brake Pads", "Rotors", "Calipers", "Brake Lines", "Fluids", "Boosters", "Master Cylinders", "ABS Kits"],
      "Suspension Components": ["Suspension Arms", "Ball Joints", "Bush Kits", "Coilovers", "Shock Absorbers", "Lift Kits", "Lowering Springs", "Tie Rods", "Sway Bars", "End Links", "Adjustable Dampers", "Camber Kits"]
    },
    filters: [
      { "name": "Vehicle Type", "options": [] },
      { "name": "Brake Type", "options": ["Disc", "Drum", "ABS", "Non-ABS"] },
      { "name": "Suspension Style", "options": ["Air", "Hydraulic", "Coilover", "OEM"] },
      { "name": "Intended Use", "options": ["Street", "Track", "Off-road"] },
      { "name": "Brand / Material", "options": [] },
      { "name": "Installation Type", "options": [] },
      { "name": "Price / Warranty", "options": [] }
    ]
    
  },
  "tyres-wheels": {
    label: "Tyres & Wheels",
    subCategories: {
      "Street Tyres": ["All-season", "Performance", "Touring", "Run-flat"],
      "Off-Road Tyres": ["Mud Terrain (MT)", "All Terrain (AT)", "Sand", "Rock", "Snow"],
      "Racing Tyres": ["Slicks", "Semi-slicks", "Rain Tyres", "Drift Tyres", "Rally Tyres", "Gravel Tyres"],
      "Superbike & Scooter Tyres": ["Tubeless", "Radials", "Sport Touring"],
      "Alloy Wheels": ["Forged", "Flow Formed", "Cast", "OEM Spec"],
      "Steel & Off-Road Rims": ["Beadlock", "Reinforced"],
      "Accessories": ["Valve Caps", "Wheel Spacers", "Lug Nuts", "TPMS"]
    },
    filters: [
      { "name": "Tyre Type", "options": ["Street", "Off-road", "Racing", "Bike"] },
      { "name": "Rim Diameter", "options": [] },
      { "name": "Width", "options": [] },
      { "name": "PCD", "options": [] },
      { "name": "Load Index / Speed Rating", "options": [] },
      { "name": "Terrain Type", "options": [] },
      { "name": "Brand", "options": [] },
      { "name": "Vehicle Fitment", "options": [] },
      { "name": "Tread Pattern", "options": [] },
      { "name": "Tube / Tubeless", "options": [] },
      { "name": "Availability & Warranty", "options": [] }
    ]
  },

  "lighting-vision": {
    label: "Lighting & Vision",
    subCategories: {
      "Headlights": ["OEM Style", "LED", "HID", "Halogen"],
      "Fog Lights / DRLs": ["Bumper Mount", "Integrated Units"],
      "Off-Road & Rally Lights": ["Light Bars", "Spotlights", "Roof Mounts"],
      "Indicators, Brake & Tail Lights": ["LED Units", "Sequential Modules"],
      "Interior & Accent Lighting": ["Ambient Light Strips", "Dome Lights", "Footwell LEDs"],
      "Mounts & Wiring": ["Switch Panels", "Harness Kits", "Connectors"]
    },
    filters:[
      { "name": "Light Type", "options": ["Halogen", "LED", "HID"] },
      { "name": "Mounting", "options": ["OEM", "Custom", "Universal"] },
      { "name": "Brightness", "options": [] },
      { "name": "Color Temp", "options": [] },
      { "name": "Power Rating", "options": [] },
      { "name": "Brand / Compatibility", "options": [] },
      { "name": "Waterproofing & Housing", "options": [] }
    ]
    
  },

  "audio-electronics-tech": {
    label: "Audio, Electronics & Tech",
    subCategories: {
      "Head Units": ["Touchscreen", "Android Auto", "Apple CarPlay", "GPS"],
      "Speakers & Subwoofers": ["Coaxial", "Component", "Powered Subs"],
      "Amplifiers & DSPs": ["2/4/6 Channel Amps", "Equalizers"],
      "Reverse Cams & Parking Sensors": ["Rear Assist Kits", "Dash Cams", "360 Cameras"],
      "Security & Smart Tech": ["GPS Trackers", "Central Locking", "Remote Start", "Immobilizers"],
      "Wiring & Installation Kits": ["ISO Harnesses", "Power Cables", "Noise Filters"]
    },
    filters:[
      { "name": "Output Power", "options": [] },
      { "name": "Screen Size / Resolution", "options": [] },
      { "name": "Input Type", "options": ["USB", "AUX", "Bluetooth"] },
      { "name": "CarPlay / Android Auto Compatibility", "options": [] },
      { "name": "Vehicle Fitment", "options": [] },
      { "name": "Installation Type", "options": ["DIN", "Custom"] },
      { "name": "Brand / Warranty", "options": [] }
    ]
  },

  "interior-styling": {
    label: "Interior Styling & Utility",
    subCategories: {
      "Steering Wheels": ["OEM", "Racing", "Quick Release", "Flat-bottom"],
      "Seats & Seat Covers": ["Leather", "Fabric", "Sporty", "Custom-fit"],
      "Gear Knobs, Pedals, Handbrakes": ["Weighted", "Engraved", "Performance"],
      "Mats & Carpets": ["3D", "Rubber", "Laminated"],
      "Storage Accessories": ["Seat Organizers", "Cup Holders", "Underseat Trays"],
      "Interior Lighting": ["RGB Footwell Kits", "Star Roof Headliners"]
    },
    filters:[
      { "name": "Material", "options": ["Leather", "PU", "Metal"] },
      { "name": "Color / Design", "options": [] },
      { "name": "Brand", "options": [] },
      { "name": "Fitment Type", "options": [] },
      { "name": "Custom / Universal", "options": [] }
    ]
    
  },

  "exterior-styling": {
    label: "Exterior Styling & Kits",
    subCategories: {
      "Body Kits": ["Spoilers", "Bumpers", "Skirts", "Canards"],
      "Bonnet / Roof Mods": ["Scoops", "Vents", "Wraps"],
      "Roof Racks & Carriers": ["Luggage Racks", "Bike Racks", "Jerrican Holders"],
      "Tow Hooks / Diffusers / Splitters": ["Functional or Show-use"],
      "Bike Fairings & Mods": ["Windshields", "Frame Sliders", "Handle Guards"]
    },
    filters:[
      { "name": "Part Type", "options": [] },
      { "name": "Mount Style", "options": [] },
      { "name": "Compatibility", "options": [] },
      { "name": "Color & Finish", "options": [] },
      { "name": "Aerodynamic Rating", "options": [] }
    ]
  },

  "car-care-detailing": {
    label: "Car Care & Detailing",
    subCategories: {
      "Washes & Cleaners": ["Car Shampoo", "Foam", "Degreasers", "Waterless Wash"],
      "Polish & Paint Care": ["Waxes", "Ceramic Coating", "Glazes", "Compounds"],
      "Interior Care": ["Leather Cleaners", "Dashboard Sprays", "Odor Eliminators"],
      "Dry Ice / Nitrogen Deep Cleaning": ["Advanced professional cleaning kits"],
      "Tools": ["Pressure Washers", "Polish Machines", "Brushes"],
      "Accessories": ["Microfiber Cloths", "Buffing Pads", "Sprayers"]
    },
    filters:[
      { "name": "Use Type", "options": ["Interior", "Exterior", "Engine Bay"] },
      { "name": "Finish Type", "options": ["Gloss", "Matte", "Ceramic"] },
      { "name": "Cleaning Method", "options": ["Manual", "Machine", "Dry Ice"] },
      { "name": "Brand", "options": [] },
      { "name": "Fragrance", "options": [] }
    ]
    
  },

  "garage-tools": {
    label: "Tools, Garage & Service Equipment",
    subCategories: {
      "Diagnostic Tools": ["OBD Scanners", "ECU Readers", "Code Erasers"],
      "Mechanical Tools": ["Torque Wrenches", "Spanners", "Screwdrivers", "Jacks"],
      "Electrical Tools": ["Multimeters", "Crimpers", "Wire Strippers"],
      "Workshop Setup": ["Trolleys", "Cabinets", "Lights", "Flooring"],
      "Off-Road & Rally Tents": ["Paddock Tents", "Inflatable Bays", "Pit Lane Structures"]
    },
    filters:[
      { "name": "Tool Type", "options": [] },
      { "name": "Usage", "options": ["Electrical", "Mechanical", "Diagnostic"] },
      { "name": "Voltage / Power Type", "options": [] },
      { "name": "Brand", "options": [] },
      { "name": "Workshop vs Mobile", "options": [] }
    ]
    
  },
  "simracing-gaming": {
    label: "SimRacing & Gaming Gear",
    subCategories: {
      "Racing Hardware": ["Wheels (Fanatec, Logitech, Thrustmaster)", "Pedals", "Shifters", "Handbrakes", "Button Boxes"],
      "Simulation Cockpits & Rigs": ["Foldable Rigs", "Motion Simulators", "Cockpits"],
      "Displays & Visual Gear": ["Triple Monitor Mounts", "Curved Displays", "VR Headsets"],
      "PCs & Hardware": ["Racing-spec PCs", "Graphic Cards", "Cooling Systems"],
      "Game Bundles & Tournaments": ["Esports Packages", "Online Events", "Team League Support"]
    },
    filters:[
      { "name": "Platform", "options": ["PC", "Console"] },
      { "name": "Brand", "options": ["Fanatec", "Logitech", "Thrustmaster"] },
      { "name": "Rig Type", "options": ["Foldable", "Full Frame", "Motion"] },
      { "name": "Pedal Set", "options": ["2-pedal", "3-pedal", "Loadcell"] },
      { "name": "Compatibility", "options": ["iRacing", "Assetto", "GT7"] },
      { "name": "Price Range", "options": [] }
    ]
  },

  "bike-accessories-parts": {
    label: "Bike Accessories & Parts",
    subCategories: {
      "OEM & Performance Spares": ["Chains", "Sprockets", "Air Filters", "Exhausts"],
      "Lighting & Electricals": ["Headlights", "Indicators", "Horns", "Wiring"],
      "Mobile Holders & Storage": ["Phone Mounts", "Tank Bags", "Tail Bags"],
      "Crash Protection & Styling": ["Frame Sliders", "Skid Plates", "Custom Fairings"]
    },
    filters:[
      { "name": "Bike Brand / Model", "options": [] },
      { "name": "Performance vs Street", "options": [] },
      { "name": "Material Type", "options": [] },
      { "name": "Color & Finish", "options": [] },
      { "name": "Brand", "options": [] }
    ]
  },

  "toys-models-collectibles": {
    label: "Toys, Models & Collector Items",
    subCategories: {
      "Ride-on Electric Cars & Bikes (Kids)": ["Battery-Powered Mini Jeeps", "BMWs", "Supercars"],
      "RC Cars, Bikes, Trucks": ["Drift", "Buggy", "Rally", "4WD Crawlers"],
      "Diecast & Miniatures": ["1:18", "1:24", "1:64 scale (AutoArt, Hot Wheels, etc.)"],
      "Garage Diorama Kits": ["Display Environments", "Pit Lane Sets"],
      "Licensed Collectibles": ["Team Figurines", "Engine Models", "Mini Helmets"]
    },
    filters:[
      { "name": "Age Group", "options": ["Kids", "Collectors"] },
      { "name": "Brand / Edition", "options": [] },
      { "name": "Power Type", "options": ["Battery", "Manual"] },
      { "name": "Scale", "options": ["1:18", "1:24", "1:64"] },
      { "name": "Licensing", "options": [] }
    ]
  },

  "apparel-merch-lifestyle": {
    label: "Apparel, Merchandise & Lifestyle",
    subCategories: {
      "Clothing & Apparel": ["Racing Suits", "T-shirts", "Hoodies", "Gloves", "Caps"],
      "Team & Event Gear": ["Pit Shirts", "Lanyards", "Official Merchandise"],
      "Lifestyle Accessories": ["Watches", "Bags", "Belts", "Wallets", "Scarves"],
      "Keychains & Custom Gifts": ["Leather", "Personalized", "Metal Diecast"]
    },
    filters:[
      { "name": "Gender", "options": ["Men", "Women", "Unisex"] },
      { "name": "Event or Brand Affiliation", "options": [] },
      { "name": "Size & Fit", "options": [] },
      { "name": "Customization Available", "options": [] },
      { "name": "Collector Edition", "options": [] }
    ]
  },

  "stickers-decals-wraps": {
    label: "Stickers, Decals & Wraps",
    subCategories: {
      "Racing Numbers & Livery Kits": ["WRC", "Formula", "Drift Styles"],
      "Windshield & Side Decals": ["Name Strips", "Blood Group", "Brand Logos"],
      "Reflective & Safety Stickers": ["Caution", "Race Arrows", "Visibility Tapes"],
      "Custom Upload Options": ["User-generated Livery Designs"],
      "Glow-in-the-Dark Vinyls": ["Track Safety & Decorative"]
    },
    filters:[
      { "name": "Application", "options": ["Car", "Bike", "Helmet", "Toolbox"] },
      { "name": "Material", "options": ["Gloss", "Matte", "Reflective", "Glow"] },
      { "name": "Color", "options": [] },
      { "name": "Custom Upload Enabled", "options": [] },
      { "name": "Size", "options": [] }
    ]
  },

  "books-magazines-docs": {
    label: "Books, Magazines & Documentation",
    subCategories: {
      "Auto Magazines (Print + Digital)": ["Monthly", "Special Editions (AutoCar, Evo India)"],
      "Owner Manuals & Service Books": ["OEM Handbook Reprints & PDF Downloads"],
      "Tuning Handbooks & Build Diaries": ["Suspension", "ECU", "Aero Mods", "Dyno Logs"],
      "Brochures & Tech Sheets": ["Factory Catalogs", "Sales Sheets"],
      "Historic Rally Documents": ["Entry Lists", "Maps", "Poster Reproductions"]
    },
    filters:[
      { "name": "Publication Type", "options": ["Magazine", "Book", "Poster"] },
      { "name": "Language", "options": [] },
      { "name": "Time Period", "options": ["Vintage", "Modern"] },
      { "name": "Vehicle Type", "options": [] },
      { "name": "Format", "options": ["Print", "PDF"] }
    ]
  },

  "vendors-storefronts": {
    label: "Shop by Vendor / Storefronts",
    subCategories: {
      "Featured Vendor Stores": ["Race Tuners", "OEM Sellers", "Performance Brands"],
      "Location-Based Vendors": ["City-based Filtering", "Nearby Recommendations"],
      "Garage Storefronts": ["Verified Workshops", "Local Mechanics with Shops"],
      "Retailers & Resellers": ["Pan-India Retail Chains", "Online Distributors"],
      "Creator & Influencer Shops": ["Limited Merch", "Stickers", "Builds-for-Sale"]
    },
    filters:
    [
      { "name": "Seller Type", "options": ["OEM", "Workshop", "Brand", "Creator"] },
      { "name": "Rating & Reviews", "options": [] },
      { "name": "Products Count", "options": [] },
      { "name": "Region", "options": [] },
      { "name": "Shop Category", "options": ["Parts", "Merchandise", "Services"] }
    ]
  },

  "offroad-adventure": {
    label: "Off-Roading & Adventure Gear",
    subCategories: {
      "Off-Road Suspension & Lift Kits": ["Long Travel Coilovers", "HD Shock Absorbers"],
      "Off-Road Tyres & Beadlocks": ["Gravel", "Sand", "Rock Crawling", "Rally", "Mud Terrain"],
      "Utility Accessories": ["Snorkels", "Winches", "Jerry Can Mounts", "Tow Ropes"],
      "Roof Gear & Camping": ["Rooftop Tents", "Side Awnings", "Storage Boxes"],
      "Lighting & Electricals": ["Light Bars", "CB Radios", "12V Sockets"],
      "Body Mods": ["Bumpers", "Rock Sliders", "Skid Plates"]
    },
    filters:[
      { "name": "Terrain Type", "options": ["Gravel", "Sand", "Rock Crawling", "Rally", "Mud Terrain"] },
      { "name": "Vehicle Type", "options": ["4x4", "SUV", "Adventure Bike"] },
      { "name": "Load / Winch Rating", "options": [] },
      { "name": "Waterproof / Dustproof Rating", "options": [] },
      { "name": "Mounting Type", "options": [] }
    ]
  }
};
export const featuredProducts = [
  {
    id: "product1",
    name: "Performance Air Intake System",
    price: 299.99,
    originalPrice: 349.99,
    image: "https://images.unsplash.com/photo-1607603750909-408e193868c7",
    category: "Performance Parts",
    isNew: true,
    isSale: true,
  },
  {
    id: "product2",
    name: "Premium Brake Kit",
    price: 849.99,
    image: "https://images.unsplash.com/photo-1486262322291-6f4bdad73f84",
    category: "Brakes & Suspension",
    isNew: true,
  },
  {
    id: "product3",
    name: "LED Headlight Conversion Kit",
    price: 199.99,
    originalPrice: 259.99,
    image: "https://images.unsplash.com/photo-1596558131507-5c4c48827024",
    category: "Lighting",
    isSale: true,
  },
  {
    id: "product4",
    name: "Racing Bucket Seat",
    price: 749.99,
    image: "https://images.unsplash.com/photo-1584641911870-6196a92c1920",
    category: "Interior",
  },
  {
    id: "product5",
    name: "Carbon Fiber Hood",
    price: 1299.99,
    image: "https://images.unsplash.com/photo-1610647752706-3bb12232b3ab",
    category: "Exterior",
    isNew: true,
  },
  {
    id: "product6",
    name: "Performance Exhaust System",
    price: 899.99,
    originalPrice: 1099.99,
    image: "https://images.unsplash.com/photo-1590656331554-7560616cd6e2",
    category: "Performance Parts",
    isSale: true,
  },
  {
    id: "product7",
    name: "Lowering Springs Kit",
    price: 349.99,
    image: "https://images.unsplash.com/photo-1600448772342-679c5f913252",
    category: "Brakes & Suspension",
  },
  {
    id: "product8",
    name: "Turbocharger Upgrade Kit",
    price: 1799.99,
    image: "https://images.unsplash.com/photo-1595844730298-b960ff98fee0",
    category: "Performance Parts",
    isNew: true,
  },
];

export const allProducts = [
  ...featuredProducts,
  {
    id: "product9",
    name: "Racing Steering Wheel",
    price: 349.99,
    image: "https://images.unsplash.com/photo-1571913640706-339910108fa9",
    category: "Interior",
    isNew: true,
  },
  {
    id: "product10",
    name: "High Performance Spark Plugs",
    price: 79.99,
    originalPrice: 99.99,
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3",
    category: "Engine Parts",
    isSale: true,
  },
  {
    id: "product11",
    name: "Adjustable Coilover Suspension",
    price: 1299.99,
    image: "https://images.unsplash.com/photo-1614200125127-b6497660564d",
    category: "Brakes & Suspension",
  },
  {
    id: "product12",
    name: "Racing Harness Set",
    price: 249.99,
    image: "https://images.unsplash.com/photo-1613760114309-a1164c2e80e3",
    category: "Safety",
    isNew: true,
  },
];
