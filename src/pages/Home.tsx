import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  ArrowRight, 
  MapPin, 
  Calendar, 
  HelpCircle, 
  Key, 
  Smartphone, 
  CreditCard, 
  Backpack, 
  Glasses, 
  User,
  Plus,
  HeartHandshake,
  CheckCircle2,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { useEffect, useState, FormEvent } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Item } from '../types';

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
    <div className="space-y-10">
      {/* Friendly, Clean Dental Theme Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-[#f0fbf8] to-[#e6f7f3] border border-teal-100 shadow-sm p-6 sm:p-10 md:p-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white text-teal-800 border border-teal-200 shadow-xs mb-4">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            ศูนย์แจ้งของหายและส่งคืนของพบ มหาวิทยาลัย
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight mb-3">
            ตามหาสิ่งของที่รัก <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              ส่งต่อรอยยิ้มในการรับคืน
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 mb-6 max-w-xl mx-auto leading-relaxed">
            แพลตฟอร์มศูนย์กลางเชื่อมโยงผู้ทำของหายและผู้เก็บของได้ เพื่อความปลอดภัย รวดเร็ว และคืนสู่เจ้าของตัวจริง
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-lg mx-auto mb-6">
            <div className="flex items-center bg-white rounded-2xl border border-teal-200 shadow-xs p-1.5 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all">
              <Search className="w-5 h-5 text-teal-500 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="ค้นหาชื่อของ เช่น บัตรนักศึกษา, กระเป๋าสตางค์, AirPods..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm text-slate-800 bg-transparent outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all shadow-xs"
              >
                ค้นหา
              </button>
            </div>

            {/* Quick searches */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-xs text-slate-500">
              <span className="text-slate-400">คำค้นหายอดนิยม:</span>
              {['บัตรนักศึกษา', 'กระเป๋าสตางค์', 'AirPods', 'กุญแจรถ', 'iPad'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => navigate(`/list?q=${encodeURIComponent(tag)}`)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-teal-50 border border-teal-100 text-slate-700 font-medium transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </form>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/report/lost"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-sm transition-all"
            >
              <HeartHandshake className="w-4 h-4 text-cyan-200" />
              <span>+ ลงประกาศสิ่งของ</span>
            </Link>
            <Link
              to="/list"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-teal-200 px-6 py-3 rounded-2xl font-bold text-sm shadow-xs transition-all"
            >
              <span>ดูรายการทั้งหมด</span>
              <ArrowRight className="w-4 h-4 text-teal-600" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Lost Stat */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">กำลังตามหา</span>
            <div className="text-3xl font-extrabold text-slate-900 font-mono mt-1">{stats.lost}</div>
            <p className="text-xs text-amber-700 font-medium mt-0.5">ของที่เจ้าของกำลังเฝ้ารอ</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold">
            !
          </div>
        </div>

        {/* Found Stat */}
        <div className="bg-white rounded-2xl p-5 border border-teal-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">เก็บของได้</span>
            <div className="text-3xl font-extrabold text-teal-900 font-mono mt-1">{stats.found}</div>
            <p className="text-xs text-teal-700 font-medium mt-0.5">รอเจ้าของมาติดต่อรับคืน</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center font-bold">
            ✓
          </div>
        </div>

        {/* Resolved Stat */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">ส่งคืนสำเร็จแล้ว</span>
            <div className="text-3xl font-extrabold text-emerald-900 font-mono mt-1">{stats.resolved}</div>
            <p className="text-xs text-emerald-700 font-medium mt-0.5">ได้รับของคืนสู่เจ้าของแล้ว</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
            ★
          </div>
        </div>
      </section>

      {/* Recent Items Section */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">อัปเดตล่าสุด</span>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">ประกาศล่าสุดในมหาวิทยาลัย</h2>
          </div>
          <Link
            to="/list"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-teal-700 hover:text-teal-800 transition-colors"
          >
            <span>ดูทั้งหมด ({recentItems.length}+ รายการ)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-slate-200 p-4 space-y-3">
                <div className="bg-slate-100 rounded-xl h-40 w-full" />
                <div className="bg-slate-100 rounded h-4 w-1/3" />
                <div className="bg-slate-100 rounded h-5 w-3/4" />
                <div className="bg-slate-100 rounded h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : recentItems.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-teal-200 p-8">
            <h3 className="text-base font-bold text-slate-800 mb-1">ยังไม่มีประกาศสิ่งของในขณะนี้</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed">
              คุณสามารถเป็นคนแรกที่ลงประกาศแจ้งของหาย หรือแจ้งพบของเพื่อช่วยเหลือเพื่อนในมหาวิทยาลัยได้ทันที
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/report/lost" className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs">
                แจ้งของหาย
              </Link>
              <Link to="/report/found" className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-xs">
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
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden cursor-pointer hover:shadow-md hover:border-teal-200 hover:-translate-y-0.5 transition-all group flex flex-col"
                >
                  {/* Thumbnail */}
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
                        <div className="p-3.5 rounded-2xl bg-white shadow-xs border border-teal-100 mb-2">
                          {getCategoryIcon(item.category)}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">รูปถ่ายไม่ระบุ</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs ${
                        isLost 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-teal-600 text-white'
                      }`}>
                        {isLost ? 'ตามหาของ' : 'พบของ'}
                      </span>
                    </div>

                    {isResolved && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center p-3 text-center">
                        <span className="bg-white text-emerald-800 px-3 py-1 rounded-full text-xs font-bold shadow">
                          ✓ ได้รับคืนแล้ว
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                      <span className="font-semibold text-teal-700">{item.category}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>
                        {new Date(item.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 mb-1.5 group-hover:text-teal-700 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="mt-auto pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <div className="flex items-center gap-1 truncate max-w-[130px]">
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
      </section>
    </div>
  );
}
