import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Upload, X, Check, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { shopApi, supabase } from "@/integrations/supabase/client";

// Input schema for form (accepts strings from HTML inputs)
const formInputSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  price: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Price must be a positive number"),
  inventory: z.string().refine((val) => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num >= 0;
  }, "Inventory must be 0 or higher"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formInputSchema>;

const productCategories = [
  "Performance Parts",
  "OEM Parts",
  "Exterior",
  "Interior",
  "Lighting",
  "Wheels & Tires",
  "Electronics",
  "Tools",
  "Accessories",
];

const ProductCreate = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formInputSchema),
    defaultValues: {
      name: "",
      price: "0",
      inventory: "0",
      category: "",
      description: "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newFiles = Array.from(e.target.files);
    
    if (imageFiles.length + newFiles.length > 5) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 5 images",
        variant: "destructive",
      });
      return;
    }
    
    for (const file of newFiles) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Images must be less than 2MB each",
          variant: "destructive",
        });
        return;
      }
    }
    
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    
    setImageFiles(prev => [...prev, ...newFiles]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to create products",
        variant: "destructive",
      });
      return;
    }
    
    if (imageFiles.length === 0) {
      toast({
        title: "Images required",
        description: "Please upload at least one product image",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const imageUrls: string[] = [];
      
      for (const file of imageFiles) {
        const fileName = `product_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const { data: fileData, error: fileError } = await supabase.storage
          .from('products')
          .upload(`images/${fileName}`, file);
          
        if (fileError) throw fileError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(`images/${fileName}`);
          
        imageUrls.push(publicUrl);
      }
      
      const { data: product, error } = await shopApi.products.insert({
        name: values.name,
        price: parseFloat(values.price),
        inventory: parseInt(values.inventory, 10),
        category: values.category,
        description: values.description || "",
        seller_id: user.id,
        images: imageUrls,
      });
      
      if (error) throw error;
      
      toast({
        title: "Product created",
        description: "Your product has been successfully created",
      });
      
      router.push("/admin/products" as any);
      
    } catch (error: unknown) {
      console.error("Error creating product:", error);
      toast({
        title: "Creation failed",
        description: "Failed to create the product",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-2"
            onClick={() => router.push("/admin/products" as any)}
          >
            <ArrowLeft size={18} className="mr-2" /> Back to Products
          </Button>
          <h1 className="text-3xl font-bold">Create New Product</h1>
        </div>
        
        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="inventory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inventory</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="0"
                              {...field}
                            />
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
                          <FormLabel>Category</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {productCategories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter product description"
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide detailed information about the product, compatibility, features, etc.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <FormLabel>Images (Max 5)</FormLabel>
                    <div className="mt-1 grid grid-cols-3 gap-4 md:grid-cols-5">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-square rounded-md bg-gray-100">
                          <img
                            src={preview}
                            alt={`Product preview ${index + 1}`}
                            className="h-full w-full rounded-md object-cover"
                          />
                          <button
                            type="button"
                            className="absolute right-1 top-1 rounded-full bg-black bg-opacity-60 p-1 text-white hover:bg-opacity-80"
                            onClick={() => removeImage(index)}
                          >
                            <X size={14} />
                          </button>
                          {index === 0 && (
                            <span className="absolute bottom-1 left-1 rounded bg-black bg-opacity-60 px-1.5 py-0.5 text-xs text-white">
                              Main
                            </span>
                          )}
                        </div>
                      ))}
                      
                      {imagePreviews.length < 5 && (
                        <div className="flex aspect-square items-center justify-center rounded-md border-2 border-dashed border-gray-300 hover:border-gray-400">
                          <label className="flex cursor-pointer flex-col items-center justify-center">
                            <Upload className="mb-2 h-8 w-8 text-gray-400" />
                            <span className="text-xs font-medium text-gray-600">Add Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageChange}
                              multiple={true}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/admin/products" as any)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-sm-red hover:bg-sm-red-light"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Create Product
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-medium">Publishing Tips</h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Check size={18} className="mt-0.5 text-green-500" />
                  <span>Use clear, descriptive product names</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={18} className="mt-0.5 text-green-500" />
                  <span>Include all compatible vehicle models</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={18} className="mt-0.5 text-green-500" />
                  <span>List all specifications and dimensions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={18} className="mt-0.5 text-green-500" />
                  <span>Add high-quality images from multiple angles</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={18} className="mt-0.5 text-green-500" />
                  <span>Set competitive pricing based on market research</span>
                </li>
              </ul>
            </div>
            
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
              <div className="flex items-start gap-2">
                <AlertCircle size={20} className="mt-0.5 text-yellow-600" />
                <div>
                  <h3 className="font-medium text-yellow-800">Product Review Process</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Your product may undergo a brief review before becoming visible in the main shop. This helps ensure quality listings for all users.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProductCreate;
