import React, { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
// Adjust import path
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Camera, Edit, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Profile {
  avatar_url?: string | null;
  full_name?: string | null;
  [key: string]: unknown;
}

interface AvatarUploaderProps {
  profile: Profile | null;
  user: SupabaseUser | null;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  uploadProfilePicture: (file: File) => Promise<string | null>;
}

const AvatarUploader = ({ profile, user, setProfile, uploadProfilePicture }: AvatarUploaderProps) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [cropping, setCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  useEffect(() => {
    setAvatarUrl(profile?.avatar_url || null);
  }, [profile?.avatar_url]);

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
      setCropping(true);
    }
  };

  const onCropComplete = useCallback((_: { x: number; y: number }, croppedPixels: { x: number; y: number; width: number; height: number }) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const confirmCrop = async () => {
    if (!avatarUrl || !croppedAreaPixels) return;

    const croppedBlob = await getCroppedImg(avatarUrl, croppedAreaPixels);
    const croppedFile = new File([croppedBlob], "avatar.png", {
      type: "image/png",
    });

    setAvatarFile(croppedFile);
    setAvatarUrl(URL.createObjectURL(croppedFile));
    setCropping(false);
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return;

    setUploadingAvatar(true);
    const newAvatarUrl = await uploadProfilePicture(avatarFile);
    setUploadingAvatar(false);
     setCroppedAreaPixels(null)
    if (newAvatarUrl) {
      setProfile((prev) => (prev ? { ...prev, avatar_url: newAvatarUrl } : null));
      setAvatarFile(null);
    }
  };

  return (
    <CardContent className="flex flex-col items-center relative">
     {!cropping && <div className="mb-4 relative">
        <Avatar className="h-32 w-32">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt="Profile" />
          ) : (
            <AvatarFallback className="text-4xl">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
            </AvatarFallback>
          )}
        </Avatar>
        <Label
          htmlFor="avatar-upload"
          className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-sm-red text-white shadow-md hover:bg-sm-red-light"
        >
          {croppedAreaPixels && avatarUrl && profile ?<Edit size={18}></Edit>:<Camera size={18} />}
        </Label>
        <Input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
      </div>}

      {cropping && avatarUrl && (
        <div className=" max-w-xs aspect-square relative h-32 w-32   bg-muted rounded-full overflow-hidden">
          <Cropper
            image={avatarUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
         
        </div>
      )}
  {cropping && avatarUrl && (
    <>
           <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="mt-4 w-full"
          />
          <div className="mt-2 flex justify-center gap-3">
            <Button onClick={() =>{setCropping(false)
                if(profile?.avatar_url)
                {
                     setAvatarUrl(profile.avatar_url)
                }
                else
                {
                     setAvatarUrl(null)
                }
                setAvatarFile(null)
                  setCroppedAreaPixels(null)
            }
            
            } variant="outline" size="sm">
              Cancel
            </Button>
            <Button onClick={confirmCrop} size="sm">
              Crop & Save
            </Button>
             </div>
             </>
           )}
          
      {avatarFile && !cropping && (
        <Button
          onClick={uploadAvatar}
          disabled={uploadingAvatar}
          className="mt-4"
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
    </CardContent>
  );
};

export default AvatarUploader;


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
