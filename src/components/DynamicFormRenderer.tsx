import React from 'react';
import FileUploadField from './FileUploadField';
import type { FormSection, FormField } from '../types';

interface DynamicFormRendererProps {
  sections: FormSection[];
  formData: Record<string, any>;
  onChange: (name: string, value: any) => void;
  preFilled?: Record<string, string>;
  disabled?: boolean;
  services?: string[];
}

const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  sections,
  formData,
  onChange,
  preFilled = {},
  disabled,
  services = [],
}) => {
  const shouldShowField = (field: FormField): boolean => {
    if (!field.conditions || !field.conditions.dependsOn) return true;
    if (field.conditions.dependsOn === 'purchasedServices') {
      return services.includes(field.conditions.value);
    }
    const depValue = formData[field.conditions.dependsOn];
    return depValue === field.conditions.value;
  };

  const renderField = (field: FormField, _sectionIndex: number, _fieldIndex: number) => {
    if (!shouldShowField(field)) return null;

    const value = formData[field.name] ?? '';
    const isPreFilled = preFilled[field.name] && !value;
    const displayValue = isPreFilled ? preFilled[field.name] : value;

    const baseInputClass = 'w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all';

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <input
            type={field.type}
            value={displayValue}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder || field.label}
            className={baseInputClass}
            disabled={disabled || !!isPreFilled}
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={displayValue}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder || field.label}
            rows={4}
            className={`${baseInputClass} resize-none`}
            disabled={disabled || !!isPreFilled}
            required={field.required}
          />
        );

      case 'dropdown':
        return (
          <select
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={baseInputClass}
            disabled={disabled}
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt) => {
              const checked = Array.isArray(value) ? value.includes(opt) : false;
              return (
                <label key={opt} className={`inline-flex items-center gap-2 px-3 py-2 border rounded-xl cursor-pointer transition-all text-sm ${checked ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const current = Array.isArray(value) ? [...value] : [];
                      if (checked) {
                        onChange(field.name, current.filter((v: string) => v !== opt));
                      } else {
                        onChange(field.name, [...current, opt]);
                      }
                    }}
                    className="sr-only"
                    disabled={disabled}
                  />
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                    {checked && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  {opt}
                </label>
              );
            })}
          </div>
        );

      case 'file':
        return (
          <FileUploadField
            name={field.name}
            label={field.label}
            required={field.required}
            accept={field.accept}
            maxSize={field.maxSize}
            value={Array.isArray(value) ? value : value ? [value] : []}
            onChange={(urls) => onChange(field.name, urls)}
            disabled={disabled}
          />
        );

      case 'repeater':
        return (
          <RepeaterField
            field={field}
            value={Array.isArray(value) ? value : []}
            onChange={(val) => onChange(field.name, val)}
            disabled={disabled}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {sections.map((section, sIdx) => {
        const visibleFields = section.fields.filter(f => shouldShowField(f));
        if (visibleFields.length === 0) return null;

        return (
          <div key={sIdx} className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">{section.title}</h3>
            {section.description && <p className="text-sm text-slate-500 mb-4">{section.description}</p>}
            <div className="space-y-4">
              {section.fields.map((field, fIdx) => (
                <div key={`${sIdx}-${fIdx}-${field.name}`}>
                  {renderField(field, sIdx, fIdx)}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface RepeaterFieldProps {
  field: FormField;
  value: Record<string, any>[];
  onChange: (val: Record<string, any>[]) => void;
  disabled?: boolean;
}

const RepeaterField: React.FC<RepeaterFieldProps> = ({ field, value, onChange, disabled }) => {
  const addItem = () => {
    onChange([...value, {}]);
  };

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, name: string, val: any) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [name]: val };
    onChange(updated);
  };

  const baseInputClass = 'w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all';

  return (
    <div className="space-y-3">
      {value.map((item, idx) => (
        <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {field.label} #{idx + 1}
            </span>
            {!disabled && (
              <button type="button" onClick={() => removeItem(idx)} className="text-xs text-red-500 hover:text-red-700 font-medium">
                Remove
              </button>
            )}
          </div>
          {field.fields?.map((subField) => (
            <div key={subField.name}>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {subField.label} {subField.required && <span className="text-red-500">*</span>}
              </label>
              {subField.type === 'file' ? (
                <FileUploadField
                  name={`${field.name}_${idx}_${subField.name}`}
                  label={subField.label}
                  accept={subField.accept}
                  maxSize={subField.maxSize}
                  value={Array.isArray(item[subField.name]) ? item[subField.name] : item[subField.name] ? [item[subField.name]] : []}
                  onChange={(urls) => updateItem(idx, subField.name, urls)}
                  disabled={disabled}
                />
              ) : subField.type === 'textarea' ? (
                <textarea
                  value={item[subField.name] || ''}
                  onChange={(e) => updateItem(idx, subField.name, e.target.value)}
                  placeholder={subField.placeholder || subField.label}
                  rows={3}
                  className={`${baseInputClass} resize-none`}
                  disabled={disabled}
                />
              ) : (
                <input
                  type={subField.type === 'number' ? 'number' : 'text'}
                  value={item[subField.name] || ''}
                  onChange={(e) => updateItem(idx, subField.name, e.target.value)}
                  placeholder={subField.placeholder || subField.label}
                  className={baseInputClass}
                  disabled={disabled}
                />
              )}
            </div>
          ))}
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          onClick={addItem}
          className="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm font-medium text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
        >
          + Add {field.label}
        </button>
      )}
    </div>
  );
};

export default DynamicFormRenderer;
