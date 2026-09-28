import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Item } from '../types';
import { 
  MapPin, 
  Calendar, 
  User, 
  Smartphone, 
  CreditCard, 
  Key, 
  Backpack, 
  Glasses, 
  HelpCircle,
  BookOpen,
  Gem,
  Tag
} from 'lucide-react';

interface ClaimTicketCardProps {
  key?: string;
  item: Item;
  onClick?: () => void;
  actionSlot?: ReactNode;
}

export function ClaimTicketCard({ item, onClick, actionSlot }: ClaimTicketCardProps) {
  const navigate = useNavigate();
  const isLost = item.type === 'lost';
  const isResolved = item.status === 'resolved';

  // Format real ticket code strictly using monospace
  const ticketCode = `TKT-${(item.id || 'XXXXXX').slice(0, 6).toUpperCase()}`;

  const formattedDate = new Date(item.date).toLocaleDateString('th-TH', { 
    year: 'numeric',
    month: 'short', 
    day: 'numeric' 
  });

  const getCategoryIcon = (cat: string) => {
    if (cat.includes('อิเล็กทรอนิกส์')) return <Smartphone className="w-6 h-6 text-teal-700" />;
    if (cat.includes('บัตร') || cat.includes('เอกสาร')) return <CreditCard className="w-6 h-6 text-cyan-700" />;
    if (cat.includes('กุญแจ')) return <Key className="w-6 h-6 text-amber-700" />;
    if (cat.includes('กระเป๋า')) return <Backpack className="w-6 h-6 text-indigo-700" />;
    if (cat.includes('แว่น')) return <Glasses className="w-6 h-6 text-sky-700" />;
    if (cat.includes('หนังสือ') || cat.includes('เรียน')) return <BookOpen className="w-6 h-6 text-emerald-700" />;
    if (cat.includes('เครื่องประดับ')) return <Gem className="w-6 h-6 text-rose-700" />;
    return <HelpCircle className="w-6 h-6 text-slate-500" />;
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/item/${item.id}`);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="group relative bg-[#fefdfa] rounded-2xl border-2 border-amber-900/25 shadow-[0_3px_12px_rgba(120,53,15,0.06)] hover:shadow-[0_8px_25px_rgba(120,53,15,0.16)] hover:border-amber-800/60 transition-all duration-200 cursor-pointer flex flex-col overflow-hidden text-left"
    >
      {/* Top Wanted / Sheriff Notice Kicker */}
      <div className={`px-3 py-1 flex items-center justify-between text-[11px] font-western tracking-wider font-bold border-b ${
        isLost 
          ? 'bg-amber-950 text-amber-200 border-amber-900' 
          : 'bg-stone-900 text-amber-300 border-stone-800'
      }`}>
        <span className="flex items-center gap-1">
          <span>★</span>
          <span>{isLost ? 'WANTED POSTER' : 'SHERIFF SAFEKEEPING'}</span>
        </span>
        {item.reward && item.reward > 0 ? (
          <span className="bg-amber-500 text-stone-950 px-1.5 py-0.2 rounded font-sans font-black text-[10px] tracking-normal">
            BOUNTY ฿{item.reward.toLocaleString()}
          </span>
        ) : (
          <span className="font-mono text-[9px] text-amber-300/80 uppercase">
            {isLost ? 'MISSING' : 'FOUND'}
          </span>
        )}
      </div>

      {/* Ticket Header & Image Box */}
      <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden border-b border-amber-900/15">
        {item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            alt={item.title} 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#faf6ed] to-[#ede3d1] p-4 text-center">
            <div className="p-3.5 rounded-2xl bg-white/80 shadow-2xs border border-amber-900/20 mb-2">
              {getCategoryIcon(item.category)}
            </div>
            <span className="text-xs text-amber-900/60 font-medium">ไม่มีรูปภาพแนบ</span>
          </div>
        )}

        {/* Rubber Stamp Status Overlay */}
        <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
          {isResolved ? (
            <div className="animate-stamp-slam stamp-ink-double border-emerald-900 text-emerald-950 bg-emerald-50/95 px-2.5 py-1 text-[11px] font-black tracking-wider shadow-md transform -rotate-5">
              <span>✓ ส่งคืนสำเร็จ</span>
              <span className="block text-[9px] font-mono tracking-widest text-emerald-800">RECOVERED</span>
            </div>
          ) : isLost ? (
            <div className="stamp-ink border-rose-900 text-rose-950 bg-rose-50/95 px-2.5 py-1 text-[11px] font-extrabold tracking-wider shadow-sm transform -rotate-3">
              <span>★ ตามหาของ</span>
              <span className="block text-[9px] font-mono tracking-widest text-rose-800">WANTED</span>
            </div>
          ) : (
            <div className="stamp-ink border-amber-900 text-amber-950 bg-amber-50/95 px-2.5 py-1 text-[11px] font-extrabold tracking-wider shadow-sm transform rotate-2">
              <span>★ รับแจ้งพบ</span>
              <span className="block text-[9px] font-mono tracking-widest text-amber-800">SAFEKEEPING</span>
            </div>
          )}
        </div>

        {/* Category label watermark on ticket photo */}
        <div className="absolute bottom-2 right-2 bg-stone-900/80 backdrop-blur-xs text-amber-100 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-700/40">
          <Tag className="w-2.5 h-2.5 text-amber-400" />
          <span>{item.category}</span>
        </div>
      </div>

      {/* Ticket Main Body */}
      <div className="p-4 flex-1 flex flex-col bg-[#fdfbf7]">
        <h3 className="font-display font-black text-stone-900 text-base leading-snug line-clamp-1 mb-1.5 group-hover:text-amber-900 transition-colors">
          {item.title}
        </h3>

        <p className="text-xs text-stone-700 line-clamp-2 leading-relaxed mb-3">
          {item.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
        </p>

        {/* 2-line Meta Structure */}
        <div className="mt-auto space-y-1.5 text-xs text-stone-700 pt-2">
          {/* Line 1: Location */}
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-800 shrink-0" />
            <span className="truncate font-semibold text-stone-900">
              {item.type === 'lost' ? item.location : item.currentLocation || item.location}
            </span>
          </div>

          {/* Line 2: Date */}
          <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
            <Calendar className="w-3.5 h-3.5 text-amber-900/40 shrink-0" />
            <span>ปักป้ายเมื่อ: {formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Perforated Stub Tear Line (ขอบปรุเหมือนตั๋วฉีก) */}
      <div className="relative py-1 flex items-center px-2 bg-[#fdfbf7]">
        <span className="ticket-notch-left" aria-hidden="true" />
        <div className="w-full border-t-2 border-dashed border-amber-900/20" />
        <span className="ticket-notch-right" aria-hidden="true" />
      </div>

      {/* Ticket Stub Footer (หางตั๋วเคลม) */}
      <div className="px-4 py-2.5 bg-[#f6eee2] border-t border-amber-900/15 flex items-center justify-between gap-2 text-xs">
        {/* Real Ticket ID in Monospace */}
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-amber-900/60 uppercase tracking-widest flex items-center gap-0.5">
            <span>★</span>
            <span>ตั๋ว ID</span>
          </span>
          <span className="font-mono font-bold text-stone-900 text-[11px] tracking-wider">
            {ticketCode}
          </span>
        </div>

        {/* Author / Post by */}
        <div className="flex items-center gap-1 text-[11px] text-stone-600">
          <User className="w-3 h-3 text-amber-900/60" />
          <span className="font-semibold text-stone-800 truncate max-w-[85px]" title={item.authorName || 'Guest'}>
            {item.authorName || 'คาวบอยนิรนาม'}
          </span>
        </div>

        {actionSlot && (
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            {actionSlot}
          </div>
        )}
      </div>
    </div>
  );
}
