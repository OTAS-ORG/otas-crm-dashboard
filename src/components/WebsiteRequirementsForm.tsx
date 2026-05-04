import React, { useState } from 'react';
import { clientService } from '../services/api';
import { Upload, Plus, Trash2, ChevronRight, ChevronLeft, CheckCircle, Image as ImageIcon } from 'lucide-react';

interface WebsiteRequirementsFormProps {
  clientId: string;
  onSuccess: () => void;
  isPublic?: boolean;
}

const WebsiteRequirementsForm: React.FC<WebsiteRequirementsFormProps> = ({ clientId, onSuccess, isPublic = false }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    general: {
      tagline: { en: '', mm: '' },
      address: { en: '', mm: '' },
      socialLinks: { facebook: '', linkedin: '', twitter: '' },
      licenseNumber: '',
      logoUrl: ''
    },
    homePage: {
      hero: { en: '', mm: '' },
      whyChooseUs: [
        { title: { en: '', mm: '' }, desc: { en: '', mm: '' } },
        { title: { en: '', mm: '' }, desc: { en: '', mm: '' } },
        { title: { en: '', mm: '' }, desc: { en: '', mm: '' } }
      ],
      services: [{ title: { en: '', mm: '' }, summary: { en: '', mm: '' }, iconUrl: '' }],
      testimonials: [{ name: { en: '', mm: '' }, feedback: { en: '', mm: '' }, position: { en: '', mm: '' } }]
    },
    aboutUs: {
      mission: { en: '', mm: '' },
      vision: { en: '', mm: '' },
      staffImages: [] as string[],
      licenseImages: [] as string[]
    },
    servicesDetail: [
      { name: { en: '', mm: '' }, description: { en: '', mm: '' }, imageUrl: '' }
    ],
    contact: {
      officeHours: { en: '', mm: '' },
      googleMapsLink: '',
      mapConfirmed: false
    }
  });

  const handleFileUpload = async (files: FileList | null, callback: (urls: string[]) => void) => {
    if (!files || files.length === 0) return;
    setLoading(true);
    try {
      const urls = isPublic
        ? await clientService.uploadPublicFiles(Array.from(files))
        : await clientService.uploadFiles(Array.from(files));
      callback(urls);
    } catch (err) {
      setError('File upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        clientId,
        formType: 'website_requirements',
        submittedBy: { name: 'Client User', position: 'Owner' },
        formData
      };

      if (isPublic) {
        await clientService.submitPublicForm(payload);
      } else {
        await clientService.submitForm(payload);
      }
      onSuccess();
    } catch (err) {
      setError('Form submission failed');
    } finally {
      setLoading(false);
    }
  };

  const renderBilingualInput = (label: string, value: { en: string; mm: string }, onChange: (lang: 'en' | 'mm', val: string) => void, isTextArea = false) => (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isTextArea ? (
          <>
            <textarea
              placeholder="English"
              className="w-full p-2 border border-slate-200 rounded-lg text-sm h-24"
              value={value.en}
              onChange={(e) => onChange('en', e.target.value)}
            />
            <textarea
              placeholder="Myanmar (မြန်မာ)"
              className="w-full p-2 border border-slate-200 rounded-lg text-sm h-24"
              value={value.mm}
              onChange={(e) => onChange('mm', e.target.value)}
            />
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="English"
              className="w-full p-2 border border-slate-200 rounded-lg text-sm"
              value={value.en}
              onChange={(e) => onChange('en', e.target.value)}
            />
            <input
              type="text"
              placeholder="Myanmar (မြန်မာ)"
              className="w-full p-2 border border-slate-200 rounded-lg text-sm"
              value={value.mm}
              onChange={(e) => onChange('mm', e.target.value)}
            />
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Stepper Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 flex justify-between items-center">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step === s ? 'bg-primary text-white' : step > s ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
              {step > s ? <CheckCircle className="w-5 h-5" /> : s}
            </div>
            {s < 5 && <div className={`w-8 md:w-16 h-1 mx-2 rounded ${step > s ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <div className="p-8">
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">{error}</div>}

        {/* SECTION A: General */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-slate-800">Section A: General Information</h2>
            <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <div className="w-24 h-24 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                {formData.general.logoUrl ? <img src={formData.general.logoUrl} className="w-full h-full object-contain" /> : <Upload className="text-slate-300" />}
              </div>
              <div>
                <p className="font-semibold mb-2">Company Logo</p>
                <input type="file" onChange={(e) => handleFileUpload(e.target.files, (urls) => setFormData({ ...formData, general: { ...formData.general, logoUrl: urls[0] } }))} className="text-sm" />
              </div>
            </div>
            {renderBilingualInput("Company Tagline", formData.general.tagline, (lang, val) => setFormData({ ...formData, general: { ...formData.general, tagline: { ...formData.general.tagline, [lang]: val } } }))}
            {renderBilingualInput("Business Address", formData.general.address, (lang, val) => setFormData({ ...formData, general: { ...formData.general, address: { ...formData.general.address, [lang]: val } } }))}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">License Number</label>
                <input type="text" className="w-full p-2 border border-slate-200 rounded-lg" value={formData.general.licenseNumber} onChange={(e) => setFormData({ ...formData, general: { ...formData.general, licenseNumber: e.target.value } })} />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Facebook Page URL</label>
                <input type="text" className="w-full p-2 border border-slate-200 rounded-lg" value={formData.general.socialLinks.facebook} onChange={(e) => setFormData({ ...formData, general: { ...formData.general, socialLinks: { ...formData.general.socialLinks, facebook: e.target.value } } })} />
              </div>
            </div>
          </div>
        )}

        {/* SECTION B: Home Page */}
        {step === 2 && (
          <div className="space-y-10">
            <h2 className="text-2xl font-bold text-slate-800">Section B: Home Page Content</h2>
            {renderBilingualInput("Hero Section Title/Welcome", formData.homePage.hero, (lang, val) => setFormData({ ...formData, homePage: { ...formData.homePage, hero: { ...formData.homePage.hero, [lang]: val } } }))}

            {/* Service Summaries */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-700 border-l-4 border-primary pl-3">Service Summaries (Min 3)</h3>
                <button onClick={() => setFormData({ ...formData, homePage: { ...formData.homePage, services: [...formData.homePage.services, { title: { en: '', mm: '' }, summary: { en: '', mm: '' }, iconUrl: '' }] } })} className="text-primary flex items-center gap-1 text-sm font-bold bg-primary/5 px-3 py-1.5 rounded-lg"><Plus className="w-4 h-4" /> Add Service</button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {formData.homePage.services.map((svc, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl space-y-4 relative border border-slate-200">
                    <button onClick={() => setFormData({ ...formData, homePage: { ...formData.homePage, services: formData.homePage.services.filter((_, i) => i !== idx) } })} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    {renderBilingualInput(`Service ${idx + 1} Title`, svc.title, (lang, val) => {
                      const newSvcs = [...formData.homePage.services];
                      newSvcs[idx].title[lang] = val;
                      setFormData({ ...formData, homePage: { ...formData.homePage, services: newSvcs } });
                    })}
                    {renderBilingualInput(`Service ${idx + 1} Summary`, svc.summary, (lang, val) => {
                      const newSvcs = [...formData.homePage.services];
                      newSvcs[idx].summary[lang] = val;
                      setFormData({ ...formData, homePage: { ...formData.homePage, services: newSvcs } });
                    }, true)}
                  </div>
                ))}
              </div>
            </div>

            {/* Why Choose Us */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 border-l-4 border-indigo-500 pl-3">Why Choose Us (3 Features)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {formData.homePage.whyChooseUs.map((feature, idx) => (
                  <div key={idx} className="p-4 bg-indigo-50/50 rounded-xl space-y-3 border border-indigo-100">
                    <p className="text-xs font-bold text-indigo-400 uppercase">Feature #{idx + 1}</p>
                    <input placeholder="Title (EN)" className="w-full p-2 text-sm rounded-lg border border-indigo-200" value={feature.title.en} onChange={(e) => {
                      const newFeatures = [...formData.homePage.whyChooseUs];
                      newFeatures[idx].title.en = e.target.value;
                      setFormData({ ...formData, homePage: { ...formData.homePage, whyChooseUs: newFeatures } });
                    }} />
                    <textarea placeholder="Description (EN)" className="w-full p-2 text-sm rounded-lg border border-indigo-200 h-20" value={feature.desc.en} onChange={(e) => {
                      const newFeatures = [...formData.homePage.whyChooseUs];
                      newFeatures[idx].desc.en = e.target.value;
                      setFormData({ ...formData, homePage: { ...formData.homePage, whyChooseUs: newFeatures } });
                    }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonials */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-700 border-l-4 border-emerald-500 pl-3">Client Testimonials</h3>
                <button onClick={() => setFormData({ ...formData, homePage: { ...formData.homePage, testimonials: [...formData.homePage.testimonials, { name: { en: '', mm: '' }, feedback: { en: '', mm: '' }, position: { en: '', mm: '' } }] } })} className="text-emerald-600 flex items-center gap-1 text-sm font-bold bg-emerald-50 px-3 py-1.5 rounded-lg"><Plus className="w-4 h-4" /> Add Testimonial</button>
              </div>
              {formData.homePage.testimonials.map((t, idx) => (
                <div key={idx} className="p-4 bg-emerald-50/30 rounded-xl space-y-4 border border-emerald-100 relative">
                  <button onClick={() => setFormData({ ...formData, homePage: { ...formData.homePage, testimonials: formData.homePage.testimonials.filter((_, i) => i !== idx) } })} className="absolute top-2 right-2 text-emerald-400 hover:text-emerald-600"><Trash2 className="w-4 h-4" /></button>
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Client Name" className="p-2 text-sm border rounded-lg" value={t.name.en} onChange={(e) => {
                      const newT = [...formData.homePage.testimonials];
                      newT[idx].name.en = e.target.value;
                      setFormData({ ...formData, homePage: { ...formData.homePage, testimonials: newT } });
                    }} />
                    <input placeholder="Position/Company" className="p-2 text-sm border rounded-lg" value={t.position.en} onChange={(e) => {
                      const newT = [...formData.homePage.testimonials];
                      newT[idx].position.en = e.target.value;
                      setFormData({ ...formData, homePage: { ...formData.homePage, testimonials: newT } });
                    }} />
                  </div>
                  <textarea placeholder="Their Feedback" className="w-full p-2 text-sm border rounded-lg h-20" value={t.feedback.en} onChange={(e) => {
                    const newT = [...formData.homePage.testimonials];
                    newT[idx].feedback.en = e.target.value;
                    setFormData({ ...formData, homePage: { ...formData.homePage, testimonials: newT } });
                  }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION C: About Us */}
        {step === 3 && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-800">Section C: About Us & Certifications</h2>
            {renderBilingualInput("Our Mission", formData.aboutUs.mission, (lang, val) => setFormData({ ...formData, aboutUs: { ...formData.aboutUs, mission: { ...formData.aboutUs.mission, [lang]: val } } }))}
            {renderBilingualInput("Our Vision", formData.aboutUs.vision, (lang, val) => setFormData({ ...formData, aboutUs: { ...formData.aboutUs, vision: { ...formData.aboutUs.vision, [lang]: val } } }))}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Staff Photos */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">Staff & Office Photos</label>
                <div className="grid grid-cols-3 gap-2">
                  {formData.aboutUs.staffImages.map((url, i) => <div key={i} className="relative group"><img src={url} className="w-full h-20 object-cover rounded-lg" /><button onClick={() => setFormData({ ...formData, aboutUs: { ...formData.aboutUs, staffImages: formData.aboutUs.staffImages.filter((_, idx) => idx !== i) } })} className="absolute inset-0 bg-red-500/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-white"><Trash2 className="w-4 h-4" /></button></div>)}
                  <label className="w-full h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="file" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files, (urls) => setFormData({ ...formData, aboutUs: { ...formData.aboutUs, staffImages: [...formData.aboutUs.staffImages, ...urls] } }))} />
                    <Plus className="text-slate-400" />
                  </label>
                </div>
              </div>

              {/* License Photos */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">License & Certifications (Scans)</label>
                <div className="grid grid-cols-3 gap-2">
                  {formData.aboutUs.licenseImages.map((url, i) => <div key={i} className="relative group"><img src={url} className="w-full h-20 object-cover rounded-lg" /><button onClick={() => setFormData({ ...formData, aboutUs: { ...formData.aboutUs, licenseImages: formData.aboutUs.licenseImages.filter((_, idx) => idx !== i) } })} className="absolute inset-0 bg-red-500/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-white"><Trash2 className="w-4 h-4" /></button></div>)}
                  <label className="w-full h-20 border-2 border-dashed border-indigo-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors">
                    <input type="file" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files, (urls) => setFormData({ ...formData, aboutUs: { ...formData.aboutUs, licenseImages: [...formData.aboutUs.licenseImages, ...urls] } }))} />
                    <ImageIcon className="text-indigo-400" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION D: Services Detail */}
        {step === 4 && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-800">Section D: Detailed Services</h2>
            {formData.servicesDetail.map((svc, idx) => (
              <div key={idx} className="p-6 border border-slate-200 rounded-2xl space-y-4 bg-slate-50/50 shadow-sm relative">
                <button onClick={() => setFormData({ ...formData, servicesDetail: formData.servicesDetail.filter((_, i) => i !== idx) })} className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"><Trash2 className="w-5 h-5" /></button>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-32 h-24 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                    {svc.imageUrl ? <img src={svc.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" />}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Service Image</p>
                    <input type="file" className="text-xs" onChange={(e) => handleFileUpload(e.target.files, (urls) => {
                      const newDetail = [...formData.servicesDetail];
                      newDetail[idx].imageUrl = urls[0];
                      setFormData({ ...formData, servicesDetail: newDetail });
                    })} />
                  </div>
                </div>
                {renderBilingualInput("Service Name", svc.name, (lang, val) => {
                  const newDetail = [...formData.servicesDetail];
                  newDetail[idx].name[lang] = val;
                  setFormData({ ...formData, servicesDetail: newDetail });
                })}
                {renderBilingualInput("Full Description", svc.description, (lang, val) => {
                  const newDetail = [...formData.servicesDetail];
                  newDetail[idx].description[lang] = val;
                  setFormData({ ...formData, servicesDetail: newDetail });
                }, true)}
              </div>
            ))}
            <button onClick={() => setFormData({ ...formData, servicesDetail: [...formData.servicesDetail, { name: { en: '', mm: '' }, description: { en: '', mm: '' }, imageUrl: '' }] })} className="w-full py-4 border-2 border-dashed border-primary/30 text-primary font-bold rounded-2xl hover:bg-primary/5 transition flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> Add Another Service Detail</button>
          </div>
        )}

        {/* SECTION E: Contact */}
        {step === 5 && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-800">Section E: Contact & Finalization</h2>
            {renderBilingualInput("Office Hours", formData.contact.officeHours, (lang, val) => setFormData({ ...formData, contact: { ...formData.contact, officeHours: { ...formData.contact.officeHours, [lang]: val } } }))}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Google Maps Embed/Share Link</label>
              <input type="text" placeholder="https://goo.gl/maps/..." className="w-full p-3 border border-slate-200 rounded-xl text-sm" value={formData.contact.googleMapsLink} onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, googleMapsLink: e.target.value } })} />
            </div>
            <div className="flex items-center gap-3 p-6 bg-emerald-50 text-emerald-700 rounded-2xl border-2 border-emerald-100 shadow-inner">
              <input type="checkbox" className="w-6 h-6 accent-emerald-600 rounded cursor-pointer" checked={formData.contact.mapConfirmed} onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, mapConfirmed: e.target.checked } })} />
              <div>
                <p className="font-bold">Ready for Deployment</p>
                <p className="text-sm opacity-80 font-medium">I confirm that all provided information is accurate and ready for website development.</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-12 flex justify-between">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="flex items-center px-6 py-2 text-slate-600 hover:text-primary disabled:opacity-30 transition font-bold"
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> Previous
          </button>
          {step < 5 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center px-8 py-3 bg-primary text-white rounded-xl shadow-lg hover:shadow-primary/30 transition font-bold"
            >
              Next Section <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.contact.mapConfirmed}
              className="flex items-center px-10 py-3 bg-emerald-600 text-white rounded-xl shadow-lg hover:shadow-emerald-300 transition font-bold disabled:bg-emerald-300 disabled:shadow-none"
            >
              {loading ? 'Submitting...' : 'Submit Website Brief'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebsiteRequirementsForm;
