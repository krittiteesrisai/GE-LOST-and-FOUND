import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Item } from '../types';
import { 
  MapPin, 
  Calendar, 
  Tag, 
  User, 
  Laptop, 
  Smartphone, 
  Wallet, 
  CreditCard, 
  Key, 
  Glasses, 
  Watch, 
  Sparkles,
  HelpCircle 
} from 'lucide-react';

interface ClaimTicketCardProps {
  key?: React.Key;
  item: Item;
  onClick?: () => void;
  actionSlot?: ReactNode;
  animationDelay?: number;
}

export function ClaimTicketCard({ item, onClick, actionSlot, animationDelay }: ClaimTicketCardProps) {
  const navigate = useNavigate();

  const isResolved = item.status === 'resolved';
  const isLost = item.type === 'lost';
  const ticketCode = `TKT-${(item.id || '').slice(0, 6).toUpperCase()}`;

  // Helper for category icon matching primary palette
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'อุปกรณ์อิเล็กทรอนิกส์':
        return <Laptop className="w-7 h-7 text-teal-600" />;
      case 'โทรศัพท์มือถือ':
        return <Smartphone className="w-7 h-7 text-teal-600" />;
      case 'กระเป๋า / เป้':
        return <Wallet className="w-7 h-7 text-teal-600" />;
      case 'บัตร / เอกสาร':
        return <CreditCard className="w-7 h-7 text-teal-600" />;
      case 'กุญแจ':
        return <Key className="w-7 h-7 text-teal-600" />;
      case 'แว่นตา':
        return <Glasses className="w-7 h-7 text-teal-600" />;
      case 'นาฬิกา / เครื่องประดับ':
        return <Watch className="w-7 h-7 text-teal-600" />;
      case 'ของมีค่าอื่นๆ':
        return <Sparkles className="w-7 h-7 text-teal-600" />;
      default:
        return <HelpCircle className="w-7 h-7 text-slate-400" />;
    }
  };

  const formattedDate = item.createdAt?.seconds 
    ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: '2-digit'
      })
    : item.date || 'ไม่ระบุ';

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
      style={animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : undefined}
      className="group relative bg-white rounded-2xl border border-slate-200/90 shadow-[0_3px_12px_rgba(15,118,110,0.05)] hover:shadow-[0_12px_28px_rgba(15,118,110,0.15)] hover:border-teal-400 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col overflow-hidden text-left animate-item-unroll"
    >
      {/* Ticket Header & Image Box */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden border-b border-slate-100">
        {item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            alt={item.title} 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 p-4 text-center">
            <div className="p-3.5 rounded-2xl bg-white shadow-2xs border border-slate-200/80 mb-2 group-hover:scale-105 transition-transform">
              {getCategoryIcon(item.category)}
            </div>
            <span className="text-xs text-slate-400 font-medium">ไม่มีรูปภาพแนบ</span>
          </div>
        )}

        {/* Rubber Stamp Status Overlay - Cohesive Colors */}
        <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
          {isResolved ? (
            <div className="stamp-ink-double border-emerald-700 text-emerald-800 bg-emerald-50/95 px-2.5 py-1 text-[11px] font-black tracking-wider shadow-sm transform -rotate-5">
              <span>✓ ส่งคืนสำเร็จ</span>
              <span className="block text-[9px] font-mono tracking-widest text-emerald-600">RETURNED</span>
            </div>
          ) : isLost ? (
            <div className="stamp-ink border-amber-600 text-amber-800 bg-amber-50/95 px-2.5 py-1 text-[11px] font-extrabold tracking-wider shadow-sm transform -rotate-3">
              <span>กำลังตามหา</span>
              <span className="block text-[9px] font-mono tracking-widest text-amber-600">SEARCHING</span>
            </div>
          ) : (
            <div className="stamp-ink border-teal-700 text-teal-800 bg-teal-50/95 px-2.5 py-1 text-[11px] font-extrabold tracking-wider shadow-sm transform rotate-2">
              <span>รับแจ้งพบ</span>
              <span className="block text-[9px] font-mono tracking-widest text-teal-600">FOUND</span>
            </div>
          )}
        </div>

        {/* Category label watermark on ticket photo */}
        <div className="absolute bottom-2 right-2 bg-slate-900/75 backdrop-blur-xs text-slate-100 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border border-white/10 shadow-xs">
          <Tag className="w-2.5 h-2.5 text-teal-300" />
          <span>{item.category}</span>
        </div>
      </div>

      {/* Ticket Main Body */}
      <div className="p-4 flex-1 flex flex-col bg-white">
        <h3 className="font-display font-bold text-slate-900 text-base leading-snug line-clamp-1 mb-1.5 group-hover:text-teal-700 transition-colors">
          {item.title}
        </h3>

        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
          {item.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
        </p>

        {/* 2-line Meta Structure without Middle Dots */}
        <div className="mt-auto space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100/80">
          {/* Line 1: Location */}
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate font-medium text-slate-700">
              {item.type === 'lost' ? item.location : item.currentLocation || item.location}
            </span>
          </div>

          {/* Line 2: Date */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>บันทึกเมื่อ: {formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Perforated Stub Tear Line (ขอบปรุเหมือนตั๋วฉีก) */}
      <div className="relative py-1 flex items-center px-2 bg-white">
        <span className="ticket-notch-left" aria-hidden="true" />
        <div className="w-full border-t border-dashed border-slate-200" />
        <span className="ticket-notch-right" aria-hidden="true" />
      </div>

      {/* Ticket Stub Footer (หางตั๋วเคลม) */}
      <div className="px-4 py-2.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        {/* Real Ticket ID in Monospace */}
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            ตั๋ว ID
          </span>
          <span className="font-mono font-bold text-teal-900 text-[11px] tracking-wider">
            {ticketCode}
          </span>
        </div>

        {/* Author / Post by */}
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <User className="w-3 h-3 text-slate-400" />
          <span className="font-medium text-slate-700 truncate max-w-[85px]" title={item.authorName || 'Guest'}>
            {item.authorName || 'ผู้ใช้งาน'}
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
