import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Item, CATEGORIES } from '../types';
import { Search, MapPin, Calendar, Filter, X, ArrowUpDown, Smartphone, CreditCard, Key, Backpack, Glasses, HelpCircle, AlertCircle, CheckCircle2, User } from 'lucide-react';

export default function ItemsList() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Tab State
  const initialType = (searchParams.get('type') as 'all' | 'lost' | 'found') || 'all';
  const [activeTab, setActiveTab] = useState<'all' | 'lost' | 'found'>(initialType);

  // Filters State
  const initialQ = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || '');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        let q;
        if (activeTab === 'all') {
          q = query(collection(db, 'items'), orderBy('createdAt', sortOrder));
        } else {
          q = query(
            collection(db, 'items'), 
            where('type', '==', activeTab),
            orderBy('createdAt', sortOrder)
          );
        }
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
  }, [activeTab, sortOrder]);

  // Extract unique locations
  const uniqueLocations = Array.from(new Set(items.map(item => item.location))).filter(Boolean);

  const filteredItems = items.filter(item => {
    const searchString = `${item.title} ${item.description} ${item.location} ${item.currentLocation || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    const matchesLocation = selectedLocation ? item.location === selectedLocation : true;
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const hasActiveFilters = Boolean(searchTerm || selectedCategory || selectedLocation);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedLocation('');
    setSearchParams({});
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'อุปกรณ์อิเล็กทรอนิกส์':
        return <Smartphone className="w-8 h-8 text-blue-500" />;
      case 'เอกสาร/บัตร':
        return <CreditCard className="w-8 h-8 text-amber-500" />;
      case 'กุญแจ':
        return <Key className="w-8 h-8 text-emerald-500" />;
      case 'กระเป๋า':
        return <Backpack className="w-8 h-8 text-indigo-500" />;
      case 'แว่นตา':
        return <Glasses className="w-8 h-8 text-purple-500" />;
      default:
        return <HelpCircle className="w-8 h-8 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header & Segmented Tabs */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              ศูนย์รวมรายการสิ่งของ
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              ค้นหาทรัพย์สินที่สูญหาย หรือตรวจสอบรายการที่มีผู้เก็บได้และนำมาส่งมอบ
            </p>
          </div>

          {/* Segmented Control Switcher */}
          <div className="inline-flex bg-slate-200/70 p-1 rounded-2xl shrink-0 self-start sm:self-auto shadow-inner">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setActiveTab('lost')}
              className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'lost'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-slate-600 hover:text-orange-600'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              ตามหาของ
            </button>
            <button
              onClick={() => setActiveTab('found')}
              className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'found'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              เก็บของได้
            </button>
          </div>
        </div>

        {/* Refined Filter Surface */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อสิ่งของ, ลักษณะ, สี, ยี่ห้อ..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-slate-800 placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="relative md:w-52">
            <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-9 pr-7 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white text-slate-700 cursor-pointer appearance-none"
            >
              <option value="">ทุกหมวดหมู่</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
          </div>

          {/* Location Filter */}
          <div className="relative md:w-52">
            <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select 
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full pl-9 pr-7 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white text-slate-700 cursor-pointer appearance-none"
            >
              <option value="">ทุกสถานที่</option>
              {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
          </div>

          {/* Sort Order */}
          <div className="relative md:w-44">
            <ArrowUpDown className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
              className="w-full pl-9 pr-7 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white text-slate-700 cursor-pointer appearance-none"
            >
              <option value="desc">ล่าสุดก่อน</option>
              <option value="asc">เก่าสุดก่อน</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
          </div>

          {/* Reset button if filtered */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          พบทั้งหมด <span className="font-semibold text-slate-800">{filteredItems.length}</span> รายการ
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
            <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-slate-200/80 p-4 space-y-3">
              <div className="bg-slate-100 rounded-xl h-40 w-full" />
              <div className="bg-slate-100 rounded h-4 w-1/3" />
              <div className="bg-slate-100 rounded h-5 w-3/4" />
              <div className="bg-slate-100 rounded h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 p-8 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">ไม่พบข้อมูลที่ตรงกับการค้นหา</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            ลองปรับเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองหมวดหมู่และสถานที่ใหม่อีกครั้ง
          </p>
          {hasActiveFilters ? (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          ) : (
            <button
              onClick={() => navigate('/report/lost')}
              className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-semibold hover:bg-orange-700 transition-colors"
            >
              ลงประกาศแจ้งของหายใหม่
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredItems.map(item => {
            const isLost = item.type === 'lost';
            const isResolved = item.status === 'resolved';

            return (
              <div 
                key={item.id} 
                onClick={() => navigate(`/item/${item.id}`)}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-200 group flex flex-col"
              >
                {/* Image / Thumbnail Container */}
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400 p-4 text-center">
                      <div className="p-3 rounded-2xl bg-white/80 shadow-sm mb-2 group-hover:scale-110 transition-transform">
                        {getCategoryIcon(item.category)}
                      </div>
                      <span className="text-xs text-slate-400 font-medium">รูปถ่ายไม่ระบุ</span>
                    </div>
                  )}

                  {/* Status Indicator */}
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide backdrop-blur-md shadow-sm ${
                      isLost 
                        ? 'bg-orange-500/90 text-white' 
                        : 'bg-emerald-600/90 text-white'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      {isLost ? 'ตามหาของ' : 'พบของ'}
                    </span>
                  </div>

                  {isResolved && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-3 text-center">
                      <span className="bg-white text-slate-900 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg">
                        ✓ ได้รับคืนแล้ว
                      </span>
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div className="p-4 flex-1 flex flex-col">
                  {/* Metadata line */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
                    <span className="font-medium text-slate-600">{item.category}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span>
                      {new Date(item.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 mb-1.5 group-hover:text-orange-600 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed font-normal">
                    {item.description}
                  </p>

                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.type === 'lost' ? item.location : item.currentLocation || item.location}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-medium shrink-0">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        item.isGuest || !item.authorName || item.authorName === 'Guest'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-orange-50 text-orange-700'
                      }`}>
                        {item.isGuest || !item.authorName || item.authorName === 'Guest' ? 'Guest' : item.authorName}
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

