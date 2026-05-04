import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { clientService } from '../services/api';
import BusinessEmailForm from '../components/BusinessEmailForm';
import WebsiteRequirementsForm from '../components/WebsiteRequirementsForm';
import logo from '../assets/otas.png';
import { CheckCircle2, Building2 } from 'lucide-react';

const PublicFormPage: React.FC = () => {
  const { type, clientId } = useParams<{ type: string; clientId: string }>();
  const [clientInfo, setClientInfo] = useState<{ companyName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (clientId) {
      console.log('Fetching public info for client:', clientId);
      clientService.getPublicClientInfo(clientId)
        .then(info => {
          console.log('Client info received:', info);
          setClientInfo(info);
        })
        .catch(err => {
          console.error('Failed to fetch client info:', err);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [clientId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold">Loading Form...</div>;

  if (!clientInfo) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-red-500">Form Link Invalid or Expired</div>;

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-6 md:p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Thank You!</h1>
          <p className="text-slate-600">Your information for <span className="font-bold text-slate-800">{clientInfo.companyName}</span> has been successfully submitted to the OTAS Team.</p>
          <div className="pt-4">
            <img src={logo} alt="OTAS" className="h-8 mx-auto grayscale opacity-50" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 md:py-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Public Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <img src={logo} alt="OTAS" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">OTAS Requirements Form</h1>
              <div className="flex items-center gap-2 text-primary font-semibold mt-1">
                <Building2 className="w-4 h-4" />
                <span>{clientInfo.companyName}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-primary/20">
              {type === 'email' ? 'Business Email Setup' : 'Website Content Brief'}
            </span>
          </div>
        </div>

        {/* Dynamic Form Rendering */}
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          {type === 'email' ? (
            <BusinessEmailForm
              clientId={clientId!}
              onSuccess={() => setSubmitted(true)}
              isPublic={true}
            />
          ) : (
            <WebsiteRequirementsForm
              clientId={clientId!}
              onSuccess={() => setSubmitted(true)}
              isPublic={true}
            />
          )}
        </div>

        <p className="text-center text-slate-400 text-sm font-medium">
          Securely processed by OTAS Tech Solutions
        </p>
      </div>
    </div>
  );
};

export default PublicFormPage;
