import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  Share2,
  Check,
  Copy,
  LayoutGrid,
  List as ListIcon,
  Clock,
  Sparkles,
  TrendingUp,
  FileText,
  Archive,
  CheckCircle2,
  X,
  Code2,
  Terminal,
} from 'lucide-react';
import { blogService } from '../services/api';
import type { Blog, BlogStats, BlogStatus } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Blogs: React.FC = () => {
  const navigate = useNavigate();

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [stats, setStats] = useState<BlogStats>({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & UI States
  const [deleteBlogId, setDeleteBlogId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fetch blogs & stats
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const data = await blogService.getBlogs({
        search,
        category: selectedCategory,
        status: selectedStatus,
        sort: sortBy,
        page,
        limit: 9,
      });

      setBlogs(data.blogs);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await blogService.getBlogStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching blog stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBlogs();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedStatus, sortBy, page]);

  const handleDelete = async () => {
    if (!deleteBlogId) return;
    try {
      setDeleting(true);
      await blogService.deleteBlog(deleteBlogId);
      setDeleteBlogId(null);
      await fetchBlogs();
      await fetchStats();
    } catch (error) {
      console.error('Error deleting blog:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Status badge styling
  const getStatusBadge = (status: BlogStatus) => {
    switch (status) {
      case 'Published':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Published
          </span>
        );
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Draft
          </span>
        );
      case 'Archived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
            <Archive className="w-3 h-3 text-slate-400" />
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* ===== Header & Actions ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-primary shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Blog & Article Hub</h1>
              <p className="text-xs text-slate-500 font-medium">Create and publish articles to your public portfolio</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsApiModalOpen(true)}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Code2 className="w-4 h-4 text-indigo-500" />
            <span>Portfolio API</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/blogs/new')}
            className="px-4.5 py-2.5 bg-primary hover:bg-primary-600 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Write New Post</span>
          </button>
        </div>
      </div>

      {/* ===== Stats Cards ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Posts</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.total}</p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Published</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">{stats.published}</p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Drafts</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">{stats.draft}</p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Reads</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600">{stats.totalViews.toLocaleString()}</p>
        </div>
      </div>

      {/* ===== Filters & Search Controls ===== */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['All', 'Published', 'Draft', 'Archived'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setSelectedStatus(st);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === st
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search, Category & View toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Technology">Technology</option>
            <option value="Web Development">Web Development</option>
            <option value="Design & UI/UX">Design & UI/UX</option>
            <option value="Business & Sales">Business & Sales</option>
            <option value="Tutorials">Tutorials</option>
            <option value="Case Studies">Case Studies</option>
            <option value="Company News">Company News</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="popular">Most Popular</option>
            <option value="title">Title (A-Z)</option>
          </select>

          {/* View Mode */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ===== Blog Posts Display ===== */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold">Loading articles...</p>
        </div>
      ) : blogs.length === 0 ? (
        <div className="py-20 bg-white rounded-3xl border border-slate-200/80 text-center p-8 shadow-2xs">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-primary flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No articles found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            {search || selectedStatus !== 'All'
              ? 'Try adjusting your search query or status filter.'
              : 'You haven’t published any blog posts yet. Start writing your first post today!'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/blogs/new')}
            className="px-4.5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-600 transition-all cursor-pointer"
          >
            Create First Post
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {blogs.map((blog) => (
            <div
              key={blog._id}
              className="group bg-white rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col overflow-hidden"
            >
              {/* Card Cover */}
              <div className="relative h-44 bg-gradient-to-tr from-slate-100 via-blue-50/50 to-indigo-50 overflow-hidden shrink-0">
                {blog.coverImage ? (
                  <img
                    src={blog.coverImage}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                    <BookOpen className="w-12 h-12 stroke-[1.2] mb-1" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      {blog.category || 'Article'}
                    </span>
                  </div>
                )}

                {/* Badges on Cover */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-md text-slate-800 shadow-xs border border-white/60">
                    {blog.category || 'General'}
                  </span>
                </div>

                <div className="absolute top-3 right-3">{getStatusBadge(blog.status)}</div>
              </div>

              {/* Card Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3
                    onClick={() => navigate(`/blogs/edit/${blog._id}`)}
                    className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 mb-2 cursor-pointer leading-snug"
                  >
                    {blog.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                    {blog.excerpt || 'No excerpt available for this post.'}
                  </p>
                </div>

                {/* Meta & Footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {blog.readTime || 1} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      {blog.views || 0}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(`${API_BASE_URL}/public/blogs/${blog.slug}`, `slug-${blog._id}`)}
                      className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Copy Public API Endpoint"
                    >
                      {copiedKey === `slug-${blog._id}` ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/blogs/edit/${blog._id}`)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Article"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteBlogId(blog._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table Layout */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Article
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Category
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Author
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Reads
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Published Date
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {blogs.map((blog) => (
                  <tr key={blog._id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                          {blog.coverImage ? (
                            <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <BookOpen className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p
                            onClick={() => navigate(`/blogs/edit/${blog._id}`)}
                            className="text-sm font-bold text-slate-900 hover:text-primary transition-colors cursor-pointer line-clamp-1"
                          >
                            {blog.title}
                          </p>
                          <p className="text-xs text-slate-400 line-clamp-1">{blog.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                        {blog.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(blog.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-semibold text-slate-700">
                        {typeof blog.author === 'object' && blog.author?.username
                          ? blog.author.username
                          : blog.authorName || 'Admin'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold text-slate-800">{blog.views || 0}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs text-slate-500 font-medium">
                        {blog.publishedAt
                          ? new Date(blog.publishedAt).toLocaleDateString()
                          : new Date(blog.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopy(`${API_BASE_URL}/public/blogs/${blog.slug}`, `table-${blog._id}`)}
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Copy API Link"
                        >
                          {copiedKey === `table-${blog._id}` ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/blogs/edit/${blog._id}`)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteBlogId(blog._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
        </div>
      )}

      {/* ===== Pagination Controls ===== */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ===== Delete Confirmation Modal ===== */}
      {deleteBlogId &&
        createPortal(
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setDeleteBlogId(null)}
          >
            <div
              className="no-glass bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
              style={{ backgroundColor: '#ffffff', opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4 text-rose-500 shadow-xs">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 text-center mb-1.5">Delete Blog Post</h3>
              <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
                Are you sure you want to delete this blog post? This action will remove it from the dashboard and your public portfolio.
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteBlogId(null)}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20 cursor-pointer"
                >
                  {deleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ===== Public Portfolio API Documentation Modal ===== */}
      {isApiModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setIsApiModalOpen(false)}
          >
            <div
              className="no-glass bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col"
              style={{ backgroundColor: '#ffffff', opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Public Portfolio API Endpoints</h3>
                    <p className="text-xs text-slate-500 font-medium">Use these endpoints on your personal portfolio website (No Auth needed)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsApiModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 bg-slate-50/50">
                {/* Endpoint 1 */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                        GET
                      </span>
                      <span className="text-xs font-bold text-slate-800">Fetch All Published Articles</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(`${API_BASE_URL}/public/blogs`, 'api-1')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'api-1' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy URL</span>
                    </button>
                  </div>
                  <pre className="p-2.5 bg-slate-950 text-slate-200 text-xs font-mono rounded-xl overflow-x-auto">
                    {`${API_BASE_URL}/public/blogs?page=1&limit=9&category=All`}
                  </pre>
                </div>

                {/* Endpoint 2 */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                        GET
                      </span>
                      <span className="text-xs font-bold text-slate-800">Fetch Single Article by Slug</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(`${API_BASE_URL}/public/blogs/:slug`, 'api-2')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'api-2' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy URL</span>
                    </button>
                  </div>
                  <pre className="p-2.5 bg-slate-950 text-slate-200 text-xs font-mono rounded-xl overflow-x-auto">
                    {`${API_BASE_URL}/public/blogs/my-first-blog-post`}
                  </pre>
                  <p className="text-[11px] text-slate-500 italic">
                    * Calling this endpoint automatically increments the article's total view count by 1.
                  </p>
                </div>

                {/* Example Frontend Code snippet */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">React / Next.js Integration Example</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          `// In your Portfolio website (e.g. Next.js or React)
const res = await fetch('${API_BASE_URL}/public/blogs');
const data = await res.json();
const blogs = data.data.blogs;`,
                          'snippet'
                        )
                      }
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'snippet' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Code</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 text-emerald-400 text-xs font-mono rounded-xl overflow-x-auto leading-relaxed">
                    {`// Fetching articles in your portfolio
const fetchPortfolioBlogs = async () => {
  const res = await fetch('${API_BASE_URL}/public/blogs');
  const result = await res.json();
  return result.data.blogs; // Array of published articles
};`}
                  </pre>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsApiModalOpen(false)}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default Blogs;
