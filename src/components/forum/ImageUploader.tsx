import React, { useRef, useState } from "react";
import { Button } from "~/components/ui";

interface ImageUploaderProps {
  onImageSelected: (base64Image: string) => void;
  maxSizeKB: number;
  aspectRatio?: number;
  previewHeight?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  maxSizeKB,
  aspectRatio,
  previewHeight = 200,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous errors
    setError(null);

    // Check file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas for resizing
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Apply aspect ratio if specified
        if (aspectRatio) {
          if (width / height > aspectRatio) {
            // Too wide, adjust width
            width = height * aspectRatio;
          } else if (width / height < aspectRatio) {
            // Too tall, adjust height
            height = width / aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setError("Failed to process image");
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);

        // Start with high quality
        let quality = 0.9;
        let base64 = canvas.toDataURL("image/jpeg", quality);
        
        // Reduce quality until file size is under the limit
        while (base64.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
          quality -= 0.1;
          base64 = canvas.toDataURL("image/jpeg", quality);
        }

        if (base64.length > maxSizeKB * 1024 * 1.37) {
          // Still too large, try reducing dimensions
          const scale = Math.sqrt((maxSizeKB * 1024 * 1.37) / base64.length);
          canvas.width = Math.floor(width * scale);
          canvas.height = Math.floor(height * scale);
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          base64 = canvas.toDataURL("image/jpeg", 0.8);
          
          if (base64.length > maxSizeKB * 1024 * 1.37) {
            setError(`Image is too large. Maximum size is ${maxSizeKB}KB.`);
            return;
          }
        }

        // Set preview and pass base64 to parent
        setPreview(base64);
        onImageSelected(base64);
      };

      img.onerror = () => {
        setError("Failed to load image");
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      setError("Failed to read file");
    };

    reader.readAsDataURL(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <Button
        type="button"
        variant="outline"
        onClick={handleButtonClick}
      >
        {preview ? "Change Image" : "Select Image"}
      </Button>
      
      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}
      
      {preview && (
        <div 
          className="overflow-hidden rounded-md border border-gray-200"
          style={{ height: previewHeight }}
        >
          <img
            src={preview}
            alt="Preview"
            className="h-full w-full object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
