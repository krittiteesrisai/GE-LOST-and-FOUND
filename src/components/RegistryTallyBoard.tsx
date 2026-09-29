import { Link } from 'react-router-dom';
import { Clock, Package, CheckCircle2, ClipboardList } from 'lucide-react';

interface RegistryTallyBoardProps {
  stats: {
    lost: number;
    found: number;
    resolved: number;
  };
}

export function RegistryTallyBoard({ stats }: RegistryTallyBoardProps) {
  // Helper to draw clean physical tally marks (groups of 5: 卌)
  const renderTallyMarks = (count: number) => {
    const bundles = Math.min(Math.floor(count / 5), 4);
    const remainder = count % 5;

    return (
      <div className="flex items-center gap-1.5 opacity-70 text-xs font-mono select-none" aria-hidden="true">
        {Array.from({ length: bundles }).map((_, i) => (
          <span key={i} className="tracking-tighter font-black text-slate-600 bg-slate-200/70 px-1 py-0.5 rounded">
            卌
          </span>
        ))}
        {remainder > 0 && (
          <span className="font-bold tracking-widest text-slate-600">
            {'|'.repeat(remainder)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_rgba(15,118,110,0.04)] overflow-hidden">
      {/* Ledger Header Band */}
      <div className="px-5 py-3 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between flex-wrap gap-2 text-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700">
            <ClipboardList className="w-3.5 h-3.5" />
          </div>
          <span className="font-display font-bold text-xs sm:text-sm tracking-wide uppercase text-slate-800">
            กระดานสถิติทรัพย์สิน (Campus Ledger Board)
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-500 font-medium">
          อัปเดตข้อมูลตามเวลาจริง
        </span>
      </div>

      {/* Unified 3-Bay Tally Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/80">
        {/* Bay 1: กำลังตามหา (Lost - Warm Amber) */}
        <Link 
          to="/list?tab=lost"
          className="p-5 sm:p-6 bg-white hover:bg-amber-50/50 transition-colors duration-150 flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-xs sm:text-sm text-slate-700 uppercase tracking-wide">
                กำลังตามหา
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/70 group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="font-display font-black text-3xl sm:text-4xl text-slate-900 tabular-nums">
                {stats.lost}
              </span>
              <span className="text-xs text-slate-500 font-medium">รายการ</span>
            </div>

            <div className="mt-2.5">
              {renderTallyMarks(stats.lost)}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-dashed border-slate-200/80 flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 group-hover:text-amber-900 transition-colors">
              เปิดดูกระดานของหาย
            </span>
            <span className="text-amber-500 group-hover:translate-x-0.5 transition-transform text-xs font-bold">→</span>
          </div>
        </Link>

        {/* Bay 2: รับแจ้งพบและเก็บรักษา (Found - Teal) */}
        <Link 
          to="/list?tab=found"
          className="p-5 sm:p-6 bg-white hover:bg-teal-50/50 transition-colors duration-150 flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-xs sm:text-sm text-slate-700 uppercase tracking-wide">
                รับแจ้งพบและเก็บรักษา
              </span>
              <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/70 group-hover:scale-105 transition-transform">
                <Package className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="font-display font-black text-3xl sm:text-4xl text-slate-900 tabular-nums">
                {stats.found}
              </span>
              <span className="text-xs text-slate-500 font-medium">รายการ</span>
            </div>

            <div className="mt-2.5">
              {renderTallyMarks(stats.found)}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-dashed border-slate-200/80 flex items-center justify-between">
            <span className="text-xs font-bold text-teal-700 group-hover:text-teal-900 transition-colors">
              เปิดดูรายการพบของ
            </span>
            <span className="text-teal-600 group-hover:translate-x-0.5 transition-transform text-xs font-bold">→</span>
          </div>
        </Link>

        {/* Bay 3: ส่งคืนสำเร็จ (Resolved - Emerald) */}
        <Link 
          to="/list?tab=resolved"
          className="p-5 sm:p-6 bg-white hover:bg-emerald-50/50 transition-colors duration-150 flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-xs sm:text-sm text-slate-700 uppercase tracking-wide">
                ส่งคืนเจ้าของสำเร็จ
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="font-display font-black text-3xl sm:text-4xl text-slate-900 tabular-nums">
                {stats.resolved}
              </span>
              <span className="text-xs text-slate-500 font-medium">รายการ</span>
            </div>

            <div className="mt-2.5">
              {renderTallyMarks(stats.resolved)}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-dashed border-slate-200/80 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 group-hover:text-emerald-900 transition-colors">
              เปิดดูรายการส่งคืนแล้ว
            </span>
            <span className="text-emerald-600 group-hover:translate-x-0.5 transition-transform text-xs font-bold">→</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
