import React, { useState, useEffect } from 'react';
import { Item, TrackingStage } from '../types';
import { 
  FileText, 
  Search, 
  MessageSquare, 
  CheckCircle2, 
  Check,
  Lock,
  RotateCcw
} from 'lucide-react';
import { doc, updateDoc, collection, query, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ConfirmResolveModal } from './ConfirmResolveModal';

interface TrackingProgressBarProps {
  item: Item;
  isOwner: boolean;
  isAdmin: boolean;
  onStatusChange?: (newStage: TrackingStage, newStatus: 'active' | 'resolved') => void;
}

interface StepConfig {
  key: TrackingStage;
  lostLabel: string;
  foundLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  isAutoTriggered?: boolean;
}

const STEPS: StepConfig[] = [
  {
    key: 'reported',
    lostLabel: 'ลงประกาศ',
    foundLabel: 'ลงประกาศ',
    icon: FileText
  },
  {
    key: 'review',
    lostLabel: 'กำลังตามหา',
    foundLabel: 'รอเจ้าของ',
    icon: Search
  },
  {
    key: 'contacted',
    lostLabel: 'มีคนแจ้งเบาะแส',
    foundLabel: 'มีผู้ติดต่อยืนยัน',
    icon: MessageSquare,
    isAutoTriggered: true
  },
  {
    key: 'resolved',
    lostLabel: 'ได้รับคืนแล้ว',
    foundLabel: 'ส่งมอบแล้ว',
    icon: CheckCircle2
  }
];

export function TrackingProgressBar({ item, isOwner, isAdmin, onStatusChange }: TrackingProgressBarProps) {
  const [updating, setUpdating] = useState(false);
  const [hasMessages, setHasMessages] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const isLost = item.type === 'lost';

  // Listen to check if there are messages in this post
  useEffect(() => {
    if (!item.id) return;
    const messagesRef = collection(db, 'items', item.id, 'messages');
    const q = query(messagesRef, limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHasMessages(!snapshot.empty);
    }, (err) => {
      console.warn('Error checking messages:', err);
    });
    return () => unsubscribe();
  }, [item.id]);

  // Determine current active stage automatically
  const getCurrentStage = (): TrackingStage => {
    if (item.status === 'resolved') return 'resolved';
    // If explicitly marked as contacted OR if there are messages in chat -> auto promote to 'contacted'
    if (item.stage === 'contacted' || hasMessages) return 'contacted';
    if (item.stage === 'reported') return 'reported';
    return 'review'; // default searching stage
  };

  const currentStage = getCurrentStage();
  const isResolved = currentStage === 'resolved' || item.status === 'resolved';
  const currentStageIndex = STEPS.findIndex(s => s.key === currentStage);
  const activeIndex = currentStageIndex === -1 ? 1 : currentStageIndex;

  // Only allowed to mark resolved (or admin can reopen)
  const handleStageSelect = async (targetStage: TrackingStage) => {
    if (!item.id || updating) return;
    
    // Non-admin CANNOT reopen if already resolved (LOCKED!)
    if (isResolved && targetStage !== 'resolved' && !isAdmin) {
      return;
    }

    if (!isOwner && !isAdmin) return;

    setUpdating(true);
    const newStatus: 'active' | 'resolved' = targetStage === 'resolved' ? 'resolved' : 'active';

    try {
      await updateDoc(doc(db, 'items', item.id), {
        stage: targetStage,
        status: newStatus
      });
      if (onStatusChange) {
        onStatusChange(targetStage, newStatus);
      }
    } catch (err) {
      console.error('Error updating stage:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Progress line percent
  const progressPercent = (activeIndex / (STEPS.length - 1)) * 100;

  return (
    <div className="bg-white rounded-2xl border border-teal-100/90 p-3 sm:px-5 sm:py-3 shadow-2xs">
      {/* Top row: Status Badge & Lock / Resolution Action */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            สถานะติดตาม:
          </span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors ${
            isResolved
              ? 'bg-emerald-100 text-emerald-800'
              : currentStage === 'contacted'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-teal-50 text-teal-800 border border-teal-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isResolved 
                ? 'bg-emerald-600' 
                : currentStage === 'contacted'
                  ? 'bg-amber-600 animate-pulse'
                  : 'bg-teal-600'
            }`} />
            <span>
              {isResolved 
                ? (isLost ? 'ได้รับของคืนเรียบร้อยแล้ว' : 'ส่งมอบคืนเจ้าของเรียบร้อยแล้ว')
                : currentStage === 'contacted'
                  ? (isLost ? '⚡ มีคนแจ้งเบาะแสแล้ว (อัปเดตอัตโนมัติจากแชต)' : '⚡ มีผู้ติดต่อยืนยันตัวตนแล้ว (จากแชต)')
                  : currentStage === 'review'
                    ? (isLost ? 'กำลังประกาศตามหา' : 'เก็บรักษา รอเจ้าของติดต่อมา')
                    : (isLost ? 'ลงประกาศแจ้งของหายแล้ว' : 'ลงประกาศแจ้งพบของแล้ว')}
            </span>
          </span>
        </div>

        {/* Action Button: Owner can mark resolved, but once resolved it is LOCKED unless Admin */}
        {(isOwner || isAdmin) && (
          <div className="flex items-center gap-1.5 shrink-0">
            {!isResolved ? (
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={updating}
                className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-all active:scale-95 shadow-2xs disabled:opacity-50 cursor-pointer"
                title="กดเมื่อได้รับของคืนหรือส่งมอบสำเร็จ (เมื่อกดยืนยันแล้วจะล็อคเคส)"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isLost ? 'ได้ของคืนแล้ว' : 'ส่งคืนแล้ว'}</span>
              </button>
            ) : isAdmin ? (
              /* Only Admin has permission to reopen */
              <button
                type="button"
                onClick={() => handleStageSelect('review')}
                disabled={updating}
                className="text-[11px] font-bold px-2.5 py-1 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95 flex items-center gap-1 shadow-2xs cursor-pointer"
                title="ผู้ดูแลระบบ: ปลดล็อคและเปิดตามหาใหม่"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>เปิดตามหาใหม่ (Admin)</span>
              </button>
            ) : (
              /* Non-admin / Regular User: LOCKED, cannot toggle back and forth */
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>ปิดเคสแล้ว (ล็อค)</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal before permanent lock */}
      <ConfirmResolveModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={async () => {
          await handleStageSelect('resolved');
          setShowConfirmModal(false);
        }}
        item={item}
        loading={updating}
      />

      {/* Compact Stepper Track (Pure Display - User CANNOT click steps to manipulate state) */}
      <div className="relative px-2 sm:px-4 pt-1 pb-1">
        {/* Background track line */}
        <div className="absolute top-4 left-6 right-6 h-1 bg-slate-100 rounded-full -translate-y-1/2 z-0" />

        {/* Filled progress line */}
        <div 
          className="absolute top-4 left-6 h-1 bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-500 rounded-full -translate-y-1/2 z-0 transition-all duration-300"
          style={{ width: `calc((100% - 48px) * ${progressPercent / 100})` }}
        />

        {/* Nodes Grid (Non-clickable, automatic display only) */}
        <div className="relative z-10 flex items-start justify-between select-none">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < activeIndex || isResolved;
            const isCurrent = idx === activeIndex && !isResolved;
            const Icon = step.icon;

            return (
              <div 
                key={step.key}
                className="flex flex-col items-center text-center cursor-default"
                style={{ width: '25%' }}
              >
                {/* Node Circle - strictly display, not a button */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all duration-200 ${
                  isCompleted && !isCurrent
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : isCurrent
                      ? 'bg-teal-600 text-white ring-3 ring-teal-100 shadow-teal-500/30 scale-110'
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}>
                  {isCompleted && !isCurrent ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Node Label */}
                <div className="mt-1.5 space-y-0.5">
                  <p className={`text-[10px] sm:text-xs font-bold leading-tight ${
                    isCurrent 
                      ? 'text-teal-950 font-extrabold' 
                      : isCompleted 
                        ? 'text-slate-800' 
                        : 'text-slate-400'
                  }`}>
                    {isLost ? step.lostLabel : step.foundLabel}
                  </p>
                  
                  {step.isAutoTriggered && (
                    <span className="hidden sm:inline-block text-[9px] text-amber-600 font-bold bg-amber-50 px-1 rounded">
                      Auto 💬
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
