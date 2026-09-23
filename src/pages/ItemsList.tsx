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
  Smartphone, 
  CreditCard, 
  Key, 
  Backpack, 
  Glasses, 
  HelpCircle, 
  User, 
  Check, 
  Plus,
  Package,
  X
} from 'lucide-react';
import { matchItemWithSearch } from '../utils/searchMatcher';

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
  const [activeTab, setActiveTab] = useState<'all' | 'lost' | 'found' | 'mine'>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'lost' || tabParam === 'found' || tabParam === 'mine') return tabParam;
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
    const tab = searchParams.get('tab');
    if (tab === 'lost' || tab === 'found' || tab === 'all') setActiveTab(tab);
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

  // Filter items
  const filteredItems = items.filter(item => {
    if (activeTab === 'mine') {
      if (!isMyItem(item)) return false;
    } else if (activeTab !== 'all' && item.type !== activeTab) {
      return false;
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

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'อุปกรณ์อิเล็กทรอนิกส์':
        return <Smartphone className="w-6 h-6 text-teal-600" />;
      case 'เอกสาร/บัตร':
        return <CreditCard className="w-6 h-6 text-cyan-600" />;
      case 'กุญแจ':
        return <Key className="w-6 h-6 text-emerald-600" />;
      case 'กระเป๋า':
        return <Backpack className="w-6 h-6 text-indigo-600" />;
      case 'แว่นตา':
        return <Glasses className="w-6 h-6 text-sky-600" />;
      default:
        return <HelpCircle className="w-6 h-6 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Segmented Tabs */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Directory</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              ศูนย์รวมรายการสิ่งของ
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              ค้นหาทรัพย์สินที่สูญหาย หรือตรวจสอบรายการที่มีผู้เก็บได้และนำมาส่งมอบ
            </p>
          </div>

          {/* Segmented Control Switcher */}
          <div className="inline-flex bg-teal-50/80 p-1.5 rounded-2xl shrink-0 self-start sm:self-auto border border-teal-100">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-teal-950 shadow-xs'
                  : 'text-slate-600 hover:text-teal-900'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setActiveTab('lost')}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'lost'
                  ? 'bg-white text-amber-600 shadow-xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              ตามหาของ
            </button>
            <button
              onClick={() => setActiveTab('found')}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'found'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-teal-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              พบของ
            </button>
            <button
              onClick={() => setActiveTab('mine')}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 active:scale-95 ${
                activeTab === 'mine'
                  ? 'bg-white text-teal-950 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-teal-900'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-teal-600" />
              ประกาศของฉัน
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-3xl border border-teal-100/80 shadow-xs flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-500" />
            <input
              type="text"
              placeholder="ค้นหาชื่อของ รายละเอียด ตัวอักษร หรือคำสำคัญ (เช่น บัตร, ไอโฟน, กุญแจ)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-800 placeholder:text-slate-400"
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
          {filteredItems.map((item) => {
            const isLost = item.type === 'lost';
            const isResolved = item.status === 'resolved';

            return (
              <div 
                key={item.id} 
                onClick={() => navigate(`/item/${item.id}`)}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden cursor-pointer hover:shadow-lg hover:border-teal-200 hover:-translate-y-0.5 transition-all group flex flex-col"
              >
                {/* Visual Thumbnail */}
                <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#f8fcfb] to-[#eef9f6] text-teal-600 p-4 text-center">
                      <div className="p-3.5 rounded-2xl bg-white shadow-xs border border-teal-100/80 mb-2">
                        {getCategoryIcon(item.category)}
                      </div>
                      <span className="text-xs text-slate-400 font-medium">รูปถ่ายไม่ระบุ</span>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide backdrop-blur-md shadow-xs ${
                      isLost 
                        ? 'bg-amber-500/90 text-white' 
                        : 'bg-teal-600/90 text-white'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      {isLost ? 'ตามหาของ' : 'พบของ'}
                    </span>
                  </div>

                  {isResolved && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-3 text-center">
                      <span className="bg-white text-emerald-800 px-4 py-1.5 rounded-full text-xs font-extrabold shadow-lg flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> ได้รับคืนแล้ว
                      </span>
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col">
                  {/* Metadata line */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
                    <span className="font-semibold text-teal-700">{item.category}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span>
                      {new Date(item.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 mb-1.5 group-hover:text-teal-700 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed font-normal">
                    {item.description}
                  </p>

                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="truncate">{item.type === 'lost' ? item.location : item.currentLocation || item.location}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-medium shrink-0">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="font-bold text-slate-700 truncate max-w-[90px]" title={item.authorName || 'Guest'}>
                        {item.authorName || 'Guest'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
