'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from './button';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface ImageUploadProps {
  value?: string; // Current image URL
  onChange: (url: string | null) => void;
  onError?: (error: string) => void;
  storagePath?: string; // e.g., 'company-logos', 'profile-pictures'
  maxSizeMB?: number;
  aspectRatio?: string; // e.g., '1:1', '16:9'
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  onError,
  storagePath = 'uploads',
  maxSizeMB = 5,
  aspectRatio,
  label = 'Upload Image',
  description,
  required = false,
  disabled = false
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError?.('Please select an image file');
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      onError?.(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    try {
      setUploading(true);

      // Create unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storageRef = ref(storage, `${storagePath}/${filename}`);

      // Upload file
      await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          uploadedAt: new Date().toISOString()
        }
      });

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update preview and notify parent
      setPreviewUrl(downloadURL);
      onChange(downloadURL);

      console.log('[ImageUpload] File uploaded successfully:', downloadURL);
    } catch (error) {
      console.error('[ImageUpload] Upload error:', error);
      onError?.('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!previewUrl) return;

    try {
      // Try to delete from storage (may fail if URL is external)
      if (previewUrl.includes('firebase')) {
        const fileRef = ref(storage, previewUrl);
        await deleteObject(fileRef);
        console.log('[ImageUpload] File deleted from storage');
      }
    } catch (error) {
      console.warn('[ImageUpload] Could not delete file:', error);
      // Continue anyway - we'll just remove the reference
    }

    setPreviewUrl(undefined);
    onChange(null);
  };

  const handleClick = () => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}

      <div className="flex items-start gap-4">
        {/* Preview or Upload Area */}
        <div
          className={`relative flex items-center justify-center border-2 border-dashed rounded-lg overflow-hidden bg-gray-50 transition-colors ${
            disabled
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-pointer hover:border-indigo-400 hover:bg-indigo-50'
          } ${previewUrl ? 'border-gray-300' : 'border-gray-300'}`}
          style={{
            width: aspectRatio === '1:1' ? '160px' : '200px',
            height: aspectRatio === '1:1' ? '160px' : '120px',
            aspectRatio: aspectRatio || 'auto'
          }}
          onClick={handleClick}
        >
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-contain"
              />
              {!disabled && !uploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </>
          ) : (
            <div className="text-center p-4">
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Uploading...</p>
                </>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Click to upload</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Upload Button (alternative) */}
        {!previewUrl && !uploading && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClick}
            disabled={disabled}
            className="h-auto"
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose File
          </Button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Additional info */}
      <p className="text-xs text-gray-500">
        Accepted: JPG, PNG, GIF, WebP • Max size: {maxSizeMB}MB
      </p>
    </div>
  );
}
