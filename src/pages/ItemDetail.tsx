import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Item } from '../types';
import { MapPin, Calendar, Tag, Phone, ArrowLeft, Building2, CheckCircle2, Link as LinkIcon, Search, Copy, Check, Sparkles, Smartphone, CreditCard, Key, Backpack, Glasses, HelpCircle, Edit3, ShieldAlert, User as UserIcon } from 'lucide-react';

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedContact, setCopiedContact] = useState(false);
  const [suggestions, setSuggestions] = useState<Item[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      
      const myItems = JSON.parse(localStorage.getItem('myItems') || '[]');

      try {
        const docRef = doc(db, 'items', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const itemData = { id: docSnap.id, ...docSnap.data() } as Item;
          setItem(itemData);
          fetchSuggestions(itemData);

          const isUserAuthor = !!user && !!itemData.authorId && itemData.authorId === user.uid;
          if (myItems.includes(id) || isAdmin || isUserAuthor) {
            setIsOwner(true);
          }
        }
      } catch (error) {
        console.error("Error fetching item:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id, user, isAdmin]);

  const fetchSuggestions = async (currentItem: Item) => {
    try {
      const oppositeType = currentItem.type === 'lost' ? 'found' : 'lost';
      const q = query(
        collection(db, 'items'),
        where('type', '==', oppositeType),
        where('status', '==', 'active'),
        where('category', '==', currentItem.category)
      );
      
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Item))
        .filter(i => i.id !== currentItem.id);

      const getWords = (text: string) => text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const targetWords = new Set([...getWords(currentItem.title), ...getWords(currentItem.description)]);

      const scoredItems = items.map(i => {
        const iWords = [...getWords(i.title), ...getWords(i.description)];
        let score = 0;
        iWords.forEach(w => {
          if (targetWords.has(w)) score++;
        });
        return { ...i, score };
      }).filter(i => i.score > 0);

      scoredItems.sort((a, b) => b.score - a.score);
      setSuggestions(scoredItems.slice(0, 3));
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: item?.title ? `${item.title} - Lost & Found` : 'ประกาศของหาย / พบของ',
          text: item?.title ? `ดูประกาศ: ${item.title}` : undefined,
          url: url,
        });
        return;
      } catch (e) {
        // Fallback to clipboard if share was dismissed or not allowed
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Old browser fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyContact = () => {
    if (item?.contact) {
      navigator.clipboard.writeText(item.contact);
      setCopiedContact(true);
      setTimeout(() => setCopiedContact(false), 2000);
    }
  };

  const handleResolve = async () => {
    if (!id || !item) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'items', id), { status: 'resolved' });
      setItem({ ...item, status: 'resolved' });
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'อุปกรณ์อิเล็กทรอนิกส์':
        return <Smartphone className="w-10 h-10 text-blue-500" />;
      case 'เอกสาร/บัตร':
        return <CreditCard className="w-10 h-10 text-amber-500" />;
      case 'กุญแจ':
        return <Key className="w-10 h-10 text-emerald-500" />;
      case 'กระเป๋า':
        return <Backpack className="w-10 h-10 text-indigo-500" />;
      case 'แว่นตา':
        return <Glasses className="w-10 h-10 text-purple-500" />;
      default:
        return <HelpCircle className="w-10 h-10 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-orange-500 rounded-full animate-spin" />
        <span className="text-sm font-medium">กำลังโหลดข้อมูลสิ่งของ...</span>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-2">ไม่พบข้อมูลประกาศนี้</h2>
        <p className="text-sm text-slate-500 mb-6">ประกาศอาจถูกลบหรือไม่มีอยู่ในระบบ</p>
        <Link to="/list" className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800">
          กลับไปหน้ารวมรายการ
        </Link>
      </div>
    );
  }

  const isLost = item.type === 'lost';
  const isResolved = item.status === 'resolved';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Share Actions */}
      <div className="flex items-center justify-between">
        <Link 
          to="/list" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> 
          <span>กลับไปรายการทั้งหมด</span>
        </Link>

        <button 
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs hover:bg-slate-50 transition-colors"
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600 font-semibold">คัดลอกลิงก์แล้ว!</span>
            </>
          ) : (
            <>
              <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>แชร์ประกาศ</span>
            </>
          )}
        </button>
      </div>

      {/* Main Showcase Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Visual Showcase (Left/Top) */}
        <div className="md:w-1/2 bg-slate-50 min-h-[320px] md:min-h-[460px] flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-200/80 relative overflow-hidden">
          {item.imageUrl ? (
            <img 
              src={item.imageUrl} 
              alt={item.title} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover max-h-[500px]" 
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="p-4 rounded-3xl bg-white shadow-sm mb-3">
                {getCategoryIcon(item.category)}
              </div>
              <p className="text-xs font-medium text-slate-400">ผู้แจ้งไม่ได้แนบรูปภาพประกอบ</p>
            </div>
          )}

          {/* Overlay Status Pill */}
          {isResolved && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
              <div className="bg-white text-slate-900 px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold text-sm">รายการนี้ปิดแล้ว (ได้รับคืนแล้ว)</span>
              </div>
            </div>
          )}
        </div>

        {/* Content Section (Right) */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col">
          {/* Status Badge & Category */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isLost 
                ? 'bg-orange-50 text-orange-700 border border-orange-200' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLost ? 'bg-orange-500' : 'bg-emerald-600'} animate-pulse`} />
              {isLost ? 'ประกาศตามหาของ' : 'ประกาศพบของ'}
            </span>

            <span className="text-xs font-medium text-slate-500">
              หมวดหมู่: <strong className="text-slate-800">{item.category}</strong>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4 tracking-tight leading-snug">
            {item.title}
          </h1>

          {/* Author Badge */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 mb-6">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
              item.isGuest || !item.authorName || item.authorName === 'Guest'
                ? 'bg-slate-200 text-slate-700'
                : 'bg-orange-600 text-white shadow-xs'
            }`}>
              {item.isGuest || !item.authorName || item.authorName === 'Guest' ? (
                'G'
              ) : (
                <UserIcon className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500">ผู้ลงประกาศ:</span>
                <span className="text-xs font-bold text-slate-900 truncate">
                  {item.authorName || 'Guest'}
                </span>
                {item.isGuest || !item.authorName || item.authorName === 'Guest' ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-600">
                    Guest (ผู้ใช้ทั่วไป)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    ✓ ผู้ใช้งานยืนยันตัวตน
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              ลักษณะและรายละเอียด
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              {item.description}
            </p>
          </div>

          {/* Key Facts / Metadata Grid */}
          <div className="space-y-3 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>{isLost ? 'สถานที่คาดว่าหาย' : 'สถานที่พบ'}</span>
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-800 break-words">
                  {item.location}
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>{isLost ? 'วันที่คาดว่าหาย' : 'วันที่พบ'}</span>
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-800">
                  {new Date(item.date).toLocaleString('th-TH', { 
                    dateStyle: 'medium', 
                    timeStyle: 'short' 
                  })}
                </div>
              </div>
            </div>

            {!isLost && item.currentLocation && (
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>สถานที่นำของไปฝากไว้ในปัจจุบัน</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-emerald-950">
                  {item.currentLocation}
                </div>
              </div>
            )}

            {/* Admin Note if provided */}
            {item.adminNote && (
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200/80">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 mb-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>ข้อความกำกับจากเจ้าหน้าที่ / ผู้ดูแลระบบ</span>
                </div>
                <div className="text-xs text-amber-900 leading-relaxed">
                  {item.adminNote}
                </div>
              </div>
            )}
          </div>

          {/* Contact Box */}
          <div className="mt-auto pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                ช่องทางติดต่อ{isLost ? 'เจ้าของที่ตามหา' : 'ผู้ที่เก็บได้'}
              </span>
              {!isResolved && (
                <button
                  onClick={handleCopyContact}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  {copiedContact ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600">คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>คัดลอก</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {isResolved ? (
              <div className="bg-slate-100 p-3 rounded-xl text-center text-xs text-slate-500 font-medium italic">
                ซ่อนข้อมูลการติดต่อแล้วเนื่องจากรายการนี้ดำเนินการปิดสำเร็จแล้ว
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-emerald-900 select-all font-mono">
                  {item.contact}
                </span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md font-semibold">
                  ติดต่อได้ทันที
                </span>
              </div>
            )}

            {/* Owner or Admin Controls */}
            {isOwner && !isResolved && (
              <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="text-xs font-bold text-slate-800 mb-1">
                  เมนูจัดการประกาศ (สำหรับคุณหรือเจ้าหน้าที่)
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  เมื่อได้รับของคืนแล้ว กรุณากดปิดประกาศเพื่อไม่ให้มีผู้ติดต่อซ้ำ
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleResolve}
                    disabled={updating}
                    className="flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{updating ? 'กำลังอัปเดต...' : 'ปิดประกาศ (ส่งมอบคืนแล้ว)'}</span>
                  </button>
                  <Link
                    to={`/edit/${item.id}`}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>แก้ไขข้อมูล</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Matching Suggestions Section */}
      {suggestions.length > 0 && (
        <div className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <h2 className="text-base font-bold text-slate-900">
              รายการที่ใกล้เคียงและอาจเกี่ยวข้องกับชิ้นนี้
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {suggestions.map(s => (
              <div 
                key={s.id} 
                onClick={() => navigate(`/item/${s.id}`)}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-slate-300 transition-all group flex flex-col"
              >
                <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden">
                  {s.imageUrl ? (
                    <img 
                      src={s.imageUrl} 
                      alt={s.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400">
                      {getCategoryIcon(s.category)}
                    </div>
                  )}
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${
                    s.type === 'lost' ? 'bg-orange-500' : 'bg-emerald-600'
                  }`}>
                    {s.type === 'lost' ? 'ตามหา' : 'เก็บได้'}
                  </span>
                </div>
                <div className="p-3.5 flex-1 flex flex-col">
                  <h4 className="font-bold text-slate-900 text-xs line-clamp-1 mb-1 group-hover:text-orange-600 transition-colors">
                    {s.title}
                  </h4>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-auto">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{s.type === 'lost' ? s.location : s.currentLocation || s.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

