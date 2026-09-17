import { Link, useNavigate } from 'react-router-dom';
import { Search, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Item } from '../types';

export default function Home() {
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ lost: 0, found: 0, resolved: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentAndStats = async () => {
      try {
        const qRecent = query(collection(db, 'items'), orderBy('createdAt', 'desc'), limit(4));
        const qAll = query(collection(db, 'items'));
        
        const [recentSnapshot, allSnapshot] = await Promise.all([
          getDocs(qRecent),
          getDocs(qAll)
        ]);

        const itemsData = recentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
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

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12 md:py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
          ศูนย์รวมแจ้งของหายและของพบ
        </h1>
        <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto px-4">
          ติดตามทรัพย์สินคืนได้รวดเร็วยิ่งขึ้น ค้นหาง่าย และเชื่อมต่อผู้ทำของหายกับผู้ที่เก็บได้โดยตรง
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 px-4">
          <Link
            to="/report/lost"
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl text-lg font-medium transition-colors"
          >
            <AlertCircle className="w-5 h-5" />
            แจ้งของหาย
          </Link>
          <Link
            to="/report/found"
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl text-lg font-medium transition-colors"
          >
            <CheckCircle2 className="w-5 h-5" />
            แจ้งพบของ
          </Link>
          <Link
            to="/list"
            className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-medium transition-colors"
          >
            <Search className="w-5 h-5" />
            ค้นหาข้อมูล
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-orange-50 border border-orange-100 rounded-3xl p-8 flex items-center justify-between">
          <div>
            <p className="text-orange-900 font-medium mb-1">ตามหาของ</p>
            <h2 className="text-4xl font-bold text-orange-600">{stats.lost}</h2>
          </div>
          <div className="bg-orange-100 p-4 rounded-full">
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-3xl p-8 flex items-center justify-between">
          <div>
            <p className="text-green-900 font-medium mb-1">เก็บของได้</p>
            <h2 className="text-4xl font-bold text-green-600">{stats.found}</h2>
          </div>
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8 flex items-center justify-between">
          <div>
            <p className="text-blue-900 font-medium mb-1">ปิดรายการแล้ว</p>
            <h2 className="text-4xl font-bold text-blue-600">{stats.resolved}</h2>
          </div>
          <div className="bg-blue-100 p-4 rounded-full">
            <CheckCircle2 className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </section>

      {/* Recent Items */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-gray-900">ประกาศล่าสุด</h2>
          <Link to="/list" className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
            ดูทั้งหมด <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl h-64 animate-pulse shadow-sm border border-gray-100"></div>
            ))}
          </div>
        ) : recentItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500">ยังไม่มีประกาศในขณะนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentItems.map((item) => (
              <div 
                key={item.id} 
                onClick={() => navigate(`/item/${item.id}`)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow group flex flex-col"
              >
                <div className="h-40 bg-gray-100 relative overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                      ไม่มีรูปภาพ
                    </div>
                  )}
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
                    item.type === 'lost' 
                      ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                      : 'bg-green-100 text-green-700 border border-green-200'
                  }`}>
                    {item.type === 'lost' ? 'ตามหาของ' : 'เก็บของได้'}
                  </div>
                  {item.status === 'resolved' && (
                     <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                       <span className="bg-gray-900 text-white px-4 py-1.5 rounded-full text-sm font-medium">
                         ได้รับคืนแล้ว
                       </span>
                     </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <p className="text-xs font-medium text-gray-500 mb-1">{item.category}</p>
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{item.title}</h3>
                  <div className="mt-auto space-y-1 text-sm text-gray-600">
                    <p className="line-clamp-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                      {item.type === 'lost' ? item.location : item.currentLocation || item.location}
                    </p>
                    <p className="line-clamp-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                      {new Date(item.date).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
