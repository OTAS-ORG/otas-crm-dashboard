import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface FileUploadFieldProps {
  name: string;
  label: string;
  required?: boolean;
  accept?: string;
  maxSize?: number;
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  name,
  label,
  required,
  accept,
  maxSize = 20,
  value = [],
  onChange,
  disabled,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');
    const file = files[0];

    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit`);
      return;
    }

    const formData = new FormData();
    formData.append('files', file);

    setUploading(true);
    setProgress(0);

    try {
      const storedUser = localStorage.getItem('otas_user');
      const headers: any = { 'Content-Type': 'multipart/form-data' };
      if (storedUser) {
        const { token } = JSON.parse(storedUser);
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.post(`${API_URL}/public/upload`, formData, {
        headers,
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      const urls = response.data.data.urls;
      onChange([...value, ...urls]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="space-y-2">
        {value.map((url, index) => (
          <div key={index} className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline truncate flex-1">
              {url.split('/').pop()}
            </a>
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            {!disabled && (
              <button type="button" onClick={() => handleRemove(index)} className="text-slate-400 hover:text-red-500 shrink-0">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {!disabled && (
          <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all">
            <Upload className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500">
              {uploading ? `Uploading ${progress}%...` : 'Click to upload'}
            </span>
            <input
              type="file"
              accept={accept}
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
        {uploading && (
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className="bg-indigo-600 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default FileUploadField;
