import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Item, CATEGORIES } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  MapPin, 
  ArrowUpDown, 
  Package,
  X
} from 'lucide-react';
import { matchItemWithSearch } from '../utils/searchMatcher';
import { ClaimTicketCard } from '../components/ClaimTicketCard';

export default function ItemsList() {
  const { user, effectiveUser } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeUid = effectiveUser?.uid || user?.uid;
  const activeEmail = effectiveUser?.email || user?.email;
  const localMyItems: string[] = JSON.parse(localStorage.getItem('myItems') || '[]');

  const isMyItem = (item: Item) => {
    if (item.id && localMyItems.includes(item.id)) return true;
    if (activeUid && item.authorId === activeUid) return true;
    if (activeEmail && item.authorEmail === activeEmail) return true;
    return false;
  };

  // Filters State
  const [activeTab, setActiveTab] = useState<'all' | 'lost' | 'found' | 'resolved' | 'mine'>(() => {
    const tabParam = searchParams.get('tab') || searchParams.get('type');
    if (tabParam === 'lost' || tabParam === 'found' || tabParam === 'resolved' || tabParam === 'mine') return tabParam;
    return 'all';
  });

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || '');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Keep query params in sync
  useEffect(() => {
    const query = searchParams.get('q');
    if (query !== null) setSearchTerm(query);
    const tab = searchParams.get('tab') || searchParams.get('type');
    if (tab === 'lost' || tab === 'found' || tab === 'resolved' || tab === 'mine' || tab === 'all') {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'items'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const itemsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Item));
        setItems(itemsData);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Switch tabs and update URL
  const handleTabChange = (newTab: 'all' | 'lost' | 'found' | 'resolved' | 'mine') => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams);
    if (newTab === 'all') {
      params.delete('tab');
      params.delete('type');
    } else {
      params.set('tab', newTab);
      params.delete('type');
    }
    setSearchParams(params);
  };

  // Filter items
  const filteredItems = items.filter(item => {
    if (activeTab === 'mine') {
      if (!isMyItem(item)) return false;
    } else if (activeTab === 'resolved') {
      if (item.status !== 'resolved') return false;
    } else if (activeTab === 'lost' || activeTab === 'found') {
      if (item.type !== activeTab) return false;
    }
    if (selectedCategory && item.category !== selectedCategory) {
      return false;
    }
    if (selectedLocation && item.location !== selectedLocation && item.currentLocation !== selectedLocation) {
      return false;
    }
    if (searchTerm.trim()) {
      const matchResult = matchItemWithSearch(item, searchTerm);
      if (!matchResult.isMatch) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => {
    // If user is searching, prioritize highest match score first!
    if (searchTerm.trim()) {
      const scoreA = matchItemWithSearch(a, searchTerm).score;
      const scoreB = matchItemWithSearch(b, searchTerm).score;
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
    }
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const uniqueLocations = Array.from(new Set(items.map(i => i.location).filter(Boolean)));

  const handleResetFilters = () => {
    setActiveTab('all');
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedLocation('');
    setSortOrder('desc');
    setSearchParams({});
  };

  const hasActiveFilters = activeTab !== 'all' || !!searchTerm || !!selectedCategory || !!selectedLocation;

  return (
    <div className="space-y-8">
      {/* Header & Segmented Tabs */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-western text-amber-900 font-bold uppercase tracking-wider mb-1">
              <span>★</span>
              <span>FRONTIER BOUNTY & NOTICE BOARD</span>
              <span>★</span>
            </div>
            <h1 className="font-western text-2xl sm:text-3xl font-black tracking-wide text-stone-900">
              กระดานประกาศแดนคาวบอย
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 font-medium">
              ตรวจสอบรายการประกาศตามล่าของหาย (Wanted) หรือทรัพย์สินที่ฝากไว้กับนายอำเภอ
            </p>
          </div>

          {/* Segmented Control Switcher - Wild West */}
          <div className="inline-flex bg-[#f2e7d5] p-1.5 rounded-2xl shrink-0 self-start sm:self-auto border-2 border-amber-900/25 flex-wrap gap-1">
            <button
              onClick={() => handleTabChange('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-stone-900 shadow-xs font-black'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => handleTabChange('lost')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'lost'
                  ? 'bg-rose-900 text-rose-50 shadow-xs font-black'
                  : 'text-rose-900 hover:bg-rose-100/50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              ★ ตามล่า (WANTED)
            </button>
            <button
              onClick={() => handleTabChange('found')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'found'
                  ? 'bg-amber-900 text-amber-100 shadow-xs font-black'
                  : 'text-amber-950 hover:bg-amber-100/50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              ★ ฝากอำเภอ (FOUND)
            </button>
            <button
              onClick={() => handleTabChange('resolved')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'resolved'
                  ? 'bg-emerald-900 text-emerald-100 shadow-xs font-black'
                  : 'text-emerald-900 hover:bg-emerald-100/50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              ✓ คืนแล้ว
            </button>
            <button
              onClick={() => handleTabChange('mine')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'mine'
                  ? 'bg-stone-900 text-amber-200 shadow-xs font-black'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-amber-600" />
              ของฉัน
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-[#fefdfa] p-4 rounded-3xl border-2 border-amber-900/20 shadow-xs flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-800" />
            <input
              type="text"
              placeholder="ค้นหาตั๋ว ID, ชื่อของ, หรือคีย์เวิร์ดสำคัญ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-2xl border border-amber-900/20 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-amber-700 focus:border-amber-800 outline-none text-stone-900 placeholder:text-stone-400 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="ล้างคำค้นหา"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="relative md:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-3.5 pr-8 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white text-slate-700 cursor-pointer appearance-none"
            >
              <option value="">ทุกหมวดหมู่</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
          </div>

          {/* Location Filter */}
          <div className="relative md:w-52">
            <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-500 pointer-events-none" />
            <select 
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white text-slate-700 cursor-pointer appearance-none"
            >
              <option value="">ทุกสถานที่</option>
              {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
          </div>

          {/* Sort Order */}
          <div className="relative md:w-44">
            <ArrowUpDown className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-500 pointer-events-none" />
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
              className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white text-slate-700 cursor-pointer appearance-none"
            >
              <option value="desc">ล่าสุดก่อน</option>
              <option value="asc">เก่าสุดก่อน</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors shrink-0"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>

        {/* Live Search & Matching Indicator */}
        {searchTerm && (
          <div className="mt-3 flex items-center justify-between gap-2 text-xs bg-teal-50 border border-teal-200/80 px-4 py-2.5 rounded-2xl text-teal-900 shadow-2xs">
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="truncate">
                กำลังจับคู่ตัวอักษรและคำค้น: <strong className="font-bold underline decoration-teal-400">"{searchTerm}"</strong>
                <span className="ml-2 font-semibold text-teal-700">
                  (ค้นพบ {filteredItems.length} รายการที่ตรงกัน)
                </span>
              </span>
            </div>
            <button
              onClick={() => setSearchTerm('')}
              className="text-[11px] font-bold text-teal-700 hover:text-teal-900 bg-teal-100/70 hover:bg-teal-200/70 px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              ล้างคำค้นหา
            </button>
          </div>
        )}
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          พบทั้งหมด <span className="font-bold text-teal-900">{filteredItems.length}</span> รายการ
          {hasActiveFilters && ' (จากการกรองข้อมูล)'}
        </span>
        <span className="text-[11px] text-slate-400">
          คลิกที่รายการเพื่อดูรายละเอียดและข้อมูลติดต่อ
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white rounded-3xl h-72 animate-pulse border border-slate-200/80 p-4 space-y-3">
              <div className="bg-slate-100 rounded-2xl h-40 w-full" />
              <div className="bg-slate-100 rounded h-4 w-1/3" />
              <div className="bg-slate-100 rounded h-5 w-3/4" />
              <div className="bg-slate-100 rounded h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-teal-100 p-8 shadow-xs">
          <p className="text-base font-bold text-slate-800 mb-1">ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา</p>
          <p className="text-xs text-slate-500 mb-4">ลองปรับคำค้นหา หรือเลือกหมวดหมู่อื่นดูอีกครั้ง</p>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-xs hover:bg-teal-700"
            >
              แสดงรายการทั้งหมด
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredItems.map((item) => (
            <ClaimTicketCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
