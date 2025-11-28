"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { simRacingApi, SimLeague } from "@/integrations/supabase/modules/simRacing";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

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

// Schema for form validation (input type - all strings)
const formSchema = z.object({
  name: z.string().min(1, "League name is required"),
  description: z.string().optional(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  platform: z.enum(["iracing", "assetto_corsa", "rfactor2", "automobilista", "project_cars", "gran_turismo", "forza", "other"]),
  registration_type: z.enum(["solo", "team", "invitation_only", "open"]),
  max_participants: z.string()
    .refine(val => val === '' || !isNaN(Number(val)), "Must be a number")
    .optional(),
  points_system: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const SimLeagueEdit = () => {
  const { id } = useParams();
  const stringId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const isEditing = !!id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const { user } = useAuth();
  const isVendorContext =
    typeof window !== "undefined" &&
    window.location.pathname.includes("/vendor/");
  const isInitializingRef = useRef(false);
   
  // Fetch league data if editing
  const { data: league, isLoading } = useQuery({
    queryKey: ["simLeague", stringId],
    queryFn: async () => {
      if (!stringId) return null;
      const { data, error } = await simRacingApi.leagues.getById(stringId);
      if (error) {
        console.error("Error fetching league:", error);
        return null;
      }
      return data;
    },
    enabled: isEditing,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      start_date: "",
      end_date: "",
      platform: "iracing", // Default value
      registration_type: league?.registration_type || "open", // Default value
      max_participants: "",
      points_system: undefined,
    },
  });

  // Update form values when league data is loaded
  useEffect(() => {
    if (league) {
      isInitializingRef.current = true;
      const registrationType = (league.registration_type && 
        ["solo", "team", "invitation_only", "open"].includes(league.registration_type))
        ? league.registration_type 
        : "open";
    
      // Reset form
      form.reset({
        name: league.name || "",
        description: league.description || "",
        platform: (league.platform || "iracing") as "iracing" | "assetto_corsa" | "rfactor2" | "automobilista" | "project_cars" | "gran_turismo" | "forza" | "other",
        registration_type: registrationType as "solo" | "team" | "invitation_only" | "open",
        max_participants: league.max_participants?.toString() || "",
        start_date: league.start_date ? new Date(league.start_date).toISOString().split('T')[0] : "",
        end_date: league.end_date ? new Date(league.end_date).toISOString().split('T')[0] : "",
        points_system: league.points_system ? (typeof league.points_system === 'string' ? league.points_system : JSON.stringify(league.points_system)) : "",
      });
      
      // Reset the flag after a short delay to allow form to settle
      setTimeout(() => {
        isInitializingRef.current = false;
      }, 100);
    }
  }, [league, form]);

  const validateJSON = (value: string): boolean => {
    if (!value) return true;
    try {
      JSON.parse(value);
      setJsonError(null);
      return true;
    } catch (e) {
      setJsonError("Invalid JSON format");
      return false;
    }
  };

  const onSubmit = async (values: FormValues) => {
    // Validate JSON before submission

    const pointsSystemValue = form.getValues().points_system as string;
    if (pointsSystemValue && !validateJSON(pointsSystemValue)) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Get the current form value for registration_type to ensure it's captured
      const currentRegistrationType = form.getValues("registration_type") || values.registration_type || "open";
      
      // Convert form values to league data
      const leagueData: Partial<SimLeague> = {
        name: values.name,
        description: values.description,
        platform: values.platform,
        registration_type: currentRegistrationType as "solo" | "team" | "invitation_only" | "open",
        start_date: values.start_date,
        end_date: values.end_date,
        max_participants: values.max_participants ? parseInt(values.max_participants, 10) : null,
        points_system: values.points_system ? (() => {
          try {
            return JSON.parse(values.points_system);
          } catch {
            return null;
          }
        })() : null,
        organizer_id: user?.id || null
      };

      if (isEditing && stringId) {
        await simRacingApi.leagues.update(stringId, leagueData);
        toast({
          title: "League Updated",
          description: "The league has been successfully updated.",
        });

        // Trigger revalidation for sim-racing SSG/ISR
        try {
          await fetch("/api/sim-racing/revalidate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: stringId,
              entityType: "league",
              action: "update",
            }),
          });
        } catch (revalidateError) {
          console.error(
            "Error triggering sim-racing revalidation (league update):",
            revalidateError
          );
        }
      } else {
        const { error } = await simRacingApi.leagues.create(leagueData as any);
        if (error) throw error;

        toast({
          title: "League Created",
          description: "The new league has been successfully created.",
        });

        // Trigger revalidation for sim-racing SSG/ISR
        try {
          await fetch("/api/sim-racing/revalidate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              // No specific detail page yet; revalidate listing and /sim-racing
              entityType: "league",
              action: "create",
            }),
          });
        } catch (revalidateError) {
          console.error(
            "Error triggering sim-racing revalidation (league create):",
            revalidateError
          );
        }
      }

      router.push(
        (isVendorContext ? "/vendor/simleague-management" : "/admin/sim-leagues") as any
      );
    } catch (error) {
      console.error("Error saving league:", error);
      toast({
        title: "Error",
        description: "There was an error saving the league. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Loading League...">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title={isEditing ? "Edit Sim Racing League" : "Create Sim Racing League"}
      backLink={
        isVendorContext ? "/vendor/simleague-management" : "/admin/sim-leagues"
      }
    >
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                {/* League Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>League Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter league name" {...field} />
                      </FormControl>
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
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            // Prevent onChange from firing during form initialization
                            if (isInitializingRef.current) {
                              return;
                            }
                            // Only update if value is not empty and is a valid option
                            if (value && ["iracing", "assetto_corsa", "rfactor2", "automobilista", "project_cars", "gran_turismo", "forza", "other"].includes(value)) {
                              field.onChange(value);
                              field.onBlur();
                            }
                          }}
                          value={field.value || "iracing"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
                            {platformOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            // Prevent onChange from firing during form initialization
                            if (isInitializingRef.current) {
                              return;
                            }
                            // Only update if value is not empty and is a valid option
                            if (value && ["solo", "team", "invitation_only", "open"].includes(value)) {
                              field.onChange(value);
                              field.onBlur();
                            }
                          }}
                          value={field.value || "open"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select registration type" />
                          </SelectTrigger>
                          <SelectContent>
                            {registrationTypeOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
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
                      <FormMessage />
                      <FormDescription>
                        Leave empty for unlimited participants
                      </FormDescription>
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
                        <Input type="date" {...field} />
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
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter league description" 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Points System */}
              <FormField
                control={form.control}
                name="points_system"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points System</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder='Enter points system as JSON, e.g., {"1": 25, "2": 18, "3": 15}' 
                        className="min-h-[120px] font-mono" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          validateJSON(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the points system as a JSON object. Example: {`{"1": 25, "2": 18, "3": 15}`}
                    </FormDescription>
                    {jsonError && <p className="text-sm font-medium text-destructive">{jsonError}</p>}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push("/admin/sim-leagues" as any)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : isEditing ? "Update League" : "Create League"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default SimLeagueEdit;
