import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Item, MentionedItemSummary } from '../types';
import { useAuth } from '../context/AuthContext';
import { Search, X, Package, MapPin, Calendar, Check, ExternalLink } from 'lucide-react';

interface MentionItemPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (item: MentionedItemSummary) => void;
}

export function MentionItemPickerModal({ isOpen, onClose, onSelectItem }: MentionItemPickerModalProps) {
  const { user, effectiveUser } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'mine'>('all');

  const activeUid = effectiveUser?.uid || user?.uid;
  const activeEmail = effectiveUser?.email || user?.email;
  const localMyItems: string[] = JSON.parse(localStorage.getItem('myItems') || '[]');

  const isMyItem = (item: Item) => {
    if (item.id && localMyItems.includes(item.id)) return true;
    if (activeUid && item.authorId === activeUid) return true;
    if (activeEmail && item.authorEmail === activeEmail) return true;
    return false;
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchAllItems = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'items'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data: Item[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Item));
        setItems(data);
      } catch (err) {
        console.error('Error fetching items for mention picker:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllItems();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredItems = items.filter(item => {
    if (tab === 'mine' && !isMyItem(item)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  });

  const handleSelect = (item: Item) => {
    if (!item.id) return;
    const summary: MentionedItemSummary = {
      id: item.id,
      title: item.title,
      type: item.type,
      category: item.category,
      imageUrl: item.imageUrl,
      status: item.status,
      location: item.location,
      date: item.date
    };
    onSelectItem(summary);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                เลือกประกาศที่ต้องการแนบ
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              เลือกสิ่งของหรือประกาศเพื่อแนบส่งให้เจ้าหน้าที่
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Tabs Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 space-y-3 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="ค้นหาชื่อของ, หมวดหมู่, หรือสถานที่..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tab === 'all'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ประกาศทั้งหมด ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('mine')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                tab === 'mine'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>ประกาศของฉัน ({items.filter(isMyItem).length})</span>
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 divide-y divide-slate-100/80">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              กำลังโหลดรายการสิ่งของ...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Package className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">ไม่พบประกาศที่ค้นหา</p>
              <p className="text-[11px] text-slate-400">ลองเปลี่ยนคำค้นหา หรือตรวจสอบในแท็บประกาศทั้งหมด</p>
            </div>
          ) : (
            filteredItems.map(item => {
              const isLost = item.type === 'lost';
              const isResolved = item.status === 'resolved';

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-teal-50/70 border border-transparent hover:border-teal-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 shrink-0 overflow-hidden flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">{isLost ? '🔍' : '📦'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isLost ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                        }`}>
                          {isLost ? 'ตามหา' : 'พบของ'}
                        </span>
                        {isResolved && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ส่งคืนแล้ว
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-slate-500 truncate">
                          {item.category}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-teal-800 transition-colors mt-0.5">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.location}
                        </span>
                        <span>·</span>
                        <span className="truncate">{item.date}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="shrink-0 px-3 py-1.5 bg-teal-50 text-teal-700 font-bold text-xs rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-all shadow-2xs"
                  >
                    เลือก
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500">
          เมื่อเลือกแล้ว ระบบจะแนบข้อมูลประกาศนี้ไปพร้อมกับข้อความที่คุณส่ง
        </div>
      </div>
    </div>
  );
}
