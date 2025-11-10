
import React from "react";
import EventCard from "./EventCard";
import { Event } from "@/integrations/supabase/modules/events";

interface EventsGridProps {
  events: Event[];
  className?: string;
}

const EventsGrid: React.FC<EventsGridProps> = ({ events, className = "" }) => {
  if (!events.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium text-gray-600">No events found</h3>
        <p className="text-gray-500 mt-2">Check back later for upcoming events</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {events.map((event) => (
        <EventCard
          key={event.id}
          id={event.id}
          title={event.title}
          category={event.category}
          start_date={event.start_date}
          end_date={event.end_date}
          venue={event.venue}
          city={event.city}
          banner_image_url={event.banner_image_url}
          tags={event.tags ?? undefined}
          registration_required={event.registration_required ?? undefined}
          max_participants={event.max_participants ?? undefined}
        />
      ))}
    </div>
  );
};

export default EventsGrid;
