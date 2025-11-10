import { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { EventFormData } from "@/integrations/supabase/modules/events";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploadField } from "@/components/admin/FileUploadField";
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  Plus,
  X,
  Info,
  TimerIcon,
  Users,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// Form schema
const eventFormSchema = z.object({
  category: z.string().min(1, "Category is required"),
  title: z.string().min(2, "Title is required"),
  description: z.string().min(10, "This field is required with minimum 10 characters"),
  venue: z.string().min(1, "Venue is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  status: z.enum(["draft", "published", "completed", "cancelled"]),
  banner_image_url: z.string(),
  gallery_urls: z.array(z.string()),
  promo_video_url: z.string().min(1, "Promo video URL is required"),
  features: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  registration_required: z.boolean().default(false),
  registration_start_date: z.string().optional().nullable(),
  registration_end_date: z.string().optional().nullable(),
  max_participants: z.number().optional().nullable(),
  fee_currency: z.string().default("INR"),
  fee_amount: z.number().optional().nullable(),
  category_details: z.record(z.string(), z.any()).optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.registration_required) {
    if (!data.registration_start_date) {
      ctx.addIssue({
        path: ["registration_start_date"],
        code: z.ZodIssueCode.custom,
        message: "Start date is required when registration is enabled",
      });
    }
    if (!data.registration_end_date) {
      ctx.addIssue({
        path: ["registration_end_date"],
        code: z.ZodIssueCode.custom,
        message: "End date is required when registration is enabled",
      });
    }
  }
});

type FormData = z.infer<typeof eventFormSchema>;

type EventFormProps = {
  initialData?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => void;
  isSubmitting: boolean;
};

const categoryOptions = [
  "Rally",
  "Circuit Race",
  "Car Show",
  "Workshop",
  "Meetup",
  "Off-Road",
  "Track Day",
  "Charity",
  "Conference",
  "Virtual Event",
  "Other",
];

const featureOptions = [
  "RSVP",
  "Live Map",
  "QR Check-in",
  "Photo/Video Upload",
  "Ticketing",
  "Social Sharing",
  "Live Streaming",
  "Community Chat",
  "Vendor Booths",
  "Afterparty",
];

const EventForm = ({ initialData, onSubmit, isSubmitting }: EventFormProps) => {
  const { toast } = useToast();
  const [newTag, setNewTag] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [banner, setBannerFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [existingImage, setExistingImage] = useState<{banner:string[],gallery:string[]}>({banner:[],gallery:[]});
   
  const form = useForm<FormData>({
    resolver: zodResolver(eventFormSchema) as any,
    defaultValues: {
      category: initialData?.category || "",
      title: initialData?.title || "",
      description: initialData?.description || "",
      venue: initialData?.venue || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      country: initialData?.country || "",
      start_date: initialData?.start_date || "",
      end_date: initialData?.end_date || "",
      start_time: initialData?.start_time || "",
      end_time: initialData?.end_time || "",
      status: initialData?.status || "draft",
      banner_image_url: initialData?.banner_image_url || "",
      gallery_urls: initialData?.gallery_urls || [],
      promo_video_url: initialData?.promo_video_url || "",
      features: initialData?.features || [],
      tags: initialData?.tags || [],
      registration_required: initialData?.registration_required || false,
      registration_start_date: initialData?.registration_start_date || "",
      registration_end_date: initialData?.registration_end_date || "",
      max_participants: initialData?.max_participants || null,
      fee_currency: initialData?.fee_currency || "INR",
      fee_amount: initialData?.fee_amount || null,
      category_details: initialData?.category_details || null,
    },
  });

  useEffect(() => {
    if(initialData) {
      setExistingImage({
         banner:initialData.banner_image_url?[initialData.banner_image_url]:[] ,
         gallery:initialData.gallery_urls || []
      });
      setTagFields([...initialData.tags || []]);
      setFeatureFields([...initialData.features || []]);
    }
  }, [initialData]);
  
  const [tagFields, setTagFields] = useState<string[]>([]);
  const [featureFields, setFeatureFields] = useState<string[]>([]);

  useEffect(() => {
    form.setValue("features", featureFields);
  }, [featureFields, form]);

  useEffect(() => {
    form.setValue("tags", tagFields);
  }, [tagFields, form]);

  const handleAddTag = () => {
    if (newTag.trim()) {
      if(!tagFields.includes(newTag.toLowerCase()))
         setTagFields([...tagFields, newTag.trim().toLowerCase()]);
      setNewTag("");
    }
  };

  const removeTag = (name: string) => {
    const removedTags = tagFields.filter((item) => item !== name);
    setTagFields([...removedTags]);
    form.setValue("tags", removedTags);
  };

  const removeFeature = (name: string) => {
    const removedFeatures = featureFields.filter((item) => item !== name);
    setFeatureFields([...removedFeatures]);
  };

  const handleAddFeature = () => {
    if (newFeature && !featureFields.some(field => field === newFeature)) {
      setFeatureFields([...featureFields, newFeature]);
      setNewFeature("");
      form.setValue("features", [...featureFields, newFeature]);
    }
  };

  const watchRegistrationRequired = form.watch("registration_required");

  const handleFormSubmit = async(data: FormData) => {
    console.log(existingImage,"existing",uploadedFiles,banner);
    const bannerUrls: string[] = [...existingImage.banner];
    const galleryUrls: string[] = [...existingImage.gallery];
  
    setLoading(true);
    
    try {
      console.log(banner.length==0,"exis");
      if (bannerUrls.length==0 && banner.length === 0) {
        toast({
          title: "banner Image required",
          description: "Please upload image.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      if(galleryUrls.length==0 && uploadedFiles.length==0) {
        toast({
          title: "gallery Image required",
          description: "Please upload at least one image.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
  
      if (banner.length > 0) {
        bannerUrls.pop();
        const file = banner[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `banners/${fileName}`;
  
        const { error: uploadError } = await supabase.storage
          .from("events")
          .upload(filePath, file);
  
        if (uploadError) throw uploadError;
  
        const { data: urlData } = supabase.storage.from("events").getPublicUrl(filePath);
        bannerUrls.push(urlData.publicUrl);
      }
  
      for (const file of uploadedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `gallery/${fileName}`;
  
        const { error: uploadError } = await supabase.storage
          .from("events")
          .upload(filePath, file);
  
        if (uploadError) throw uploadError;
  
        const { data: urlData } = supabase.storage.from("events").getPublicUrl(filePath);
        galleryUrls.push(urlData.publicUrl);
      }
  
      console.log({
        banner_image_url: bannerUrls[0] || null,
        gallery_urls: galleryUrls,
      });
  
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Error",
        description: "Image upload failed.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }

    let filteredData: any = data;
    if(!data.registration_required) {
      const {
        registration_end_date,
        registration_start_date,
        fee_amount,
        fee_currency,
        max_participants,
        ...finalData
      } = data;
      filteredData = {...finalData};
    }

    const formattedData: EventFormData = {
      ...filteredData,
      banner_image_url: bannerUrls[0],
      gallery_urls: galleryUrls,
      max_participants: data.max_participants ? Number(data.max_participants) : null,
      fee_amount: data.fee_amount ? Number(data.fee_amount) : null,
      tags: tagFields,
      features: featureFields
    };
   
    onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 md:space-y-6">
        <Card>
          <CardHeader className="max-[769px]:py-4">
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoryOptions.map((category) => (
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your event..."
                      className="min-h-32"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="max-[769px]:py-4">
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" /> Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <FormControl>
                    <Input placeholder="Event venue" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="State" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="Country" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="max-[769px]:py-4">
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" /> Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="max-[769px]:py-4">
            <CardTitle>Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="banner_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner Image</FormLabel>
                  <FormControl>
                    <FileUploadField
                      id="events-banner"
                      label="Add Banner Image"
                      description="Upload up to 10 images. Supported formats: JPG, PNG, WEBP."
                      accept="image/jpeg, image/png, image/webp"
                      multiple={false}
                    
                      onChange={setBannerFiles}
                      value={banner}
                      
                     
                    />
                  </FormControl>
                  <FormDescription>
                    Upload a banner image for your event (recommended size: 1920 x 600 pixels)
                  </FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {existingImage.banner.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Gallery ${index + 1}`}
                          className="h-24 w-full object-contain rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={
                            () => {
                              const newImages = [...existingImage.banner];
                              newImages.splice(index, 1);
                              setExistingImage({...existingImage,banner:newImages})
                            }
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gallery_urls"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gallery Images</FormLabel>
                  <FormControl>
                    <FileUploadField
                    id="events-gallery"
                    label="Add Gallery Images"
                    description="Upload up to 10 images. Supported formats: JPG, PNG, WEBP."
                    accept="image/jpeg, image/png, image/webp"
                    multiple={true}
                    maxFiles={10}
                    onChange={setUploadedFiles}
                    value={uploadedFiles}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload images for the event gallery (up to 10 images)
                  </FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {existingImage.gallery.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Gallery ${index + 1}`}
                          className="h-24 w-full object-contain rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={
                            () => {
                              const newImages = [...existingImage.gallery];
                              newImages.splice(index, 1);
                              setExistingImage({...existingImage,gallery:newImages})
                            }
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="promo_video_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Promo Video URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="YouTube or Vimeo URL"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Add a promotional video URL from YouTube or Vimeo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="max-[769px]:py-4">
            <CardTitle className="flex items-center">
              <Tag className="mr-2 h-5 w-5" /> Tags & Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {tagFields.map((field, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {field}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTag(field)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <Label>Features</Label>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {featureFields.map((field, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {field}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFeature(field)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Select
                  value={newFeature}
                  onValueChange={setNewFeature}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select feature" />
                  </SelectTrigger>
                  <SelectContent>
                    {featureOptions.map((feature) => (
                      <SelectItem key={feature} value={feature}>
                        {feature}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={handleAddFeature}
                  size="sm"
                  disabled={!newFeature}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="max-[769px]:py-4">
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" /> Registration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="registration_required"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Registration Required</FormLabel>
                    <FormDescription>
                      Enable if participants need to register for this event
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {watchRegistrationRequired && (
              <div className="space-y-4 rounded-lg border p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                  <FormField
                    control={form.control}
                    name="registration_start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="registration_end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="max_participants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Participants</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Unlimited if left empty"
                          {...field}
                          value={field.value === null ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === "" ? null : parseInt(value));
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Set a limit to the number of participants, or leave empty for unlimited
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label>Registration Fee</Label>
                  <div className="flex gap-2 md:gap-4">
                    <FormField
                      control={form.control}
                      name="fee_currency"
                      render={({ field }) => (
                        <FormItem className="w-1/3">
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Currency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="INR">INR (₹)</SelectItem>
                                <SelectItem value="USD">USD ($)</SelectItem>
                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                <SelectItem value="GBP">GBP (£)</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fee_amount"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Amount (0 for free)"
                              {...field}
                              value={field.value === null ? "" : field.value}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value === "" ? null : parseFloat(value));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormDescription>
                    Set a registration fee or leave as 0 for free events
                  </FormDescription>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting || loading}>
            {isSubmitting || loading ? "Saving..." : initialData ? "Update Event" : "Create Event"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EventForm;
