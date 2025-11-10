import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Search, Calendar, Tag, Mic } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/navigation";

type SearchType = "products" | "services" | "sim_products" | "events" | "sim_events" | "vehicles";

interface BaseResult {
  id: string | number;
  title: string;
  thumbnail?: string | null;
  priceOrDate?: string | null;
  type: SearchType;
}

interface GlobalSearchProps {
  className?: string;
  isMobile?: boolean;
}

const formatPriceOrDate = (item: any, type: SearchType): string | null => {
  if (type === "products") {
    const price = item.price ?? item.cost ?? item.amount;
    return typeof price === "number" ? `₹${price.toLocaleString()}` : null;
  }
  if (type === "services") {
    const price = item.price ?? item.cost ?? item.amount;
    if (typeof price === "string") return price as string;
    if (typeof price === "number") return `₹${price.toLocaleString()}`;
    return null;
  }
  if (type === "events" || type === "sim_events") {
    const dateStr = item.date || item.start_date || item.created_at;
    try {
      return dateStr ? new Date(dateStr).toLocaleDateString() : null;
    } catch {
      return null;
    }
  }
  return null;
};

const mapRow = (row: any, type: SearchType): BaseResult => {
  let thumb: string | null = null;
  if (type === "events") thumb = row.banner_image_url || row.thumbnail || null;
  else if (type === "sim_events") thumb = row.banner_image_url || null;
  else if (type === "vehicles") thumb = row.images?.[0] || null;
  else if (type === "services") thumb = row.media_urls?.[0] || null;
  else if (type === "sim_products") thumb = row.image_url?.[0] || null;
  else thumb = row.thumbnail || row.image || row.images?.[0] || row.cover_url || row.logo_url || null;

  const name =
    row.title ||
    row.name ||
    row.product_name ||
    row.service_name ||
    row.vehicle_name ||
    row.event_name ||
    `${row.make ? row.make + " " : ""}${row.model || "Untitled"}`;

  return {
    id: row.id,
    title: name,
    thumbnail: thumb,
    priceOrDate: formatPriceOrDate(row, type),
    type,
  };
};

type Scope = "all" | "products" | "services" | "sim_products" | "events" | "sim_events" | "vehicles";

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ className, isMobile }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<Scope>("all");
  const [isTabletOrMobile, setIsTabletOrMobile] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [results, setResults] = useState<Record<SearchType, BaseResult[]>>({
    products: [],
    services: [],
    sim_products: [],
    events: [],
    sim_events: [],
    vehicles: [],
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (isListening && recognitionRef.current) {
          recognitionRef.current.stop();
          setIsListening(false);
        }
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [isListening]);

  // Check screen size for tablet/mobile positioning
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkScreenSize = () => {
      setIsTabletOrMobile(window.innerWidth < 1025); // Use mobile positioning below 1025px
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Prevent background scroll when dropdown is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  // Cleanup voice recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const debouncedQuery = useDebounce(query, 250);

  // Ensure mobile/tablet always uses "All" scope
  useEffect(() => {
    if ((isMobile || isTabletOrMobile) && scope !== "all") {
      setScope("all");
    }
  }, [isMobile, isTabletOrMobile, scope]);

  useEffect(() => {
    const run = async () => {
      if (!debouncedQuery.trim()) {
        setResults({ products: [], services: [], sim_products: [], events: [], sim_events: [], vehicles: [] });
        return;
      }
      setLoading(true);
      try {
        const [products, services, simProducts, events, simEvents, vehicles] = await Promise.all([
          // products: generic name/description
          searchTable("products", debouncedQuery, ["name", "description", "category"]),
          // services: title/description/category
          searchTable("services", debouncedQuery, ["title", "description", "category"]),
          // sim_products: name/description/category
          searchTable("sim_products", debouncedQuery, ["name", "description", "category", "brand"]),
          // events: no location column; use title/venue/city/state/country/description
          searchTable("events", debouncedQuery, ["title", "venue", "city", "state", "country", "description"]),
          // sim_events: no location column; use title/track/format/description
          searchTable("sim_events", debouncedQuery, ["title", "track", "format", "description"]),
          // vehicles: no brand column; use title/make/model/description
          searchTable("vehicles", debouncedQuery, ["title", "make", "model", "description", "category"]),
        ]);

        const all = {
          products: products.slice(0, 5).map((r: any) => mapRow(r, "products")),
          services: services.slice(0, 5).map((r: any) => mapRow(r, "services")),
          sim_products: simProducts.slice(0, 5).map((r: any) => mapRow(r, "sim_products")),
          events: events.slice(0, 5).map((r: any) => mapRow(r, "events")),
          sim_events: simEvents.slice(0, 5).map((r: any) => mapRow(r, "sim_events")),
          vehicles: vehicles.slice(0, 5).map((r: any) => mapRow(r, "vehicles")),
        } as const;

        // If scoped, only keep that bucket, otherwise keep all
        setResults(scope === "all"
          ? all as any
          : ({ products: [], services: [], sim_products: [], events: [], sim_events: [], vehicles: [], [scope]: all[scope] } as any)
        );
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [debouncedQuery, scope]);

  const hasAnyResults = useMemo(() => Object.values(results).some((arr) => arr.length > 0), [results]);

  // Navigation function for search results
  const handleResultClick = (item: BaseResult) => {
    setOpen(false);
    setQuery("");
    
    switch (item.type) {
      case "products":
        router.push(`/shop/product/${item.id}`);
        break;
      case "services":
        router.push(`/services/${item.id}`);
        break;
      case "sim_products":
        router.push(`/sim-racing/products/${item.id}`);
        break;
      case "events":
        router.push(`/events/${item.id}`);
        break;
      case "sim_events":
        router.push(`/sim-racing/events/${item.id}`);
        break;
      case "vehicles":
        router.push(`/vehicles/${item.id}`);
        break;
      default:
        console.log("Unknown item type:", item.type);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <div className={cn("flex items-center gap-2", isMobile ? "h-10" : "h-9")}> 
          {!isMobile && !isTabletOrMobile && (
            <Select value={scope} onValueChange={(v: Scope) => setScope(v)}>
              <SelectTrigger className={cn("w-[160px] bg-white", isMobile ? "h-10" : "h-9")}> 
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="products">Products</SelectItem>
                <SelectItem value="services">Services</SelectItem>
                <SelectItem value="sim_products">Sim Products</SelectItem>
                <SelectItem value="events">Events</SelectItem>
                <SelectItem value="sim_events">Sim Events</SelectItem>
                <SelectItem value="vehicles">Vehicles</SelectItem>
              </SelectContent>
            </Select>
          )}

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => query && setOpen(true)}
              placeholder={`${isListening?'Listening...':'Search or ask your question...'}`}
              className={cn(
                "pl-9",
                isMobile 
                  ? "h-10 rounded-md border border-sm-red focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sm-red focus:ring-offset-0" 
                  : "h-9 rounded-full"
              )}
            />
             <button
               type="button"
               onClick={() => startVoice(setQuery, setOpen, setIsListening, recognitionRef)}
               className={cn(
                 "absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors",
                 isListening 
                   ? "bg-red-100 hover:bg-red-200" 
                   : "hover:bg-gray-100"
               )}
               aria-label={isListening ? "Stop voice search" : "Voice search"}
             >
               {isListening ? (
                 <div className="flex items-center space-x-1">
                   <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
                   <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                   <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                 </div>
               ) : (
                 <Mic className="h-4 w-4 text-gray-500" />
               )}
             </button>
          </div>
        </div>
      </div>

       {open && (query || loading) && (
         <Card className="absolute mt-2 w-full z-50 shadow-xl border border-gray-200 touch-pan-y">
           <div 
             className="max-h-[60vh] overflow-y-auto overflow-x-hidden p-2 overscroll-contain" 
             style={{ 
               WebkitOverflowScrolling: 'touch',
               scrollBehavior: 'smooth',
               overscrollBehavior: 'contain'
             }}
             onTouchStart={(e) => e.stopPropagation()}
             onTouchMove={(e) => e.stopPropagation()}
           >
            {loading && (
              <div className="p-4 text-sm text-gray-500">Searching...</div>
            )}
            {!loading && !hasAnyResults && (
              <div className="p-4 text-sm text-gray-500">No results</div>
            )}

            {(
              [
                ["products", "Products"],
                ["services", "Services"],
                ["events", "Events"],
                ["sim_events", "Sim Events"],
                ["sim_products", "Sim Products"],
                ["vehicles", "Vehicles"],
              ] as Array<[SearchType, string]>
            ).map(([key, label]) => (
              results[key].length > 0 && (
                <div key={key} className="py-1">
                  <div className="px-2 py-1 text-[11px] uppercase tracking-wide text-gray-500">
                    {label}
                  </div>
                  <ul className="divide-y">
                     {results[key].map((item) => (
                       <li key={`${key}-${item.id}`}>
                         <button
                           type="button"
                           className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 text-left transition-colors duration-150 ease-out"
                           onClick={() => handleResultClick(item)}
                         >
                          <div className="h-10 w-10 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                            {item.thumbnail ? (
                              <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
                            ) : (
                              <Tag className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{highlight(item.title, debouncedQuery)}</div>
                            <div className="text-[12px] text-gray-500 flex items-center gap-2">
                              <span className="uppercase">{key}</span>
                              {item.priceOrDate && (
                                <span className="text-gray-400">•</span>
                              )}
                              {item.priceOrDate && (
                                <span className="flex items-center gap-1">
                                  {(key === "events" || key === "sim_events") && (
                                    <Calendar className="h-3 w-3" />
                                  )}
                                  {item.priceOrDate}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

function highlight(text: string, query: string) {
  if (!query) return text;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i === -1) return text;
  const before = text.slice(0, i);
  const match = text.slice(i, i + query.length);
  const after = text.slice(i + query.length);
  return (
    <span>
      {before}
      <mark className="bg-yellow-100 text-inherit rounded px-0.5">{match}</mark>
      {after}
    </span>
  );
}

async function searchTable(table: string, q: string, columns: string[]) {
  // Simple OR ilike across provided columns
  let query: any = (supabase.from as any)(table).select("*").limit(5);
  const ors = columns.map((c) => `${c}.ilike.%${q}%`).join(",");
  // @ts-ignore - supabase-js supports .or
  query = (query as any).or(ors);
  const { data } = await query;
  return data ?? [];
}

function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}


function startVoice(
  setQuery: (v: string) => void, 
  setOpen: (o: boolean) => void, 
  setIsListening: (l: boolean) => void,
  recognitionRef: React.MutableRefObject<any>
) {
  const w = window as any;
  const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.log('Speech recognition not supported');
    return;
  }

  // Stop any existing recognition
  if (recognitionRef.current) {
    recognitionRef.current.stop();
  }

  const recognition = new SpeechRecognition();
  recognitionRef.current = recognition;
  
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    setIsListening(true);
    setOpen(true);
  };

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    setQuery(transcript);
    setIsListening(false);
  };

  recognition.onerror = (event: any) => {
    console.log('Speech recognition error:', event.error);
    setIsListening(false);
  };

  recognition.onend = () => {
    setIsListening(false);
  };

  try {
    recognition.start();
  } catch (error) {
    console.log('Error starting speech recognition:', error);
    setIsListening(false);
  }
}

export default GlobalSearch;


