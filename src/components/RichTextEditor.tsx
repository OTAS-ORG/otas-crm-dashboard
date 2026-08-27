import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Image as ImageIcon,
  Minus,
  RemoveFormatting,
  Undo2,
  Redo2,
  CodeXml,
  Eye,
  X,
  UploadCloud,
  Upload,
  Loader2,
} from 'lucide-react';
import { blogService } from '../services/api';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your article content here...',
  minHeight = '420px',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'html' | 'preview'>('visual');
  const [htmlSource, setHtmlSource] = useState(value);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [uploadingEditorImage, setUploadingEditorImage] = useState(false);

  const handleEditorImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingEditorImage(true);
      const url = await blogService.uploadImage(file);
      setImageUrl(url);
    } catch (err: any) {
      console.error('Failed to upload image into editor:', err);
    } finally {
      setUploadingEditorImage(false);
    }
  };

  // Synchronize external value changes to editor ref
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value || '';
      }
    }
    setHtmlSource(value || '');
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setHtmlSource(html);
      onChange(html);
    }
  };

  const exec = (command: string, val: string | undefined = undefined) => {
    if (viewMode !== 'visual') return;
    document.execCommand(command, false, val);
    handleInput();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleFormatBlock = (tag: string) => {
    exec('formatBlock', tag);
  };

  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl) return;

    if (editorRef.current) {
      editorRef.current.focus();
      const textToInsert = linkText || linkUrl;
      const htmlToInsert = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-semibold hover:text-blue-800">${textToInsert}</a>`;
      document.execCommand('insertHTML', false, htmlToInsert);
      handleInput();
    }

    setLinkUrl('');
    setLinkText('');
    setIsLinkModalOpen(false);
  };

  const handleInsertImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;

    if (editorRef.current) {
      editorRef.current.focus();
      const htmlToInsert = `<figure class="my-6"><img src="${imageUrl}" alt="${imageAlt || 'Article image'}" class="w-full max-w-3xl rounded-2xl shadow-md mx-auto object-cover" />${imageAlt ? `<figcaption class="text-xs text-center text-slate-500 mt-2 font-medium">${imageAlt}</figcaption>` : ''}</figure><p><br></p>`;
      document.execCommand('insertHTML', false, htmlToInsert);
      handleInput();
    }

    setImageUrl('');
    setImageAlt('');
    setIsImageModalOpen(false);
  };

  const handleHtmlSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newHtml = e.target.value;
    setHtmlSource(newHtml);
    onChange(newHtml);
    if (editorRef.current) {
      editorRef.current.innerHTML = newHtml;
    }
  };

  // Word count & reading stats
  const textOnly = value.replace(/<[^>]*>?/gm, '');
  const wordCount = textOnly.trim() ? textOnly.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = textOnly.length;
  const estimatedMins = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="border border-slate-200/90 rounded-2xl bg-white shadow-xs overflow-hidden flex flex-col transition-all">
      {/* ===== Toolbar ===== */}
      <div className="border-b border-slate-100 bg-slate-50/80 p-2.5 flex flex-wrap items-center justify-between gap-1.5 backdrop-blur-xs select-none">
        {/* Left Toolbar formatting buttons */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Headings */}
          <div className="flex items-center bg-white border border-slate-200/80 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleFormatBlock('<h1>')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors"
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleFormatBlock('<h2>')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors"
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleFormatBlock('<h3>')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors"
              title="Heading 3"
            >
              <Heading3 className="w-4 h-4" />
            </button>
          </div>

          {/* Inline Styles */}
          <div className="flex items-center bg-white border border-slate-200/80 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => exec('bold')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('italic')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('underline')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors"
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('strikeThrough')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors"
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
          </div>

          {/* Lists & Alignment */}
          <div className="flex items-center bg-white border border-slate-200/80 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => exec('insertUnorderedList')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('insertOrderedList')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors"
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('justifyLeft')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors"
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('justifyCenter')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors"
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('justifyRight')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors"
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          {/* Block Elements */}
          <div className="flex items-center bg-white border border-slate-200/80 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleFormatBlock('<blockquote>')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors"
              title="Blockquote"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleFormatBlock('<pre>')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors"
              title="Code Block"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('insertHorizontalRule')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors"
              title="Horizontal Divider"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Embeds & Links */}
          <div className="flex items-center bg-white border border-slate-200/80 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setIsLinkModalOpen(true)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors"
              title="Insert Link"
            >
              <Link2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsImageModalOpen(true)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors"
              title="Insert Image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('removeFormat')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Clear Formatting"
            >
              <RemoveFormatting className="w-4 h-4" />
            </button>
          </div>

          {/* History */}
          <div className="flex items-center bg-white border border-slate-200/80 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => exec('undo')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec('redo')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-200/70 p-1 rounded-xl gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('visual')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'visual'
                ? 'bg-white text-primary shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Visual
          </button>
          <button
            type="button"
            onClick={() => setViewMode('html')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              viewMode === 'html'
                ? 'bg-white text-primary shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CodeXml className="w-3.5 h-3.5" />
            <span>HTML</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              viewMode === 'preview'
                ? 'bg-white text-primary shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* ===== Editor Area ===== */}
      <div className="relative flex-1 bg-white" style={{ minHeight }}>
        {viewMode === 'visual' && (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleInput}
            className="w-full h-full p-6 text-slate-800 text-base leading-relaxed focus:outline-none overflow-y-auto prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:my-3 prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-blue-50/40 prose-blockquote:p-4 prose-blockquote:rounded-r-xl prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:p-4 prose-img:rounded-2xl"
            data-placeholder={placeholder}
            style={{ minHeight }}
          />
        )}

        {viewMode === 'html' && (
          <textarea
            value={htmlSource}
            onChange={handleHtmlSourceChange}
            placeholder="Edit raw HTML code..."
            className="w-full h-full p-6 text-sm font-mono text-slate-800 bg-slate-950 text-slate-100 focus:outline-none resize-none"
            style={{ minHeight }}
            spellCheck={false}
          />
        )}

        {viewMode === 'preview' && (
          <div className="w-full h-full p-6 bg-slate-50/50 overflow-y-auto" style={{ minHeight }}>
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200/80">
              <div
                className="prose prose-slate max-w-none text-slate-800 leading-relaxed prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:my-4 prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-blue-50/40 prose-blockquote:p-4 prose-blockquote:rounded-r-xl prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:p-4 prose-img:rounded-2xl"
                dangerouslySetInnerHTML={{ __html: value || '<p class="text-slate-400 italic">No content to preview yet.</p>' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ===== Footer / Stats Bar ===== */}
      <div className="border-t border-slate-100 px-4 py-2 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-4">
          <span>{wordCount} words</span>
          <span className="text-slate-300">•</span>
          <span>{charCount} characters</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 font-semibold">
          <span>~{estimatedMins} min read</span>
        </div>
      </div>

      {/* Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 className="text-sm font-bold text-slate-800">Insert Link</h4>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleInsertLink} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Link URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Display Text (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Read full case study"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-600 rounded-xl transition-colors shadow-xs"
                >
                  Insert Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 className="text-sm font-bold text-slate-800">Insert Image</h4>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold mb-4">
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  imageMode === 'upload' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>From Device</span>
              </button>
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  imageMode === 'url' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Image URL</span>
              </button>
            </div>

            <form onSubmit={handleInsertImage} className="space-y-3.5">
              {imageMode === 'upload' ? (
                <div>
                  <label className="border-2 border-dashed border-slate-200 hover:border-primary/50 bg-slate-50/70 hover:bg-blue-50/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditorImageFileUpload}
                      disabled={uploadingEditorImage}
                      className="hidden"
                    />
                    {uploadingEditorImage ? (
                      <div className="flex flex-col items-center py-2">
                        <Loader2 className="w-6 h-6 text-primary animate-spin mb-1.5" />
                        <span className="text-xs font-bold text-slate-700">Uploading image...</span>
                      </div>
                    ) : imageUrl ? (
                      <div className="flex flex-col items-center">
                        <img src={imageUrl} alt="Uploaded" className="h-24 w-auto rounded-xl object-cover mb-2" />
                        <span className="text-xs font-bold text-emerald-600">✓ Image ready to insert</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center mb-1.5">
                          <UploadCloud className="w-4.5 h-4.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">Click to choose image</span>
                        <span className="text-[10px] text-slate-400">PNG, JPG, WEBP, GIF</span>
                      </div>
                    )}
                  </label>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Image URL</label>
                  <input
                    type="url"
                    required={imageMode === 'url'}
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Caption / Alt Text (Optional)</label>
                <input
                  type="text"
                  placeholder="Describe this image"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!imageUrl || uploadingEditorImage}
                  className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-600 disabled:opacity-40 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  Insert Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
