import { MentionedItemSummary } from '../types';
import { MapPin, Calendar, ExternalLink, X, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MentionedItemCardProps {
  item: MentionedItemSummary;
  onRemove?: () => void;
  isCompact?: boolean;
}

export function MentionedItemCard({ item, onRemove, isCompact = false }: MentionedItemCardProps) {
  const isLost = item.type === 'lost';
  const isResolved = item.status === 'resolved';

  return (
    <div className={`rounded-2xl border transition-all overflow-hidden ${
      isLost 
        ? 'bg-amber-50/70 border-amber-200/90 text-slate-800' 
        : 'bg-teal-50/70 border-teal-200/90 text-slate-800'
    } ${isCompact ? 'p-2.5' : 'p-3'}`}>
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Thumbnail */}
          <div className="w-11 h-11 rounded-xl bg-white border border-slate-200/80 shrink-0 overflow-hidden flex items-center justify-center shadow-2xs">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg">{isLost ? '🔍' : '📦'}</span>
            )}
          </div>

          <div className="min-w-0">
            {/* Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[10px] font-bold text-stone-600 bg-white border border-stone-200 px-1.5 py-0.2 rounded">
                TKT-{(item.id || '').slice(0, 6).toUpperCase()}
              </span>
              {isResolved ? (
                <span className="stamp-ink-double border-emerald-800 text-emerald-900 bg-emerald-50 px-1.5 py-0.2 text-[9px] font-bold">
                  ✓ ส่งคืนแล้ว
                </span>
              ) : isLost ? (
                <span className="stamp-ink border-amber-800 text-amber-900 bg-amber-50 px-1.5 py-0.2 text-[9px] font-bold">
                  กำลังตามหา
                </span>
              ) : (
                <span className="stamp-ink border-teal-800 text-teal-900 bg-teal-50 px-1.5 py-0.2 text-[9px] font-bold">
                  รับแจ้งพบ
                </span>
              )}
              <span className="text-[10px] text-slate-500 font-semibold truncate flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" />
                {item.category}
              </span>
            </div>

            {/* Title */}
            <h4 className="font-display text-xs sm:text-sm font-bold text-slate-900 truncate mt-0.5">
              {item.title}
            </h4>

            {/* Location & Date (2 distinct lines, no middle dot) */}
            <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 space-y-0.5">
              <div className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                <span className="truncate">{item.location}</span>
              </div>
              <div className="flex items-center gap-1 truncate text-slate-400">
                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{item.date}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action button: Remove or Open */}
        <div className="flex items-center gap-1 shrink-0">
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="ยกเลิกการเมนชั่น"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <Link
              to={`/item/${item.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-slate-200 text-teal-800 hover:bg-teal-50 hover:border-teal-300 shadow-2xs transition-all cursor-pointer"
              title="เปิดดูหน้ารายละเอียดของชิ้นนี้"
            >
              <span>เปิดดู</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
