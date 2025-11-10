
import React from "react";
import { Calendar, Clock, MapPin, Users, Tag, Info } from "lucide-react";
import { Event } from "@/integrations/supabase/modules/events";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface EventDetailProps {
  event: Event;
}

const EventDetail: React.FC<EventDetailProps> = ({ event }) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "TBA";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "TBA";
    // Convert "HH:mm:ss" to "HH:mm AM/PM"
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-4 md:space-y-8 bg-[rgb(250,250,250)] px-3 md:px-6 py-3 md:py-4">
      {/* Event Header */}
      <div>
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge className="bg-red-600">{event.category}</Badge>
          {event.status === "published" && (
            <Badge variant="outline" className="border-green-500 text-green-700">
              Published
            </Badge>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>
        
        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-red-600" />
            <div>
              <p className="font-medium">Date</p>
              <p>{formatDate(event.start_date)}</p>
              {event.end_date && event.end_date !== event.start_date && (
                <p>to {formatDate(event.end_date)}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-red-600" />
            <div>
              <p className="font-medium">Time</p>
              <p>
                {formatTime(event.start_time)}
                {event.end_time && ` - ${formatTime(event.end_time)}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-red-600" />
            <div>
              <p className="font-medium">Location</p>
              <p>{event.venue || "Venue TBA"}</p>
              <p>
                {[event.city, event.state, event.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </div>
          
          {event.registration_required && (
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-red-600" />
              <div>
                <p className="font-medium">Registration</p>
                {event.max_participants ? (
                  <p>Limited to {event.max_participants} participants</p>
                ) : (
                  <p>Registration required</p>
                )}
                {event.registration_start_date && (
                  <p>Opens: {formatDate(event.registration_start_date)}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Separator className="border-[1.2px]"/>
      
      {/* Event Description */}
      {event.description && (
        <div>
          <h2 className="text-2xl font-semibold mb-2 md:mb-4">About This Event</h2>
          <div className="prose prose-gray max-w-none">
            {event.description.split('\n').map((paragraph, i) => (
              <p key={i} className="mb-1 md:mb-4">{paragraph}</p>
            ))}
          </div>
        </div>
      )}
      
      {/* Event Features */}
      {event.features && event.features.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-2 md:mb-4">Features</h2>
          <div className="flex flex-wrap gap-2">
            {event.features.map((feature, i) => (
              <div 
                key={i}
                className="flex items-center bg-red-50 text-red-800 px-3 py-2 rounded-md"
              >
                <Info className="w-4 h-4 mr-2" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Event Tags */}
      {event.tags && event.tags.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {event.tags.map((tag, i) => (
              <Badge key={i} variant="secondary">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Registration Information */}
      {event.registration_required && (
        <div className="bg-[rgb(250,250,250)] p-3 md:p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2 flex items-center">
            <Users className="w-5 h-5 mr-2 text-red-600" />
            Registration Information
          </h2>
          <div className="space-y-2 text-gray-700">
            {event.registration_start_date && event.registration_end_date && (
              <p>
                Registration period: {formatDate(event.registration_start_date)} to{" "}
                {formatDate(event.registration_end_date)}
              </p>
            )}
            {event.fee_amount && event.fee_amount > 0 ? (
              <p className="font-medium">
                Registration fee: {event.fee_currency} {event.fee_amount}
              </p>
            ) : (
              <p className="font-medium text-green-600">Free event</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;
