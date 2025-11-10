"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { simRacingApi, SimEvent, SimLeague } from "@/integrations/supabase/modules/simRacing";
import { useAuth } from "@/contexts/AuthContext";

const eventTypeOptions = [
  { value: "race", label: "Race" },
  { value: "time_trial", label: "Time Trial" },
  { value: "qualification", label: "Qualification" },
  { value: "practice", label: "Practice" },
  { value: "championship", label: "Championship" },
  { value: "bootcamp", label: "Bootcamp" },
  { value: "tournament", label: "Tournament" },
];

const platformOptions = [
  { value: "iracing", label: "iRacing" },
  { value: "assetto_corsa", label: "Assetto Corsa" },
  { value: "rfactor2", label: "rFactor 2" },
  { value: "automobilista", label: "Automobilista" },
  { value: "project_cars", label: "Project CARS" },
  { value: "gran_turismo", label: "Gran Turismo" },
  { value: "forza", label: "Forza" },
  { value: "other", label: "Other" },
];

const registrationTypeOptions = [
  { value: "solo", label: "Solo" },
  { value: "team", label: "Team" },
  { value: "invitation_only", label: "Invitation Only" },
  { value: "open", label: "Open" },
];

// Schema for form validation
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  event_type: z.enum(["race", "time_trial", "qualification", "practice", "championship", "bootcamp", "tournament"]).default("race"),
  format: z.string().optional(),
  platform: z.enum(["iracing", "assetto_corsa", "rfactor2", "automobilista", "project_cars", "gran_turismo", "forza", "other"]),
  track: z.string().min(1, "Track is required"),
  car_class: z.string().min(1, "Car class is required"),
  car_setup: z.string().optional(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  registration_type: z.enum(["solo", "team", "invitation_only", "open"]).default("open"),
  max_participants: z.string()
    .refine(val => val === '' || !isNaN(Number(val)), "Must be a number")
    .optional(),
  league_id: z.string().min(1, "league is required"),
  replay_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

const SimEventEdit = () => {
  const { id } = useParams();
  const stringId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const isEditing = !!id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaguesId,setleaguesId]=useState<SimLeague[]>([])
  const [startDate,setStartdate]=useState("")
  const {user}=useAuth()
  // Fetch leagues for dropdown
  const { data: leagues = [] } = useQuery({
    queryKey: ["simLeagues"],
    queryFn: async () => {
      const { data, error } = await simRacingApi.leagues.getAll();
      if (error) {
        console.error("Error fetching leagues:", error);
        return [];
      }
      return data || [];
    },
  });
  const { data: allEvents } = useQuery({
    queryKey: ["simEvent", id],
    queryFn: async () => {
      
      const { data, error } = await simRacingApi.events.getAll();
      if (error) {
        console.error("Error fetching event:", error);
        return null;
      }
      return data;
    },
    enabled: !isEditing,
  });

 
  // Fetch event data if editing
  const { data: event, isLoading } = useQuery({
    queryKey: ["simEvent", stringId],
    queryFn: async () => {
      if (!stringId) return null;
      const { data, error } = await simRacingApi.events.getById(stringId);
      if (error) {
        console.error("Error fetching event:", error);
        return null;
      }
      return data;
    },
    enabled: isEditing,
  });
  useEffect(()=>{
    if(!isEditing && leagues && allEvents && leagues.length)
    {
        const leagueIds=allEvents.map((item: SimEvent)=>{
            return item.league_id;
        })
       
       const filteredId=leagues.filter((item: SimLeague)=>{
            return !leagueIds.includes(item.id) && item.platform==form.getValues('platform')
        }) 
        console.log(filteredId)
         if(!filteredId.length)
         {
          toast({
           title: "Event Limit Reached",
description: "You’ve already added events for all available leagues."
          });
          router.push("/admin/sim-events" as any);
         }
 
        setleaguesId(filteredId)
            
    }
  
},[allEvents,leagues])
console.log(leaguesId,leagues)
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      event_type: "race" as const,
      format: "",
      platform: "iracing" as const, // Default value
      track: "",
      car_class: "",
      car_setup: "",
      start_date: "",
      end_date: "",
      registration_type: "open" as const,
      max_participants: "",
      league_id: "",
      replay_url: "",
    },
  });
  useEffect(() => {
    const selectedLeagueId = form.watch("league_id");
    const league = leagues.find((l) => l.id === selectedLeagueId);
  
    if (league && league.start_date) {
      const oneDayBefore = new Date(
        new Date(league.start_date).getTime() - 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0];
  
      form.setValue("end_date", oneDayBefore);
       if(!isEditing)
       {
        form.setValue("start_date","");
       }
      setStartdate(oneDayBefore); // if you need to set this for max prop elsewhere
    } 
  }, [form.watch("league_id"), leagues])
  
  // Update form values when event data is loaded
  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title || "",
        description: event.description || "",
        event_type: event.event_type || "race",
        format: event.format || "",
        platform: (event.platform || "iracing") as "iracing" | "assetto_corsa" | "rfactor2" | "automobilista" | "project_cars" | "gran_turismo" | "forza" | "other",
        track: event.track || "",
        car_class: event.car_class || "",
        car_setup: event.car_setup || "",
        start_date: event.start_date ? new Date(event.start_date).toISOString().split('T')[0] : "",
        end_date: event.end_date ? new Date(event.end_date).toISOString().split('T')[0] : "",
        registration_type: event.registration_type || "open",
        max_participants: event.max_participants != null ? String(event.max_participants) : "",
        league_id: event.league_id || "",
        replay_url: event.replay_url || "",
      } as FormValues);
    }
  }, [event, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Convert form values to event data - ensure required fields for creation
      const eventData: Partial<SimEvent> = {
        ...values,
        max_participants: values.max_participants && values.max_participants !== '' ? parseInt(values.max_participants, 10) : undefined,
        // Convert empty strings to null for optional fields
        league_id: values.league_id || null,
        replay_url: values.replay_url || null,
        car_setup: values.car_setup || null,
        created_by:user?.id || ""
      };

      if (isEditing && stringId) {
        await simRacingApi.events.update(stringId, eventData);
        toast({
          title: "Event Updated",
          description: "The event has been successfully updated.",
        });
      } else {
        // Explicitly set required fields for creation
        await simRacingApi.events.create({
          title: values.title,
          event_type: values.event_type,
          registration_type: values.registration_type,
          platform: values.platform,
          ...eventData,
          created_by:user?.id || ""
        });
        toast({
          title: "Event Created",
          description: "The new event has been successfully created.",
        });
      }

      router.push("/admin/sim-events" as any);
    } catch (error) {
      console.error("Error saving event:", error);
      toast({
        title: "Error",
        description: "There was an error saving the event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Loading Event...">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }
  console.log(form.formState.errors,form.getValues())

  return (
    <AdminLayout 
      title={isEditing ? "Edit Sim Racing Event" : "Create Sim Racing Event"}
      backLink="/admin/sim-events"
    >
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter event title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Event Type */}
                <FormField
                  control={form.control}
                  name="event_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {eventTypeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Platform */}
                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {platformOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Format */}
                <FormField
                  control={form.control}
                  name="format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Format</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Sprint, Endurance, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Track */}
                <FormField
                  control={form.control}
                  name="track"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Track*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Spa-Francorchamps" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Car Class */}
                <FormField
                  control={form.control}
                  name="car_class"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Car Class*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., GT3, Formula, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

 {/* League */}
                <FormField
                  control={form.control}
                  name="league_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>League</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value || ""}
                        disabled={isEditing}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select league" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(isEditing?leagues:leaguesId).length > 0 ? (
                            (isEditing?leagues:leaguesId).map(league => (
                              <SelectItem key={league.id} value={league.id} >
                                {league.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no leagues" disabled>No leagues available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Start Date */}
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date*</FormLabel>
                      <FormControl>
                        <Input max={startDate} type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* End Date */}
                <FormField
                  control={form.control}
                  name="end_date"

               
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date*</FormLabel>
                      <FormControl>
                        <Input type="date"    disabled={!!form.getValues().league_id} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Registration Type */}
                <FormField
                  control={form.control}
                  name="registration_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Type*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select registration type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {registrationTypeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Max Participants */}
                <FormField
                  control={form.control}
                  name="max_participants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Participants</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="e.g., 24" {...field} />
                      </FormControl>
                      <FormDescription>
                        Leave empty for unlimited participants
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

               

                {/* Replay URL */}
                <FormField
                  control={form.control}
                  name="replay_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Replay URL</FormLabel>
                      <FormControl>
                        <Input placeholder="URL to event replay/recording" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description - Spans 2 columns */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter event description" 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Car Setup - Spans 2 columns */}
              <FormField
                control={form.control}
                name="car_setup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Car Setup</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter car setup details or requirements" 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push("/admin/sim-events" as any)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : isEditing ? "Update Event" : "Create Event"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default SimEventEdit;
