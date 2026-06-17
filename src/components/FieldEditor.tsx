import React from 'react';
import { GripVertical, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import type { FormField } from '../types';

interface FieldEditorProps {
  field: FormField;
  onChange: (updated: FormField) => void;
  onRemove: () => void;
  availableFields: string[];
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const FIELD_TYPES: { value: FormField['type']; label: string }[] = [
  { value: 'text', label: 'Text Input' },
  { value: 'number', label: 'Number Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'file', label: 'File Upload' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'repeater', label: 'Repeater (Multi-row)' },
];

const FieldEditor: React.FC<FieldEditorProps> = ({
  field, onChange, onRemove, availableFields,
  onMoveUp, onMoveDown, isFirst, isLast,
}) => {
  const update = (patch: Partial<FormField>) => onChange({ ...field, ...patch });

  const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white';
  const labelClass = 'block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1';

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-slate-300 shrink-0 cursor-grab" />
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            disabled={isFirst}
            onClick={onMoveUp}
            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={isLast}
            onClick={onMoveDown}
            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Field Name (key)</label>
            <input
              value={field.name}
              onChange={(e) => update({ name: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
              placeholder="e.g. company_name"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Label</label>
            <input
              value={field.label}
              onChange={(e) => update({ label: e.target.value })}
              placeholder="e.g. Company Name"
              className={inputClass}
            />
          </div>
        </div>
        <button onClick={onRemove} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Type</label>
          <select value={field.type} onChange={(e) => update({ type: e.target.value as FormField['type'] })} className={inputClass}>
            {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Placeholder</label>
          <input
            value={field.placeholder || ''}
            onChange={(e) => update({ placeholder: e.target.value })}
            placeholder="Optional"
            className={inputClass}
          />
        </div>
        <div className="flex items-end gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer pb-2">
            <input
              type="checkbox"
              checked={field.required || false}
              onChange={(e) => update({ required: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Required
          </label>
        </div>
      </div>

      {(field.type === 'dropdown' || field.type === 'checkbox') && (
        <div>
          <label className={labelClass}>Options (comma-separated)</label>
          <input
            value={(field.options || []).join(', ')}
            onChange={(e) => update({ options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            placeholder="Option 1, Option 2, Option 3"
            className={inputClass}
          />
        </div>
      )}

      {field.type === 'file' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Accept (MIME)</label>
            <input
              value={field.accept || ''}
              onChange={(e) => update({ accept: e.target.value })}
              placeholder="image/*,application/pdf"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Max Size (MB)</label>
            <input
              type="number"
              value={field.maxSize || 20}
              onChange={(e) => update({ maxSize: Number(e.target.value) })}
              className={inputClass}
            />
          </div>
        </div>
      )}

      <div>
        <label className={labelClass}>Show only when (conditional logic)</label>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={field.conditions?.dependsOn || ''}
            onChange={(e) => update({ conditions: e.target.value ? { dependsOn: e.target.value, value: field.conditions?.value || '' } : undefined })}
            className={inputClass}
          >
            <option value="">Always visible</option>
            <option value="purchasedServices">Service type</option>
            {availableFields.filter(f => f !== field.name).map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          {field.conditions?.dependsOn && (
            <input
              value={field.conditions.value || ''}
              onChange={(e) => update({ conditions: { dependsOn: field.conditions!.dependsOn, value: e.target.value } })}
              placeholder="Show when value is..."
              className={inputClass}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FieldEditor;
