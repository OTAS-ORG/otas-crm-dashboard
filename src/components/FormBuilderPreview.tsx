import React from 'react';
import type { FormSection } from '../types';

interface FormBuilderPreviewProps {
  serviceName: string;
  sections: FormSection[];
}

const FormBuilderPreview: React.FC<FormBuilderPreviewProps> = ({ serviceName, sections }) => {
  const inputClass = 'w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white';
  const labelClass = 'block text-sm font-bold text-slate-700 mb-1.5';

  return (
    <div className="bg-slate-100 rounded-2xl p-6 min-h-[500px]">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-h-[700px] overflow-y-auto">
        <div className="bg-[#4F46E5] text-white px-6 py-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">Preview</p>
          <h3 className="text-lg font-black tracking-tight">{serviceName} Onboarding</h3>
        </div>

        <div className="p-6 space-y-8">
          {sections.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm font-medium">No sections yet. Add a section to get started.</p>
            </div>
          )}

          {sections.map((section, si) => (
            <div key={si} className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">{section.title}</h4>
                {section.description && (
                  <p className="text-xs text-slate-500 mt-1">{section.description}</p>
                )}
              </div>

              <div className="space-y-4 pl-4 border-l-2 border-indigo-100">
                {section.fields.map((field, fi) => {
                  const show = !field.conditions || !field.conditions.dependsOn;
                  if (!show) {
                    return (
                      <div key={fi} className="opacity-40">
                        <label className={labelClass}>{field.label}</label>
                        <div className={`${inputClass} bg-slate-50 text-slate-400 italic text-xs`}>
                          Conditional: shows when {field.conditions!.dependsOn} = "{field.conditions!.value}"
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={fi}>
                      <label className={labelClass}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea placeholder={field.placeholder} className={`${inputClass} h-20 resize-none`} disabled />
                      ) : field.type === 'file' ? (
                        <div className={`${inputClass} bg-slate-50 text-slate-400 text-xs`}>
                          File upload ({field.accept || 'any type'}, max {field.maxSize || 20}MB)
                        </div>
                      ) : field.type === 'dropdown' ? (
                        <select className={inputClass} disabled>
                          <option>{field.placeholder || 'Select...'}</option>
                          {(field.options || []).map((opt, oi) => <option key={oi}>{opt}</option>)}
                        </select>
                      ) : field.type === 'checkbox' ? (
                        <div className="flex flex-wrap gap-3">
                          {(field.options || []).map((opt, oi) => (
                            <label key={oi} className="flex items-center gap-2 text-sm text-slate-600">
                              <input type="checkbox" disabled className="rounded border-slate-300" />
                              {opt}
                            </label>
                          ))}
                        </div>
                      ) : field.type === 'repeater' ? (
                        <div className={`${inputClass} bg-slate-50 text-slate-400 text-xs`}>
                          Multi-row repeater ({(field.fields || []).length} sub-fields)
                        </div>
                      ) : (
                        <input type={field.type} placeholder={field.placeholder} className={inputClass} disabled />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FormBuilderPreview;
