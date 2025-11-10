"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadField } from "@/components/admin/FileUploadField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFormValidation } from "@/hooks/useFormValidation";
import AdminLayout from "@/components/admin/AdminLayout";
import { serviceCategories } from "@/data/serviceCategories";
import { useAuth } from "@/contexts/AuthContext";
import { Trash2 } from "lucide-react";
import {
  getServiceById,
  updateService,
  uploadServiceImages,
  ServiceData,
} from "@/integrations/supabase/modules/services";

const ServiceEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Determine if this is admin or vendor context based on the current path
  const isVendorContext = typeof window !== 'undefined' && window.location.pathname.includes("/vendor/");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [availability, setAvailability] = useState({});

  const initialFormValues: ServiceData = {
    title: "",
    description: "",

    price: "",
    duration: "",
    availability: {},
    location: "",
    contact: "",
    category: "",
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setValue,
    setMultipleValues,
    validateForm,
  } = useFormValidation<ServiceData>(initialFormValues);

  useEffect(() => {
    if (id) {
      fetchService(id);
    }
  }, [id]);
  console.log(values.category);
  const fetchService = async (serviceId: string) => {
    try {
      setIsLoading(true);
      const { data, error, parsedData } = await getServiceById(serviceId);

      if (error) throw error;

      if (!data) {
        toast({
          title: "Error",
          description: "Service not found",
          variant: "destructive",
        });
        router.back();
        return;
      }

      if (data) {
        setMultipleValues({
          title: data.title ?? "",
          description: data.description ?? "",
          price: data.price ?? "",
          location: data.location ?? "",
          category: data.category ?? "",
          duration: data.duration ?? "",
          contact: data.contact ?? "",
          availability: (data.availability as any) ?? {},
        });
      }
      setAvailability((data.availability as any) ?? {});
      // Set existing images
      if (data.media_urls && data.media_urls.length > 0) {
        setExistingImages(data.media_urls);
      }
    } catch (error: any) {
      console.error("Error fetching service:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load service",
        variant: "destructive",
      });
      router.push(
        (isVendorContext ? "/vendor/service-management" : "/admin/services") as any
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    setValue("category", value);
  };

  const handleImagesChange = (files: File[]) => {
    setImages(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValue("availability", availability);

    if (!id) return;

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }
    if (!Object.keys(availability).length) {
      toast({
        title: "Validation Error",
        description: "Kindly add at least one time slot to your availability.",
        variant: "destructive",
      });
      return;
    }

    if (images.length === 0 && existingImages.length === 0) {
      toast({
        title: "Images Required",
        description: "Please upload at least one image for the service.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload any new images to storage
      let newImageUrls: string[] = [];

      if (images.length > 0) {
        const { urls, error: uploadError } = await uploadServiceImages(images);
        if (uploadError) throw uploadError;
        newImageUrls = urls;
      }

      // Combine existing and new images
      const allImageUrls = [...existingImages, ...newImageUrls];

      // Update the service
      const serviceData = {
        ...values,
        media_urls: allImageUrls,
        availability: availability,
      };

      const { success, error } = await updateService(id, serviceData);

      if (!success) throw error;

      toast({
        title: "Success",
        description: "Service updated successfully",
      });

      router.push(
        (isVendorContext ? "/vendor/service-management" : "/admin/services") as any
      );
    } catch (error: any) {
      console.error("Error updating service:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update service",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <AdminLayout
        title="Edit Service"
        backLink={
          isVendorContext ? "/vendor/service-management" : "/admin/services"
        }
      >
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading service data...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Edit Service"
      backLink={
        isVendorContext ? "/vendor/service-management" : "/admin/services"
      }
    >
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
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
                className={
                  errors.title && touched.title ? "border-red-500" : ""
                }
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
                  className={
                    errors.category && touched.category ? "border-red-500" : ""
                  }
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
              {errors.category && touched.category && (
                <p className="text-sm text-red-500">{errors.category}</p>
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
                className={
                  errors.price && touched.price ? "border-red-500" : ""
                }
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
            <div className="space-y-2">
              <AvailabilitySelector
                value={availability}
                onChange={setAvailability}
              />
            </div>
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
                className={
                  errors.location && touched.location ? "border-red-500" : ""
                }
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
              className={
                errors.description && touched.description
                  ? "border-red-500"
                  : ""
              }
            />
            {errors.description && touched.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Existing images */}
          {existingImages.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Images</label>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {existingImages.map((url, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-md border border-gray-200"
                  >
                    <img
                      src={url}
                      alt={`Service image ${index + 1}`}
                      className="h-full w-full rounded-md object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                      onClick={() => removeExistingImage(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <FileUploadField
            id="service-images"
            label="Add More Images"
            description="Upload additional images for this service (max 5 images, each up to 5MB)"
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
              onClick={() =>
                router.push(
                  (isVendorContext
                    ? "/vendor/service-management"
                    : "/admin/services") as any
                )
              }
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-sm-red hover:bg-sm-red-light"
            >
              {isSubmitting ? "Updating..." : "Update Service"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default ServiceEdit;

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const timeSlots = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
];

export function AvailabilitySelector({ value = {}, onChange }: { value?: Record<string, { start?: string; end?: string }>; onChange?: (value: Record<string, { start?: string; end?: string }>) => void }) {
  const [availability, setAvailability] = useState(value || {});

  useEffect(() => {
    setAvailability(value || {});
  }, [value]);

  const handleChange = (day: string, type: string, selectedValue: string) => {
    const updated = {
      ...availability,
      [day]: {
        ...availability[day],
        [type]: selectedValue,
      },
    };
    setAvailability(updated);
    onChange?.(updated);
  };

  return (
    <div className="space-y-2 text-sm">
      <h2 className="text-base font-medium">Availability</h2>

      {days.map((day) => (
        <div key={day} className="flex items-center gap-2">
          <div className="w-10">{day}</div>

          <select
            value={availability[day]?.start || ""}
            onChange={(e) => handleChange(day, "start", e.target.value)}
            className="flex-1 border rounded px-2 py-1"
          >
            <option value="">Start</option>
            {timeSlots.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>

          <select
            value={availability[day]?.end || ""}
            onChange={(e) => handleChange(day, "end", e.target.value)}
            className="flex-1 border rounded px-2 py-1"
          >
            <option value="">End</option>
            {timeSlots.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
