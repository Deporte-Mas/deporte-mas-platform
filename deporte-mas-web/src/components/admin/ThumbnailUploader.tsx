import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadThumbnail } from '@/lib/admin-api';

interface ThumbnailUploaderProps {
  onUpload: (url: string) => void;
  currentUrl?: string;
  label?: string;
  maxSizeMB?: number;
  aspectRatio?: string;
}

const ThumbnailUploader: React.FC<ThumbnailUploaderProps> = ({
  onUpload,
  currentUrl,
  label = 'Thumbnail',
  maxSizeMB = 5,
  aspectRatio = '16/9',
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(currentUrl);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > maxSizeMB) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to storage
    setUploading(true);
    try {
      const url = await uploadThumbnail(file);
      onUpload(url);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPreview(currentUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(undefined);
    onUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {preview ? (
        <div className="relative group">
          <div
            className="relative overflow-hidden rounded-lg border border-gray-200"
            style={{ aspectRatio }}
          >
            <img
              src={preview}
              alt="Thumbnail preview"
              className="w-full h-full object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
          {!uploading && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ aspectRatio }}
        >
          <div className="flex flex-col items-center justify-center text-gray-500">
            {uploading ? (
              <>
                <Loader2 className="w-12 h-12 mb-4 animate-spin" />
                <p className="text-sm">Uploading...</p>
              </>
            ) : (
              <>
                <ImageIcon className="w-12 h-12 mb-4" />
                <p className="text-sm font-medium">Click to upload {label.toLowerCase()}</p>
                <p className="text-xs mt-1">PNG, JPG, WebP up to {maxSizeMB}MB</p>
              </>
            )}
          </div>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!preview && !uploading && (
        <p className="text-xs text-gray-500">
          Recommended: 1280x720 pixels ({aspectRatio} aspect ratio)
        </p>
      )}
    </div>
  );
};

export default ThumbnailUploader;
