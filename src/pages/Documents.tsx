import React, { useEffect, useState } from 'react';
import {
  FolderOpen, Search, Trash2, Eye, X, Loader2, Upload, FileText, Image, Video, Music, Archive, File, Plus
} from 'lucide-react';
import { documentService, clientService, projectService } from '../services/api';
import type { Document, Client, Project } from '../types';

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');

  // Dropdown list data
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Filter states
  const [clientFilter, setClientFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  // Upload modal states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploadClientId, setUploadClientId] = useState('');
  const [uploadProjectId, setUploadProjectId] = useState('');
  const [uploading, setUploading] = useState(false);

  // Delete modal states
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentService.getDocuments({
        search: search || undefined,
        clientId: clientFilter || undefined,
        projectId: projectFilter || undefined,
        page,
        limit: 15,
      });
      setDocuments(data.documents);
      setTotal(data.total);
      setPages(data.pages);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [clientsData, projectsData] = await Promise.all([
        clientService.getClients(),
        projectService.getProjects(),
      ]);
      setClients(clientsData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching filter lists:', error);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [page, clientFilter, projectFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchDocuments();
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFiles || uploadFiles.length === 0) return;

    try {
      setUploading(true);
      const filesArray = Array.from(uploadFiles);
      const newDocs = await documentService.uploadDocument(
        filesArray,
        uploadClientId || undefined,
        uploadProjectId || undefined
      );
      setDocuments((prev) => [...newDocs, ...prev]);
      setTotal((t) => t + newDocs.length);
      setIsUploadOpen(false);
      setUploadFiles(null);
      setUploadClientId('');
      setUploadProjectId('');
    } catch (error) {
      console.error('Error uploading documents:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await documentService.deleteDocument(deleteId);
      setDocuments((prev) => prev.filter((d) => d._id !== deleteId));
      setTotal((t) => t - 1);
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setDeleting(false);
    }
  };

  // Helper to format file size
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Helper to resolve extension icons
  const getFileIcon = (mimeType: string, fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const type = mimeType.toLowerCase();

    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (type.includes('image') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
      return <Image className="w-5 h-5 text-emerald-500" />;
    }
    if (type.includes('video') || ['mp4', 'mov', 'avi', 'mkv'].includes(ext)) {
      return <Video className="w-5 h-5 text-orange-500" />;
    }
    if (type.includes('audio') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
      return <Music className="w-5 h-5 text-violet-500" />;
    }
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
      return <Archive className="w-5 h-5 text-slate-500" />;
    }
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext)) {
      return <FileText className="w-5 h-5 text-blue-500" />;
    }
    return <File className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 bg-white p-5 md:px-6 md:py-5 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Document Vault</h2>
            <p className="text-sm text-slate-500">{total} documents stored</p>
          </div>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="mt-4 sm:mt-0 relative z-10 flex items-center justify-center px-5 py-2.5 bg-primary text-white text-sm rounded-xl hover:bg-primary-600 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 font-semibold"
        >
          <Plus className="w-5 h-5 mr-2" />
          Upload Document
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by name..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all text-sm text-slate-700 dark:text-slate-200 shadow-inner"
          />
        </div>
        <select
          value={clientFilter}
          onChange={(e) => { setClientFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white cursor-pointer"
        >
          <option value="">All Clients</option>
          {clients.map((c) => <option key={c._id} value={c._id}>{c.companyName}</option>)}
        </select>
        <select
          value={projectFilter}
          onChange={(e) => { setProjectFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white cursor-pointer"
        >
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      {/* Main Grid / Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No documents found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">File Name</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Size</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Associated To</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Uploaded By</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Upload Date</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          {getFileIcon(doc.type, doc.name)}
                        </div>
                        <span className="text-sm font-medium text-slate-800 break-all">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className="text-sm text-slate-600">{formatBytes(doc.size)}</span>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex flex-col gap-0.5">
                        {doc.client && (
                          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md w-max">
                            Client: {doc.client.companyName}
                          </span>
                        )}
                        {doc.project && (
                          <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md w-max">
                            Project: {doc.project.name}
                          </span>
                        )}
                        {!doc.client && !doc.project && (
                          <span className="text-xs text-slate-400 font-medium">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className="text-sm text-slate-600">{doc.uploadedBy?.username || 'Unknown'}</span>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className="text-xs text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                          title="Open/Download"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => setDeleteId(doc._id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">Page {page} of {pages}</p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsUploadOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-slate-800">Upload New File</h3>
              </div>
              <button onClick={() => setIsUploadOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-5 space-y-4">
              {/* File Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Select File(s)</label>
                <input
                  type="file"
                  multiple
                  required
                  onChange={(e) => setUploadFiles(e.target.files)}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer"
                />
              </div>

              {/* Client Association */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Link to Client (Optional)</label>
                <select
                  value={uploadClientId}
                  onChange={(e) => setUploadClientId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white cursor-pointer"
                >
                  <option value="">Do not link client</option>
                  {clients.map((c) => <option key={c._id} value={c._id}>{c.companyName}</option>)}
                </select>
              </div>

              {/* Project Association */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Link to Project (Optional)</label>
                <select
                  value={uploadProjectId}
                  onChange={(e) => setUploadProjectId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white cursor-pointer"
                >
                  <option value="">Do not link project</option>
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFiles}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary-600 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 text-center mb-2">Delete Document</h3>
            <p className="text-sm text-slate-500 text-center mb-5">Are you sure you want to delete this document? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
