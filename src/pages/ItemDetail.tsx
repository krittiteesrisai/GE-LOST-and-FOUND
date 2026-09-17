import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Item } from '../types';
import { MapPin, Calendar, Tag, Phone, ArrowLeft, Building2, CheckCircle2, Link as LinkIcon, Search } from 'lucide-react';

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [suggestions, setSuggestions] = useState<Item[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      
      // Check if user is the creator (via localStorage) or an Admin
      const myItems = JSON.parse(localStorage.getItem('myItems') || '[]');
      const isAdminUser = sessionStorage.getItem('isAdmin') === 'true';
      if (myItems.includes(id) || isAdminUser) {
        setIsOwner(true);
      }

      try {
        const docRef = doc(db, 'items', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const itemData = { id: docSnap.id, ...docSnap.data() } as Item;
          setItem(itemData);
          fetchSuggestions(itemData);
        }
      } catch (error) {
        console.error("Error fetching item:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

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
        .filter(i => i.id !== currentItem.id); // exclude self just in case

      // Simple keyword matching
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  if (loading) {
    return <div className="text-center py-20 animate-pulse text-gray-500">กำลังโหลดข้อมูล...</div>;
  }

  if (!item) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบข้อมูล</h2>
        <Link to="/list" className="text-orange-600 hover:underline">กลับไปหน้ารายการ</Link>
      </div>
    );
  }

  const isLost = item.type === 'lost';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/list" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium">
        <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
      </Link>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        {/* Image Section */}
        <div className="md:w-1/2 bg-gray-50 min-h-[300px] flex items-center justify-center border-r border-gray-100 relative">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover max-h-[500px]" />
          ) : (
             <div className="text-gray-400">ไม่มีรูปภาพประกอบ</div>
          )}
          {item.status === 'resolved' && (
             <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
               <span className="bg-gray-900 text-white px-6 py-2 rounded-full text-lg font-medium shadow-xl">
                 รายการนี้ได้รับคืนแล้ว
               </span>
             </div>
          )}
        </div>

        {/* Content Section */}
        <div className="md:w-1/2 p-8 md:p-10 flex flex-col">
          <div className={`self-start px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ${
            isLost ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
          }`}>
            {isLost ? 'ประกาศตามหาของ' : 'ประกาศเก็บของได้'}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{item.title}</h1>
          <div className="flex items-center gap-2 text-gray-500 mb-8">
            <Tag className="w-4 h-4" />
            <span className="text-sm font-medium">{item.category}</span>
          </div>

          <div className="space-y-6 flex-1">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">รายละเอียด</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{item.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  {isLost ? 'สถานที่คาดว่าหาย' : 'สถานที่พบ'}
                </h3>
                <p className="text-gray-600 text-sm">{item.location}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  {isLost ? 'วันที่คาดว่าหาย' : 'วันที่พบ'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {new Date(item.date).toLocaleString('th-TH', { 
                    dateStyle: 'long', 
                    timeStyle: 'short' 
                  })}
                </p>
              </div>

              {!isLost && item.currentLocation && (
                <div className="sm:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-orange-500" />
                    สถานที่ฝากของปัจจุบัน
                  </h3>
                  <p className="text-gray-600 text-sm font-medium">{item.currentLocation}</p>
                </div>
              )}
            </div>

            {item.adminNote && (
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                <h3 className="text-sm font-semibold text-yellow-800 mb-1 flex items-center gap-2">
                  <Tag className="w-4 h-4" /> ประกาศเพิ่มเติมจากแอดมิน
                </h3>
                <p className="text-sm text-yellow-900">{item.adminNote}</p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  ช่องทางติดต่อ {isLost ? 'เจ้าของ' : 'ผู้พบ'}
                </h3>
                <button 
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  {copied ? <span className="text-green-600">คัดลอกลิงก์แล้ว</span> : 'คัดลอกลิงก์'}
                </button>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                {item.status === 'resolved' ? (
                  <p className="text-gray-500 text-center text-sm italic">ซ่อนข้อมูลการติดต่อเนื่องจากรายการถูกปิดแล้ว</p>
                ) : (
                  <p className="text-green-800 font-medium">{item.contact}</p>
                )}
              </div>
            </div>

            {/* User resolve button (if owner or admin) */}
            {isOwner && item.status !== 'resolved' && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">การจัดการประกาศของคุณ</h3>
                <p className="text-sm text-gray-500 mb-4">หาก{isLost ? 'ได้รับของคืนแล้ว' : 'ส่งคืนของให้เจ้าของแล้ว'} คุณสามารถปิดประกาศนี้ได้เลย หรือแก้ไขข้อมูล</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleResolve}
                    disabled={updating}
                    className="flex-1 px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {updating ? 'กำลังปิดรายการ...' : 'ปิดประกาศ (สำเร็จแล้ว)'}
                  </button>
                  <Link
                    to={`/edit/${item.id}`}
                    className="flex-1 px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    แก้ไขประกาศ
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suggestions Section */}
      {suggestions.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-500" />
            รายการที่อาจตรงกับที่คุณตามหา
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map(s => (
              <div 
                key={s.id} 
                onClick={() => navigate(`/item/${s.id}`)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow group flex flex-col"
              >
                <div className="h-40 bg-gray-100 relative overflow-hidden">
                  {s.imageUrl ? (
                    <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50 text-sm">
                      ไม่มีรูปภาพ
                    </div>
                  )}
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
                    s.type === 'lost' 
                      ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                      : 'bg-green-100 text-green-700 border border-green-200'
                  }`}>
                    {s.type === 'lost' ? 'ตามหาของ' : 'เก็บของได้'}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{s.title}</h3>
                  <div className="mt-auto text-sm text-gray-600">
                    <p className="line-clamp-1 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {s.type === 'lost' ? s.location : s.currentLocation || s.location}
                    </p>
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
