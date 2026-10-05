import React from 'react';
import { TemplateItem, ChecklistResponse } from '@/types';
import { Check, X, Minus, Camera, AlertCircle, AlertTriangle } from 'lucide-react';
import { PhotoUploader } from '@/components/evidence/PhotoUploader';

export interface ChecklistItemState {
  template_item_id: string;
  item_title_snapshot: string;
  item_description_snapshot?: string | null;
  response: ChecklistResponse;
  remarks: string;
  photos: File[];
  default_severity?: any;
}

interface InspectionChecklistProps {
  items: TemplateItem[];
  values: Record<string, ChecklistItemState>;
  onChange: (itemId: string, updates: Partial<ChecklistItemState>) => void;
}

export const InspectionChecklist: React.FC<InspectionChecklistProps> = ({
  items,
  values,
  onChange,
}) => {
  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const state = values[item.id] || {
          template_item_id: item.id,
          item_title_snapshot: item.title,
          item_description_snapshot: item.description,
          response: undefined,
          remarks: '',
          photos: [],
          default_severity: item.default_severity,
        };

        const isComplete = Boolean(state.response);
        const requiresRemarks = item.requires_remarks && state.response === 'fail';
        const requiresPhoto = item.requires_photo && state.response === 'fail';

        return (
          <div
            key={item.id}
            className={`p-5 rounded-lg border transition-all ${
              state.response === 'fail'
                ? 'border-red-300 bg-red-50/20'
                : state.response === 'pass'
                ? 'border-emerald-200 bg-emerald-50/10'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                  {index + 1}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  {item.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    {item.requires_remarks && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        Remarks required if failed
                      </span>
                    )}
                    {item.requires_photo && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        Photo required if failed
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Pass / Fail / NA */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => onChange(item.id, { response: 'pass' })}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    state.response === 'pass'
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500 ring-offset-1'
                      : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  Pass
                </button>

                <button
                  type="button"
                  onClick={() => onChange(item.id, { response: 'fail' })}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    state.response === 'fail'
                      ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-500 ring-offset-1'
                      : 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-700'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  Fail
                </button>

                <button
                  type="button"
                  onClick={() => onChange(item.id, { response: 'not_applicable' })}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    state.response === 'not_applicable'
                      ? 'bg-slate-700 text-white shadow-sm ring-2 ring-slate-600 ring-offset-1'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                  N/A
                </button>
              </div>
            </div>

            {/* Failure notice banner */}
            {state.response === 'fail' && (
              <div className="mb-3 p-2 bg-red-100/70 border border-red-200 text-red-800 rounded text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>
                  This item failed inspection. A defect ticket will be prepared upon submission.
                </span>
              </div>
            )}

            {/* Remarks input */}
            <div className="mt-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Remarks / Observations {requiresRemarks && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={state.remarks || ''}
                onChange={(e) => onChange(item.id, { remarks: e.target.value })}
                placeholder={
                  requiresRemarks
                    ? 'Mandatory: Describe the defect or non-conformance...'
                    : 'Optional observations or measurements...'
                }
                rows={2}
                className="w-full text-xs p-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Photo upload if failed or required */}
            {(state.response === 'fail' || item.requires_photo) && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <PhotoUploader
                  files={state.photos || []}
                  onChange={(photos) => onChange(item.id, { photos })}
                  maxFiles={3}
                  label="Item Photographic Evidence"
                  required={requiresPhoto}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
