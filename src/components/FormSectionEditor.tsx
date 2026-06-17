import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, GripVertical } from 'lucide-react';
import FieldEditor from './FieldEditor';
import type { FormSection, FormField } from '../types';

interface FormSectionEditorProps {
  section: FormSection;
  sectionIndex: number;
  onChange: (updated: FormSection) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  allFieldNames: string[];
  isFirst?: boolean;
  isLast?: boolean;
  onMoveFieldUp?: (fieldIndex: number) => void;
  onMoveFieldDown?: (fieldIndex: number) => void;
}

const FormSectionEditor: React.FC<FormSectionEditorProps> = ({
  section,
  sectionIndex,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  allFieldNames,
  isFirst,
  isLast,
  onMoveFieldUp,
  onMoveFieldDown,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const updateField = (fieldIndex: number, updated: FormField) => {
    const fields = [...section.fields];
    fields[fieldIndex] = updated;
    onChange({ ...section, fields });
  };

  const removeField = (fieldIndex: number) => {
    onChange({ ...section, fields: section.fields.filter((_, i) => i !== fieldIndex) });
  };

  const addField = () => {
    const newField: FormField = {
      name: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false,
    };
    onChange({ ...section, fields: [...section.fields, newField] });
  };

  const handleDragStart = (e: React.DragEvent, fieldIndex: number) => {
    e.dataTransfer.setData('fieldIndex', String(fieldIndex));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, fieldIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(fieldIndex);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('fieldIndex'));
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) {
      setDragOverIndex(null);
      return;
    }

    const fields = [...section.fields];
    const [moved] = fields.splice(sourceIndex, 1);
    fields.splice(targetIndex, 0, moved);
    onChange({ ...section, fields });
    setDragOverIndex(null);
  };

  const handleDragEnd = () => setDragOverIndex(null);

  const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white';
  const labelClass = 'block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div
        className="flex items-center gap-3 px-5 py-4 bg-slate-50 border-b border-slate-200 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            disabled={isFirst}
            onClick={onMoveUp}
            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors"
          >
            <GripVertical className="w-4 h-4 rotate-90" />
          </button>
          <button
            disabled={isLast}
            onClick={onMoveDown}
            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors"
          >
            <GripVertical className="w-4 h-4 -rotate-90" />
          </button>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
          <div>
            <label className={labelClass}>Section Title</label>
            <input
              value={section.title}
              onChange={(e) => onChange({ ...section, title: e.target.value })}
              placeholder="Section title"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <input
              value={section.description || ''}
              onChange={(e) => onChange({ ...section, description: e.target.value })}
              placeholder="Optional description"
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 font-medium">{section.fields.length} fields</span>
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
          {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="p-5 space-y-4">
          {section.fields.map((field, i) => (
            <div
              key={`${sectionIndex}-${i}`}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              className={`transition-all ${dragOverIndex === i ? 'ring-2 ring-indigo-400 ring-offset-2 rounded-xl' : ''}`}
            >
              <FieldEditor
                field={field}
                onChange={(updated) => updateField(i, updated)}
                onRemove={() => removeField(i)}
                availableFields={allFieldNames}
                onMoveUp={onMoveFieldUp ? () => onMoveFieldUp(i) : undefined}
                onMoveDown={onMoveFieldDown ? () => onMoveFieldDown(i) : undefined}
                isFirst={i === 0}
                isLast={i === section.fields.length - 1}
              />
            </div>
          ))}
          <button
            onClick={addField}
            className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-500 font-semibold rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-all text-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Field
          </button>
        </div>
      )}
    </div>
  );
};

export default FormSectionEditor;
