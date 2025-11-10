
// Sample data for social media posts

export const trendingPosts = [
  {
    id: "post1",
    author: {
      name: "Max Speed",
      avatar: "https://i.pravatar.cc/150?img=32",
      isVerified: false,
    },
    time: "2 hours ago",
    content: "Just installed the new racing exhaust on my M4! The sound is incredible! Can't wait to take it to the track this weekend. #BMW #M4 #RacingPerformance",
    media: [
      {
        type: "image" as const,
        url: "https://images.unsplash.com/photo-1614026480209-cd9934144671",
      },
    ],
    likes: 152,
    comments: 48,
  },
  {
    id: "post2",
    author: {
      name: "SuperCars LA",
      avatar: "https://i.pravatar.cc/150?img=52",
      isVerified: true,
    },
    time: "5 hours ago",
    content: "New arrivals at our showroom! The stunning Lamborghini Huracan STO in Blu Laufey. Stop by to see it in person or schedule a test drive today. #Lamborghini #Huracan #STO #LuxuryCars",
    media: [
      {
        type: "image" as const,
        url: "https://images.unsplash.com/photo-1571607388263-1044f9ea01dd",
      },
      {
        type: "image" as const,
        url: "https://images.unsplash.com/photo-1580274455191-1c62238fa333",
      },
    ],
    likes: 432,
    comments: 67,
  },
  {
    id: "post3",
    author: {
      name: "Track Day Events",
      avatar: "https://i.pravatar.cc/150?img=12",
      isVerified: true,
    },
    time: "1 day ago",
    content: "ANNOUNCEMENT: Our next track day is scheduled for June 15th at Laguna Seca! Early bird tickets available now with a 15% discount. Limited spots available, so grab yours before they're gone! #TrackDay #LagunaeSeca #RacingEvent",
    media: [
      {
        type: "image" as const,
        url: "https://images.unsplash.com/photo-1584738766473-61c083514bf4",
      },
    ],
    likes: 256,
    comments: 89,
  },
];

export const allPosts = [
  ...trendingPosts,
  {
    id: "post4",
    author: {
      name: "Sarah's Garage",
      avatar: "https://i.pravatar.cc/150?img=23",
      isVerified: false,
    },
    time: "2 days ago",
    content: "DIY Saturday! Showing how to properly detail your engine bay. Swipe through for step-by-step photos. Drop any questions in the comments! #CarDetailing #DIY #EngineDetailling",
    media: [
      {
        type: "image" as const,
        url: "https://images.unsplash.com/photo-1597987072661-c9585167f69a",
      },
      {
        type: "image" as const,
        url: "https://images.unsplash.com/photo-1635673482920-b4f49e139a6b",
      },
    ],
    likes: 187,
    comments: 43,
  },
  {
    id: "post5",
    author: {
      name: "Performance Parts Inc",
      avatar: "https://i.pravatar.cc/150?img=54",
      isVerified: true,
    },
    time: "3 days ago",
    content: "NEW PRODUCT ALERT! Introducing our latest carbon fiber intake system for the 2023 Toyota Supra. Dyno tested with gains of up to 15hp! Pre-orders open now with a special 10% discount for the first 50 customers. #Supra #PerformanceParts #CarbonFiber",
    media: [
      {
        type: "image" as const,
        url: "https://images.unsplash.com/photo-1614200179396-2bdb77ebedd0",
      },
    ],
    likes: 342,
    comments: 78,
  },
  {
    id: "post6",
    author: {
      name: "Classic Car Collectors",
      avatar: "https://i.pravatar.cc/150?img=42",
      isVerified: true,
    },
    time: "4 days ago",
    content: "JUST ARRIVED: 1967 Ford Mustang Shelby GT500 in perfect condition. Numbers matching, full restoration completed last year. This beauty is looking for a new home! Contact us for more details. #ClassicCars #Mustang #Shelby #GT500",
    media: [
      {
        type: "image" as const,
        url: "https://images.unsplash.com/photo-1584345604476-8ec5f82d718c",
      },
      {
        type: "image" as const,
        url: "https://images.unsplash.com/photo-1584345604476-8ec5f82d718c",
      },
    ],
    likes: 521,
    comments: 104,
  },
  {
    id: "post7",
    author: {
      name: "Auto Show Events",
      avatar: "https://i.pravatar.cc/150?img=22",
      isVerified: true,
    },
    time: "5 days ago",
    content: "The International Auto Show is coming to town next month! Exclusive unveilings, test drives, and automotive technology showcase. Get your early bird tickets now at 20% off! #AutoShow #CarEvent #NewCars",
    media: [
      {
        type: "image" as const,
        url: "https://images.unsplash.com/photo-1581546109296-e7c4672105d8",
      },
    ],
    likes: 412,
    comments: 87,
  },
  {
    id: "post8",
    author: {
      name: "Rally Driver Mike",
      avatar: "https://i.pravatar.cc/150?img=11",
      isVerified: false,
    },
    time: "1 week ago",
    content: "What a race weekend! Coming in 2nd place at the Forest Rally Championship. Couldn't have done it without my amazing team and our reliable Subaru WRX STI. Already preparing for the next one! #RallyRacing #Subaru #WRX #ChampionshipRally",
    media: [
      {
        type: "image" as const,
        url: "https://images.unsplash.com/photo-1518527895905-232c66f71b61",
      },
    ],
    likes: 382,
    comments: 61,
  },
  {
    id: "post9",
    author: {
      name: "Exotic Rentals Miami",
      avatar: "https://i.pravatar.cc/150?img=33",
      isVerified: true,
    },
    time: "1 week ago",
    content: "New addition to our fleet! The Ferrari SF90 Stradale is now available for rent. Experience nearly 1,000 horsepower of hybrid power. Book now for your next Miami weekend! #Ferrari #SF90 #ExoticCars #MiamiLife",
    media: [
      {
        type: "image" as const,
        url: "https://images.unsplash.com/photo-1627803293399-5810be31acb9",
      },
    ],
    likes: 512,
    comments: 95,
  },
];
