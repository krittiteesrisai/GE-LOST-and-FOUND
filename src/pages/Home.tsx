import { useState, useEffect, useMemo, useRef, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Smartphone, 
  CreditCard, 
  Key, 
  Backpack, 
  HeartHandshake, 
  Sparkles,
  Package,
  X,
  BookOpen,
  Gem,
  HelpCircle,
  Tag
} from 'lucide-react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Item } from '../types';
import { useMyItems } from '../hooks/useMyItems';
import { matchItemWithSearch } from '../utils/searchMatcher';
import { RegistryTallyBoard } from '../components/RegistryTallyBoard';
import { ClaimTicketCard } from '../components/ClaimTicketCard';

export default function Home() {
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ lost: 0, found: 0, resolved: 0 });
  const [quickSearch, setQuickSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();
  const { items: myItems } = useMyItems();

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch all items for fast client-side character matching, dashboard stats & recent list
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const qAll = query(collection(db, 'items'));
        const allSnapshot = await getDocs(qAll);
        
        const itemsList: Item[] = [];
        let lost = 0;
        let found = 0;
        let resolved = 0;

        allSnapshot.forEach((doc) => {
          const data = { id: doc.id, ...(doc.data() as object) } as Item;
          itemsList.push(data);
          if (data.status === 'resolved') {
            resolved++;
          } else {
            if (data.type === 'lost') lost++;
            if (data.type === 'found') found++;
          }
        });

        // Sort items by date desc
        itemsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setAllItems(itemsList);
        setStats({ lost, found, resolved });
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // Real-time character & keyword matching as user types
  const liveSearchResults = useMemo(() => {
    const queryTerm = quickSearch.trim();
    if (!queryTerm) return [];

    return allItems
      .map(item => ({ item, match: matchItemWithSearch(item, queryTerm) }))
      .filter(({ match }) => match.isMatch)
      .sort((a, b) => b.match.score - a.match.score)
      .map(({ item }) => item);
  }, [allItems, quickSearch]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/list?q=${encodeURIComponent(quickSearch.trim())}`);
    } else {
      navigate('/list');
    }
  };

  const getCategoryIcon = (cat: string) => {
    if (cat.includes('อิเล็กทรอนิกส์')) return <Smartphone className="w-5 h-5 text-teal-600" />;
    if (cat.includes('บัตร')) return <CreditCard className="w-5 h-5 text-cyan-600" />;
    if (cat.includes('กุญแจ')) return <Key className="w-5 h-5 text-emerald-600" />;
    if (cat.includes('กระเป๋า')) return <Backpack className="w-5 h-5 text-indigo-600" />;
    if (cat.includes('หนังสือ') || cat.includes('เรียน') || cat.includes('เอกสาร')) return <BookOpen className="w-5 h-5 text-amber-600" />;
    if (cat.includes('เครื่องประดับ')) return <Gem className="w-5 h-5 text-rose-600" />;
    return <HelpCircle className="w-5 h-5 text-slate-500" />;
  };

  // Recent items to display on the main page (top 8)
  const recentItems = allItems.slice(0, 8);

  return (
    <div className="space-y-8 sm:space-y-10 max-w-5xl mx-auto pb-10">
      {/* 1. Hero & Interactive Search Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-teal-50/40 to-teal-100/30 border border-teal-100 p-6 sm:p-10 text-center shadow-xs">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/80 border border-teal-200 text-teal-800 text-xs font-semibold">
            <span>🎒</span>
            <span>ศูนย์กลางรับแจ้งของหายและพบของภายในมหาวิทยาลัย</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            กระดานตามหาของหาย <br />
            <span className="bg-gradient-to-r from-teal-800 via-teal-600 to-cyan-700 bg-clip-text text-transparent">
              ส่งต่อรอยยิ้มในการรับคืน
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            ค้นหาทรัพย์สินที่สูญหาย หรือแจ้งมอบสิ่งของที่เก็บได้ ติดตามสถานะตั๋ว ID และเชื่อมต่อเจ้าของตัวจริง
          </p>

          {/* Interactive Live Search Bar */}
          <div ref={searchContainerRef} className="relative max-w-xl mx-auto pt-2">
            <form onSubmit={handleSearchSubmit}>
              <div className="flex items-center bg-white rounded-2xl border-2 border-teal-200 shadow-md p-1.5 focus-within:ring-3 focus-within:ring-teal-100 focus-within:border-teal-600 transition-all">
                <Search className="w-5 h-5 text-teal-600 ml-3 shrink-0" />
                <input
                  type="text"
                  placeholder="ค้นหาตั๋ว ID (TKT-...), ชื่อของหาย, สถานที่, หรือประเภทสิ่งของ..."
                  value={quickSearch}
                  onChange={(e) => {
                    setQuickSearch(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm text-slate-800 bg-transparent outline-none placeholder:text-slate-400"
                />
                
                {quickSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuickSearch('');
                      setIsSearchFocused(false);
                    }}
                    className="p-1.5 mr-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                    title="ล้างคำค้นหา"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 active:scale-95 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all shadow-xs cursor-pointer"
                >
                  ค้นหา
                </button>
              </div>
            </form>

            {/* Live Character & Keyword Matching Dropdown */}
            {isSearchFocused && quickSearch.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-teal-100 shadow-xl overflow-hidden z-50 text-left">
                <div className="p-3 bg-teal-50/80 border-b border-teal-100 flex items-center justify-between text-xs text-teal-900 font-bold">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    <span>ผลจับคู่คำค้นหา: "{quickSearch}"</span>
                  </div>
                  <span className="text-[11px] bg-white px-2 py-0.5 rounded-md border border-teal-200 text-teal-700 font-bold font-mono">
                    พบ {liveSearchResults.length} รายการ
                  </span>
                </div>

                {liveSearchResults.length > 0 ? (
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {liveSearchResults.slice(0, 6).map((item) => {
                      const isLost = item.type === 'lost';
                      const isResolved = item.status === 'resolved';

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setIsSearchFocused(false);
                            navigate(`/item/${item.id}`);
                          }}
                          className="p-3 hover:bg-teal-50/50 cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                getCategoryIcon(item.category)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-display text-xs font-bold text-slate-800 truncate group-hover:text-teal-700 transition-colors">
                                {item.title}
                              </p>
                              {/* 2-line meta without middle dots */}
                              <div className="text-[11px] text-slate-500 mt-0.5 space-y-0.5">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                                  <span className="truncate">{item.location}</span>
                                </div>
                                <div className="flex items-center gap-1 text-stone-500">
                                  <Tag className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{item.category}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isLost ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-teal-100 text-teal-900 border border-teal-200'
                            }`}>
                              {isLost ? 'กำลังตามหา' : 'รับแจ้งพบ'}
                            </span>
                            {isResolved && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                                ส่งคืนแล้ว
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchFocused(false);
                          navigate(`/list?q=${encodeURIComponent(quickSearch.trim())}`);
                        }}
                        className="text-xs font-bold text-teal-800 hover:text-teal-950 inline-flex items-center cursor-pointer"
                      >
                        เปิดดูผลการค้นหาบนกระดานทั้งหมด ({liveSearchResults.length} รายการ)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center space-y-2">
                    <p className="text-xs font-bold text-slate-700">
                      ไม่พบรายการที่ตรงกับคำค้นหา "{quickSearch}"
                    </p>
                    <p className="text-[11px] text-slate-400">
                      ลองใช้คำอื่น เช่น บัตร, ไอโฟน, กระเป๋า หรือเปิดดูกระดานทั้งหมด
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchFocused(false);
                        navigate('/list');
                      }}
                      className="mt-2 text-xs font-bold px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 transition-colors cursor-pointer"
                    >
                      เปิดดูกระดานประกาศทั้งหมด
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick searches chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-xs text-slate-500">
              <span className="text-slate-400 text-[11px]">ยอดนิยม:</span>
              {['บัตรนักศึกษา', 'AirPods', 'กระเป๋าสตางค์', 'กุญแจรถ', 'iPad'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setQuickSearch(tag);
                    navigate(`/list?q=${encodeURIComponent(tag)}`);
                  }}
                  className="px-2.5 py-0.5 rounded-lg bg-white hover:bg-teal-50 border border-teal-100 text-slate-700 font-medium text-[11px] transition-all cursor-pointer shadow-2xs"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/report/lost"
              className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all"
            >
              <HeartHandshake className="w-4 h-4 text-rose-200" />
              <span>แจ้งของหาย</span>
            </Link>
            <Link
              to="/report/found"
              className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all"
            >
              <span>แจ้งพบของ</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Unified Registry Tally Board */}
      <section className="space-y-3.5">
        <RegistryTallyBoard stats={stats} />

        {/* Clean status bar for user posts (No trailing arrows) */}
        {myItems.length > 0 && (
          <div className="bg-stone-900 text-white rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <Package className="w-4 h-4 text-teal-300 shrink-0" />
              <p className="text-xs font-semibold">
                คุณมีประกาศสิ่งของทั้งหมด <strong className="text-white font-bold">{myItems.length}</strong> รายการที่กำลังติดตาม
              </p>
            </div>
            <Link
              to="/my-posts"
              className="text-xs font-bold text-stone-900 bg-white hover:bg-stone-100 px-3.5 py-1.5 rounded-xl transition-all self-start sm:self-auto inline-flex items-center gap-1 shadow-2xs"
            >
              <span>เปิดดูประกาศของฉัน</span>
            </Link>
          </div>
        )}
      </section>

      {/* 3. รายการสิ่งของล่าสุดในทรง "ตั๋วเคลม" (Claim Ticket Cards) */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              รายการสิ่งของล่าสุด
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ตั๋วบันทึกของหายและพบของล่าสุดในระบบ คลิกที่ตั๋วเพื่อดูรายละเอียดและติดต่อ
            </p>
          </div>
          <Link
            to="/list"
            className="inline-flex items-center text-xs font-bold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100/80 px-3.5 py-1.5 rounded-xl transition-all"
          >
            <span>ดูทั้งหมด ({allItems.length})</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-stone-200 p-4 space-y-3">
                <div className="bg-stone-100 rounded-xl h-36 w-full" />
                <div className="bg-stone-100 rounded h-4 w-1/3" />
                <div className="bg-stone-100 rounded h-4 w-3/4" />
                <div className="bg-stone-100 rounded h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : recentItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-stone-300 p-8">
            <h3 className="font-display text-base font-bold text-slate-800 mb-1">ยังไม่มีประกาศสิ่งของในระบบ</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              คุณสามารถเป็นคนแรกที่ลงประกาศแจ้งของหาย หรือแจ้งพบของเพื่อช่วยเหลือเพื่อนในมหาวิทยาลัย
            </p>
            <Link to="/report/lost" className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs">
              + ลงประกาศสิ่งของ
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recentItems.map((item, idx) => (
              <ClaimTicketCard 
                key={item.id} 
                item={item} 
                animationDelay={Math.min(idx * 70, 500)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
