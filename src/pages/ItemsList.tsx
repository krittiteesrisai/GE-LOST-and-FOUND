import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Item, CATEGORIES } from '../types';
import { Search, MapPin, Calendar, Filter } from 'lucide-react';

export default function ItemsList() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'lost' | 'found'>('all');
  const navigate = useNavigate();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
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
        const itemsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
        setItems(itemsData);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [activeTab, sortOrder]);

  // Extract unique locations for the current tab
  const uniqueLocations = Array.from(new Set(items.map(item => item.location))).filter(Boolean);

  const filteredItems = items.filter(item => {
    const searchString = `${item.title} ${item.description} ${item.location} ${item.currentLocation || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    const matchesLocation = selectedLocation ? item.location === selectedLocation : true;
    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">รายการทั้งหมด</h1>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-4 px-6 font-medium text-lg border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'all' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setActiveTab('lost')}
            className={`pb-4 px-6 font-medium text-lg border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'lost' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            ประกาศของหาย
          </button>
          <button
            onClick={() => setActiveTab('found')}
            className={`pb-4 px-6 font-medium text-lg border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'found' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            ประกาศพบของ
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อสิ่งของ, รายละเอียด..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          <div className="relative md:w-56">
            <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none bg-white appearance-none"
            >
              <option value="">ทุกหมวดหมู่</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="relative md:w-56">
            <MapPin className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none bg-white appearance-none"
            >
              <option value="">ทุกสถานที่</option>
              {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>
          <div className="relative md:w-48">
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none bg-white appearance-none text-gray-700"
            >
              <option value="desc">ล่าสุดก่อน</option>
              <option value="asc">เก่าสุดก่อน</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl h-72 animate-pulse shadow-sm border border-gray-100"></div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-lg">ไม่พบข้อมูลที่ค้นหา</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <div 
              key={item.id} 
              onClick={() => navigate(`/item/${item.id}`)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow group flex flex-col"
            >
              <div className="h-48 bg-gray-100 relative overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                    ไม่มีรูปภาพ
                  </div>
                )}
                {item.status === 'resolved' ? (
                   <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                     <span className="bg-gray-900 text-white px-4 py-1.5 rounded-full text-sm font-medium">
                       ได้รับคืนแล้ว
                     </span>
                   </div>
                ) : (
                  activeTab === 'all' && (
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
                      item.type === 'lost' 
                        ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                        : 'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {item.type === 'lost' ? 'ตามหาของ' : 'เก็บของได้'}
                    </div>
                  )
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <p className="text-xs font-medium text-orange-500 mb-1">{item.category}</p>
                <h3 className="font-bold text-gray-900 mb-3 line-clamp-2">{item.title}</h3>
                <div className="mt-auto space-y-2 text-sm text-gray-600">
                  <p className="line-clamp-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {item.type === 'lost' ? item.location : item.currentLocation || item.location}
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(item.date).toLocaleDateString('th-TH')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
