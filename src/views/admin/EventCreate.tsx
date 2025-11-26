"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import EventForm from "@/components/admin/EventForm";
import { useMutation } from "@tanstack/react-query";
import { createEvent, EventFormData } from "@/integrations/supabase/modules/events";
import { useToast } from "@/hooks/use-toast";

const EventCreate = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: EventFormData) => createEvent(data),
    onSuccess: async (createdEvent) => {
      // Trigger on-demand revalidation for the /events page and cached event data
      try {
        await fetch("/api/events/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: createdEvent?.id, action: "create" }),
        });
      } catch (error) {
        console.error("Failed to revalidate events after create:", error);
      }

      toast({
        title: "Event created",
        description: "Your event has been created successfully",
      });
      router.back();
    },
    onError: (error) => {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (data: EventFormData) => {
    setIsSubmitting(true);
    mutation.mutate(data);
  };

  return (
    <AdminLayout title="Create Event" backLink="/admin/events">
      <div className="mb-6">
        <p className="text-gray-600">
          Fill in the details below to create a new event. Required fields are marked with an
          asterisk (*).
        </p>
      </div>

      <EventForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </AdminLayout>
  );
};

export default EventCreate;
