"use client";

import { useRef, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import Image from "next/image";
import { uploadImage } from "@/lib/firebase/storage";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  uploadPath: string;     // e.g. "tenants/abc/resources"
  maxImages?: number;
  label?: string;
  disabled?: boolean;
}

export function ImageUpload({
  images,
  onChange,
  uploadPath,
  maxImages = 5,
  label = "Images",
  disabled,
}: ImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || disabled) return;
    const remaining = maxImages - images.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (!toUpload.length) return;

    setUploading(true);
    try {
      const results = await Promise.all(
        toUpload.map((f) => uploadImage(uploadPath, f))
      );
      onChange([...images, ...results.map((r) => r.fullUrl)]);
    } catch {
      console.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = (url: string) => onChange(images.filter((i) => i !== url));

  return (
    <div>
      {label && (
        <p className="mb-2 text-sm font-medium text-gray-700">{label}</p>
      )}

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {images.map((url) => (
            <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200">
              <Image src={url} alt="" fill className="object-cover" />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(url)}
                  className="absolute right-0.5 top-0.5 rounded-full bg-white/80 p-0.5 text-red-500 hover:bg-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload trigger */}
      {images.length < maxImages && !disabled && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50"
        >
          {uploading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          ) : (
            <Upload size={15} />
          )}
          {uploading ? "Uploading…" : `Add photo (${images.length}/${maxImages})`}
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

// Lightweight picker — choose from existing image URLs (no upload)
interface ImagePickerProps {
  allImages: { url: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label?: string;
}

export function ImagePicker({ allImages, selected, onChange, label }: ImagePickerProps) {
  const toggle = (url: string) => {
    if (selected.includes(url)) {
      onChange(selected.filter((s) => s !== url));
    } else {
      onChange([...selected, url]);
    }
  };

  if (!allImages.length) return null;

  return (
    <div>
      {label && <p className="mb-2 text-sm font-medium text-gray-700">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {allImages.map(({ url, label: lbl }) => (
          <button
            key={url}
            type="button"
            onClick={() => toggle(url)}
            title={lbl}
            className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 transition-all ${
              selected.includes(url)
                ? "border-blue-500 ring-2 ring-blue-300"
                : "border-gray-200 hover:border-gray-400"
            }`}
          >
            <Image src={url} alt={lbl} fill className="object-cover" />
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <p className="mt-1 text-xs text-gray-500">{selected.length} image(s) selected</p>
      )}
    </div>
  );
}
