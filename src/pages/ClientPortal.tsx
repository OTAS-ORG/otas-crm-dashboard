import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService, onboardingService } from '../services/api';
import type { ClientDashboardData, EmailPair } from '../types';
import BusinessEmailForm from '../components/BusinessEmailForm';
import WebsiteRequirementsForm from '../components/WebsiteRequirementsForm';
import OnboardingLinkModal from '../components/OnboardingLinkModal';
import SuccessModal from '../components/SuccessModal';
import {
  ArrowLeft, Mail, Building, User as UserIcon, ShieldCheck,
  Globe, Link as LinkIcon, Share2, MessageSquare,
  ExternalLink, Clock, MapPin, CheckCircle, Star, Link2,
  Copy, AlertCircle, XCircle, Trash2
} from 'lucide-react';

const ClientPortal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<ClientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState('');
  const [onboardingTokens, setOnboardingTokens] = useState<any[]>([]);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchDashboardData(id);
      checkOnboardingStatus(id);
    }
  }, [id]);

  const fetchDashboardData = async (clientId: string) => {
    setLoading(true);
    try {
      const data = await clientService.getClientDashboardData(clientId);
      setDashboardData(data);
    } catch (err: any) {
      console.error('Error fetching dashboard data', err);
      setError(err.response?.data?.message || 'Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  const checkOnboardingStatus = async (clientId: string) => {
    try {
      const tokens = await onboardingService.getStatus(clientId);
      setOnboardingTokens(Array.isArray(tokens) ? tokens : []);
    } catch {
      setOnboardingTokens([]);
    }
  };

  const getTokenStatus = (token: any): 'active' | 'completed' | 'expired' => {
    if (token.isCompleted) return 'completed';
    if (new Date(token.expiresAt) < new Date()) return 'expired';
    return 'active';
  };

  const buildLink = (tokenStr: string) => {
    return `${import.meta.env.VITE_PUBLIC_URL || 'https://otas-crm-dashboard.vercel.app'}/onboarding/${tokenStr}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessType('Onboarding Link');
    setShowSuccess(true);
  };

  const SERVICE_LABELS: Record<string, string> = {
    general: 'General',
    pos: 'POS',
    ai_agent: 'AI Agent',
    erp: 'ERP',
    ecommerce: 'E-commerce',
    software: 'Software',
  };

  const handleDeleteToken = async (tokenId: string) => {
    try {
      await onboardingService.deleteToken(tokenId, id!);
      setOnboardingTokens(prev => prev.filter(t => t._id !== tokenId));
    } catch (err) {
      console.error('Failed to delete token', err);
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    }
  };

  const copyShareLink = (type: 'email' | 'website') => {
    const link = `${window.location.origin}/public/form/${type}/${id}`;
    navigator.clipboard.writeText(link);
    setSuccessType(type === 'email' ? 'Business Email' : 'Website Brief');
    setShowSuccess(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
        <p className="text-slate-600 mb-6">{error || 'Client not found'}</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { profile, submissions } = dashboardData;
  const emailSubmission = submissions.find(s => s.formType === 'business_email');
  const websiteSubmission = submissions.find(s => s.formType === 'website_requirements');

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-slate-500 hover:text-primary transition-colors font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          BACK TO DASHBOARD
        </button>
        <div className="flex items-center gap-2">
          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${profile.isPostSale ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-primary/5 text-primary border-primary/10'
            }`}>
            {profile.isPostSale ? 'Active Project' : 'Pre-Sale Phase'}
          </span>
        </div>
      </div>

      {/* Hero Client Card */}
      <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <Building className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-2">{profile.companyName}</h1>
            <p className="text-slate-400 font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {profile.industry || 'Tech Solution Client'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-white/10">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Main Contact</p>
              <p className="text-lg font-bold flex items-center gap-2"><UserIcon className="w-5 h-5 text-primary" /> {profile.contactPerson}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Contact Email/Phone</p>
              <p className="text-lg font-bold flex items-center gap-2"><Mail className="w-5 h-5 text-indigo-400" /> {profile.contactInfo}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Project Identifier</p>
              <p className="text-lg font-bold flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-400" /> {profile.projectId || 'TBD'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: BUSINESS EMAILS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            Email Configuration
          </h2>
          {!emailSubmission && (
            <button
              onClick={() => copyShareLink('email')}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              <LinkIcon className="w-4 h-4" />
              Copy Client Link
            </button>
          )}
        </div>

        {!emailSubmission ? (
          <div className="p-1">
            <BusinessEmailForm clientId={profile._id} onSuccess={() => fetchDashboardData(profile._id)} />
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 md:px-8 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Submitted by {emailSubmission.submittedBy.name} • {new Date(emailSubmission.createdAt).toLocaleDateString()}
              </p>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-tighter">Verified Secure</span>
            </div>
            <div className="p-4 md:p-8 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="pb-4">No.</th>
                    <th className="pb-4">Email Address</th>
                    <th className="pb-4">Password (Plain Text)</th>
                    <th className="pb-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {emailSubmission.formData.emails.map((pair: EmailPair, idx: number) => (
                    <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-5 text-sm font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-5 text-sm font-bold text-slate-800">{pair.email}</td>
                      <td className="py-5 text-sm font-mono font-medium text-slate-500 bg-slate-50 px-3 rounded-xl">{pair.password}</td>
                      <td className="py-5 text-right">
                        <div className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                          <CheckCircle className="w-3 h-3" /> ACTIVE
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: WEBSITE BRIEF (FULL VIEW) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <Globe className="w-5 h-5 text-indigo-600" />
            </div>
            Website Content Brief
          </h2>
          {!websiteSubmission && (
            <button
              onClick={() => copyShareLink('website')}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              <LinkIcon className="w-4 h-4" />
              Copy Client Link
            </button>
          )}
        </div>

        {!websiteSubmission ? (
          <div className="p-1">
            <WebsiteRequirementsForm clientId={profile._id} onSuccess={() => fetchDashboardData(profile._id)} />
          </div>
        ) : (
          <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-[#4F46E5] text-white px-6 md:px-10 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70 mb-1">Full Requirement Document</p>
                <h3 className="text-xl md:text-2xl font-black tracking-tight">Content Summary</h3>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/20">
                Status: Completed
              </div>
            </div>

            <div className="p-6 md:p-10 space-y-8 md:space-y-12">
              {/* Branding & Social */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand Identity</p>
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center space-y-4">
                    <div className="w-32 h-32 bg-white rounded-3xl p-4 shadow-sm border border-slate-200 flex items-center justify-center overflow-hidden">
                      <img src={websiteSubmission.formData.general.logoUrl} className="w-full h-full object-contain" alt="Client Logo" />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-lg leading-tight">{websiteSubmission.formData.general.tagline.en}</p>
                      <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-tighter">License: {websiteSubmission.formData.general.licenseNumber}</p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Contact & Presence</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <p className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-2"><MapPin className="w-3 h-3" /> Address (EN)</p>
                      <p className="text-sm font-bold text-slate-700">{websiteSubmission.formData.general.address.en}</p>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <p className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-2"><Clock className="w-3 h-3" /> Office Hours</p>
                      <p className="text-sm font-bold text-slate-700">{websiteSubmission.formData.contact.officeHours.en}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <a href={websiteSubmission.formData.general.socialLinks.facebook} target="_blank" className="p-4 bg-slate-50 rounded-2xl text-blue-600 hover:bg-blue-50 transition-colors border border-slate-100"><Share2 className="w-5 h-5" /></a>
                    <a href={websiteSubmission.formData.general.socialLinks.linkedin} target="_blank" className="p-4 bg-slate-50 rounded-2xl text-blue-700 hover:bg-blue-50 transition-colors border border-slate-100"><MessageSquare className="w-5 h-5" /></a>
                    <a href={websiteSubmission.formData.general.socialLinks.twitter} target="_blank" className="p-4 bg-slate-50 rounded-2xl text-slate-800 hover:bg-slate-100 transition-colors border border-slate-100"><ExternalLink className="w-5 h-5" /></a>
                    <a href={websiteSubmission.formData.contact.googleMapsLink} target="_blank" className="flex-1 p-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"><MapPin className="w-4 h-4" /> View Map Location</a>
                  </div>
                </div>
              </div>

              {/* Home Page Content */}
              <div className="space-y-6 pt-10 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Home Page Architecture</p>
                <div className="p-6 md:p-8 bg-indigo-50/30 rounded-3xl md:rounded-[2.5rem] border border-indigo-100 space-y-8">
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase mb-2">Hero Welcome Text</p>
                    <h4 className="text-xl md:text-3xl font-black text-indigo-900 leading-tight">"{websiteSubmission.formData.homePage.hero.en}"</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {websiteSubmission.formData.homePage.whyChooseUs.map((f: any, i: number) => (
                      <div key={i} className="p-6 bg-white rounded-3xl shadow-sm space-y-2 border border-indigo-100">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black">{i + 1}</div>
                        <p className="font-black text-slate-800">{f.title.en}</p>
                        <p className="text-xs text-slate-500 font-medium">{f.desc.en}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Services & Testimonials */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-10 border-t border-slate-100">
                <div className="space-y-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Testimonials</p>
                  <div className="space-y-4">
                    {websiteSubmission.formData.homePage.testimonials.map((t: any, i: number) => (
                      <div key={i} className="p-6 bg-white rounded-[2rem] border border-slate-200 relative shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xs">{t.name.en.charAt(0)}</div>
                          <div>
                            <p className="font-black text-slate-800 text-sm">{t.name.en}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{t.position.en}</p>
                          </div>
                          <div className="ml-auto flex gap-0.5 text-yellow-400"><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /></div>
                        </div>
                        <p className="text-sm italic text-slate-600 leading-relaxed font-medium">"{t.feedback.en}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Overview</p>
                  <div className="grid grid-cols-1 gap-3">
                    {websiteSubmission.formData.homePage.services.map((s: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-primary font-black shadow-sm">{i + 1}</div>
                        <div>
                          <p className="font-black text-slate-800 text-sm">{s.title.en}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{s.summary.en}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detailed Services */}
              <div className="space-y-6 pt-10 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detailed Service Catalog</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {websiteSubmission.formData.servicesDetail.map((sd: any, i: number) => (
                    <div key={i} className="group bg-white rounded-[2rem] border border-slate-200 overflow-hidden hover:border-primary/50 transition-all shadow-sm">
                      <div className="h-48 overflow-hidden relative">
                        <img src={sd.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={sd.name.en} />
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Service Item</div>
                      </div>
                      <div className="p-6 space-y-3">
                        <h5 className="text-lg font-black text-slate-800">{sd.name.en}</h5>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">{sd.description.en}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Photos Gallery */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-slate-100">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Office & Staff Gallery</p>
                  <div className="grid grid-cols-3 gap-3">
                    {websiteSubmission.formData.aboutUs.staffImages.map((img: string, i: number) => (
                      <img key={i} src={img} className="w-full h-24 object-cover rounded-2xl shadow-sm border border-slate-100" alt={`Office ${i}`} />
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Certifications & Licenses</p>
                  <div className="grid grid-cols-3 gap-3">
                    {websiteSubmission.formData.aboutUs.licenseImages.map((img: string, i: number) => (
                      <div key={i} className="relative group">
                        <img src={img} className="w-full h-24 object-cover rounded-2xl shadow-sm border border-slate-100" alt={`License ${i}`} />
                        <a href={img} target="_blank" className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl text-white text-[10px] font-black uppercase tracking-tighter">View Full</a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-slate-100 text-center">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-50 text-emerald-700 rounded-3xl border border-emerald-100">
                  <ShieldCheck className="w-6 h-6" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest">Client Authenticated Confirmation</p>
                    <p className="text-xs font-bold opacity-70 italic">"I confirm that all provided information is accurate and ready for deployment."</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onboarding Section */}
        <div className="mt-8">
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-[#4F46E5] text-white px-6 md:px-10 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70 mb-1">Client Onboarding</p>
                    <h3 className="text-xl md:text-2xl font-black tracking-tight">Onboarding Form</h3>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/20 flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5" />
                    {onboardingTokens.length} Link{onboardingTokens.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-10 space-y-6">
                {/* Generate Button */}
                <button
                  onClick={() => setShowOnboardingModal(true)}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                >
                  <Link2 className="w-5 h-5" />
                  Generate Onboarding Link
                </button>

                {/* Links List */}
                {onboardingTokens.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generated Links</p>
                    {onboardingTokens.map((tok) => {
                      const status = getTokenStatus(tok);
                      const link = buildLink(tok.token);
                      const statusConfig = {
                        active: { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
                        completed: { label: 'Completed', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
                        expired: { label: 'Expired', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200', icon: <XCircle className="w-3.5 h-3.5" /> },
                      }[status];

                      return (
                        <div key={tok._id} className={`border rounded-2xl p-4 transition-all ${statusConfig.bg}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0 space-y-2">
                              {/* Status + Date */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${statusConfig.bg} ${statusConfig.color}`}>
                                  {statusConfig.icon}
                                  {statusConfig.label}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Created {new Date(tok.createdAt).toLocaleDateString()} {new Date(tok.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              {/* Expiry / Completion */}
                              <div className="flex items-center gap-4 text-xs">
                                {status === 'completed' ? (
                                  <span className="flex items-center gap-1 text-blue-600 font-medium">
                                    <CheckCircle className="w-3 h-3" />
                                    Completed {tok.completedAt ? new Date(tok.completedAt).toLocaleDateString() : ''}
                                  </span>
                                ) : status === 'expired' ? (
                                  <span className="flex items-center gap-1 text-slate-400 font-medium">
                                    <AlertCircle className="w-3 h-3" />
                                    Expired {new Date(tok.expiresAt).toLocaleDateString()}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                    <Clock className="w-3 h-3" />
                                    Expires {new Date(tok.expiresAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>

                              {/* Services */}
                              {tok.serviceTypes && tok.serviceTypes.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {tok.serviceTypes.map((svc: string) => (
                                    <span key={svc} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 uppercase">
                                      {SERVICE_LABELS[svc] || svc}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Link */}
                              <div className="flex items-center gap-2">
                                <code className="text-[11px] text-slate-400 font-mono truncate max-w-md">{link}</code>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="shrink-0 flex items-center gap-2">
                              {status === 'active' && (
                                <button
                                  onClick={() => copyToClipboard(link)}
                                  className="px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-1.5"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  Copy
                                </button>
                              )}
                              <button
                                onClick={() => { setDeleteTargetId(tok._id); setShowDeleteConfirm(true); }}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                title="Delete link"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {onboardingTokens.length === 0 && (
                  <p className="text-center text-xs text-slate-400">
                    No links generated yet. Click the button above to create one.
                  </p>
                )}
              </div>
            </div>
          </div>
      </div>

      <OnboardingLinkModal
        isOpen={showOnboardingModal}
        onClose={() => {
          setShowOnboardingModal(false);
          if (id) checkOnboardingStatus(id);
        }}
        clientId={id || ''}
        clientName={dashboardData?.profile?.companyName || 'Client'}
      />

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Link Copied!"
        message={`${successType} form link has been copied to your clipboard.`}
      />

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Onboarding Link</h3>
              <p className="text-gray-500 mb-6">Are you sure you want to delete this link? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteTargetId(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => deleteTargetId && handleDeleteToken(deleteTargetId)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;
