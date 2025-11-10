import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, profilesApi } from "@/integrations/supabase/client";
import { ExtendedProfileUpdate } from "@/integrations/supabase/modules/profiles";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot be longer than 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  full_name: z
    .string()
    .max(50, "Name cannot be longer than 50 characters")
    .optional(),
  bio: z
    .string()
    .max(160, "Bio cannot be longer than 160 characters")
    .optional(),
  location: z
    .string()
    .max(50, "Location cannot be longer than 50 characters")
    .optional(),
  website: z
    .string()
    .max(100, "Website cannot be longer than 100 characters")
    .optional(),
  mobile_phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid mobile number")
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProfileEditProps {
  open: boolean;
  onClose: () => void;
  onProfileUpdated: () => void;
}

const ProfileEdit = ({ open, onClose, onProfileUpdated }: ProfileEditProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const locations = [
    "New York, NY",
    "Los Angeles, CA",
    "Chicago, IL",
    "Houston, TX",
    "Phoenix, AZ",
    "Philadelphia, PA",
    "San Antonio, TX",
    "San Diego, CA",
    "Dallas, TX",
    "San Jose, CA",
  ];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      full_name: "",
      bio: "",
      location: "",
      website: "",
      mobile_phone: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select()
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setProfile(data);
          form.reset({
            username: data.username || "",
            full_name: data.full_name || "",
            bio: data.bio || "",
            location: data.location || "",
            website: data.website || "",
            mobile_phone: data.mobile_phone || "",
          });

          // Set avatar preview if exists
          if (data.avatar_url) {
            setAvatarPreview(data.avatar_url);
          }

          // Set cover preview if exists
          if (data.cover_url) {
            setCoverPreview(data.cover_url);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to fetch profile data",
          variant: "destructive",
        });
      }
    };

    if (open) {
      fetchProfile();
    }
  }, [user, open, form, toast]);

  useEffect(() => {
    const checkUsername = async () => {
      const username = form.watch("username");

      if (!username || username === profile?.username || username.length < 3) {
        setIsCheckingUsername(false);
        return;
      }

      setIsCheckingUsername(true);

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select()
          .eq("username", username)
          .single();

        if (error && error.code === "PGRST116") {
          // No records found, username is available
          setIsUsernameAvailable(true);
        } else if (data) {
          // Username exists
          setIsUsernameAvailable(false);
        }
      } catch (error) {
        console.error("Error checking username:", error);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const debounce = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounce);
  }, [form.watch("username"), profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Profile image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Cover image must be less than 10MB",
          variant: "destructive",
        });
        return;
      }

      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) return;

    if (!isUsernameAvailable && values.username !== profile?.username) {
      toast({
        title: "Username unavailable",
        description: "Please choose a different username",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let avatarUrl = profile?.avatar_url;
      if (avatarFile) {
        const avatarFileName = `avatar_${user.id}_${Date.now()}`;
        const { data: avatarData, error: avatarError } = await supabase.storage
          .from("profiles")
          .upload(`avatars/${avatarFileName}`, avatarFile);

        if (avatarError) throw avatarError;

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("profiles")
          .getPublicUrl(`avatars/${avatarFileName}`);

        avatarUrl = publicUrl;
      }

      let coverUrl = profile?.cover_url;
      if (coverFile) {
        const coverFileName = `cover_${user.id}_${Date.now()}`;
        const { data: coverData, error: coverError } = await supabase.storage
          .from("profiles")
          .upload(`covers/${coverFileName}`, coverFile);

        if (coverError) throw coverError;

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("profiles")
          .getPublicUrl(`covers/${coverFileName}`);

        coverUrl = publicUrl;
      }

      const profileData: ExtendedProfileUpdate = {
        username: values.username,
        full_name: values.full_name,
        bio: values.bio,
        location: values.location,
        website: values.website,
        mobile_phone: values.mobile_phone,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
      };

      const { error } = await profilesApi.profiles
        .update(profileData)
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });

      onProfileUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "Failed to update your profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="relative">
            <div
              className="h-28 w-full rounded-t-lg bg-gray-200 bg-cover bg-center md:h-40"
              style={{
                backgroundImage: coverPreview ? `url(${coverPreview})` : "none",
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {!coverPreview && (
                  <span className="text-gray-400">Cover Image</span>
                )}
              </div>
              <label
                htmlFor="cover-upload"
                className="absolute bottom-2 right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-100"
              >
                <Camera size={18} />
                <span className="sr-only">Upload Cover Image</span>
              </label>
              <input
                id="cover-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverChange}
              />
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative -mt-12 md:-mt-16">
              <div
                className="h-24 w-24 rounded-full border-4 border-white bg-gray-200 bg-cover bg-center md:h-32 md:w-32"
                style={{
                  backgroundImage: avatarPreview
                    ? `url(${avatarPreview})`
                    : "none",
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center rounded-full">
                  {!avatarPreview && (
                    <Upload size={24} className="text-gray-400" />
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-100"
                >
                  <Camera size={18} />
                  <span className="sr-only">Upload Profile Picture</span>
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="username" {...field} />
                        {isCheckingUsername && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                          </div>
                        )}
                        {!isCheckingUsername &&
                          field.value !== profile?.username &&
                          field.value.length > 2 && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              {isUsernameAvailable ? (
                                <Badge
                                  variant="outline"
                                  className="border-green-500 bg-green-50 text-green-700"
                                >
                                  Available
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-red-500 bg-red-50 text-red-700"
                                >
                                  Unavailable
                                </Badge>
                              )}
                            </div>
                          )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Your unique username. Used in your profile URL.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your name as displayed on your profile
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about yourself"
                        {...field}
                        className="resize-none"
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description about yourself
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Where you're based</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your personal or business website
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobile_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your mobile number for SMS notifications
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
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
                      Saving
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEdit;
