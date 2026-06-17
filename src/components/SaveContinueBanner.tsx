import React from 'react';
import { Link2, Check } from 'lucide-react';

interface SaveContinueBannerProps {
  link: string;
  expiresAt: string;
}

const SaveContinueBanner: React.FC<SaveContinueBannerProps> = ({ link, expiresAt }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hoursLeft = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)));

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl">
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4 text-indigo-500" />
        <span className="text-sm text-indigo-700">
          Link expires in {hoursLeft}h — Copy link to continue later
        </span>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-white border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  );
};

export default SaveContinueBanner;
