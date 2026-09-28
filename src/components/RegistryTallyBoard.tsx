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
  // Helper to draw authentic physical tally marks (groups of 5: ||||/)
  const renderTallyMarks = (count: number) => {
    // Show up to 4 tally bundles to keep visual clean and domain-authentic
    const bundles = Math.min(Math.floor(count / 5), 4);
    const remainder = count % 5;

    return (
      <div className="flex items-center gap-2 opacity-60 text-xs font-mono select-none" aria-hidden="true">
        {Array.from({ length: bundles }).map((_, i) => (
          <span key={i} className="tracking-tighter font-black text-stone-600 bg-stone-200/60 px-1 py-0.5 rounded">
            卌
          </span>
        ))}
        {remainder > 0 && (
          <span className="font-bold tracking-widest text-stone-600">
            {'|'.repeat(remainder)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#fcfaf4] rounded-3xl border-2 border-amber-900/30 shadow-[0_4px_20px_rgba(120,53,15,0.06)] overflow-hidden">
      {/* Ledger Header Band */}
      <div className="px-5 py-3 bg-[#f2e7d5] border-b-2 border-amber-900/20 flex items-center justify-between flex-wrap gap-2 text-stone-900">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-amber-900" />
          <span className="font-western font-black text-xs sm:text-sm tracking-wide text-amber-950 uppercase flex items-center gap-1.5">
            <span>★</span>
            <span>สมุดบันทึกคดีทรัพย์สินแดนคาวบอย (Sheriff's Registry Ledger)</span>
            <span>★</span>
          </span>
        </div>
        <span className="text-[11px] font-mono font-semibold text-amber-900/70">
          อัปเดตตามเวลาจริง
        </span>
      </div>

      {/* Unified 3-Bay Tally Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-amber-900/20">
        {/* Bay 1: ประกาศล่า (Lost) */}
        <Link 
          to="/list?tab=lost"
          className="p-5 sm:p-6 bg-[#fdfbf7] hover:bg-rose-50/60 transition-colors duration-150 flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-700" />
                <span className="font-western font-bold text-xs sm:text-sm text-stone-900 uppercase tracking-wide">
                  ★ ตามล่าของหาย (WANTED)
                </span>
              </div>
              <div className="p-2 rounded-xl bg-rose-100 text-rose-900 border border-rose-200">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-display font-black text-3xl sm:text-4xl text-stone-900 tabular-nums">
                {stats.lost}
              </span>
              <span className="text-xs text-stone-600 font-medium">คดี</span>
            </div>

            <div className="mt-2">
              {renderTallyMarks(stats.lost)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-dashed border-amber-900/15">
            <span className="text-xs font-bold text-rose-800 group-hover:text-rose-950 transition-colors">
              เปิดดูกระดานของหาย →
            </span>
          </div>
        </Link>

        {/* Bay 2: รับแจ้งพบและฝากที่อำเภอ (Found) */}
        <Link 
          to="/list?tab=found"
          className="p-5 sm:p-6 bg-[#fdfbf7] hover:bg-amber-50/70 transition-colors duration-150 flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-700" />
                <span className="font-western font-bold text-xs sm:text-sm text-stone-900 uppercase tracking-wide">
                  ★ ฝากที่ห้องอำเภอ (SAFEKEEPING)
                </span>
              </div>
              <div className="p-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-300">
                <Package className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-display font-black text-3xl sm:text-4xl text-stone-900 tabular-nums">
                {stats.found}
              </span>
              <span className="text-xs text-stone-600 font-medium">รายการ</span>
            </div>

            <div className="mt-2">
              {renderTallyMarks(stats.found)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-dashed border-amber-900/15">
            <span className="text-xs font-bold text-amber-800 group-hover:text-amber-950 transition-colors">
              เปิดดูของที่รอส่งคืน →
            </span>
          </div>
        </Link>

        {/* Bay 3: ส่งคืนสำเร็จ ปิดคดี (Resolved) */}
        <Link 
          to="/list?tab=resolved"
          className="p-5 sm:p-6 bg-[#fdfbf7] hover:bg-emerald-50/60 transition-colors duration-150 flex flex-col justify-between group cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-700" />
                <span className="font-western font-bold text-xs sm:text-sm text-stone-900 uppercase tracking-wide">
                  ✓ ส่งคืนสำเร็จ (CASE CLOSED)
                </span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-display font-black text-3xl sm:text-4xl text-emerald-950 tabular-nums">
                {stats.resolved}
              </span>
              <span className="text-xs text-stone-600 font-medium">ส่งคืนแล้ว</span>
            </div>

            <div className="mt-2">
              {renderTallyMarks(stats.resolved)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-dashed border-amber-900/15">
            <span className="text-xs font-bold text-emerald-800 group-hover:text-emerald-950 transition-colors">
              เปิดดูคดีที่ปิดสำเร็จ →
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
