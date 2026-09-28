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
      {/* 1. Hero & Interactive Search Section - Wild West Style */}
      <section className="relative overflow-hidden rounded-3xl bg-[#fdfbf6] border-2 border-amber-900/25 p-6 sm:p-10 text-center shadow-[0_4px_20px_rgba(120,53,15,0.08)]">
        {/* Decorative corner stars */}
        <div className="absolute top-3 left-3 text-amber-900/40 text-xs font-serif select-none">★ ★ ★</div>
        <div className="absolute top-3 right-3 text-amber-900/40 text-xs font-serif select-none">★ ★ ★</div>

        <div className="max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900/10 border border-amber-900/20 text-amber-950 text-[11px] font-western tracking-wider font-bold">
            <span>★</span>
            <span>FRONTIER OUTPOST & LOST PROPERTY</span>
            <span>★</span>
          </div>

          <h1 className="font-western text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-wide text-stone-900 leading-tight">
            กระดานตามหาของหาย <br />
            <span className="font-display font-black text-amber-800 text-2xl sm:text-3xl md:text-4xl tracking-tight">
              WILD WEST BOUNTY BOARD
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-stone-700 max-w-lg mx-auto leading-relaxed font-medium">
            ปักป้ายประกาศล่าของรัก หรือส่งมอบของที่เก็บได้ ณ สำนักงานนายอำเภอ เชื่อมต่อเจ้าของตัวจริงในแดนคาวบอย
          </p>

          {/* Interactive Live Search Bar */}
          <div ref={searchContainerRef} className="relative max-w-xl mx-auto pt-2">
            <form onSubmit={handleSearchSubmit}>
              <div className="flex items-center bg-[#fdfaf2] rounded-2xl border-2 border-amber-900/30 shadow-md p-1.5 focus-within:ring-3 focus-within:ring-amber-200 focus-within:border-amber-800 transition-all">
                <Search className="w-5 h-5 text-amber-800 ml-3 shrink-0" />
                <input
                  type="text"
                  placeholder="ค้นหาตั๋ว ID (TKT-...), ชื่อของหาย, หรือสถานที่ในเมือง..."
                  value={quickSearch}
                  onChange={(e) => {
                    setQuickSearch(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm text-stone-900 bg-transparent outline-none placeholder:text-stone-400 font-medium"
                />
                
                {quickSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuickSearch('');
                      setIsSearchFocused(false);
                    }}
                    className="p-1.5 mr-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200/50 transition-colors cursor-pointer"
                    title="ล้างคำค้นหา"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="submit"
                  className="bg-gradient-to-r from-amber-800 to-stone-900 hover:from-amber-900 hover:to-black active:scale-95 text-amber-100 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all shadow-xs cursor-pointer border border-amber-700/50"
                >
                  ค้นหา
                </button>
              </div>
            </form>

            {/* Live Character & Keyword Matching Dropdown */}
            {isSearchFocused && quickSearch.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#fffefc] rounded-2xl border-2 border-amber-900/30 shadow-xl overflow-hidden z-50 text-left">
                <div className="p-3 bg-[#f6eee2] border-b border-amber-900/20 flex items-center justify-between text-xs text-amber-950 font-bold">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>ผลจับคู่ตั๋ว & คีย์เวิร์ด: "{quickSearch}"</span>
                  </div>
                  <span className="text-[11px] bg-white px-2 py-0.5 rounded-md border border-amber-900/20 text-amber-900 font-bold font-mono">
                    พบ {liveSearchResults.length} รายการ
                  </span>
                </div>

                {liveSearchResults.length > 0 ? (
                  <div className="divide-y divide-amber-900/10 max-h-72 overflow-y-auto">
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
                          className="p-3 hover:bg-amber-50/70 cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-stone-100 overflow-hidden flex items-center justify-center shrink-0 border border-amber-900/20">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                getCategoryIcon(item.category)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-display text-xs font-bold text-stone-900 truncate group-hover:text-amber-900 transition-colors">
                                {item.title}
                              </p>
                              {/* 2-line meta without middle dots */}
                              <div className="text-[11px] text-stone-600 mt-0.5 space-y-0.5">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-amber-800 shrink-0" />
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
                              isLost ? 'bg-rose-100 text-rose-900 border border-rose-200' : 'bg-amber-100 text-amber-900 border border-amber-200'
                            }`}>
                              {isLost ? '★ ตามหา' : '★ รับแจ้งพบ'}
                            </span>
                            {isResolved && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                                คืนแล้ว
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <div className="p-2.5 bg-[#f6eee2] border-t border-amber-900/20 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchFocused(false);
                          navigate(`/list?q=${encodeURIComponent(quickSearch.trim())}`);
                        }}
                        className="text-xs font-bold text-amber-900 hover:text-amber-950 inline-flex items-center cursor-pointer"
                      >
                        เปิดดูผลการค้นหาบนกระดานทั้งหมด ({liveSearchResults.length} รายการ)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center space-y-2">
                    <p className="text-xs font-bold text-stone-800">
                      ไม่พบรายการที่ตรงกับคำค้นหา "{quickSearch}"
                    </p>
                    <p className="text-[11px] text-stone-500">
                      ลองใช้คำอื่น เช่น บัตร, ไอโฟน, กระเป๋า หรือเปิดดูกระดานทั้งหมด
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchFocused(false);
                        navigate('/list');
                      }}
                      className="mt-2 text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors cursor-pointer"
                    >
                      เปิดดูกระดานประกาศทั้งหมด
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick searches chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-xs text-stone-600">
              <span className="text-stone-500 text-[11px]">ยอดนิยม:</span>
              {['บัตรนักศึกษา', 'AirPods', 'กระเป๋าสตางค์', 'กุญแจรถ', 'iPad'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setQuickSearch(tag);
                    navigate(`/list?q=${encodeURIComponent(tag)}`);
                  }}
                  className="px-2.5 py-0.5 rounded-lg bg-white/80 hover:bg-amber-100 border border-amber-900/20 text-stone-800 font-medium text-[11px] transition-all cursor-pointer shadow-2xs"
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
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-800 to-stone-900 hover:from-amber-900 hover:to-black active:scale-95 text-amber-50 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all border border-amber-700/50"
            >
              <HeartHandshake className="w-4 h-4 text-amber-300" />
              <span>+ ปักป้ายตามหาของหาย (Wanted)</span>
            </Link>
            <Link
              to="/report/found"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-amber-50 active:scale-95 text-stone-900 border-2 border-amber-900/30 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm shadow-2xs transition-all"
            >
              <span>⭐ แจ้งมอบของที่พบ (Found)</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Unified Registry Tally Board (แทนการ์ด 3 ใบแยกกัน) */}
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
            {recentItems.map((item) => (
              <ClaimTicketCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
