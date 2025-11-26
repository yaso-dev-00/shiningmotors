"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { simRacingApi, SimGarage } from "@/integrations/supabase/modules/simRacing";
import { useQuery } from "@tanstack/react-query";

// Schema for form validation (input schema - string for services_offered)
const formInputSchema = z.object({
  name: z.string().min(1, "Garage name is required"),
  logo: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  services_offered: z.string().optional(),
});

type FormValues = z.infer<typeof formInputSchema>;

const SimGarageEdit = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isEditing = !!id;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch garage data if editing
  const { data: garage, isLoading } = useQuery({
    queryKey: ["simGarage", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await simRacingApi.garages.getById(id);
      if (error) {
        console.error("Error fetching garage:", error);
        return null;
      }
      return data;
    },
    enabled: isEditing,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formInputSchema),
    defaultValues: {
      name: "",
      logo: "",
      city: "",
      state: "",
      country: "",
      phone: "",
      email: "",
      website: "",
      services_offered: "",
    },
  });

  // Update form values when garage data is loaded
  useEffect(() => {
    if (garage) {
      form.reset({
        name: garage.name || "",
        logo: garage.logo || "",
        city: garage.city || "",
        state: garage.state || "",
        country: garage.country || "",
        phone: garage.phone || "",
        email: garage.email || "",
        website: garage.website || "",
        services_offered: garage.services_offered ? garage.services_offered.join(', ') : "",
      });
    }
  }, [garage, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Transform services_offered from string to array
      const servicesArray = values.services_offered
        ? values.services_offered.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : [];
      
      // Convert form values to garage data
      const garageData: Partial<SimGarage> = {
        name: values.name,
        logo: values.logo || null,
        city: values.city || null,
        state: values.state || null,
        country: values.country || null,
        phone: values.phone || null,
        email: values.email || null,
        website: values.website || null,
        services_offered: servicesArray,
      };

      if (isEditing && id) {
        await simRacingApi.garages.update(id, garageData);
        toast({
          title: "Garage Updated",
          description: "The garage has been successfully updated.",
        });
      } else {
        await simRacingApi.garages.create(garageData as any);
        toast({
          title: "Garage Created",
          description: "The new garage has been successfully created.",
        });
      }

      router.push("/admin/sim-garages" as any);
    } catch (error: unknown) {
      console.error("Error saving garage:", error);
      toast({
        title: "Error",
        description: "There was an error saving the garage. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Loading Garage...">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title={isEditing ? "Edit Sim Racing Garage" : "Create Sim Racing Garage"}
      backLink="/admin/sim-garages"
    >
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                {/* Garage Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Garage Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter garage name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Logo URL */}
                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/logo.png" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* City */}
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* State */}
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input placeholder="State/Province" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Country */}
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Website */}
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Services Offered */}
              <FormField
                control={form.control}
                name="services_offered"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Services Offered</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter services offered, separated by commas" 
                        className="min-h-[80px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Enter services separated by commas (e.g., "Setup Consultation, Driver Coaching, Race Strategy")
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push("/admin/sim-garages" as any)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : isEditing ? "Update Garage" : "Create Garage"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default SimGarageEdit;
