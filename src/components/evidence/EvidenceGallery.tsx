import React, { useState } from 'react';
import { EvidenceFile, EvidenceStage } from '@/types';
import { formatDate } from '@/lib/utils';
import { ExternalLink, X, ZoomIn, Image as ImageIcon } from 'lucide-react';

interface EvidenceGalleryProps {
  evidence: EvidenceFile[];
  title?: string;
  stageFilter?: EvidenceStage;
  emptyMessage?: string;
}

export const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({
  evidence,
  title,
  stageFilter,
  emptyMessage = 'No photographic evidence uploaded yet.',
}) => {
  const [selectedImage, setSelectedImage] = useState<EvidenceFile | null>(null);

  const filtered = stageFilter
    ? evidence.filter((e) => e.stage === stageFilter)
    : evidence;

  const getStageLabel = (stage: EvidenceStage) => {
    switch (stage) {
      case 'original_inspection':
        return 'Original Inspection';
      case 'defect_report':
        return 'Defect Report';
      case 'contractor_rectification':
        return 'Contractor Rectification';
      case 'reinspection':
        return 'QA Reinspection';
      default:
        return stage;
    }
  };

  const getStageBadgeColor = (stage: EvidenceStage) => {
    switch (stage) {
      case 'original_inspection':
        return 'bg-blue-100 text-blue-800';
      case 'defect_report':
        return 'bg-amber-100 text-amber-800';
      case 'contractor_rectification':
        return 'bg-cyan-100 text-cyan-800';
      case 'reinspection':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (filtered.length === 0) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-500">
        <ImageIcon className="w-5 h-5 mx-auto mb-1 text-slate-400" />
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {title && (
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedImage(item)}
            className="group relative rounded-lg border border-slate-200 overflow-hidden bg-slate-100 aspect-square cursor-pointer transition-all hover:shadow-md"
          >
            {item.url ? (
              <img
                src={item.url}
                alt={item.caption || item.original_filename}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2">
                <ImageIcon className="w-8 h-8 mb-1" />
                <span className="text-[10px] text-center truncate w-full">
                  {item.original_filename}
                </span>
              </div>
            )}

            {/* Hover overlay with zoom icon */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <ZoomIn className="w-6 h-6" />
            </div>

            {/* Stage tag badge */}
            <div className="absolute top-1 left-1">
              <span
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shadow-sm ${getStageBadgeColor(
                  item.stage
                )}`}
              >
                {getStageLabel(item.stage)}
              </span>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent text-white p-1.5 text-[10px]">
              <p className="truncate font-medium">{item.caption || item.original_filename}</p>
              <p className="text-slate-300 text-[9px]">{formatDate(item.created_at)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal image viewer */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-lg overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${getStageBadgeColor(selectedImage.stage)}`}>
                  {getStageLabel(selectedImage.stage)}
                </span>
                <span className="text-sm font-semibold truncate max-w-md">
                  {selectedImage.caption || selectedImage.original_filename}
                </span>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 bg-black flex items-center justify-center overflow-auto max-h-[70vh]">
              {selectedImage.url ? (
                <img
                  src={selectedImage.url}
                  alt={selectedImage.original_filename}
                  className="max-h-[65vh] object-contain rounded"
                />
              ) : (
                <div className="p-12 text-slate-400 flex flex-col items-center">
                  <ImageIcon className="w-16 h-16 mb-2" />
                  <p>Image preview unavailable</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>
                <p><span className="font-semibold text-slate-700">Filename:</span> {selectedImage.original_filename}</p>
                <p><span className="font-semibold text-slate-700">Uploaded:</span> {formatDate(selectedImage.created_at)}</p>
              </div>
              {selectedImage.url && (
                <a
                  href={selectedImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary-600 hover:underline font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in New Tab
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
