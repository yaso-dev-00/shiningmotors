"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  FileTerminal,
  Loader2,
  X,
  AlertCircle,
  Camera,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFormValidation } from "@/hooks/useFormValidation";
import { FileUploadField } from "@/components/admin/FileUploadField";
import VideoCropper from "@/components/VideoCropper";

const productCategories = [
  { value: "oem-parts", label: "OEM Parts" },
  { value: "performance-racing-parts", label: "Performance & Racing Parts" },
  { value: "interior", label: "Interior" },
  { value: "exterior", label: "Exterior" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "clearance", label: "Clearance" },
];

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { shopApi } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ImageIcon } from "lucide-react";
import { categoryData } from "@/data/products";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const productSchema = z.object({
  name: z.string().min(2, {
    message: "Product name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  price: z.number().min(10, {
    message: "Price must be greater than 0.",
  }),
  category: z.string().min(1, {
    message: "Category must be selected.",
  }),
  inventory: z.number().min(0, {
    message: "Inventory must be 0 or greater.",
  }),
  images: z.array(z.string()).min(1, {
    message: "At least one image is required.",
  }),
  status: z.enum(["on sale", "upcoming"]).optional(),
  subCategory: z.string().min(1, {
    message: "subCategory must be selected.",
  }),
  parts: z.string().min(1, {
    message: "parts must be selected.",
  }),
  weight: z.number().min(0.01, {
    message: "Weight must be greater than 0.",
  }),
  length: z.number().min(0.01, {
    message: "Length must be greater than 0.",
  }),
  breadth: z.number().min(0.01, {
    message: "Breadth must be greater than 0.",
  }),
  height: z.number().min(0.01, {
    message: "Height must be greater than 0.",
  }),
  pickup_postcode: z.string().min(1, {
    message: "Pickup postcode is required.",
  }),
  gst_percentage: z.number().min(0).max(100, {
    message: "GST percentage must be between 0 and 100.",
  }),
});

type ProductFormData = z.infer<typeof productSchema>;

const ProductEdit = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingPostMedia, setExistingPostMedia] = useState<string[]>([]);
  const isEditing = !!id;
  const [category, setCategory] = useState("");
  const [postToSocial, setPostToSocial] = useState(true);
  const [socialDescription, setSocialDescription] = useState("");
  const [existingPostId, setExistingPostId] = useState<string | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [hasFetchedProduct, setHasFetchedProduct] = useState(false);

  // Detect if we're in vendor context
  const isVendorContext = typeof window !== 'undefined' && window.location.pathname.includes("/vendor/");

  // Aspect ratio states for social media posts
  const [imageAspectRatio, setImageAspectRatio] = useState<
    "1:1" | "4:5" | "9:16"
  >("1:1");
  const [videoAspectRatio, setVideoAspectRatio] = useState<
    "1:1" | "4:5" | "9:16"
  >("1:1");
  const [cropParams, setCropParams] = useState<{
    [index: number]: {
      cropX: number;
      cropY: number;
      cropWidth: number;
      cropHeight: number;
    };
  }>({});
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [productFilters, setProductFilters] = useState<
    Record<string, string[]>
  >({});
  const [existingFilters, setExistingFilters] = useState<
    Record<string, string[]>
  >({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>(
    {}
  );
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const [editingOption, setEditingOption] = useState<{
    filterName: string;
    option: string;
  } | null>(null);
  const [newOptionInput, setNewOptionInput] = useState<{
    filterName: string;
    value: string;
  } | null>(null);

  const handleFilterChange = (
    filterName: string,
    option: string,
    checked: boolean
  ) => {
    setProductFilters((prev) => {
      const currentOptions = prev[filterName] || [];
      if (checked) {
        return {
          ...prev,
          [filterName]: [...currentOptions, option],
        };
      } else {
        return {
          ...prev,
          [filterName]: currentOptions.filter((opt) => opt !== option),
        };
      }
    });
  };

  const startAddingOption = (filterName: string) => {
    setNewOptionInput({ filterName, value: "" });
  };

  const saveNewOption = () => {
    if (newOptionInput && newOptionInput.value.trim()) {
      setProductFilters((prev) => ({
        ...prev,
        [newOptionInput.filterName]: [
          ...(prev[newOptionInput.filterName] || []),
          newOptionInput.value.trim(),
        ],
      }));
      setNewOptionInput(null);
    }
  };

  const cancelNewOption = () => {
    setNewOptionInput(null);
  };

  const startEditingOption = (filterName: string, option: string) => {
    setEditingOption({ filterName, option });
  };

  const saveEditedOption = (newValue: string) => {
    if (editingOption && newValue.trim() && newValue !== editingOption.option) {
      setProductFilters((prev) => {
        const currentOptions = prev[editingOption.filterName] || [];
        const updatedOptions = currentOptions.map((opt) =>
          opt === editingOption.option ? newValue.trim() : opt
        );
        return {
          ...prev,
          [editingOption.filterName]: updatedOptions,
        };
      });
    }
    setEditingOption(null);
  };

  const cancelEditingOption = () => {
    setEditingOption(null);
  };

  const initialFormData: ProductFormData = {
    name: "",
    category: "",
    description: "",
    price: 1,
    inventory: 2,
    images: [],
    status: "on sale",
    subCategory: "",
    parts: "",
    weight: 1,
    length: 1,
    breadth: 1,
    height: 1,
    pickup_postcode: "",
    gst_percentage: 0,
  };

  const form = useFormValidation(initialFormData);
  const formRef = useRef(form);

  // Update form ref when form changes
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const {
    subCategoryOptions,
    selectedSubCategory,
    updateSubCategory,
    itemOptions,
    selectedItem,
    setSelectedItem,
    setSelectedSubCategory,
    setItemOptions,
    filters,
  } = useSubcategoryLogic(form.values.category, form);

  // Function to convert aspect ratio string to number
  const getAspectRatioNumber = (ratio: "1:1" | "9:16" | "4:5"): number => {
    switch (ratio) {
      case "1:1":
        return 1;
      case "9:16":
        return 9 / 16;
      case "4:5":
        return 4 / 5;
      default:
        return 1;
    }
  };

  // Helper function to safely set aspect ratio based on media type
  const setAspectRatio = (ratio: "1:1" | "9:16" | "4:5") => {
    setImageAspectRatio(ratio);
    setVideoAspectRatio(ratio);
    // Don't reset crop params when aspect ratio changes in modal
    // setCropParams({});
  };

  // Function to get cropped image blob
  const getCroppedImg = (
    imageSrc: string,
    crop: {
      cropX: number;
      cropY: number;
      cropWidth: number;
      cropHeight: number;
    }
  ) => {
    return new Promise((resolve, reject) => {
      const image = typeof window !== 'undefined' ? new window.Image() : ({} as HTMLImageElement);
      image.src = imageSrc;
      image.crossOrigin = "anonymous";
      image.onload = () => {
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        const canvas = document.createElement("canvas");
        canvas.width = crop.cropWidth;
        canvas.height = crop.cropHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(
          image,
          crop.cropX * scaleX,
          crop.cropY * scaleY,
          crop.cropWidth * scaleX,
          crop.cropHeight * scaleY,
          0,
          0,
          crop.cropWidth,
          crop.cropHeight
        );
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas is empty"));
        }, "image/png");
      };
      image.onerror = (err) => reject(err);
    });
  };

  // Helper component for field labels with error indicators
  const FieldLabel = ({
    htmlFor,
    children,
    hasError,
  }: {
    htmlFor: string;
    children: React.ReactNode;
    hasError?: boolean;
  }) => (
    <Label
      htmlFor={htmlFor}
      className={`flex items-center gap-2 ${hasError ? "text-red-500" : ""}`}
    >
      {children}
      {hasError && <AlertCircle className="h-4 w-4 text-red-500" />}
    </Label>
  );

  // Custom validation function for physical properties and GST percentage
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = parseFloat(value);
    let errorMessage = "";

    // Field labels for better error messages
    const fieldLabels: Record<string, string> = {
      weight: "Weight",
      length: "Length",
      breadth: "Breadth",
      height: "Height",
      gst_percentage: "GST Percentage",
    };

    const fieldLabel = fieldLabels[name] || name;

    // Validate physical properties
    if (
      name === "weight" ||
      name === "length" ||
      name === "breadth" ||
      name === "height"
    ) {
      if (value !== "" && (isNaN(numericValue) || numericValue <= 0)) {
        errorMessage = `${fieldLabel} must be greater than 0`;
      }
    }

    // Validate GST percentage
    if (name === "gst_percentage") {
      if (
        value !== "" &&
        (isNaN(numericValue) || numericValue < 0 || numericValue > 100)
      ) {
        errorMessage = `${fieldLabel} must be between 0 and 100`;
      }
    }

    // Set error in form state if validation fails
    if (errorMessage) {
      // Set the field as touched to show the error
      form.setTouched({ ...form.touched, [name]: true });
      // Set the error
      form.setErrors({ ...form.errors, [name]: errorMessage });
      return;
    }

    // Clear error if validation passes
    if (form.errors[name]) {
      const newErrors = { ...form.errors };
      delete newErrors[name];
      form.setErrors(newErrors);
    }

    // Convert to number and update form
    const numericValueForForm = value === "" ? "" : numericValue;
    form.setValue(name, numericValueForForm);
  };

  type Post = {
    id: string;
    title: string;
    content: string;
    product_id: string;
  };

  const fetchProduct = useCallback(async () => {
    if (!id) return;

    const vendorContext = typeof window !== "undefined" && window.location.pathname.includes("/vendor/");

    setLoading(true);
    setHasFetchedProduct(true);
    try {
      let data: Record<string, unknown> | null = null;
      let existingPost: { id: string; content?: string; media_urls?: string[] } | null = null;

      if (vendorContext) {
        const headers: HeadersInit = { "Content-Type": "application/json", "Cache-Control": "no-cache" };
        if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
        const res = await fetch(`/api/vendor/products/${id}?_t=${Date.now()}`, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
          headers,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (res.status === 404) throw new Error("Product not found");
          throw new Error(body?.error || "Failed to fetch product");
        }
        const body = await res.json();
        data = body?.data?.product ?? null;
        existingPost = body?.data?.existingPost ?? null;
      } else {
        const { data: productData, error } = await supabase
          .from("products")
          .select()
          .eq("id", id)
          .single();
        if (error) throw error;
        data = productData;
        const postsResult = await supabase.from("posts").select("*").eq("product_id", id);
        if (postsResult.data && postsResult.data.length > 0) {
          existingPost = postsResult.data[0] as { id: string; content?: string; media_urls?: string[] };
        }
      }

      if (data) {
        const name = String(data.name || "");
        const categoryStr = String(data.category || "");
        const description = String(data.description || "");
        const subCategoryStr = String(data.subCategory || "");
        const partsStr = String(data.parts || "");

        const productData = {
          name,
          category: categoryStr,
          description,
          price: Number(data.price) || 1,
          inventory: Number(data.inventory) || 0,
          status: ((data.status as string) as "on sale" | "upcoming") || "on sale",
          subCategory: subCategoryStr,
          parts: partsStr,
          weight: Number((data as any).weight) || 1,
          length: Number((data as any).length) || 1,
          breadth: Number((data as any).breadth) || 1,
          height: Number((data as any).height) || 1,
          pickup_postcode: String((data as any).pickup_postcode || ""),
          gst_percentage: Number((data as any).gst_percentage) || 1,
        };

        formRef.current.setMultipleValues(productData);
        setCategory(categoryStr);
        setSelectedSubCategory(subCategoryStr);
        setSelectedItem(partsStr);
        formRef.current.setValue("parts", partsStr);

        const categoryInfo = categoryData[categoryStr as keyof typeof categoryData];
        const subCategoryKey = subCategoryStr || "";
        const items = categoryInfo?.subCategories ? (categoryInfo.subCategories as Record<string, string[]>)[subCategoryKey] || [] : [];
        setItemOptions(items);

        if (existingPost) {
          setExistingPostId(existingPost.id);
          setSocialDescription(existingPost.content || "");
          setPostToSocial(true);
          if (existingPost.media_urls && Array.isArray(existingPost.media_urls)) {
            setExistingPostMedia(existingPost.media_urls);
          }
        }

        if (data.images && Array.isArray(data.images)) {
          setExistingImages(data.images);
        }
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast({
        title: "Error",
        description: "Failed to load product details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast, session?.access_token, setSelectedSubCategory, setSelectedItem, setItemOptions]);

  useEffect(() => {
    if (isEditing) {
      fetchProduct();
    }
  }, [id, isEditing, fetchProduct]);

  // Load existing filters from Filters table when category changes
  useEffect(() => {
    const loadExistingFilters = async () => {
      if (category) {
        try {
          const { data: filterData, error } = await supabase
            .from("Filters")
            .select("filters")
            .eq("category", category)
            .single();

          if (error && error.code !== "PGRST116") {
            // PGRST116 = no rows found
            console.error("Error loading existing filters:", error);
            return;
          }

          if (filterData?.filters) {
            setExistingFilters(filterData.filters as Record<string, string[]>);
          }
        } catch (error) {
          console.error("Error loading existing filters:", error);
        }
      }
    };

    loadExistingFilters();
  }, [category]);

  // Load existing product filters when editing and category is available
  const loadExistingProductFilters = useCallback(async () => {
    if (!id || !category) return;

    try {
      const { data: filterData, error } = await supabase
        .from("Filters")
        .select("product_ids")
        .eq("category", category)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading product filters:", error);
        return;
      }

      const productIds = (filterData as any)?.product_ids as Record<string, Record<string, string[]>> | undefined;
      if (productIds) {
        const productFilters: Record<string, string[]> = {};

        // Find which filter options this product is associated with
        Object.entries(productIds).forEach(([filterName, options]) => {
          const productOptions: string[] = [];
          Object.entries(options).forEach(([option, productList]: [string, string[]]) => {
            if (productList.includes(id)) {
              productOptions.push(option);
            }
          });
          if (productOptions.length > 0) {
            productFilters[filterName] = productOptions;
          }
        });

        console.log("Loading existing product filters:", productFilters);
        setProductFilters(productFilters);
      }
    } catch (error) {
      console.error("Error loading product filters:", error);
    }
  }, [id, category]);

  useEffect(() => {
    if (isEditing && category && id) {
      loadExistingProductFilters();
    }
  }, [isEditing, category, id, loadExistingProductFilters]);

  // Reset fetch flag when id changes
  useEffect(() => {
    setHasFetchedProduct(false);
  }, [id]);

  // Prevent any automatic form submission
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const fetchFilters = useCallback(async (category: string) => {
    const { data: filters, error } = await supabase
      .from("Filters")
      .select()
      .eq("category", category);
    if (error) throw error;

    if (filters.length && filters[0].filters) {
      const filterData = filters[0].filters as Record<string, unknown>;
      setSelectedOptions(
        Object.assign({}, filterData, { current: filterData })
      );
      setCurrentFilters(filterData);
    } else {
      setSelectedOptions({ current: {} });
      setCurrentFilters({});
    }
  }, []);

  useEffect(() => {
    if (category) fetchFilters(category);
  }, [category, fetchFilters]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  const handleFilterCreation = async (productId: string) => {
    // Ensure selectedOptions has proper structure before processing
    const sanitizedSelectedOptions = { ...selectedOptions };
    Object.keys(sanitizedSelectedOptions).forEach((key) => {
      if (!Array.isArray(sanitizedSelectedOptions[key])) {
        console.warn(
          `Converting ${key} to array:`,
          sanitizedSelectedOptions[key]
        );
        sanitizedSelectedOptions[key] = [];
      }
    });

    const { data: filters, error } = await supabase
      .from("Filters")
      .select()
      .eq("category", form.values.category);
    if (error) throw error;

    if (filters.length != 0) {
      // Get existing filter data
      const existingFilters = filters[0].filters as Record<string, string[]>;
      const existingProductIds =
        (filters[0].product_ids as Record<string, Record<string, string[]>>) ||
        {};

      // Ensure existingFilters has proper structure
      Object.keys(existingFilters).forEach((key) => {
        if (!Array.isArray(existingFilters[key])) {
          console.warn(
            `Converting existingFilters[${key}] to array:`,
            existingFilters[key]
          );
          existingFilters[key] = [];
        }
      });

      // Create new filter structure with product IDs
      const updatedFilters = { ...existingFilters };
      const updatedProductIds = { ...existingProductIds };

      // Update each filter category
      Object.keys(sanitizedSelectedOptions).forEach((filterName) => {
        const selectedValues = sanitizedSelectedOptions[filterName];

        // Ensure selectedValues is an array
        if (!Array.isArray(selectedValues)) {
          console.warn(
            `selectedValues for ${filterName} is not an array:`,
            selectedValues
          );
          return;
        }

        // Update filter values (remove duplicates)
        const existingValues = Array.isArray(existingFilters[filterName])
          ? existingFilters[filterName]
          : [];
        const combinedValues = Array.from(
          new Set([...existingValues, ...selectedValues])
        );
        updatedFilters[filterName] = combinedValues;

        // Update product IDs for each filter value
        if (!updatedProductIds[filterName]) {
          updatedProductIds[filterName] = {};
        }

        selectedValues.forEach((value) => {
          if (!updatedProductIds[filterName][value]) {
            updatedProductIds[filterName][value] = [];
          }
          // Add current product ID if not already present
          if (!updatedProductIds[filterName][value].includes(productId)) {
            updatedProductIds[filterName][value].push(productId);
          }
        });
      });

      const { error } = await supabase
        .from("Filters")
        .update({
          filters: updatedFilters,
          product_ids: updatedProductIds,
        })
        .eq("category", form.values.category);
      if (error) {
        console.error("Error updating filters:", error);
        throw error;
      }
    } else {
      // Create new filter structure with product IDs
      const newFilters = { ...sanitizedSelectedOptions };
      const newProductIds: Record<string, Record<string, string[]>> = {};

      // Create product_ids structure
      Object.keys(sanitizedSelectedOptions).forEach((filterName) => {
        const selectedValues = sanitizedSelectedOptions[filterName];
        // Ensure selectedValues is an array
        if (!Array.isArray(selectedValues)) {
          console.warn(
            `selectedValues for ${filterName} is not an array:`,
            selectedValues
          );
          return;
        }

        newProductIds[filterName] = {};

        selectedValues.forEach((value) => {
          newProductIds[filterName][value] = [productId];
        });
      });

      const { error } = await supabase.from("Filters").insert({
        filters: newFilters,
        product_ids: newProductIds,
        category: form.values.category,
      });
      if (error) {
        console.error("Error creating filters:", error);
        throw error;
      }
    }
  };

  const handleManualSubmit = async () => {
    // Prevent multiple submissions
    if (isFormSubmitting || loading) {
      return;
    }

    // Don't set loading state yet - validate first
    setIsFormSubmitting(true);

    // Convert string values to numbers for validation and include actual images
    const formDataWithNumbers = {
      ...form.values,
      price: parseFloat(form.values.price.toString()) || 0,
      inventory: parseInt(form.values.inventory.toString()) || 0,
      weight: parseFloat(form.values.weight.toString()) || 1,
      length: parseFloat(form.values.length.toString()) || 1,
      breadth: parseFloat(form.values.breadth.toString()) || 1,
      height: parseFloat(form.values.height.toString()) || 1,
      gst_percentage: parseFloat(form.values.gst_percentage.toString()) || 1,
      // Include actual images for validation
      images:
        existingImages.length > 0
          ? existingImages
          : uploadedFiles.length > 0
          ? ["placeholder"]
          : [],
    };

    // Validate using Zod schema first
    try {
      const validatedData = productSchema.parse(formDataWithNumbers);
    } catch (error) {
      console.error("Validation failed:", error);
      if (error instanceof z.ZodError) {
        // Set form errors from Zod validation
        const newErrors: Record<string, string> = {};
        const errorFields: string[] = [];

        error.issues.forEach((err: z.ZodIssue) => {
          if (err.path.length > 0) {
            const fieldName = err.path[0] as string;
            newErrors[fieldName] = err.message;
            errorFields.push(fieldName);
          }
        });

        // Set all fields as touched to show errors
        const touchedFields: Record<string, boolean> = {};
        errorFields.forEach((field) => {
          touchedFields[field] = true;
        });

        // Update form state with errors and touched fields
        form.setErrors(newErrors);
        form.setTouched(touchedFields);

        // Show specific error message
        const fieldNames = errorFields.map((field) => {
          const fieldLabels: Record<string, string> = {
            name: "Product Name",
            description: "Description",
            price: "Price",
            category: "Category",
            inventory: "Inventory",
            subCategory: "Subcategory",
            parts: "Parts",
            weight: "Weight",
            length: "Length",
            breadth: "Breadth",
            height: "Height",
            pickup_postcode: "Pickup Postcode",
            gst_percentage: "GST Percentage",
          };
          return fieldLabels[field] || field;
        });

        toast({
          title: "Validation Error",
          description: `Please fix the following fields: ${fieldNames.join(
            ", "
          )}`,
          variant: "destructive",
        });
        setIsFormSubmitting(false);
        return;
      }
    }

    // Remove problematic handleValidate call that causes continuous API calls
    // if (!handleValidate()) {
    //   toast({
    //     title: "Filter Validation Error",
    //     description: "Please fill all required filter options before updating",
    //     variant: "destructive",
    //   });
    //   setIsFormSubmitting(false);
    //   return;
    // }
    if (!form.validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      setIsFormSubmitting(false);
      return;
    }

    // Only set loading state after all validations pass
    setLoading(true);
    try {
      const imageUrls: string[] = [...existingImages];

      if (!imageUrls.length && !uploadedFiles.length) {
        toast({
          title: "Image required",
          description: "Please upload at least one image.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (uploadedFiles.length > 0) {
        for (let i = 0; i < uploadedFiles.length; i++) {
          const file = uploadedFiles[i];
          const fileExt = file.name.split(".").pop();
          const fileName = `${Math.random()
            .toString(36)
            .substring(2, 15)}.${fileExt}`;
          const filePath = `products/${fileName}`;

          // Check if this file has crop parameters for social media posting
          if (postToSocial && cropParams[i]) {
            if (file.type.startsWith("image/")) {
              // For images, crop in browser using stored crop params
              const croppedBlob = await getCroppedImg(
                URL.createObjectURL(file),
                cropParams[i]
              );
              const croppedFile = new File([croppedBlob as Blob], file.name, {
                type: file.type,
              });

              const { error: uploadError } = await supabase.storage
                .from("product-images")
                .upload(filePath, croppedFile);

              if (uploadError) throw uploadError;
            } else {
              // For videos, upload as is (video cropping would need backend support)
              const { error: uploadError } = await supabase.storage
                .from("product-images")
                .upload(filePath, file);

              if (uploadError) throw uploadError;
            }
          } else {
            // Upload original file if no crop params or not posting to social
            const { error: uploadError } = await supabase.storage
              .from("product-images")
              .upload(filePath, file);

            if (uploadError) throw uploadError;
          }

          const { data } = supabase.storage
            .from("product-images")
            .getPublicUrl(filePath);
          imageUrls.push(data.publicUrl);
        }
      }

      // Update existing post media if we're adding new images and posting to social
      // This ensures the UI shows the new images in the existing post media section
      if (postToSocial && uploadedFiles.length > 0) {
        // Use the final imageUrls which contains all images (existing + new)
        setExistingPostMedia(imageUrls);
      }
      // We'll handle filter creation after product creation to get the correct product ID
      // Use the converted numeric values for product data
      const productData = {
        name: formDataWithNumbers.name,
        category: formDataWithNumbers.category,
        description: formDataWithNumbers.description,
        price: formDataWithNumbers.price,
        inventory: formDataWithNumbers.inventory,
        status: formDataWithNumbers.status,
        images: imageUrls,
        subCategory: selectedSubCategory,
        parts: selectedItem,
        weight: Math.max(0.01, formDataWithNumbers.weight),
        length: Math.max(0.01, formDataWithNumbers.length),
        breadth: Math.max(0.01, formDataWithNumbers.breadth),
        height: Math.max(0.01, formDataWithNumbers.height),
        pickup_postcode: formDataWithNumbers.pickup_postcode,
        gst_percentage: Math.max(
          0,
          Math.min(100, formDataWithNumbers.gst_percentage)
        ),
        // Add custom filters to product data
        // custom_filters: selectedOptions,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", id);

        if (error) throw error;

        // Update Filters table with product associations
        await updateFiltersTable(form.values.category, productFilters, id);

        // Handle social media post update
        if (postToSocial) {
          // For updates, use new images if uploaded, otherwise use existing post media
          // This allows users to selectively choose which images appear in the post
          const socialMediaUrls =
            uploadedFiles.length > 0 ? imageUrls : [...existingPostMedia];

          const postData = {
            content: socialDescription ? socialDescription : "",
            media_urls: socialMediaUrls, // Use current product images only
            product_id: id,
            updated_at: new Date().toISOString(),
          };

          if (existingPostId) {
            // Update existing post
            const { error: postError } = await supabase
              .from("posts")
              .update(postData)
              .eq("id", existingPostId);

            if (postError) throw postError;
          } else {
            // Create new post if none exists
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (!user?.id) {
              throw new Error("User not authenticated");
            }
            const { error: postError } = await supabase.from("posts").insert([
              {
                ...postData,
                user_id: user.id,
                created_at: new Date().toISOString(),
              },
            ]);

            if (postError) throw postError;
          }

          // Invalidate posts queries to show the updated post immediately
          queryClient.invalidateQueries({ queryKey: ["posts", "trending"] });
          queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
          queryClient.invalidateQueries({ queryKey: ["posts", "following"] });
          queryClient.invalidateQueries({ queryKey: ["trendingPosts"] });
          queryClient.invalidateQueries({ queryKey: ["homePageData"] });
          queryClient.invalidateQueries({ queryKey: ["userPosts"] });
        } else if (existingPostId) {
          // Delete existing post if user unchecks the option
          const { error: deleteError } = await supabase
            .from("posts")
            .delete()
            .eq("id", existingPostId);

          if (deleteError) throw deleteError;

          // Invalidate posts queries to remove the deleted post immediately
          queryClient.invalidateQueries({ queryKey: ["posts", "trending"] });
          queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
          queryClient.invalidateQueries({ queryKey: ["posts", "following"] });
          queryClient.invalidateQueries({ queryKey: ["trendingPosts"] });
          queryClient.invalidateQueries({ queryKey: ["homePageData"] });
          queryClient.invalidateQueries({ queryKey: ["userPosts"] });
        }

        // Product filters are now stored directly in the product record

        // Trigger revalidation for shop SSG/ISR
        try {
          await fetch("/api/shop/revalidate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: id,
              action: "update",
            }),
          });
        } catch (revalidateError) {
          console.error("Error triggering shop revalidation:", revalidateError);
        }

        toast({
          title: "Product updated",
          description: "The product has been updated successfully",
        });
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert([{ ...productData, seller_id: user?.id }])
          .select()
          .single();

        if (error) throw error;

        // Now create/update filters with the correct product ID
        await handleFilterCreation(newProduct.id);

        // Update Filters table with product associations
        await updateFiltersTable(
          form.values.category,
          productFilters,
          newProduct.id
        );
        // Create social media post if enabled
        if (postToSocial && newProduct) {
          // For new products, use uploaded images for social post
          if (!user?.id) {
            throw new Error("User not authenticated");
          }
          const postData = {
            content: socialDescription ? socialDescription : "",
            media_urls: imageUrls, // Use uploaded images for new products
            product_id: newProduct.id,
            user_id: user.id,
            created_at: new Date().toISOString(),
          };

          const { error: postError } = await supabase
            .from("posts")
            .insert([postData]);

          if (postError) throw postError;

          // Invalidate posts queries to show the new post immediately
          queryClient.invalidateQueries({ queryKey: ["posts", "trending"] });
          queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
          queryClient.invalidateQueries({ queryKey: ["posts", "following"] });
          queryClient.invalidateQueries({ queryKey: ["trendingPosts"] });
          queryClient.invalidateQueries({ queryKey: ["homePageData"] });
          queryClient.invalidateQueries({ queryKey: ["userPosts"] });
        }

        // Product filters are now stored directly in the product record

        // Trigger revalidation for shop SSG/ISR
        try {
          await fetch("/api/shop/revalidate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: newProduct.id,
              action: "create",
            }),
          });
        } catch (revalidateError) {
          console.error("Error triggering shop revalidation:", revalidateError);
        }

        toast({
          title: "Product created",
          description: "The product has been created successfully",
        });
      }

      if (isVendorContext) {
        router.push("/vendor/shop-management" as any);
      } else {
        router.back();
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsFormSubmitting(false);
    }
  };

  const [validationError, setValidationError] = useState({});
  const filterSchema = z.object(
    filters.reduce((acc: Record<string, z.ZodArray<z.ZodString>>, filter: { name: string; options: string[] }) => {
      acc[filter.name] = z.array(z.string(), {
        message: "This field is required, Add and select any one of the option",
      });
      return acc;
    }, {})
  );

  const handleValidate = async () => {
    // This function is kept for compatibility but should not be called
    // as it causes continuous API calls
    return true;
  };

  // Function to update Filters table with product associations
  const updateFiltersTable = async (
    category: string,
    productFilters: Record<string, string[]>,
    productId: string
  ) => {
    try {
      // Get existing filter data for this category
      const { data: existingFilters, error: fetchError } = await supabase
        .from("Filters")
        .select("*")
        .eq("category", category)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 = no rows found
        console.error("Error fetching filters:", fetchError);
        return;
      }

      let filterData = (existingFilters?.filters as Record<string, string[]>) || {};
      let productIds = (existingFilters as any)?.product_ids || {};

      // Update filter options and product associations
      Object.entries(productFilters).forEach(
        ([filterName, selectedOptions]) => {
          // Initialize filter if it doesn't exist
          if (!filterData[filterName]) {
            filterData[filterName] = [];
          }

          // Add new options to filter data (avoid duplicates)
          selectedOptions.forEach((option) => {
            if (!filterData[filterName].includes(option)) {
              filterData[filterName].push(option);
            }
          });

          // Initialize product_ids for this filter if it doesn't exist
          if (!productIds[filterName]) {
            productIds[filterName] = {};
          }

          // Add product to each selected option
          selectedOptions.forEach((option) => {
            if (!productIds[filterName][option]) {
              productIds[filterName][option] = [];
            }
            if (!productIds[filterName][option].includes(productId)) {
              productIds[filterName][option].push(productId);
            }
          });
        }
      );

      // Remove product from filters it's no longer associated with
      Object.keys(productIds).forEach((filterName) => {
        Object.keys(productIds[filterName]).forEach((option) => {
          if (!productFilters[filterName]?.includes(option)) {
            productIds[filterName][option] = productIds[filterName][
              option
            ].filter((id: string) => id !== productId);
            // Remove empty options
            if (productIds[filterName][option].length === 0) {
              delete productIds[filterName][option];
            }
          }
        });
        // Remove empty filters
        if (Object.keys(productIds[filterName]).length === 0) {
          delete productIds[filterName];
        }
      });

      // Update or insert the filter data
      if (existingFilters) {
        await supabase
          .from("Filters")
          .update({
            filters: filterData,
            product_ids: productIds,
          } as any)
          .eq("category", category);
      } else {
        await supabase.from("Filters").insert({
          category,
          filters: filterData,
          product_ids: productIds,
        } as any);
      }
    } catch (error) {
      console.error("Error updating filters table:", error);
    }
  };

  return (
    <AdminLayout
      title={isEditing ? "Edit Product" : "Create Product"}
      backLink={isVendorContext ? "/vendor/shop-management" : "/admin/products"}
    >
      {/* Derive filters to display for create mode as well */}
      {/* If categoryData doesn't have filters for a category yet, fall back to keys from Filters table */}
      {(() => {
        // build a derived list once per render without extra state
        const derived =
          filters && filters.length > 0
            ? filters
            : Object.keys(currentFilters || {}).map((name) => ({
                name,
                options: Array.isArray(
                  (currentFilters as Record<string, unknown>)[name]
                )
                  ? (currentFilters as Record<string, string[]>)[name] || []
                  : [],
              }));
        // Stash on window-like object for use below in JSX without recomputing
        (
          globalThis as unknown as { __displayFilters?: unknown }
        ).__displayFilters = derived;
        return null;
      })()}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleFormSubmit} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 gap-2 md:gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter product name"
                  value={form.values.name}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                    }
                  }}
                  className={
                    form.touched.name && form.errors.name
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }
                />
                {form.touched.name && form.errors.name && (
                  <p className="text-xs text-red-500">{form.errors.name}</p>
                )}
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  name="category"
                  value={form.values.category}
                  onValueChange={(value) => form.setValue("category", value)}
                >
                  <SelectTrigger 
                    id="category"
                    className={form.touched.category && form.errors.category ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.touched.category && form.errors.category && (
                  <p className="text-xs text-red-500">{form.errors.category}</p>
                )}
              </div> */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  name="status"
                  value={form.values.status}
                  onValueChange={(value) => form.setValue("status", value)}
                >
                  <SelectTrigger
                    id="status"
                    className={
                      form.touched.status && form.errors.status
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }
                  >
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on sale">On Sale</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                  </SelectContent>
                </Select>
                {form.touched.status && form.errors.status && (
                  <p className="text-xs text-red-500">{form.errors.status}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.values.price}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  className={
                    form.touched.price && form.errors.price
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }
                />
                {form.touched.price && form.errors.price && (
                  <p className="text-xs text-red-500">{form.errors.price}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="inventory">Inventory</Label>
                <Input
                  id="inventory"
                  name="inventory"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.values.inventory}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  className={
                    form.touched.inventory && form.errors.inventory
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }
                />
                {form.touched.inventory && form.errors.inventory && (
                  <p className="text-xs text-red-500">
                    {form.errors.inventory}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                name="category"
                value={productCategories2.some((c) => c.value === form.values.category) ? form.values.category : ""}
                onValueChange={(value) => {
                  form.setValue("category", value);
                  const subcategories = Object.keys(
                    (categoryData[value as keyof typeof categoryData]?.subCategories) || {}
                  );
                  setCategory(value);
                  updateSubCategory(subcategories[0] || "");
                  form.setValue("subCategory", subcategories[0] || "");
                }}
              >
                <SelectTrigger
                  id="category"
                  className={
                    form.touched.category && form.errors.category
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {productCategories2.map((category) => (
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

            {/* Subcategory */}
            {form.values.category && (
              <div className="space-y-2">
                <Label htmlFor="subCategory">Subcategory</Label>
                <Select
                  value={subCategoryOptions.includes(selectedSubCategory) ? selectedSubCategory : ""}
                  onValueChange={(value) => {
                    updateSubCategory(value);
                    form.setValue("subCategory", value);
                  }}
                >
                  <SelectTrigger
                    id="subcategory"
                    className={
                      form.touched.subCategory && form.errors.subCategory
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }
                  >
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {subCategoryOptions.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.touched.subCategory && form.errors.subCategory && (
                  <p className="text-xs text-red-500">
                    {form.errors.subCategory}
                  </p>
                )}
              </div>
            )}

            {/* Items */}
            {selectedSubCategory && (
              <div className="space-y-2">
                <Label htmlFor="parts">Parts</Label>
                <Select
                  value={itemOptions.includes(selectedItem) ? selectedItem : ""}
                  onValueChange={(value) => {
                    setSelectedItem(value);
                    form.setValue("parts", value);
                  }}
                >
                  <SelectTrigger
                    id="Parts"
                    className={
                      form.touched.parts && form.errors.parts
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }
                  >
                    <SelectValue placeholder="Select part" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.touched.parts && form.errors.parts && (
                  <p className="text-xs text-red-500">{form.errors.parts}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter product description"
                rows={4}
                value={form.values.description}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                  }
                }}
                className={
                  form.touched.description && form.errors.description
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : ""
                }
              />
              {form.touched.description && form.errors.description && (
                <p className="text-xs text-red-500">
                  {form.errors.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <Label>Existing Product Images</Label>
                  <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {existingImages.map((imageUrl, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-md border border-gray-200 bg-gray-50"
                      >
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
                          onClick={() => {
                            const newImages = [...existingImages];
                            const removedImage = newImages.splice(index, 1)[0];

                            setExistingImages(newImages);

                            // Find and remove the corresponding post media by URL
                            const newPostMedia = existingPostMedia.filter(
                              (mediaUrl) => mediaUrl !== removedImage
                            );
                            setExistingPostMedia(newPostMedia);
                          }}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <FileUploadField
                id="product-images"
                label="Add Product Images"
                description="Upload up to 10 images. Supported formats: JPG, PNG, WEBP."
                accept="image/jpeg, image/png, image/webp"
                multiple={true}
                maxFiles={10}
                onChange={setUploadedFiles}
                value={uploadedFiles}
              />

              {/* Social Media Posting Section */}
              <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="post-to-social"
                    checked={postToSocial}
                    disabled={!!(isEditing && existingPostId && postToSocial)}
                    onCheckedChange={(checked) =>
                      setPostToSocial(checked === true)
                    }
                  />
                  <Label
                    htmlFor="post-to-social"
                    className="text-sm font-medium"
                  >
                    Post this product to social media
                    {isEditing && existingPostId && postToSocial && (
                      <span className="text-xs text-gray-500 ml-2">
                        (Cannot be unchecked - existing post found)
                      </span>
                    )}
                  </Label>
                </div>

                {postToSocial && (
                  <div className="space-y-4">
                    {/* Crop Images for Social Media Section */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">
                            Crop Images for Social Media
                          </Label>

                          {/* Common Aspect Ratio Selector */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">
                              Select Aspect Ratio for All Images
                            </Label>
                            <div className="flex gap-2">
                              {(["1:1", "4:5", "9:16"] as const).map(
                                (ratio) => (
                                  <button
                                    key={ratio}
                                    type="button"
                                    onClick={() => setAspectRatio(ratio)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                      imageAspectRatio === ratio
                                        ? "bg-sm-red text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                  >
                                    {ratio}
                                  </button>
                                )
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              This ratio will be applied to all images. Click
                              individual images to fine-tune cropping.
                            </p>
                          </div>

                          {/* Image Grid with Crop Options - Only New Uploads */}
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {uploadedFiles.map((file, index) => (
                              <div
                                key={index}
                                className="relative aspect-square rounded-md border border-gray-200 bg-gray-50"
                              >
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Product ${index + 1}`}
                                  className="h-full w-full rounded-md object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="absolute bottom-1 right-1 h-6 w-6 p-0"
                                  onClick={() => {
                                    setCropIndex(index);
                                    setShowCropModal(true);
                                  }}
                                >
                                  <Camera className="h-3 w-3" />
                                </Button>
                                {cropParams[index] ? (
                                  <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                                    Cropped
                                  </div>
                                ) : (
                                  <div className="absolute top-1 left-1 bg-purple-500 text-white text-xs px-1 py-0.5 rounded">
                                    Post
                                  </div>
                                )}
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                                  onClick={() => {
                                    const newFiles = [...uploadedFiles];
                                    newFiles.splice(index, 1);
                                    setUploadedFiles(newFiles);

                                    // Also remove corresponding crop params
                                    const newCropParams = { ...cropParams };
                                    delete newCropParams[index];
                                    setCropParams(newCropParams);
                                  }}
                                >
                                  <X size={14} />
                                </Button>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">
                            Click the camera icon to fine-tune cropping for
                            individual images
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Existing Post Media Preview */}
                    {isEditing && existingPostMedia.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          Existing Post Media
                        </Label>
                        <div className="border rounded-lg p-4 bg-white">
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                            {existingPostMedia.map((mediaUrl, index) => (
                              <div
                                key={`existing-post-${index}`}
                                className="relative aspect-square rounded-md border border-gray-200 bg-gray-50"
                              >
                                <img
                                  src={mediaUrl}
                                  alt={`Existing Post ${index + 1}`}
                                  className="h-full w-full rounded-md object-cover"
                                />
                                <div className="absolute top-1 left-1 bg-purple-500 text-white text-xs px-1 py-0.5 rounded">
                                  Post
                                </div>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                                  onClick={() => {
                                    // Only remove from post media by URL, keep in product images
                                    const mediaUrlToRemove =
                                      existingPostMedia[index];

                                    const newPostMedia =
                                      existingPostMedia.filter(
                                        (mediaUrl) =>
                                          mediaUrl !== mediaUrlToRemove
                                      );
                                    setExistingPostMedia(newPostMedia);
                                  }}
                                >
                                  <X size={14} />
                                </Button>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Purple badges show existing post media. Removing
                            these only affects the social post, not product
                            images. When you remove a product image, it will
                            also be removed from the post.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="social-description">
                        Social Media Description (Optional)
                      </Label>
                      <Textarea
                        id="social-description"
                        placeholder="Write a description for your social media post..."
                        value={socialDescription}
                        onChange={(e) => setSocialDescription(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                          }
                        }}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Physical Properties Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Physical Properties</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <FieldLabel
                    htmlFor="weight"
                    hasError={form.touched.weight && !!form.errors.weight}
                  >
                    Weight (kg)
                  </FieldLabel>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.values.weight}
                    onChange={handleNumberChange}
                    onBlur={form.handleBlur}
                    className={
                      form.touched.weight && form.errors.weight
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }
                  />
                  {form.touched.weight && form.errors.weight && (
                    <p className="text-xs text-red-500">{form.errors.weight}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <FieldLabel
                    htmlFor="length"
                    hasError={form.touched.length && !!form.errors.length}
                  >
                    Length (cm)
                  </FieldLabel>
                  <Input
                    id="length"
                    name="length"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.values.length}
                    onChange={handleNumberChange}
                    onBlur={form.handleBlur}
                    className={
                      form.touched.length && form.errors.length
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }
                  />
                  {form.touched.length && form.errors.length && (
                    <p className="text-xs text-red-500">{form.errors.length}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <FieldLabel
                    htmlFor="breadth"
                    hasError={form.touched.breadth && !!form.errors.breadth}
                  >
                    Breadth (cm)
                  </FieldLabel>
                  <Input
                    id="breadth"
                    name="breadth"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.values.breadth}
                    onChange={handleNumberChange}
                    onBlur={form.handleBlur}
                    className={
                      form.touched.breadth && form.errors.breadth
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }
                  />
                  {form.touched.breadth && form.errors.breadth && (
                    <p className="text-xs text-red-500">
                      {form.errors.breadth}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <FieldLabel
                    htmlFor="height"
                    hasError={form.touched.height && !!form.errors.height}
                  >
                    Height (cm)
                  </FieldLabel>
                  <Input
                    id="height"
                    name="height"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.values.height}
                    onChange={handleNumberChange}
                    onBlur={form.handleBlur}
                    className={
                      form.touched.height && form.errors.height
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }
                  />
                  {form.touched.height && form.errors.height && (
                    <p className="text-xs text-red-500">{form.errors.height}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping & Tax Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Shipping & Tax Information
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel
                    htmlFor="pickup_postcode"
                    hasError={
                      form.touched.pickup_postcode &&
                      !!form.errors.pickup_postcode
                    }
                  >
                    Pickup Postcode
                  </FieldLabel>
                  <Input
                    id="pickup_postcode"
                    name="pickup_postcode"
                    placeholder="Enter pickup postcode"
                    value={form.values.pickup_postcode}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    className={
                      form.touched.pickup_postcode &&
                      form.errors.pickup_postcode
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }
                  />
                  {form.touched.pickup_postcode &&
                    form.errors.pickup_postcode && (
                      <p className="text-xs text-red-500">
                        {form.errors.pickup_postcode}
                      </p>
                    )}
                </div>

                <div className="space-y-2">
                  <FieldLabel
                    htmlFor="gst_percentage"
                    hasError={
                      form.touched.gst_percentage &&
                      !!form.errors.gst_percentage
                    }
                  >
                    GST Percentage (%)
                  </FieldLabel>
                  <Input
                    id="gst_percentage"
                    name="gst_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0.00"
                    value={form.values.gst_percentage}
                    onChange={handleNumberChange}
                    onBlur={form.handleBlur}
                    className={
                      form.touched.gst_percentage && form.errors.gst_percentage
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }
                  />
                  {form.touched.gst_percentage &&
                    form.errors.gst_percentage && (
                      <p className="text-xs text-red-500">
                        {form.errors.gst_percentage}
                      </p>
                    )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Product Filter Options</Label>
              <p className="text-sm text-gray-500">
                Select filter options that apply to this product. These will
                help customers find your product when filtering.
              </p>

              {filters.length > 0 ? (
                <div className="space-y-4">
                  {filters.map((filter: { name: string; options: string[] }) => {
                    const existingOptions = existingFilters[filter.name] || [];
                    const predefinedOptions = filter.options || [];
                    const allOptions = [
                      ...new Set([...predefinedOptions, ...existingOptions]),
                    ];

                    return (
                      <div key={filter.name} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{filter.name}</h4>
                          {existingOptions.length > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {existingOptions.length} existing options
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {/* All available options (predefined + existing) */}
                          {allOptions.map((option) => {
                            const isExisting = existingOptions.includes(option);
                            const isPredefined =
                              predefinedOptions.includes(option);

                            return (
                              <label
                                key={option}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    productFilters[filter.name]?.includes(
                                      option
                                    ) || false
                                  }
                                  onChange={(e) =>
                                    handleFilterChange(
                                      filter.name,
                                      option,
                                      e.target.checked
                                    )
                                  }
                                  className="rounded"
                                />
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm">{option}</span>
                                  {isExisting && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                      Existing
                                    </span>
                                  )}
                                  {isPredefined && !isExisting && (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                      Default
                                    </span>
                                  )}
                                </div>
                              </label>
                            );
                          })}

                          {/* Add new custom option */}
                          <div className="pt-2 border-t">
                            {newOptionInput?.filterName === filter.name ? (
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="text"
                                  placeholder="Enter new option"
                                  value={newOptionInput.value}
                                  onChange={(e) =>
                                    setNewOptionInput(newOptionInput ? {
                                      ...newOptionInput,
                                      value: e.target.value,
                                    } : null)
                                  }
                                  className="flex-1"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      saveNewOption();
                                    } else if (e.key === "Escape") {
                                      cancelNewOption();
                                    }
                                  }}
                                  autoFocus
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={saveNewOption}
                                  disabled={!newOptionInput.value.trim()}
                                >
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelNewOption}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startAddingOption(filter.name)}
                                >
                                  Add New Option
                                </Button>
                                <span className="text-xs text-gray-500">
                                  Add a new filter option for this category
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Show selected custom options that aren't in predefined or existing */}
                          {productFilters[filter.name]
                            ?.filter(
                              (option) =>
                                !predefinedOptions.includes(option) &&
                                !existingOptions.includes(option)
                            )
                            .map((option) => (
                              <div
                                key={option}
                                className="flex items-center justify-between bg-yellow-50 p-2 rounded border border-yellow-200"
                              >
                                {editingOption?.filterName === filter.name &&
                                editingOption?.option === option ? (
                                  <div className="flex items-center space-x-2 flex-1">
                                    <Input
                                      type="text"
                                      defaultValue={option}
                                      className="flex-1"
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          saveEditedOption(
                                            e.currentTarget.value
                                          );
                                        } else if (e.key === "Escape") {
                                          cancelEditingOption();
                                        }
                                      }}
                                      autoFocus
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        const input =
                                          e.currentTarget.parentElement?.querySelector(
                                            "input"
                                          );
                                        if (input)
                                          saveEditedOption(input.value);
                                      }}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={cancelEditingOption}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm">{option}</span>
                                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                        New
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          startEditingOption(
                                            filter.name,
                                            option
                                          )
                                        }
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleFilterChange(
                                            filter.name,
                                            option,
                                            false
                                          )
                                        }
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No filter options available for this category. Select a
                  category first.
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  router.push(
                    (isVendorContext
                      ? "/vendor/shop-management"
                      : "/admin/products") as any
                  )
                }
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleManualSubmit}
                className="bg-sm-red hover:bg-sm-red-light"
                disabled={loading || isFormSubmitting}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {isEditing ? "Update Product" : "Create Product"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Crop Modal */}
      {showCropModal && cropIndex !== null && uploadedFiles[cropIndex] && (
        <Dialog
          open={showCropModal}
          onOpenChange={() => setShowCropModal(false)}
        >
          <DialogContent
            className="max-w-4xl p-2 rounded-sm"
            style={{ width: "95%" }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Crop Image for Social Media
                </h3>
                {/* <Button
                  variant="outline"
                  onClick={() => setShowCropModal(false)}
                >
                  Cancel
                </Button> */}
              </div>

              {/* Crop Instructions */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Crop Image
                </Label>
                <p className="text-xs text-gray-500">
                  Use the crop tool below to adjust this specific image. The
                  aspect ratio is set globally outside this modal.
                </p>
              </div>

              <div className="relative w-full h-[60vh] bg-black rounded-lg overflow-hidden">
                <VideoCropper
                  videoFile={uploadedFiles[cropIndex]}
                  videoUrl={URL.createObjectURL(uploadedFiles[cropIndex])}
                  aspect={getAspectRatioNumber(imageAspectRatio)}
                  onCropChange={(params: { cropX: number; cropY: number; cropWidth: number; cropHeight: number }) => {
                    setCropParams((prev) => ({ ...prev, [cropIndex]: params }));
                  }}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCropModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setShowCropModal(false)}
                  className="bg-sm-red hover:bg-sm-red-light"
                >
                  Apply Crop
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
};

export default ProductEdit;

const productCategories2 = Object.entries(categoryData).map(([key, value]) => ({
  value: key,
  label: value.label,
}));

function useSubcategoryLogic(category: string, form: ReturnType<typeof useFormValidation<ProductFormData>>) {
  const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [itemOptions, setItemOptions] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [filters, setFilters] = useState<{ name: string; options: string[] }[]>([]);

  useEffect(() => {
    if (category) {
      const categoryInfo = categoryData[category as keyof typeof categoryData];
      setFilters(categoryInfo?.filters || []);
      const subcategories = Object.keys(
        categoryInfo?.subCategories || {}
      );
      setSubCategoryOptions(subcategories);
      const firstSub = subcategories[0] || "";
      setSelectedSubCategory(firstSub);
      form.setValue("subCategory", firstSub);
      const items = categoryInfo?.subCategories[firstSub as keyof typeof categoryInfo.subCategories] || [];
      setItemOptions(items);
      setSelectedItem(items[0] || "");
      form.setValue("parts", items[0] || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- form.setValue is stable, only run when category changes
  }, [category]);

  const updateSubCategory = (sub: string) => {
    setSelectedSubCategory(sub);
    form.setValue("subCategory", sub);
    const categoryInfo = categoryData[category as keyof typeof categoryData];
    const items = categoryInfo?.subCategories[sub as keyof typeof categoryInfo.subCategories] || [];
    setItemOptions(items);
    setSelectedItem(items[0] || "");
    form.setValue("parts", items[0] || "");
  };

  return {
    subCategoryOptions,
    selectedSubCategory,
    updateSubCategory,
    itemOptions,
    selectedItem,
    setSelectedItem,
    setSelectedSubCategory,
    setItemOptions,
    filters,
  };
}

// const filters = [
//   { name: "Terrain Type", options: ["Gravel", "Sand", "Rock Crawling", "Rally", "Mud Terrain"] },
//   { name: "Vehicle Type", options: ["4x4", "SUV", "Adventure Bike"] },
//   { name: "Load / Winch Rating", options: [] },
//   { name: "Waterproof / Dustproof Rating", options: [] },
//   { name: "Mounting Type", options: [] },
//   { name: "Product Category", options: ["Suspension", "Tyres", "Accessories", "Roof Gear", "Lighting", "Body Mods"] },
//   { name: "Brand", options: [] },
//   { name: "Price Range", options: [] },
//   { name: "Availability", options: [] }
// ];
