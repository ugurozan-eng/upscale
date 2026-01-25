import { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function FileUploader({ onFileSelect, disabled }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setFileName(file.name);
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  }, [handleFile]);

  const clearPreview = useCallback(() => {
    setPreview(null);
    setFileName(null);
  }, []);

  if (preview) {
    return (
      <div className="relative rounded-2xl overflow-hidden border-2 border-primary-500/50 bg-dark-800">
        <img src={preview} alt="Preview" className="w-full h-64 object-contain bg-dark-900" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-dark-900 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <ImageIcon className="w-4 h-4 text-primary-400" />
              <span className="text-dark-200 truncate max-w-[200px]">{fileName}</span>
            </div>
            {!disabled && (
              <button onClick={clearPreview} className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
        dragActive ? 'border-primary-400 bg-primary-500/10' : 'border-dark-600 hover:border-primary-500/50 hover:bg-dark-800/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 bg-dark-700 rounded-2xl flex items-center justify-center">
          <Upload className={`w-8 h-8 ${dragActive ? 'text-primary-400' : 'text-dark-400'}`} />
        </div>
        <div>
          <p className="text-lg font-medium text-white">
            {dragActive ? 'Drop your image here' : 'Drag & drop your image'}
          </p>
          <p className="text-sm text-dark-400 mt-1">or click to browse • PNG, JPG, WEBP up to 10MB</p>
        </div>
      </div>
    </div>
  );
}
