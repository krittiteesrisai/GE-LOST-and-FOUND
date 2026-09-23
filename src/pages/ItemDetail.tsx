import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Item, TrackingStage } from '../types';
import { TrackingProgressBar } from '../components/TrackingProgressBar';
import { ItemChat } from '../components/ItemChat';
import { ConfirmResolveModal } from '../components/ConfirmResolveModal';
import { 
  MapPin, 
  Calendar, 
  Phone, 
  ArrowLeft, 
  Building2, 
  Link as LinkIcon, 
  Search, 
  Copy, 
  Check, 
  Smartphone, 
  CreditCard, 
  Key, 
  Backpack, 
  Glasses, 
  HelpCircle, 
  Edit3, 
  ShieldAlert, 
  User as UserIcon,
  CheckCircle2,
  Lock,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X
} from 'lucide-react';

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, effectiveUser, isAdmin } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedContact, setCopiedContact] = useState(false);
  const [matchingSuggestions, setMatchingSuggestions] = useState<Item[]>([]);
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const navigate = useNavigate();

  // Handle ESC key and scroll lock for image lightbox
  useEffect(() => {
    if (!isImageModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsImageModalOpen(false);
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isImageModalOpen]);

  const openImageModal = () => {
    setZoomLevel(1);
    setIsImageModalOpen(true);
  };

  const activeUid = effectiveUser?.uid || user?.uid;

  const lastCategoryRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const myItems = JSON.parse(localStorage.getItem('myItems') || '[]');
    const docRef = doc(db, 'items', id);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const itemData = { id: docSnap.id, ...docSnap.data() } as Item;
        setItem(itemData);

        // Only fetch suggestions once or if category changes
        if (lastCategoryRef.current !== itemData.category) {
          lastCategoryRef.current = itemData.category;
          fetchSuggestions(itemData);
        }

        const isUserAuthor = !!activeUid && !!itemData.authorId && itemData.authorId === activeUid;
        if (myItems.includes(id) || isAdmin || isUserAuthor) {
          setIsOwner(true);
        }
      } else {
        setItem(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error listening to item:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, user, effectiveUser, activeUid, isAdmin]);

  const fetchSuggestions = async (currentItem: Item) => {
    try {
      const oppositeType = currentItem.type === 'lost' ? 'found' : 'lost';
      const q = query(
        collection(db, 'items'),
        where('type', '==', oppositeType),
        where('category', '==', currentItem.category)
      );
      const querySnapshot = await getDocs(q);
      const items: Item[] = [];
      querySnapshot.forEach((doc) => {
        if (doc.id !== currentItem.id) {
          items.push({ id: doc.id, ...doc.data() } as Item);
        }
      });
      // Limit to 3 suggestions
      setMatchingSuggestions(items.slice(0, 3));
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  const handleResolve = async () => {
    if (!id || !item) return;
    // If already resolved and not admin, locked!
    if (item.status === 'resolved' && !isAdmin) return;

    setResolving(true);
    try {
      const newStatus = item.status === 'active' ? 'resolved' : 'active';
      const newStage = newStatus === 'resolved' ? 'resolved' : 'review';
      await updateDoc(doc(db, 'items', id), {
        status: newStatus,
        stage: newStage
      });
      setItem({ ...item, status: newStatus, stage: newStage });
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setResolving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyContact = () => {
    if (item?.contact) {
      navigator.clipboard.writeText(item.contact);
      setCopiedContact(true);
      setTimeout(() => setCopiedContact(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">กำลังโหลดรายละเอียดสิ่งของ...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">ไม่พบข้อมูลประกาศ</h2>
        <p className="text-xs text-slate-500">
          รายการนี้อาจถูกลบหรือไม่มีอยู่ในระบบ
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-teal-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับสู่หน้าหลัก
        </Link>
      </div>
    );
  }

  const isLost = item.type === 'lost';
  const isResolved = item.status === 'resolved';

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link 
          to="/list" 
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-teal-700 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>กลับไปยังรายการทั้งหมด</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            title="คัดลอกลิงก์ประกาศนี้"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <LinkIcon className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'คัดลอกแล้ว' : 'แชร์ลิงก์'}</span>
          </button>

          {(isOwner || isAdmin) && (
            <Link
              to={`/edit/${item.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>แก้ไข</span>
            </Link>
          )}
        </div>
      </div>

      {/* Visual Tracking Progress Bar (Reported -> Under Review -> Lead Found -> Returned) */}
      <TrackingProgressBar 
        item={item}
        isOwner={isOwner}
        isAdmin={isAdmin}
        onStatusChange={(newStage, newStatus) => {
          setItem(prev => prev ? { ...prev, stage: newStage, status: newStatus } : null);
        }}
      />

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl border border-teal-100 shadow-xs overflow-hidden">
        {/* Status Header Bar */}
        <div className={`px-6 sm:px-8 py-4 ${
          isResolved 
            ? 'bg-slate-100 border-b border-slate-200' 
            : isLost 
              ? 'bg-rose-50/70 border-b border-rose-100' 
              : 'bg-teal-50/70 border-b border-teal-100'
        } flex flex-wrap items-center justify-between gap-3`}>
          <div className="flex items-center gap-2.5">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              isLost ? 'bg-rose-500 text-white' : 'bg-teal-600 text-white'
            }`}>
              {isLost ? '📢 ประกาศของหาย' : '🎁 ประกาศเก็บของได้'}
            </span>

            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {isResolved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ส่งคืนสำเร็จเรียบร้อย</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>{isLost ? 'กำลังตามหา' : 'รอส่งมอบเจ้าของ'}</span>
                </>
              )}
            </span>
          </div>

          {(isOwner || isAdmin) && (
            isResolved ? (
              isAdmin ? (
                <button
                  onClick={handleResolve}
                  disabled={resolving}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center gap-1.5 cursor-pointer"
                  title="ผู้ดูแลระบบ: ปลดล็อคและเปิดตามหาใหม่"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                  <span>{resolving ? 'กำลังอัปเดต...' : 'เปิดตามหาใหม่ (Admin)'}</span>
                </button>
              ) : (
                <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>ปิดเคสแล้ว (ล็อค)</span>
                </span>
              )
            ) : (
              <button
                onClick={() => setShowResolveConfirm(true)}
                disabled={resolving}
                className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                {resolving ? 'กำลังอัปเดต...' : 'ทำเครื่องหมายว่า "ส่งคืนสำเร็จแล้ว"'}
              </button>
            )
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 grid md:grid-cols-12 gap-8">
          {/* Left Column: Image (5 cols) */}
          <div className="md:col-span-5">
            <div 
              onClick={() => item.imageUrl && openImageModal()}
              className={`rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/90 aspect-square flex items-center justify-center relative select-none group/img transition-all ${
                item.imageUrl ? 'cursor-zoom-in hover:shadow-md hover:border-teal-300' : ''
              }`}
            >
              {item.imageUrl ? (
                <>
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                  />

                  {/* Hover Zoom Hint Overlay */}
                  <div className="absolute inset-0 bg-slate-900/25 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none p-3">
                    <span className="bg-slate-900/85 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-xs flex items-center gap-1.5 transform translate-y-2 group-hover/img:translate-y-0 transition-transform">
                      <ZoomIn className="w-4 h-4 text-teal-300" />
                      <span>แตะเพื่อขยายรูปภาพ</span>
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5 bg-slate-900/70 text-white p-1.5 rounded-xl backdrop-blur-xs shadow-xs group-hover/img:bg-teal-700 transition-colors">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                </>
              ) : (
                <div className="text-center p-6 space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto text-2xl font-bold">
                    🎒
                  </div>
                  <span className="text-xs text-slate-400 block font-medium">ไม่มีรูปภาพประกอบ</span>
                </div>
              )}

              {isResolved && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-4 z-10 pointer-events-none">
                  <div className="bg-white/95 text-slate-900 px-4 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>รายการนี้ส่งมอบแล้ว</span>
                  </div>
                </div>
              )}
            </div>

            {/* Author info pill */}
            <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {item.authorName?.[0] || 'U'}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                  ผู้ลงประกาศ
                </span>
                <span className="text-xs font-bold text-slate-800 truncate block">
                  {item.authorName || 'Guest'} {item.isGuest ? '(Guest)' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Contacts (7 cols) */}
          <div className="md:col-span-7 space-y-6">
            <div>
              <div className="inline-block px-3 py-1 rounded-lg text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-100 mb-2">
                หมวดหมู่: {item.category}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {item.title}
              </h1>
            </div>

            {/* Location & Date Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isLost ? 'สถานที่คาดว่าทำหาย' : 'สถานที่ที่พบ'}
                  </span>
                  <span className="text-xs font-bold text-slate-800 leading-snug block mt-0.5">
                    {item.location}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isLost ? 'วันที่ทำหาย' : 'วันที่พบเจอ'}
                  </span>
                  <span className="text-xs font-bold text-slate-800 leading-snug block mt-0.5">
                    {item.date}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Drop-off Location for Found items */}
            {!isLost && item.currentLocation && (
              <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200/80 flex items-start gap-3">
                <Building2 className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-extrabold text-teal-900 block">
                    📍 จุดฝากสิ่งของในปัจจุบัน
                  </span>
                  <span className="text-xs text-teal-800 mt-0.5 block font-semibold">
                    {item.currentLocation}
                  </span>
                  <span className="text-[11px] text-teal-700/80 mt-1 block">
                    สามารถติดต่อขอรับของคืนได้ตามจุดที่ระบุไว้ข้างต้น
                  </span>
                </div>
              </div>
            )}

            {/* Detailed Description */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                รายละเอียดเพิ่มเติม
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/60 p-4 rounded-2xl border border-slate-100 whitespace-pre-wrap">
                {item.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
              </p>
            </div>

            {/* Contact Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-teal-500/10 via-cyan-500/5 to-white border border-teal-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    ข้อมูลติดต่อกลับ
                  </span>
                </div>
                {item.contact && (
                  <button
                    onClick={handleCopyContact}
                    className="flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900"
                  >
                    {copiedContact ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedContact ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                )}
              </div>

              <div className="p-3 bg-white rounded-xl border border-teal-100 font-bold text-xs sm:text-sm text-slate-900 select-all">
                {item.contact || 'ไม่ได้ระบุข้อมูลติดต่อ'}
              </div>
              <p className="text-[11px] text-slate-500">
                กรุณาติดต่อด้วยความสุภาพ และตรวจสอบหลักฐานความเป็นเจ้าของอย่างรอบคอบก่อนส่งมอบ
              </p>
            </div>

            {/* Admin Note if present */}
            {item.adminNote && (
              <div className="p-3 rounded-2xl bg-slate-100 text-slate-700 text-xs border border-slate-200">
                <span className="font-bold block text-slate-900">🛡️ บันทึกจากเจ้าหน้าที่:</span>
                <span className="mt-0.5 block">{item.adminNote}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Post Chat / Lead Discussion */}
      <ItemChat 
        item={item} 
        isOwner={isOwner} 
        onStageAutoAdvance={() => {
          setItem(prev => prev ? { ...prev, stage: 'contacted' } : null);
        }}
      />

      {/* Suggested Matching Items */}
      {matchingSuggestions.length > 0 && (
        <div className="pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-800">
              {isLost ? 'รายการที่อาจตรงกับของที่คุณทำหาย' : 'รายการที่อาจเป็นเจ้าของของชิ้นนี้'}
            </h3>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {matchingSuggestions.map((sug) => (
              <Link
                key={sug.id}
                to={`/item/${sug.id}`}
                className="bg-white p-4 rounded-2xl border border-teal-100 hover:border-teal-300 hover:shadow-xs transition-all flex flex-col justify-between group"
              >
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold mb-2 ${
                    sug.type === 'lost' ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
                  }`}>
                    {sug.type === 'lost' ? 'ของหาย' : 'พบของ'}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-teal-600 transition-colors">
                    {sug.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {sug.description || sug.location}
                  </p>
                </div>
                <span className="text-[10px] text-teal-600 font-bold mt-3 block">
                  ดูรายละเอียด &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal before permanent lock */}
      <ConfirmResolveModal
        isOpen={showResolveConfirm}
        onClose={() => setShowResolveConfirm(false)}
        onConfirm={async () => {
          await handleResolve();
          setShowResolveConfirm(false);
        }}
        item={item}
        loading={resolving}
      />

      {/* High-Resolution Image Zoom Modal / Lightbox */}
      {isImageModalOpen && item?.imageUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-fadeIn select-none"
          onClick={() => setIsImageModalOpen(false)}
        >
          {/* Top Control Bar */}
          <div 
            className="flex items-center justify-between gap-3 text-white max-w-4xl w-full mx-auto pb-2 border-b border-white/10 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-w-0 pr-2">
              <h3 className="text-sm font-bold truncate text-white/95">
                {item.title}
              </h3>
              <p className="text-[11px] text-white/60">
                ขนาดการแสดงผล: <span className="font-mono text-teal-300 font-bold">{Math.round(zoomLevel * 100)}%</span>
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 shrink-0 bg-white/10 p-1 rounded-2xl backdrop-blur-md border border-white/15">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.5))}
                disabled={zoomLevel <= 1}
                className="p-2 rounded-xl hover:bg-white/20 active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                title="ย่อรูป (-)"
              >
                <ZoomOut className="w-4 h-4 text-white" />
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="px-2.5 py-1 text-xs font-bold rounded-xl hover:bg-white/20 active:scale-95 transition-all text-white/90 cursor-pointer"
                title="รีเซ็ตขนาดปกติ (100%)"
              >
                100%
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.5))}
                disabled={zoomLevel >= 3}
                className="p-2 rounded-xl hover:bg-white/20 active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                title="ขยายรูป (+)"
              >
                <ZoomIn className="w-4 h-4 text-white" />
              </button>

              <div className="w-px h-5 bg-white/20 mx-1" />

              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="p-2 rounded-xl bg-white/20 hover:bg-rose-600 active:scale-95 transition-all text-white cursor-pointer"
                title="ปิดหน้าต่าง (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Image Display Area with Pan & Smooth Zoom */}
          <div 
            className="flex-1 flex items-center justify-center overflow-auto p-2 my-2 cursor-zoom-out"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsImageModalOpen(false);
              }
            }}
          >
            <div 
              className="transition-transform duration-200 ease-out inline-flex items-center justify-center max-w-full max-h-full cursor-zoom-in"
              style={{ transform: `scale(${zoomLevel})` }}
              onClick={(e) => {
                e.stopPropagation();
                setZoomLevel(prev => prev === 1 ? 2 : 1);
              }}
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="max-h-[75vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-white/10"
                title="คลิกที่ภาพเพื่อสลับซูม 100% / 200%"
              />
            </div>
          </div>

          {/* Bottom Hint */}
          <div className="text-center text-[11px] text-white/60 pt-1 pointer-events-none shrink-0">
            แตะที่รูปเพื่อสลับซูม 100% / 200% หรือใช้ปุ่มควบคุมด้านบน | กด Esc หรือแตะพื้นหลังเพื่อปิด
          </div>
        </div>
      )}
    </div>
  );
}
