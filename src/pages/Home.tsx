import { Link, useNavigate } from 'react-router-dom';
import { Search, AlertCircle, CheckCircle2, ArrowRight, Sparkles, MapPin, Calendar, Tag, ShieldCheck, HelpCircle, Key, Smartphone, CreditCard, Backpack, Laptop, Glasses, User } from 'lucide-react';
import { useEffect, useState, FormEvent } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Item, CATEGORIES } from '../types';

export default function Home() {
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ lost: 0, found: 0, resolved: 0 });
  const [quickSearch, setQuickSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentAndStats = async () => {
      try {
        const qRecent = query(collection(db, 'items'), orderBy('createdAt', 'desc'), limit(8));
        const qAll = query(collection(db, 'items'));
        
        const [recentSnapshot, allSnapshot] = await Promise.all([
          getDocs(qRecent),
          getDocs(qAll)
        ]);

        const itemsData = recentSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Item));
        setRecentItems(itemsData);

        let lost = 0;
        let found = 0;
        let resolved = 0;

        allSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'resolved') {
            resolved++;
          } else {
            if (data.type === 'lost') lost++;
            if (data.type === 'found') found++;
          }
        });
        setStats({ lost, found, resolved });

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentAndStats();
  }, []);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/list?q=${encodeURIComponent(quickSearch.trim())}`);
    } else {
      navigate('/list');
    }
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
    <div className="space-y-12">
      {/* Modern Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white via-slate-50/80 to-orange-50/30 border border-slate-200/90 shadow-sm p-6 sm:p-12 md:p-16">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-orange-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-3" style={{ textWrap: 'balance' }}>
            ศูนย์รวมแจ้งของหายและเก็บของได้
          </h1>

          <p className="text-sm sm:text-base text-slate-500 mb-8 max-w-xl mx-auto">
            ค้นหารายการสิ่งของที่สูญหาย หรือลงประกาศเพื่อส่งคืนเจ้าของ
          </p>

          {/* Quick Embedded Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto mb-6">
            <div className="flex items-center bg-white rounded-2xl border border-slate-300 shadow-sm p-1.5 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-all">
              <Search className="w-5 h-5 text-slate-400 ml-3.5 shrink-0" />
              <input
                type="text"
                placeholder="ค้นหาชื่อสิ่งของ เช่น กระเป๋าสตางค์, บัตรนักศึกษา, กุญแจหอพัก..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-transparent outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shrink-0 transition-colors shadow-sm"
              >
                ค้นหา
              </button>
            </div>

            {/* Quick search tags */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-xs text-slate-500">
              <span className="font-medium text-slate-400">คำค้นหายอดนิยม:</span>
              {['บัตรนักศึกษา', 'กระเป๋าสตางค์', 'หูฟัง', 'กุญแจรถ', 'ไอแพด'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => navigate(`/list?q=${encodeURIComponent(tag)}`)}
                  className="px-2.5 py-1 rounded-lg bg-white/80 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </form>

          {/* Clear Distinct Actions: ลงประกาศ vs ดูรายการทั้งหมด */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/report/lost"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-all"
            >
              <span>+ ลงประกาศสิ่งของ</span>
            </Link>
            <Link
              to="/list"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-6 py-3 rounded-xl font-semibold text-sm shadow-xs transition-all"
            >
              <span>ดูรายการทั้งหมด</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* Modern Live Stats Grid */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {/* Lost Stat */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">กำลังตามหา</span>
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tabular-nums">
                {stats.lost}
              </span>
              <span className="text-xs text-slate-500 font-medium">รายการ</span>
            </div>
            <p className="text-xs text-orange-600/90 font-medium mt-2">ของที่เจ้าของกำลังเฝ้ารอ</p>
          </div>

          {/* Found Stat */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">เก็บของได้</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tabular-nums">
                {stats.found}
              </span>
              <span className="text-xs text-slate-500 font-medium">รายการ</span>
            </div>
            <p className="text-xs text-emerald-600/90 font-medium mt-2">รอเจ้าของมาติดต่อรับคืน</p>
          </div>

          {/* Resolved Stat */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ส่งคืนสำเร็จแล้ว</span>
              <ShieldCheck className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tabular-nums">
                {stats.resolved}
              </span>
              <span className="text-xs text-slate-500 font-medium">รายการ</span>
            </div>
            <p className="text-xs text-blue-600/90 font-medium mt-2">ได้รับของคืนสู่เจ้าของแล้ว</p>
          </div>
        </div>
      </section>

      {/* Recent Items Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">ประกาศล่าสุดในมหาวิทยาลัย</h2>
            <p className="text-sm text-slate-500">อัปเดตสิ่งของที่หายและพบใหม่ล่าสุดแบบเรียลไทม์</p>
          </div>
          <Link
            to="/list"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
          >
            <span>ดูทั้งหมด ({recentItems.length}+ รายการ)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-slate-200/70 p-4 space-y-3">
                <div className="bg-slate-100 rounded-xl h-40 w-full" />
                <div className="bg-slate-100 rounded h-4 w-1/3" />
                <div className="bg-slate-100 rounded h-5 w-3/4" />
                <div className="bg-slate-100 rounded h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : recentItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">ยังไม่มีประกาศสิ่งของในขณะนี้</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-5">
              คุณสามารถเป็นคนแรกที่ลงประกาศแจ้งของหาย หรือแจ้งพบของเพื่อช่วยเหลือเพื่อนในมหาวิทยาลัยได้เลย
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/report/lost" className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold">
                แจ้งของหาย
              </Link>
              <Link to="/report/found" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                แจ้งพบของ
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recentItems.map((item) => {
              const isLost = item.type === 'lost';
              const isResolved = item.status === 'resolved';

              return (
                <div 
                  key={item.id} 
                  onClick={() => navigate(`/item/${item.id}`)}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-200 group flex flex-col"
                >
                  {/* Card Visual / Thumbnail */}
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

                    {/* Status Badge */}
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

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    {/* Metadata line without clunky pills */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
                      <span className="font-medium text-slate-600">{item.category}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>
                        {new Date(item.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 mb-2 group-hover:text-orange-600 transition-colors">
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
      </section>
    </div>
  );
}

