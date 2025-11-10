import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Camera, 
  Upload, 
  X, 
  Loader2,
  Image as ImageIcon,
  Trash2,
  Edit3
} from 'lucide-react';
import { useVendorLogoUpload } from '@/hooks/use-vendor-logo-upload';

interface BusinessLogoModalProps {
  currentLogoUrl?: string;
  vendorId: string;
  businessName: string;
  onLogoUpdate: (newLogoUrl: string | null) => void;
  isEditable?: boolean;
  children?: React.ReactNode;
}

export const BusinessLogoModal: React.FC<BusinessLogoModalProps> = ({
  currentLogoUrl,
  vendorId,
  businessName,
  onLogoUpdate,
  isEditable = true,
  children
}) => {
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadBusinessLogo, deleteBusinessLogo, uploading } = useVendorLogoUpload();
  const [isDragging, setIsDragging] = useState(false);

  const validateAndSetFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB.');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const newLogoUrl = await uploadBusinessLogo(selectedFile, vendorId);
    if (newLogoUrl) {
      onLogoUpdate(newLogoUrl);
      setPreviewUrl(newLogoUrl);
      setOpen(false);
      setSelectedFile(null);
    }
  };

  const handleDelete = async () => {
    const success = await deleteBusinessLogo(vendorId);
    if (success) {
      onLogoUpdate(null);
      setPreviewUrl(null);
      setOpen(false);
      setSelectedFile(null);
    }
  };

  const handleCancel = () => {
    setPreviewUrl(currentLogoUrl || null);
    setSelectedFile(null);
    setOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setPreviewUrl(currentLogoUrl || null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    setOpen(newOpen);
  };

  if (!isEditable) {
    return <>{children}</>;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Edit3 className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-center">Update Business Logo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 p-1">
          {/* Circular Preview */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-28 w-28 rounded-full overflow-hidden ring-2 ring-gray-200 shadow-sm bg-gray-100">
                {previewUrl ? (
                  <img src={previewUrl} alt={businessName} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-[11px]">No Logo</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dropzone */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
              isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Upload className="w-5 h-5 mx-auto mb-2 text-gray-500" />
            <p className="text-sm font-medium text-gray-800">Drag & drop or click to upload</p>
            <p className="text-xs text-gray-500">PNG or JPG, up to 5MB</p>
            {selectedFile && (
              <p className="text-xs text-gray-600 mt-2">Selected: {selectedFile.name}</p>
            )}
          </div>

          <div className="text-center text-[11px] text-gray-500">Recommended size: 256 x 256 px</div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Save Logo
                </>
              )}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={uploading}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              {currentLogoUrl && (
                <Button
                  variant="ghost"
                  onClick={handleDelete}
                  disabled={uploading}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove current logo
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BusinessLogoModal;
