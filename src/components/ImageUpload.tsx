import { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  selectedImage: File | null;
  onClear: () => void;
}

export const ImageUpload = ({ onImageSelect, selectedImage, onClear }: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    onImageSelect(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setPreview(null);
    onClear();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {!preview ? (
        <Card className="p-8 border-2 border-dashed border-border hover:border-primary transition-smooth shadow-card animate-scale-in">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Upload Ingredient List</h3>
              <p className="text-muted-foreground text-sm">
                Take a photo or upload an image of the ingredient list
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="hero"
                size="lg"
                className="w-full hover-scale shadow-soft"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="mr-2 h-5 w-5" />
                Take Photo
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full hover-scale shadow-soft"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-5 w-5" />
                Upload Image
              </Button>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>
        </Card>
      ) : (
        <Card className="p-4 shadow-elegant animate-scale-in">
          <div className="relative">
            <img
              src={preview}
              alt="Selected ingredient list"
              className="w-full h-auto rounded-lg shadow-soft"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 shadow-soft hover-scale"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
