import React from 'react';
import { CheckCircle2, AlertTriangle, Lock, X } from 'lucide-react';
import { Item } from '../types';

interface ConfirmResolveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  item?: Item | null;
  loading?: boolean;
}

export function ConfirmResolveModal({
  isOpen,
  onClose,
  onConfirm,
  item,
  loading = false
}: ConfirmResolveModalProps) {
  if (!isOpen) return null;

  const isLost = item?.type === 'lost';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full border border-teal-100 shadow-2xl overflow-hidden p-6 sm:p-7 relative transition-all scale-100 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-100/70 px-2 py-0.5 rounded-md">
              ยืนยันการปิดเคส
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug mt-1">
              {isLost ? 'ยืนยันว่าได้รับของคืนแล้ว?' : 'ยืนยันว่าส่งมอบคืนเจ้าของแล้ว?'}
            </h3>
          </div>
        </div>

        {/* Item Preview Card if item available */}
        {item && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 mb-4 text-xs space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-900 line-clamp-1 text-sm">
                {item.title}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                isLost ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
              }`}>
                {isLost ? 'ของหาย' : 'พบของ'}
              </span>
            </div>
            {item.location && (
              <p className="text-slate-500 line-clamp-1">
                สถานที่: <span className="text-slate-700 font-medium">{item.location}</span>
              </p>
            )}
          </div>
        )}

        {/* Warning Notice Box */}
        <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-3.5 mb-5 flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 leading-relaxed">
            <span className="font-bold">ระบบจะทำการล็อคสถานะทันที:</span> เมื่อกดยืนยันแล้ว เคสนี้จะถือว่าเสร็จสิ้นสมบูรณ์ และคุณจะไม่สามารถเปิดตามหาใหม่หรือแก้สถานะกลับมาได้เอง (หากต้องการปลดล็อคจะต้องติดต่อ Admin เท่านั้น)
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition-all shadow-md shadow-emerald-600/20 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>กำลังบันทึก...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>ยืนยัน ได้ของคืนแล้ว (ล็อคเคส)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
