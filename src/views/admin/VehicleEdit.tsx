"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout  from "@/components/admin/AdminLayout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2,X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFormValidation } from "@/hooks/useFormValidation";
import { FileUploadField } from "@/components/admin/FileUploadField";
import { Vehicle } from "@/integrations/supabase/modules/vehicles";

interface VehicleFormData {
  title: string;
  category: string;
  make: string;
  model: string;
  year: string;
  price: string;
  mileage: string;
  condition: string;
  description: string;
  status: string;
  seats:string;
  fuel_type:string
}
const carCategories = [
  { value: "new-luxury-supercars", label: "New Luxury and Supercars" },
  { value: "used-luxury-cars", label: "Used Luxury Cars" },
  { value: "performance-racing", label: "Performance & Racing" },
  { value: "exotic-supercars", label: "Exotic & Supercars" },
  { value: "superbikes", label: "Superbikes" },
  { value: "vintage-classic", label: "Vintage & Classic" },
  { value: "rare-collectible", label: "Rare & Collectible" },
  { value: "campervans-rvs", label: "Campervans & RVs" },
];
const VehicleEdit = () => {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const router = useRouter();
  const { toast } = useToast();
  const isVendorContext =
    typeof window !== "undefined" && window.location.pathname.includes("/vendor/");
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const isEditing = !!id;
  
  const initialFormData: VehicleFormData = {
    title: "",
    category: "",
    make: "",
    model: "",
    year: "",
    price: "",
    mileage: "",
    condition: "",
    description: "",
    status: "Available",
    seats:"",
    fuel_type:""
  };
  
  const form = useFormValidation<VehicleFormData>(initialFormData);
  
  useEffect(() => {
    if (isEditing) {
      fetchVehicle();
    }
  }, [id]);
  
  const fetchVehicle = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select()
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        const seatsStr: string = (() => {
          if (data.seats == null) return "";
          if (typeof data.seats === 'number') return String(data.seats);
          if (typeof data.seats === 'string') return data.seats;
          return "";
        })();
        form.setMultipleValues({
          title: data.title || "",
          category: data.category || "",
          make: data.make || "",
          model: data.model || "",
          // @ts-ignore - data.year can be number or string, String() handles both
          year: data.year != null ? String(data.year) : "",
          price: data.price != null ? String(data.price) : "",
          mileage: data.mileage != null ? String(data.mileage) : "",
          condition: data.condition || "",
          description: data.description || "",
          status: data.status || "Available",
          seats: seatsStr,
          fuel_type:data.fuel_type||""
        });
        
        if (data.images && Array.isArray(data.images)) {
          setExistingImages(data.images);
        }
      }
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      toast({
        title: "Error",
        description: "Failed to load vehicle details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
   
    setLoading(true);
    
    try {
      const imageUrls: string[] = [...existingImages];
         if(!imageUrls.length && !uploadedFiles.length)
    {
 toast({
        title: "Image required",
        description: "Please upload at least one image.",
        variant: "destructive",
      });
      return
    }
    
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = `vehicles/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('vehicle-images')
            .upload(filePath, file);
          
          if (uploadError) throw uploadError;
          
          const { data } = supabase.storage.from('vehicle-images').getPublicUrl(filePath);
          imageUrls.push(data.publicUrl);
        }
      }
      console.log(form.values)
      const seatsValue: number | null = form.values.seats ? (isNaN(parseInt(form.values.seats)) ? null : parseInt(form.values.seats)) : null;
      const vehicleData = {
        title: form.values.title,
        category: form.values.category,
        make: form.values.make,
        model: form.values.model,
        year: parseInt(form.values.year),
        price: parseFloat(form.values.price),
        mileage: parseInt(form.values.mileage),
        condition: form.values.condition,
        description: form.values.description,
        images: imageUrls,
        status: form.values.status,
        seats: seatsValue,
        fuel_type: form.values.fuel_type
      } as {
        title: string;
        category: string;
        make: string;
        model: string;
        year: number;
        price: number;
        mileage: number;
        condition: string;
        description: string;
        images: string[];
        status: string;
        seats: number | null;
        fuel_type: string;
      };
      
      if (isEditing) {
        const updateData: any = {
          ...vehicleData,
          seats: vehicleData.seats,
        };
        const { error } = await supabase
          .from('vehicles')
          .update(updateData)
          .eq('id', id);
        
        if (error) throw error;
        
        // Trigger revalidation for vehicles SSG/ISR
        try {
          await fetch("/api/vehicles/revalidate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: id,
              action: "update",
            }),
          });
        } catch (revalidateError) {
          console.error("Error triggering vehicles revalidation:", revalidateError);
        }
        
        toast({
          title: "Vehicle updated",
          description: "The vehicle has been updated successfully",
        });
      } else {
        const { data: user } = await supabase.auth.getUser();
        const sellerId = user?.user?.id;
        
        const insertData: any = {
          ...vehicleData,
          seller_id: sellerId,
          seats: vehicleData.seats,
        };
        const { data: newVehicle, error } = await supabase
          .from('vehicles')
          .insert([insertData])
          .select()
          .single();
        
        if (error) throw error;
        
        // Trigger revalidation for vehicles SSG/ISR
        try {
          await fetch("/api/vehicles/revalidate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: newVehicle?.id,
              action: "create",
            }),
          });
        } catch (revalidateError) {
          console.error("Error triggering vehicles revalidation:", revalidateError);
        }
        
        toast({
          title: "Vehicle created",
          description: "The vehicle has been created successfully",
        });
      }
      
      router.push((isVendorContext ? "/vendor/vehicle-management" : "/admin/vehicles") as any);
      
    } catch (error) {
      console.error("Error saving vehicle:", error);
      toast({
        title: "Error",
        description: "Failed to save vehicle",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title={isEditing ? "Edit Vehicle" : "Create Vehicle"} backLink={isVendorContext ? "/vendor/vehicle-management" : "/admin/vehicles"}>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 gap-2 md:gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  name="title"
                  placeholder="Enter title" 
                  value={form.values.title}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                
                />
                {form.touched.title && form.errors.title && (
                  <p className="text-xs text-red-500">{form.errors.title}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  name="category"
                  value={form.values.category}
                  onValueChange={(value) => form.setValue("category", value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                   {carCategories.map((category) => (
  <SelectItem key={category.value} value={category.value}>
    {category.label}
  </SelectItem>
))}
                  </SelectContent>
                </Select>
                {form.touched.category && form.errors.category && (
                  <p className="text-xs text-red-500">{form.errors.category}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input 
                  id="make" 
                  name="make"
                  placeholder="Enter make" 
                  value={form.values.make}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
              
                />
                {form.touched.make && form.errors.make && (
                  <p className="text-xs text-red-500">{form.errors.make}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input 
                  id="model" 
                  name="model"
                  placeholder="Enter model" 
                  value={form.values.model}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
               
                />
                {form.touched.model && form.errors.model && (
                  <p className="text-xs text-red-500">{form.errors.model}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input 
                  id="year" 
                  name="year"
                  placeholder="Enter year" 
                  type="number"
                  min="1900"
                  max="2100"
                  value={form.values.year}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                
                />
                {form.touched.year && form.errors.year && (
                  <p className="text-xs text-red-500">{form.errors.year}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input 
                  id="price" 
                  name="price"
                  placeholder="Enter price" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.values.price}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}

                />
                {form.touched.price && form.errors.price && (
                  <p className="text-xs text-red-500">{form.errors.price}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mileage">Mileage</Label>
                <Input 
                  id="mileage" 
                  name="mileage"
                  placeholder="Enter mileage" 
                  type="number"
                  min="0"
                  value={form.values.mileage}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  
                />
                {form.touched.mileage && form.errors.mileage && (
                  <p className="text-xs text-red-500">{form.errors.mileage}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="seats">Seats</Label>
                <Input 
                  id="seats" 
                  name="seats"
                  placeholder="Enter Seats" 
                  type="number"
                  min="2"
                  value={form.values.seats}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  
                />
                {form.touched.seats && form.errors.seats && (
                  <p className="text-xs text-red-500">{form.errors.seats}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuel type">Fuel Type</Label>
                <Select
                  name="fuel_type"
                  value={form.values.fuel_type}
                  onValueChange={(value) => form.setValue("fuel_type", value)}
                >
                  <SelectTrigger id="fuel_type">
                    <SelectValue placeholder="Select fuel_type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gasoline">Gasoline</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="CNG">CNG</SelectItem>
                    <SelectItem value="LPG">LPG</SelectItem>
                    <SelectItem value="Bio Diesel">Bio Diesel</SelectItem>
                   
                  </SelectContent>
                </Select>
                {form.touched.fuel_type && form.errors.fuel_type && (
                  <p className="text-xs text-red-500">{form.errors.fuel_type}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select
                  name="condition"
                  value={form.values.condition}
                  onValueChange={(value) => form.setValue("condition", value)}
                >
                  <SelectTrigger id="condition">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                    <SelectItem value="restored">Restored</SelectItem>
                    <SelectItem value="project">Project Car</SelectItem>
                  </SelectContent>
                </Select>
                {form.touched.condition && form.errors.condition && (
                  <p className="text-xs text-red-500">{form.errors.condition}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  name="status"
                  value={form.values.status}
                  onValueChange={(value) => form.setValue("status", value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Reserved">Reserved</SelectItem>
                    <SelectItem value="Sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description"
                placeholder="Enter vehicle description" 
                rows={4} 
                value={form.values.description}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
              />
               {form.touched.description && form.errors.description && (
                  <p className="text-xs text-red-500">{form.errors.description}</p>
                )}
            </div>
            
            
            <div className="space-y-2">
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <Label>Existing Images</Label>
                  <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {existingImages.map((imageUrl, index) => (
                      <div key={index} className="relative aspect-square rounded-md border border-gray-200 bg-gray-50">
                        <img 
                          src={imageUrl} 
                          alt={`Vehicle ${index}`} 
                          className="h-full w-full rounded-md object-cover" 
                        />
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon" 
                          className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                          onClick={() => {
                            const newImages = [...existingImages];
                            newImages.splice(index, 1);
                            setExistingImages(newImages);
                          }}
                        >
                          {/* <Check className="h-4 w-4" /> */}
                           <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <FileUploadField
                id="vehicle-images"
                label="Add Vehicle Images"
                description="Upload up to 10 images. Supported formats: JPG, PNG, WEBP."
                accept="image/jpeg, image/png, image/webp"
                multiple={true}
                maxFiles={10}
                onChange={setUploadedFiles}
                value={uploadedFiles}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push((isVendorContext ? "/vendor/vehicle-management" : "/admin/vehicles") as any)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-sm-red hover:bg-sm-red-light" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {isEditing ? "Update Vehicle" : "Create Vehicle"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default VehicleEdit;