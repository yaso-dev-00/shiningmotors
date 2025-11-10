import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadFieldProps {
  id: string;
  label: string;
  description?: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  onChange: (files: File[]) => void;
  value?: File[];
}

export const FileUploadField = ({
  id,
  label,
  description,
  accept = "image/jpeg, image/png, image/webp",
  multiple = false,
  maxFiles = 10,
  onChange,
  value = [],
}: FileUploadFieldProps) => {
  const { toast } = useToast();
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Sync previewUrls with value prop changes
  useEffect(() => {
    // Clean up old URLs that are no longer needed
    const currentUrls = value.map((file) => URL.createObjectURL(file));

    // Revoke old URLs that are not in the current set
    setPreviewUrls((prev) => {
      prev.forEach((url) => {
        if (!currentUrls.includes(url)) {
          URL.revokeObjectURL(url);
        }
      });
      return currentUrls;
    });
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Check file types
    const validTypes = accept.split(", ");
    const invalidFiles = files.filter(
      (file) => !validTypes.includes(file.type)
    );

    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file format",
        description: `Only ${accept.replace(
          /image\//g,
          ""
        )} formats are supported.`,
        variant: "destructive",
      });
      return;
    }

    // Check max files
    if (multiple && files.length + value.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can upload a maximum of ${maxFiles} files.`,
        variant: "destructive",
      });
      return;
    }

    // Call onChange with all files
    if (!multiple) {
      removeFile(0);
    }
    onChange(multiple ? [...value, ...files] : files);

    // The previewUrls will be automatically updated by the useEffect
    // when the value prop changes, so we don't need to manually update it here

    // Reset input
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onChange(newFiles);

    // The previewUrls will be automatically updated by the useEffect
    // when the value prop changes, so we don't need to manually update it here
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {value.map((file, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-md border border-gray-200 bg-gray-50"
          >
            <img
              src={previewUrls[index]}
              alt={`Preview ${index}`}
              className="h-full w-full rounded-md object-contain"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
              onClick={() => removeFile(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <label
          htmlFor={id}
          className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
        >
          <Upload className="mb-2 h-6 w-6 text-gray-400" />
          <span className="text-xs text-gray-500">Upload</span>
          <Input
            id={id}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
  );
};
