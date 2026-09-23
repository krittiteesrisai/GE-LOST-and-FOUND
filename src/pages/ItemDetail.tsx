import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Item } from '../types';
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
  CheckCircle2
} from 'lucide-react';

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedContact, setCopiedContact] = useState(false);
  const [matchingSuggestions, setMatchingSuggestions] = useState<Item[]>([]);
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
        where('category', '==', currentItem.category),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      const matches: Item[] = [];
      snapshot.forEach(docSnap => {
        if (docSnap.id !== currentItem.id) {
          matches.push({ id: docSnap.id, ...docSnap.data() } as Item);
        }
      });
      setMatchingSuggestions(matches.slice(0, 3));
    } catch (e) {
      console.warn("Could not fetch suggestions", e);
    }
  };

  const handleResolve = async () => {
    if (!id || !item) return;
    const confirmMessage = item.type === 'lost' 
      ? 'คุณได้รับสิ่งของชิ้นนี้คืนเรียบร้อยแล้วใช่หรือไม่?' 
      : 'คุณได้ส่งมอบสิ่งของนี้คืนสู่เจ้าของเรียบร้อยแล้วใช่หรือไม่?';

    if (!window.confirm(confirmMessage)) return;

    setResolving(true);
    try {
      const docRef = doc(db, 'items', id);
      await updateDoc(docRef, {
        status: 'resolved'
      });
      setItem({ ...item, status: 'resolved' });
    } catch (error) {
      console.error("Error updating status:", error);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
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

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'อุปกรณ์อิเล็กทรอนิกส์':
        return <Smartphone className="w-8 h-8 text-teal-600" />;
      case 'เอกสาร/บัตร':
        return <CreditCard className="w-8 h-8 text-cyan-600" />;
      case 'กุญแจ':
        return <Key className="w-8 h-8 text-emerald-600" />;
      case 'กระเป๋า':
        return <Backpack className="w-8 h-8 text-indigo-600" />;
      case 'แว่นตา':
        return <Glasses className="w-8 h-8 text-sky-600" />;
      default:
        return <HelpCircle className="w-8 h-8 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded-xl" />
        <div className="bg-white rounded-3xl h-96 border border-slate-200" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 bg-white rounded-3xl border border-teal-100 p-8 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4">
          <Search className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">ไม่พบข้อมูลประกาศนี้</h2>
        <p className="text-sm text-slate-500 mb-6">
          รายการนี้อาจถูกลบออก หรือไม่มีอยู่ในระบบแล้ว
        </p>
        <Link 
          to="/list" 
          className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs hover:bg-teal-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับไปหน้ารวมรายการ</span>
        </Link>
      </div>
    );
  }

  const isLost = item.type === 'lost';
  const isResolved = item.status === 'resolved';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-teal-800 bg-white border border-teal-100 px-3.5 py-2 rounded-2xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-teal-600" />
          <span>ย้อนกลับ</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-teal-800 bg-white border border-teal-100 px-3.5 py-2 rounded-2xl shadow-xs hover:bg-teal-50/50 transition-colors"
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-teal-700 font-bold">คัดลอกลิงก์แล้ว!</span>
            </>
          ) : (
            <>
              <LinkIcon className="w-3.5 h-3.5 text-teal-600" />
              <span>แชร์ประกาศ</span>
            </>
          )}
        </button>
      </div>

      {/* Main Detail Container */}
      <div className="bg-white rounded-3xl border border-teal-100/90 shadow-xs overflow-hidden flex flex-col md:flex-row">
        {/* Visual Showcase (Left) */}
        <div className="md:w-1/2 bg-[#f8fbfb] min-h-[320px] md:min-h-[460px] flex items-center justify-center border-b md:border-b-0 md:border-r border-teal-100/70 relative overflow-hidden">
          {item.imageUrl ? (
            <img 
              src={item.imageUrl} 
              alt={item.title} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover max-h-[500px]" 
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="p-4 rounded-3xl bg-white shadow-xs border border-teal-100 mb-3">
                {getCategoryIcon(item.category)}
              </div>
              <p className="text-xs font-medium text-slate-400">ผู้แจ้งไม่ได้แนบรูปภาพประกอบ</p>
            </div>
          )}

          {/* Resolved Overlay */}
          {isResolved && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
              <div className="bg-white text-slate-900 px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-extrabold text-sm">รายการนี้ปิดแล้ว (ได้รับคืนแล้ว)</span>
              </div>
            </div>
          )}
        </div>

        {/* Content Section (Right) */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col">
          {/* Status Badge & Category */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              isLost 
                ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                : 'bg-teal-50 text-teal-800 border border-teal-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLost ? 'bg-amber-500' : 'bg-teal-600'} animate-pulse`} />
              {isLost ? 'ประกาศตามหาของ' : 'ประกาศพบของ'}
            </span>

            <span className="text-xs font-medium text-slate-500">
              หมวดหมู่: <strong className="text-teal-900">{item.category}</strong>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight leading-snug">
            {item.title}
          </h1>

          {/* Author Badge */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-teal-50/60 border border-teal-100 mb-5">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-500">ผู้ลงประกาศ:</span>
              <span className="font-bold text-slate-900">
                {item.authorName || 'Guest'}
              </span>
              {item.isGuest || !item.authorName || item.authorName === 'Guest' ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-600">
                  Guest (ผู้ใช้ทั่วไป)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  ✓ ยืนยันตัวตนแล้ว
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-5">
            <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-1.5">
              ลักษณะและรายละเอียด
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
              {item.description}
            </p>
          </div>

          {/* Fact Matrix */}
          <div className="space-y-3 mb-6 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isLost ? 'สถานที่คาดว่าหาย' : 'สถานที่ที่พบ'}</span>
                </div>
                <div className="font-bold text-slate-900 break-words">{item.location}</div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                  <span>{isLost ? 'วันที่คาดว่าหาย' : 'วันที่พบ'}</span>
                </div>
                <div className="font-bold text-slate-900">
                  {new Date(item.date).toLocaleString('th-TH', { 
                    dateStyle: 'medium', 
                    timeStyle: 'short' 
                  })}
                </div>
              </div>
            </div>

            {!isLost && item.currentLocation && (
              <div className="bg-teal-50/70 p-3.5 rounded-2xl border border-teal-100">
                <div className="flex items-center gap-1.5 text-teal-800 font-semibold mb-1">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>สถานที่นำของไปฝากไว้ในปัจจุบัน</span>
                </div>
                <div className="font-bold text-teal-950">{item.currentLocation}</div>
              </div>
            )}

            {item.adminNote && (
              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-amber-900">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                  <span>หมายเหตุจากแอดมิน</span>
                </div>
                <div className="leading-relaxed">{item.adminNote}</div>
              </div>
            )}
          </div>

          {/* Contact Box */}
          <div className="mt-auto pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                ช่องทางติดต่อ{isLost ? 'เจ้าของ' : 'ผู้เก็บได้'}
              </span>
              {!isResolved && (
                <button
                  onClick={handleCopyContact}
                  className="font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 text-[11px]"
                >
                  {copiedContact ? (
                    <>
                      <Check className="w-3 h-3 text-teal-600" />
                      <span>คัดลอกแล้ว</span>
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
              <div className="bg-slate-100 p-3.5 rounded-2xl text-center text-xs text-slate-500 italic">
                ซ่อนข้อมูลการติดต่อแล้วเนื่องจากปิดรายการเรียบร้อยแล้ว
              </div>
            ) : (
              <div className="bg-teal-50/50 border border-teal-200/80 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-slate-900 select-all font-mono">
                  {item.contact}
                </span>
                <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md font-bold">
                  ติดต่อได้โดยตรง
                </span>
              </div>
            )}

            {/* Owner Controls */}
            {isOwner && !isResolved && (
              <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-900 mb-1">
                  จัดการประกาศของคุณ
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleResolve}
                    disabled={resolving}
                    className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{resolving ? 'กำลังอัปเดต...' : 'ปิดประกาศ (ได้รับของคืนแล้ว)'}</span>
                  </button>
                  <Link
                    to={`/edit/${item.id}`}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 py-2.5 px-3.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>แก้ไข</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Matching Items */}
      {matchingSuggestions.length > 0 && !isResolved && (
        <section className="bg-white rounded-3xl border border-teal-100 p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 text-sm">
              รายการที่อาจตรงกัน (หมวดหมู่ {item.category})
            </h3>
            <p className="text-xs text-slate-500">
              พบรายการที่มีประเภทตรงข้ามและอาจเป็นของชิ้นเดียวกัน
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {matchingSuggestions.map(suggestion => (
              <Link
                key={suggestion.id}
                to={`/item/${suggestion.id}`}
                className="p-3.5 rounded-2xl border border-teal-100/80 hover:border-teal-300 hover:bg-teal-50/30 transition-all flex items-center gap-3 group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0 overflow-hidden flex items-center justify-center">
                  {suggestion.imageUrl ? (
                    <img src={suggestion.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <span className="text-xs text-slate-400">รูปถ่าย</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate group-hover:text-teal-700">
                    {suggestion.title}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {suggestion.location}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
