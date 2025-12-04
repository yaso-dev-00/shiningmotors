"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProfileUpload } from "@/hooks/use-profile-upload";
import { storeRedirectPath } from "@/lib/utils/routeRemember";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Loader2, X } from "lucide-react";
import ChangeEmailForm from "@/components/settings/ChangeEmailForm";
import ChangePasswordForm from "@/components/settings/ChangePasswordForm";
import VendorRegistrationTab from "@/components/settings/VendorRegistrationTab";
import NotificationsTab from "@/components/settings/NotificationsTab";
import MobileVerificationForm from "@/components/settings/MobileVerificationForm";
import AvatarUploader from "./AvatarUpload";

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  mobile_phone: string | null;
  phone_verified: boolean | null;
  tag: string[] | null;
}

const Settings = () => {
  const { user, userRole, loading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const {
    uploadProfilePicture,
    uploadCoverImage,
    uploading: uploadingAvatar,
  } = useProfileUpload();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [originalProfile, setOriginalProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");

  const handlePhoneUpdated = (phone: string) => {
    setProfile((prev) => 
      prev ? { ...prev, mobile_phone: phone, phone_verified: true } : null
    );
  };

  const hasProfileChanged = () => {
    if (!profile || !originalProfile) return false;

    return (
      profile.username !== originalProfile.username ||
      profile.full_name !== originalProfile.full_name ||
      profile.bio !== originalProfile.bio ||
      profile.location !== originalProfile.location ||
      profile.website !== originalProfile.website ||
      profile.mobile_phone !== originalProfile.mobile_phone ||
      JSON.stringify(profile.tag) !== JSON.stringify(originalProfile.tag) ||
      avatarFile !== null ||
      coverFile !== null
    );
  };

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      // Store the current route before redirecting
      if (typeof window !== 'undefined' && window.location.pathname && window.location.pathname !== "/auth") {
        storeRedirectPath(window.location.pathname);
      }
      router.replace("/auth");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        setProfile(data as Profile);
        setOriginalProfile(data as Profile);
        if (data.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
        if (data.cover_url) {
          setCoverUrl(data.cover_url);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
  
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: profile.username,
          full_name: profile.full_name,
          bio: profile.bio,
          location: profile.location?profile.location.toLocaleLowerCase():null,
          website: profile.website,
          mobile_phone: profile.mobile_phone,
          cover_url: profile.cover_url,
          tag: profile.tag,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      // Update originalProfile with the new values
      setOriginalProfile(profile);

      // Reset file states
      setAvatarFile(null);
      setCoverFile(null);

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      toast({
        title: "Update failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

const [cropping, setCropping] = useState(false);
const [crop, setCrop] = useState({ x: 0, y: 0 });
const [zoom, setZoom] = useState(1);
const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Avatar image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);
    setAvatarUrl(URL.createObjectURL(file));
    setCropping(true); // show crop UI
  }
};

const onCropComplete = useCallback((_: unknown, croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
  setCroppedAreaPixels(croppedAreaPixels);
}, []);

const confirmCrop = async () => {
  if (!avatarUrl || !croppedAreaPixels) return;
  const croppedBlob = await getCroppedImg(avatarUrl, croppedAreaPixels);
  const croppedFile = new File([croppedBlob], "avatar.png", {
    type: "image/png",
  });

  setAvatarFile(croppedFile);
  setAvatarUrl(URL.createObjectURL(croppedFile));
  setCropping(false); // hide crop UI
};

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Cover image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      console.log({ file });

      setCoverFile(file);
      setCoverUrl(URL.createObjectURL(file));
    }
  };

 
const uploadAvatar = async () => {
  if (!avatarFile) return;

  const newAvatarUrl = await uploadProfilePicture(avatarFile);
  if (newAvatarUrl) {
    setProfile((prev) =>
      prev ? { ...prev, avatar_url: newAvatarUrl } : null
    );
    setAvatarFile(null);
  }
};
  const uploadCover = async () => {
    if (!coverFile) return;

    const newCoverUrl = await uploadCoverImage(coverFile);
    if (newCoverUrl) {
      setProfile((prev) => (prev ? { ...prev, cover_url: newCoverUrl } : null));
      setCoverFile(null);
    }
  };

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-4 md:py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-sm-red" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-4 md:py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-sm-red" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 pb-20 py-6 max-[769px]:pb-6 md:py-8">
        <h1 className="mb-6 text-2xl font-bold">Account Settings</h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          {userRole!=="ADMIN" &&  <TabsTrigger value="vendor">Vendor</TabsTrigger>}
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                  <CardDescription>Update your profile image</CardDescription>
                </CardHeader>
                {/* <CardContent className="flex flex-col items-center">
                  <div className="mb-4 relative">
                    <Avatar className="h-32 w-32">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt="Profile" />
                      ) : (
                        <AvatarFallback className="text-4xl">
                          {profile?.full_name?.charAt(0) ||
                            user?.email?.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <Label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-sm-red text-white shadow-md hover:bg-sm-red-light"
                    >
                      <Camera size={18} />
                    </Label>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>

                  {avatarFile && (
                    <Button
                      onClick={uploadAvatar}
                      disabled={uploadingAvatar}
                      className="mt-2"
                    >
                      {uploadingAvatar ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Save Profile Picture"
                      )}
                    </Button>
                  )}
                </CardContent> */}
                <AvatarUploader 
                  profile={profile as { avatar_url?: string | null; full_name?: string | null; [key: string]: unknown } | null} 
                  user={user} 
                  setProfile={setProfile as React.Dispatch<React.SetStateAction<{ avatar_url?: string | null; full_name?: string | null; [key: string]: unknown } | null>>} 
                  uploadProfilePicture={uploadProfilePicture}
                />
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Cover Image</CardTitle>
                  <CardDescription>
                    Update your profile cover image
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative h-48 w-full mb-4">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt="Cover"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500">No cover image</span>
                      </div>
                    )}
                    <Label
                      htmlFor="cover-upload"
                      className="absolute bottom-1 right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-sm-red text-white shadow-md hover:bg-sm-red-light"
                    >
                      <Camera size={18} />
                    </Label>
                    <Input
                      id="cover-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="hidden"
                    />
                  </div>

                  {coverFile && (
                    <Button
                      onClick={uploadCover}
                      disabled={uploadingAvatar}
                      className="mt-2"
                    >
                      {uploadingAvatar ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Save Cover Image"
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your profile details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={profile?.username || ""}
                          onChange={(e) =>
                            setProfile((prev) =>
                              prev
                                ? { ...prev, username: e.target.value }
                                : null
                            )
                          }
                          placeholder="Username"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={profile?.full_name || ""}
                          onChange={(e) =>
                            setProfile((prev) =>
                              prev
                                ? { ...prev, full_name: e.target.value }
                                : null
                            )
                          }
                          placeholder="Full Name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">
                        Bio{" "}
                        <span className="text-xs text-gray-400">
                          ({profile?.bio?.length || 0}/100)
                        </span>
                      </Label>
                      <Textarea
                        id="bio"
                        value={profile?.bio || ""}
                        maxLength={100}
                        onChange={(e) =>
                          setProfile((prev) =>
                            prev
                              ? { ...prev, bio: e.target.value.slice(0, 100) }
                              : null
                          )
                        }
                        placeholder="Tell us about yourself"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tag">
                        Tags{" "}
                        <span className="text-xs text-gray-400">
                          (max 30 chars per tag)
                        </span>
                      </Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {profile?.tag?.map((t, idx) => (
                          <span
                            key={idx}
                            className="flex items-center bg-gray-200 rounded px-2 py-1 text-sm"
                          >
                            {t}
                            <button
                              type="button"
                              className="ml-1 text-gray-500 hover:text-red-500"
                              onClick={() =>
                                setProfile((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        tag:
                                          prev.tag?.filter(
                                            (_, i) => i !== idx
                                          ) || [],
                                      }
                                    : null
                                )
                              }
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <Input
                        id="tag"
                        value={tagInput}
                        maxLength={30}
                        onChange={(e) =>
                          setTagInput(e.target.value.slice(0, 30))
                        }
                        onKeyDown={(e) => {
                          if (
                            (e.key === "Enter" || e.key === ",") &&
                            tagInput.trim() &&
                            (!profile?.tag ||
                              !profile.tag.includes(tagInput.trim()))
                          ) {
                            e.preventDefault();
                            setProfile((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    tag: [...(prev.tag || []), tagInput.trim()],
                                  }
                                : null
                            );
                            setTagInput("");
                          }
                        }}
                        placeholder="Type a tag and press Enter"
                      />
                      <div className="text-xs text-gray-400">
                        Press Enter to add tag. Max 30 characters per tag.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={profile?.location || ""}
                          onChange={(e) =>
                            setProfile((prev) =>
                              prev
                                ? { ...prev, location: e.target.value }
                                : null
                            )
                          }
                          placeholder="City, Country"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={profile?.website || ""}
                          onChange={(e) =>
                            setProfile((prev) =>
                              prev ? { ...prev, website: e.target.value } : null
                            )
                          }
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>


                    <div className="pt-4">
                      <Button
                        type="submit"
                        className="bg-sm-red hover:bg-sm-red-light"
                        disabled={saving || !hasProfileChanged()}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-3">
                <MobileVerificationForm
                  currentPhone={profile?.mobile_phone}
                  isVerified={profile?.phone_verified || false}
                  onPhoneUpdated={handlePhoneUpdated}
                />
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="account">
            <div className="grid gap-6">
              <ChangeEmailForm />
              <ChangePasswordForm />

              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  <CardDescription>
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive">Delete Account</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vendor">
            <VendorRegistrationTab />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* <BottomNav activeItem="profile" /> */}
      <Footer />
    </div>
  );
};

export default Settings;


export const getCroppedImg = (
  imageSrc: string,
  crop: { x: number; y: number; width: number; height: number }
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const image = typeof window !== 'undefined' ? new Image() : ({} as HTMLImageElement);
    image.src = imageSrc;
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = crop.width;
      canvas.height = crop.height;

      ctx?.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas is empty"));
      }, "image/png");
    };
    image.onerror = (err) => reject(err);
  });
};
