import React, { useState } from 'react';
import Cropper from 'react-easy-crop';

interface VideoCropperProps {
  videoFile: File;
  videoUrl: string;
  aspect?: number;
  onCropChange?: (cropData: {
    cropX: number;
    cropY: number;
    cropWidth: number;
    cropHeight: number;
  }) => void;
}

const VideoCropper: React.FC<VideoCropperProps> = ({ videoFile, videoUrl, aspect = 1, onCropChange }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const isImage = videoFile.type.startsWith('image/');

  const handleCropComplete = (
    croppedArea: { x: number; y: number; width: number; height: number },
    croppedAreaPixels: { x: number; y: number; width: number; height: number }
  ) => {
    setCroppedAreaPixels(croppedAreaPixels);
    if (onCropChange) {
      onCropChange({
        cropX: croppedAreaPixels.x,
        cropY: croppedAreaPixels.y,
        cropWidth: croppedAreaPixels.width,
        cropHeight: croppedAreaPixels.height,
      });
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full h-[50vh] bg-black">
        <Cropper
          {...(isImage
            ? { image: videoUrl }
            : { video: videoUrl })}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
          mediaProps={{
            muted: isImage,
            autoPlay: !isImage,
            controls: false,
          }}
        />
      </div>
    </div>
  );
};

export default VideoCropper;
