import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, X } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, title, message }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-500 ease-out"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-full max-w-sm overflow-hidden transform transition-all duration-500 ease-out animate-in zoom-in-95 fade-in">
        <div className="p-8 text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200/50">
            <CheckCircle className="w-12 h-12" />
          </div>
          
          <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{title}</h3>
          <p className="text-slate-500 font-medium leading-relaxed">{message}</p>
          
          <div className="mt-8">
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
            >
              Great!
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SuccessModal;
