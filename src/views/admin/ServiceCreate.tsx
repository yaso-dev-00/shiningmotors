"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadField } from "@/components/admin/FileUploadField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFormValidation } from "@/hooks/useFormValidation";
import AdminLayout from "@/components/admin/AdminLayout";
import { serviceCategories } from "@/data/serviceCategories";
import { useAuth } from "@/contexts/AuthContext";
import {
  createService,
  uploadServiceImages,
  ServiceData
} from "@/integrations/supabase/modules/services";
import { AvailabilitySelector } from "./ServiceEdit";

const ServiceCreate = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
const [availability, setAvailability] = useState({});

  
  const initialFormValues: ServiceData = {
    title: "",
    description: "",
    price: "",
    duration: "",
    availability: {},
    location: "",
    contact: "",
    category: ""
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setValue,
    validateForm
  } = useFormValidation<ServiceData>(initialFormValues);

  const handleCategoryChange = (value: string) => {
    setValue("category", value);
  };

  const handleImagesChange = (files: File[]) => {
    setImages(files);
  };
console.log(errors,values)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
     setValue('availability',availability)
    
    // Make sure required fields are provided
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }
    if(!Object.keys(availability).length)
     {
      toast({
        title: "Validation Error",
        description: "Kindly add at least one time slot to your availability.",
        variant: "destructive",
      });
      return 
     }

    if (images.length === 0) {
      toast({
        title: "Images Required",
        description: "Please upload at least one image for the service.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create services.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload images to storage
      const { urls: imageUrls, error: uploadError } = await uploadServiceImages(images);
      
      if (uploadError) throw uploadError;
      
      // Create the service post
      const serviceData = {
        ...values,
        media_urls: imageUrls,
        availability:availability
      };
      
      const { data, error } = await createService(serviceData, user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service created successfully",
      });

      router.back();
    } catch (error: any) {
      console.error("Error creating service:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create service",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Create Service" backLink="/admin/services">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="title">
                  Service Title *
                </label>
                <Input
                  id="title"
                  name="title"
                  value={values.title}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter service title"
                  className={errors.title && touched.title ? "border-red-500" : ""}
                />
                {errors.title && touched.title && (
                  <p className="text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="categoryId">
                  Category *
                </label>
                <Select
                  value={values.category}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger 
                    className={errors.category && touched.category ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && touched.categoryId && (
                  <p className="text-sm text-red-500">{errors.categoryId}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="price">
                  Price Range *
                </label>
                <Input
                  id="price"
                  name="price"
                  value={values.price}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. ₹1000-₹5000"
                  className={errors.price && touched.price ? "border-red-500" : ""}
                />
                {errors.price && touched.price && (
                  <p className="text-sm text-red-500">{errors.price}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="duration">
                  Duration
                </label>
                <Input
                  id="duration"
                  name="duration"
                  value={values.duration}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. 1-2 hours"
                />
              </div>
             
<AvailabilitySelector value={availability} onChange={setAvailability} />
              {/* <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="availability">
                  Availability
                </label>
                <Input
                  id="availability"
                  name="availability"
                  value={values.availability}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. Mon-Fri : 9am-5pm"
                />
              </div> */}

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="location">
                  Location *
                </label>
                <Input
                  id="location"
                  name="location"
                  value={values.location}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. Mumbai, Delhi"
                  className={errors.location && touched.location ? "border-red-500" : ""}
                />
                {errors.location && touched.location && (
                  <p className="text-sm text-red-500">{errors.location}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="contact">
                  Contact Information
                </label>
                <Input
                  id="contact"
                  name="contact"
                  value={values.contact}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Phone, email, or website"
                />
              </div>
            </div>
      

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="description">
              Description *
            </label>
            <Textarea
              id="description"
              name="description"
              value={values.description}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={5}
              placeholder="Describe the service in detail"
              className={errors.description && touched.description ? "border-red-500" : ""}
            />
            {errors.description && touched.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <FileUploadField
            id="service-images"
            label="Service Images *"
            description="Upload images for this service (max 5 images, each up to 5MB)"
            accept="image/jpeg, image/png, image/webp"
            multiple={true}
            maxFiles={5}
            onChange={handleImagesChange}
            value={images}
          />

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/services" as any)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-sm-red hover:bg-sm-red-light"
            >
              {isSubmitting ? "Creating..." : "Create Service"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default ServiceCreate;
