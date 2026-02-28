"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import EventForm from "@/components/admin/EventForm";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { updateEvent, EventFormData } from "@/integrations/supabase/modules/events";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const EventEdit = () => {
  const { id } = useParams<{ id: string }>();
  const stringId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { toast } = useToast();
  const { session } = useAuth();
  const isVendorContext =
    typeof window !== "undefined" && window.location.pathname.includes("/vendor/");
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch event data (route handler, no cache)
  const { data: event, isLoading, error } = useQuery({
    queryKey: ["event", stringId],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      if (!stringId) return null;
      const headers: HeadersInit = { "Content-Type": "application/json", "Cache-Control": "no-cache" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      const res = await fetch(`/api/vendor/events/${stringId}?_t=${Date.now()}`, {
        method: "GET",
        credentials: "include",
        headers,
        cache: "no-store",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? "Failed to load event");
      return body;
    },
    enabled: !!stringId,
  });

  // Update event mutation
  const mutation = useMutation({
    mutationFn: (data: EventFormData) => {
      if (!stringId) throw new Error("Event ID is required");
      return updateEvent(stringId, data);
    },
    onSuccess: async (updatedEvent) => {
      // Trigger on-demand revalidation for the /events page and cached event data
      try {
        await fetch("/api/events/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: updatedEvent?.id ?? stringId, action: "update" }),
        });
      } catch (error) {
        console.error("Failed to revalidate events after update:", error);
      }

      toast({
        title: "Event updated",
        description: "Your event has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["event", stringId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      router.push((isVendorContext ? "/vendor/event-management" : "/admin/events") as any);
    },
    onError: (error) => {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (data: EventFormData) => {
    setIsSubmitting(true);
    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Edit Event" backLink={isVendorContext ? "/vendor/event-management" : "/admin/events"}>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !event) {
    return (
      <AdminLayout title="Edit Event" backLink={isVendorContext ? "/vendor/event-management" : "/admin/events"}>
        <div className="text-center py-8 text-red-500">
          Error loading event. Please try again.
        </div>
      </AdminLayout>
    );
  }

  // Transform event data to match EventFormData type
  const transformedEvent: Partial<EventFormData> = {
    ...event,
    status: (event.status === 'draft' || event.status === 'published' || event.status === 'completed' || event.status === 'cancelled')
      ? event.status
      : 'draft' as 'draft' | 'published' | 'completed' | 'cancelled',
    gallery_urls: event.gallery_urls ?? [],
    features: event.features ?? [],
    tags: event.tags ?? [],
    registration_required: event.registration_required ?? false,
    fee_currency: event.fee_currency ?? 'INR',
    category_details: event.category_details && typeof event.category_details === 'object' && !Array.isArray(event.category_details)
      ? (event.category_details as Record<string, any>)
      : null,
    organizer_id: event.organizer_id ?? undefined,
  };

  return (
    <AdminLayout title={`Edit Event: ${event.title}`} backLink={isVendorContext ? "/vendor/event-management" : "/admin/events"}>
      <div className="mb-6">
        <p className="text-gray-600">
          Update the event details below. Required fields are marked with an asterisk (*).
        </p>
      </div>

      <EventForm 
        initialData={transformedEvent}
        onSubmit={handleSubmit} 
        isSubmitting={isSubmitting} 
      />
    </AdminLayout>
  );
};

export default EventEdit;
