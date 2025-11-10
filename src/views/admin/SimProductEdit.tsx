
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { simRacingApi } from "@/integrations/supabase/modules/simRacing";
import { FileUploadField } from "@/components/admin/FileUploadField";
import { Check, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
import { Label } from "@/components/ui/label";

const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().positive("Price must be greater than 0"),
  stock: z.number().int().nonnegative("Stock must be 0 or greater"),
  brand: z.string().min(1, "Brand is required"),
  category: z.string().min(1, "Category is required"),
});

type ProductFormValues = z.infer<typeof productSchema>;

const productCategories = [
  { value: "racing-gear", label: "Racing Gear" },
  { value: "sim-equipment", label: "Sim Equipment" },
  { value: "software", label: "Software" },
  { value: "peripherals", label: "Peripherals" },
  { value: "accessories", label: "Accessories" },
  { value: "wheels", label: "Racing Wheels" },
  { value: "pedals", label: "Racing Pedals" },
  { value: "cockpits", label: "Racing Cockpits" },
  { value: "monitors", label: "Monitors & Displays" },
  { value: "shifters", label: "Shifters & Handbrakes" },
];

const SimProductEdit = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [existingImageUrl, setExistingImageUrl] = useState<string[]>([]);
  const isEditMode = !!id;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock: 0,
      brand: "",
      category: "",
    },
  });

  useEffect(() => {
    if (isEditMode) {
      fetchProductDetails();
    }
  }, [id]);

  const fetchProductDetails = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await simRacingApi.shop.getProductById(id);
      
      if (error) throw error;
      if (!data) throw new Error("Product not found");

      form.reset({
        name: data.name,
        description: data.description || "",
        price: data.price,
        stock: data.stock || 0,
        brand: data.brand || "",
        category: data.category || "",
      });

      if (data.image_url) {
        setExistingImageUrl(data.image_url);
      }
    } catch (error: unknown) {
      console.error("Error fetching product details:", error);
      toast({
        title: "Error",
        description: "Failed to load product details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: ProductFormValues) => {
    try {
      setIsLoading(true);
      const productImageUrls = [...existingImageUrl];

      // Upload images if there are new files
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const fileExt = file.name.split(".").pop();
          const filePath = `sim-products/${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          const { error: uploadError, data } = await supabase.storage
            .from("product-images")
            .upload(filePath, file);
          
          if (uploadError) throw uploadError;
          
          const { data: urlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(filePath);
          
          productImageUrls.push(urlData.publicUrl);
        }
      }

      const productData = {
        name: values.name,
        description: values.description,
        price: values.price,
        stock: values.stock,
        brand: values.brand,
        category: values.category,
        image_url: productImageUrls,
      };

      if (isEditMode) {
        if (!id) {
          throw new Error("Product ID is required for editing");
        }
        const { error } = await simRacingApi.shop.updateProduct(id, productData);
        if (error) throw error;

        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        const { error } = await simRacingApi.shop.createProduct(productData);
        if (error) throw error;

        toast({
          title: "Success",
          description: "Product created successfully",
        });
      }

      router.push("/admin/sim-products" as any);
    } catch (error: unknown) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeExistingImage = (index: number) => {
    const newImages = [...existingImageUrl];
    newImages.splice(index, 1);
    setExistingImageUrl(newImages);
  };

  return (
    <AdminLayout 
      title={isEditMode ? "Edit Sim Racing Product" : "Create Sim Racing Product"} 
      backLink="/admin/sim-products"
    >
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? "Edit Product" : "Create New Product"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter brand name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {productCategories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          min="0" 
                          step="0.01"
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          min="0" 
                          step="1"
                          onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter product description" 
                        className="min-h-32" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Product Images</FormLabel>
                <div className="space-y-4">
                  {existingImageUrl.length > 0 && (
                    <div className="mb-4">
                      <Label>Existing Images</Label>
                      <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {existingImageUrl.map((imageUrl, index) => (
                          <div key={index} className="relative aspect-square rounded-md border border-gray-200 bg-gray-50">
                            <img 
                              src={imageUrl} 
                              alt={`Product ${index}`} 
                              className="h-full w-full rounded-md object-cover" 
                            />
                            <Button 
                              type="button" 
                              variant="destructive" 
                              size="icon" 
                              className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                              onClick={() => removeExistingImage(index)}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <FileUploadField
                    id="product-image"
                    accept="image/jpeg, image/png, image/webp"
                    description="Upload product images. Supported formats: JPG, PNG, WEBP"
                    onChange={setUploadedFiles}
                    multiple={true}
                    label=""
                    maxFiles={10}
                    value={uploadedFiles}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/admin/sim-products' as any)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      {isEditMode ? "Update Product" : "Create Product"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default SimProductEdit;
