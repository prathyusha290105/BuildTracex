import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoUploaderProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  label?: string;
  required?: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  files,
  onChange,
  maxFiles = 5,
  maxSizeMB = 10,
  label = 'Upload Photographs / Evidence',
  required = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');

  const handleFileSelect = (selectedList: FileList | null) => {
    if (!selectedList) return;
    setError('');

    const newFiles: File[] = [];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

    for (let i = 0; i < selectedList.length; i++) {
      const file = selectedList[i];

      if (!allowedTypes.includes(file.type)) {
        setError(`File "${file.name}" is not a supported image (JPG, PNG, WebP).`);
        continue;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File "${file.name}" exceeds maximum allowed size of ${maxSizeMB}MB.`);
        continue;
      }

      newFiles.push(file);
    }

    if (files.length + newFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} photos allowed.`);
      const remainingSlots = maxFiles - files.length;
      onChange([...files, ...newFiles.slice(0, remainingSlots)]);
    } else {
      onChange([...files, ...newFiles]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onChange(updated);
    setError('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <span className="text-xs text-slate-400">
          {files.length}/{maxFiles} photos (max {maxSizeMB}MB each)
        </span>
      </div>

      {/* Drop area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 hover:border-primary-500 hover:bg-slate-50 rounded-lg p-5 text-center cursor-pointer transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <div className="flex flex-col items-center justify-center space-y-1">
          <Upload className="w-8 h-8 text-slate-400" />
          <p className="text-sm font-medium text-slate-700">
            Click to upload photographic evidence
          </p>
          <p className="text-xs text-slate-400">
            Supports JPEG, PNG, WebP (up to {maxSizeMB}MB)
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2 rounded">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Previews */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="relative group rounded-md border border-slate-200 overflow-hidden bg-slate-100 aspect-square"
            >
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(idx);
                }}
                className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-80 hover:opacity-100 hover:bg-red-600 transition-all"
                title="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-white p-1 truncate">
                {file.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
