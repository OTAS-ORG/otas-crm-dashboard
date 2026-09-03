import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Share2,
  Trash2,
  Globe,
  Loader2,
  X,
  UploadCloud,
  Upload,
  Link2,
  Move,
  Crosshair,
  RotateCcw,
} from 'lucide-react';
import { blogService } from '../services/api';
import RichTextEditor from '../components/RichTextEditor';
import type { Blog, BlogFormData, BlogStatus } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DEFAULT_CATEGORIES = [
  'Technology',
  'Web Development',
  'Design & UI/UX',
  'Business & Sales',
  'Tutorials',
  'Case Studies',
  'Company News',
];

const PRESET_POSITIONS = [
  { label: 'Top', val: '50% 0%' },
  { label: 'Center', val: '50% 50%' },
  { label: 'Bottom', val: '50% 100%' },
  { label: 'Left', val: '0% 50%' },
  { label: 'Right', val: '100% 50%' },
];

const parsePosition = (posStr?: string): { x: number; y: number } => {
  if (!posStr) return { x: 50, y: 50 };
  const parts = posStr.trim().split(/\s+/);
  if (parts.length >= 2) {
    const parseCoord = (val: string, fallback: number) => {
      if (val === 'top' || val === 'left') return 0;
      if (val === 'center') return 50;
      if (val === 'bottom' || val === 'right') return 100;
      const num = parseFloat(val.replace('%', ''));
      return isNaN(num) ? fallback : Math.max(0, Math.min(100, num));
    };
    return {
      x: parseCoord(parts[0], 50),
      y: parseCoord(parts[1], 50),
    };
  }
  return { x: 50, y: 50 };
};

const BlogEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Form states
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    customSlug: '',
    content: '',
    excerpt: '',
    coverImage: '',
    coverImagePosition: '50% 50%',
    category: 'Technology',
    tags: [],
    status: 'Draft',
  });

  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [originalBlog, setOriginalBlog] = useState<Blog | null>(null);

  // Cover image mode, upload state & repositioning
  const [coverMode, setCoverMode] = useState<'upload' | 'url'>('upload');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number } | null>(null);
  const coverContainerRef = useRef<HTMLDivElement>(null);

  // Loading & Feedback
  const [fetching, setFetching] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Handle local file selection and upload
  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      setError(null);
      const url = await blogService.uploadImage(file);
      setFormData((prev) => ({ ...prev, coverImage: url }));
      setSuccessMessage('Cover image uploaded successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload cover image');
    } finally {
      setUploadingCover(false);
    }
  };

  // Drag-to-Reposition Mouse & Touch Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isRepositioning) return;
    e.preventDefault();
    const current = parsePosition(formData.coverImagePosition);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: current.x,
      startY: current.y,
    };
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStartRef.current || !coverContainerRef.current) return;
    const rect = coverContainerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStartRef.current.clientX;
    const deltaY = e.clientY - dragStartRef.current.clientY;

    const deltaXPercent = (deltaX / rect.width) * 100;
    const deltaYPercent = (deltaY / rect.height) * 100;

    const newX = Math.round(Math.max(0, Math.min(100, dragStartRef.current.startX - deltaXPercent)));
    const newY = Math.round(Math.max(0, Math.min(100, dragStartRef.current.startY - deltaYPercent)));

    setFormData((prev) => ({
      ...prev,
      coverImagePosition: `${newX}% ${newY}%`,
    }));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isRepositioning || e.touches.length === 0) return;
    const touch = e.touches[0];
    const current = parsePosition(formData.coverImagePosition);
    dragStartRef.current = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      startX: current.x,
      startY: current.y,
    };
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !dragStartRef.current || !coverContainerRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = coverContainerRef.current.getBoundingClientRect();
    const deltaX = touch.clientX - dragStartRef.current.clientX;
    const deltaY = touch.clientY - dragStartRef.current.clientY;

    const deltaXPercent = (deltaX / rect.width) * 100;
    const deltaYPercent = (deltaY / rect.height) * 100;

    const newX = Math.round(Math.max(0, Math.min(100, dragStartRef.current.startX - deltaXPercent)));
    const newY = Math.round(Math.max(0, Math.min(100, dragStartRef.current.startY - deltaYPercent)));

    setFormData((prev) => ({
      ...prev,
      coverImagePosition: `${newX}% ${newY}%`,
    }));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Fetch existing blog if editing
  useEffect(() => {
    if (isEditing && id) {
      const fetchBlog = async () => {
        try {
          setFetching(true);
          const blog = await blogService.getBlogById(id);
          setOriginalBlog(blog);
          setFormData({
            title: blog.title,
            customSlug: blog.slug,
            content: blog.content,
            excerpt: blog.excerpt || '',
            coverImage: blog.coverImage || '',
            coverImagePosition: blog.coverImagePosition || '50% 50%',
            category: blog.category || 'Technology',
            tags: blog.tags || [],
            status: blog.status,
          });

          // Ensure existing category is in category options
          if (blog.category && !DEFAULT_CATEGORIES.includes(blog.category)) {
            setCategories((prev) => Array.from(new Set([...prev, blog.category])));
          }
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to load blog post');
        } finally {
          setFetching(false);
        }
      };

      fetchBlog();
    }
  }, [id, isEditing]);

  // Handle adding tags
  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();

    const trimmed = tagInput.trim().replace(/^,|,$/g, '');
    if (!trimmed) return;

    const currentTags = Array.isArray(formData.tags) ? formData.tags : [];
    if (!currentTags.includes(trimmed)) {
      setFormData({
        ...formData,
        tags: [...currentTags, trimmed],
      });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = Array.isArray(formData.tags) ? formData.tags : [];
    setFormData({
      ...formData,
      tags: currentTags.filter((t) => t !== tagToRemove),
    });
  };

  const handleAddCustomCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
      setFormData({ ...formData, category: trimmed });
    }
    setNewCategoryInput('');
    setIsAddingCategory(false);
  };

  // Submit Handler
  const handleSubmit = async (publishStatus?: BlogStatus) => {
    try {
      setError(null);
      setSuccessMessage(null);

      if (!formData.title.trim()) {
        setError('Please provide a title for the blog post.');
        return;
      }

      if (!formData.content.trim()) {
        setError('Please write some content in the editor.');
        return;
      }

      setSaving(true);

      const payload: BlogFormData = {
        ...formData,
        status: publishStatus || formData.status,
        excerpt: formData.excerpt?.trim() || formData.title.slice(0, 160),
      };

      if (isEditing && id) {
        const updated = await blogService.updateBlog(id, payload);
        setOriginalBlog(updated);
        setFormData((prev) => ({ ...prev, status: updated.status, customSlug: updated.slug }));
        setSuccessMessage('Blog post updated successfully!');
      } else {
        const created = await blogService.createBlog(payload);
        setSuccessMessage('Blog post created successfully!');
        setTimeout(() => {
          navigate(`/blogs/edit/${created._id}`);
        }, 800);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save blog post');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPublicUrl = () => {
    const slug = formData.customSlug || originalBlog?.slug;
    if (!slug) return;
    navigator.clipboard.writeText(`${API_BASE_URL}/public/blogs/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute live word count & reading time
  const textOnly = formData.content.replace(/<[^>]*>?/gm, '');
  const wordCount = textOnly.trim() ? textOnly.trim().split(/\s+/).filter(Boolean).length : 0;
  const estimatedMins = Math.max(1, Math.ceil(wordCount / 200));

  if (fetching) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <div className="w-9 h-9 border-3 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold">Loading article editor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* ===== Top Action Navigation Bar ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4.5 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/blogs')}
            className="w-10 h-10 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
            title="Back to Blogs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              {isEditing ? 'Edit Blog Post' : 'New Blog Post'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {formData.status === 'Published' ? (
                <span className="text-emerald-600 font-bold inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live on Public Portfolio
                </span>
              ) : (
                <span className="text-amber-600 font-bold">Draft Mode (Unpublished)</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit('Draft')}
            className="px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit('Published')}
            className="px-5 py-2.5 bg-primary hover:bg-primary-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{formData.status === 'Published' ? 'Update Post' : 'Publish to Portfolio'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-in fade-in">
          <Check className="w-4.5 h-4.5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ===== Main Editor Grid ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Main Content Editor (8 Columns) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Post Title */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Article Title
              </label>
              <input
                type="text"
                required
                placeholder="Enter an engaging title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full text-2xl sm:text-3xl font-black text-slate-900 placeholder-slate-300 focus:outline-none border-b border-slate-100 pb-3 focus:border-primary transition-colors"
              />
            </div>

            {/* Slug Configuration */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-slate-500 font-mono bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
              <span className="text-slate-400 font-bold shrink-0">slug:</span>
              <input
                type="text"
                placeholder="auto-generated-from-title"
                value={formData.customSlug || ''}
                onChange={(e) => setFormData({ ...formData, customSlug: e.target.value })}
                className="w-full bg-transparent text-slate-700 font-semibold focus:outline-none placeholder-slate-400"
              />
            </div>
          </div>

          {/* WYSIWYG Rich Text Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Article Body & Media
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {wordCount} words • ~{estimatedMins} min read
              </span>
            </div>

            <RichTextEditor
              value={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholder="Write your article story, insert code snippets, quotes, and images..."
              minHeight="480px"
            />
          </div>
        </div>

        {/* Right: Metadata & Settings Sidebar (4 Columns) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Publishing Settings */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <span>Publishing Settings</span>
            </h3>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Visibility Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as BlogStatus })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="Draft">Draft (Private)</option>
                <option value="Published">Published (Public)</option>
                <option value="Archived">Archived (Hidden)</option>
              </select>
            </div>

            {/* Category Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-600">Category</label>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory((prev) => !prev)}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  {isAddingCategory ? 'Cancel' : '+ New Category'}
                </button>
              </div>

              {isAddingCategory ? (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Enter category name"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCategory}
                    className="px-3 py-2 bg-primary text-white text-xs font-bold rounded-xl"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Tags Input */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Tags (Keywords)</label>
              <div className="flex gap-1.5 mb-2">
                <input
                  type="text"
                  placeholder="Add tag (e.g. React, AI) & press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Tag Chips */}
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(formData.tags) ? formData.tags : []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Featured Cover Image */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>Cover Image</span>
              </h3>

              {/* Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setCoverMode('upload')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    coverMode === 'upload' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>Device</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCoverMode('url')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    coverMode === 'url' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Link2 className="w-3 h-3" />
                  <span>URL</span>
                </button>
              </div>
            </div>

            {coverMode === 'upload' ? (
              /* Local Device Upload Dropzone */
              <div>
                <label className="border-2 border-dashed border-slate-200 hover:border-primary/50 bg-slate-50/70 hover:bg-blue-50/30 rounded-2xl p-4.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileUpload}
                    disabled={uploadingCover}
                    className="hidden"
                  />
                  {uploadingCover ? (
                    <div className="flex flex-col items-center py-2">
                      <Loader2 className="w-6 h-6 text-primary animate-spin mb-1.5" />
                      <span className="text-xs font-bold text-slate-700">Uploading cover image...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 mb-0.5">Click to choose image from device</span>
                      <span className="text-[10px] text-slate-400 font-medium">PNG, JPG, WEBP, GIF up to 10MB</span>
                    </div>
                  )}
                </label>
              </div>
            ) : (
              /* URL Input Mode */
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Direct Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.coverImage || ''}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}

            {/* Image Preview with Interactive Repositioning & Presets */}
            {formData.coverImage ? (
              <div className="space-y-3">
                <div
                  ref={coverContainerRef}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={`relative rounded-2xl overflow-hidden border border-slate-200 h-44 bg-slate-900 group shadow-xs select-none transition-all ${
                    isRepositioning
                      ? isDragging
                        ? 'cursor-grabbing ring-2 ring-primary ring-offset-2'
                        : 'cursor-grab ring-2 ring-primary/60'
                      : ''
                  }`}
                >
                  <img
                    src={formData.coverImage}
                    alt="Cover preview"
                    draggable={false}
                    style={{ objectPosition: formData.coverImagePosition || '50% 50%' }}
                    className={`w-full h-full object-cover select-none pointer-events-none transition-[object-position] ${
                      isDragging ? 'duration-0' : 'duration-200'
                    }`}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />

                  {/* Repositioning Overlay & Indicator */}
                  {isRepositioning && (
                    <div className="absolute inset-0 bg-black/25 flex flex-col items-center justify-between p-3 pointer-events-none">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-md">
                        <Move className="w-3 h-3 text-primary animate-pulse" />
                        <span>Drag image to adjust visible area</span>
                      </span>

                      <div className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center bg-black/20 text-white/75 backdrop-blur-xs">
                        <Crosshair className="w-4 h-4" />
                      </div>

                      <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-black/60 text-emerald-400">
                        {formData.coverImagePosition || '50% 50%'}
                      </span>
                    </div>
                  )}

                  {/* Top Right Actions */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                    <button
                      type="button"
                      onClick={() => setIsRepositioning(!isRepositioning)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                        isRepositioning
                          ? 'bg-primary text-white hover:bg-primary-600 ring-2 ring-white/50'
                          : 'bg-slate-950/75 text-white hover:bg-slate-900 hover:text-white backdrop-blur-md'
                      }`}
                      title={isRepositioning ? 'Finish Repositioning' : 'Reposition Cover'}
                    >
                      {isRepositioning ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Done</span>
                        </>
                      ) : (
                        <>
                          <Move className="w-3.5 h-3.5" />
                          <span>Reposition</span>
                        </>
                      )}
                    </button>

                    {!isRepositioning && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, coverImage: '', coverImagePosition: '50% 50%' });
                          setIsRepositioning(false);
                        }}
                        className="p-1.5 rounded-xl bg-slate-950/75 text-white hover:bg-rose-600 transition-colors cursor-pointer shadow-md"
                        title="Remove Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Presets & Position Controls */}
                <div className="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-600 flex items-center gap-1">
                      <Crosshair className="w-3 h-3 text-slate-400" />
                      <span>Focal Position:</span>
                      <span className="font-mono text-primary font-bold">{formData.coverImagePosition || '50% 50%'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, coverImagePosition: '50% 50%' })}
                      className="text-[10px] text-slate-400 hover:text-slate-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Reset to Center"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Reset</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    {PRESET_POSITIONS.map((preset) => {
                      const isActive = (formData.coverImagePosition || '50% 50%') === preset.val;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setFormData({ ...formData, coverImagePosition: preset.val })}
                          className={`flex-1 min-w-[50px] py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center ${
                            isActive
                              ? 'bg-primary text-white shadow-2xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-slate-200/80 rounded-2xl p-3.5 text-center text-slate-400 text-[11px] font-medium">
                No cover image selected. (Optional)
              </div>
            )}
          </div>

          {/* Short Excerpt */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
              Short Excerpt (SEO Summary)
            </label>
            <textarea
              rows={3}
              placeholder="Brief summary of this article to appear on blog cards and search engines..."
              value={formData.excerpt || ''}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none leading-relaxed"
            />
          </div>

          {/* Public API Endpoint Card */}
          {isEditing && originalBlog && (
            <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white p-5 rounded-3xl shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Public API Endpoint
                </span>
                <button
                  type="button"
                  onClick={handleCopyPublicUrl}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-xs font-mono text-slate-300 break-all bg-black/30 p-2.5 rounded-xl">
                {`${API_BASE_URL}/public/blogs/${originalBlog.slug}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogEditor;
