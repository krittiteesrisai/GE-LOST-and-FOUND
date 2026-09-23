import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Item } from '../types';
import { Trash2, CheckCircle2, AlertTriangle, RefreshCw, Edit3, ExternalLink, Search, LogOut, ShieldCheck, Check, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [statusAction, setStatusAction] = useState<{id: string, action: 'resolve' | 'active'} | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
      navigate('/login');
      return;
    }
    fetchItems();
  }, [navigate]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'items'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const itemsData = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Item));
      setItems(itemsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAdmin');
    navigate('/');
  };

  const requestDelete = (id: string) => {
    setItemToDelete(id);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete;
    setItemToDelete(null);
    try {
      await deleteDoc(doc(db, 'items', id));
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const confirmStatusChange = async () => {
    if (!statusAction) return;
    const { id, action } = statusAction;
    setStatusAction(null);
    try {
      const newStatus = action === 'resolve' ? 'resolved' : 'active';
      await updateDoc(doc(db, 'items', id), {
        status: newStatus
      });
      setItems(items.map(item => item.id === id ? { ...item, status: newStatus } : item));
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = `${item.title} ${item.contact} ${item.location}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCount = items.length;
  const activeCount = items.filter(i => i.status !== 'resolved').length;
  const resolvedCount = items.filter(i => i.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-teal-800 text-white shadow-xs">
              <ShieldCheck className="w-4 h-4 text-cyan-300" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              ระบบจัดการสำหรับเจ้าหน้าที่ (Staff Portal)
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            ตรวจสอบข้อมูล แก้ไขรายละเอียด และควบคุมการเปิด-ปิดประกาศ
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={fetchItems} 
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white border border-teal-100 text-slate-700 rounded-xl hover:bg-teal-50/50 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>
          <button 
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 rounded-xl hover:bg-rose-100 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>

      {/* KPI Counters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-teal-100/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ประกาศทั้งหมด</span>
            <p className="text-3xl font-extrabold text-slate-900 mt-0.5">{totalCount}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center font-bold text-base">
            ✦
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-teal-100/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">กำลังดำเนินการ</span>
            <p className="text-3xl font-extrabold text-amber-800 mt-0.5">{activeCount}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-teal-100/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">ส่งมอบคืนแล้ว</span>
            <p className="text-3xl font-extrabold text-teal-800 mt-0.5">{resolvedCount}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="ค้นหาชื่อรายการ, ผู้ติดต่อ, สถานที่..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="inline-flex bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด ({items.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === 'active' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-orange-600'
            }`}
          >
            ยังไม่ได้คืน ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('resolved')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusFilter === 'resolved' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600 hover:text-emerald-600'
            }`}
          >
            คืนแล้ว ({resolvedCount})
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs sm:text-sm">กำลังโหลดข้อมูล...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3.5">รายการ</th>
                  <th className="px-4 py-3.5">ประเภท</th>
                  <th className="px-4 py-3.5">หมวดหมู่</th>
                  <th className="px-4 py-3.5">ผู้ติดต่อ</th>
                  <th className="px-4 py-3.5">สถานะ</th>
                  <th className="px-5 py-3.5 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Item with Thumbnail */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/70">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">
                              N/A
                            </div>
                          )}
                        </div>
                        <div>
                          <div 
                            onClick={() => navigate(`/item/${item.id}`)}
                            className="font-bold text-slate-900 hover:text-orange-600 cursor-pointer line-clamp-1 max-w-[200px]"
                          >
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{item.location}</div>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        item.type === 'lost' 
                          ? 'bg-orange-50 text-orange-700 border border-orange-200' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {item.type === 'lost' ? 'ของหาย' : 'พบของ'}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">
                      {item.category}
                    </td>

                    {/* Contact & Author */}
                    <td className="px-4 py-3.5 text-xs text-slate-700">
                      <div className="font-mono font-medium text-slate-800">{item.contact}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span>โดย:</span>
                        <span className={`font-semibold ${
                          item.isGuest || !item.authorName || item.authorName === 'Guest'
                            ? 'text-slate-500'
                            : 'text-orange-600'
                        }`}>
                          {item.authorName || 'Guest'}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      {item.status === 'resolved' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ได้รับคืนแล้ว</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>กำลังดำเนินการ</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-1.5">
                      {item.status !== 'resolved' ? (
                        <button 
                          onClick={() => setStatusAction({ id: item.id!, action: 'resolve' })}
                          className="text-emerald-700 hover:bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                          title="คลิกเพื่อปิดรายการ"
                        >
                          ปิดรายการ
                        </button>
                      ) : (
                        <button 
                          onClick={() => setStatusAction({ id: item.id!, action: 'active' })}
                          className="text-amber-700 hover:bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                          title="ย้อนกลับเป็นกำลังตามหา"
                        >
                          เปิดใหม่
                        </button>
                      )}

                      <button 
                        onClick={() => navigate(`/edit/${item.id}`)}
                        className="text-slate-600 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                        title="แก้ไขข้อมูล"
                      >
                        <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                        แก้ไข
                      </button>

                      <button 
                        onClick={() => requestDelete(item.id!)}
                        className="text-rose-600 hover:bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                        title="ลบรายการ"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                      ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-100">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center mb-1">ยืนยันการลบประกาศนี้</h3>
            <p className="text-slate-500 text-center mb-6 text-xs leading-relaxed">
              เมื่อลบแล้ว ข้อมูลและรูปภาพจะถูกลบออกจากระบบอย่างถาวรและไม่สามารถกู้คืนได้
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-2 bg-rose-600 text-white font-semibold text-xs rounded-xl hover:bg-rose-700 transition-colors shadow-sm"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Confirmation Modal */}
      {statusAction && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-100">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto ${
              statusAction.action === 'resolve' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
            }`}>
              {statusAction.action === 'resolve' ? <Check className="w-6 h-6" /> : <RefreshCw className="w-6 h-6" />}
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center mb-1">ยืนยันการเปลี่ยนสถานะ</h3>
            <p className="text-slate-500 text-center mb-6 text-xs leading-relaxed">
              คุณต้องการเปลี่ยนสถานะเป็น {statusAction.action === 'resolve' ? '“ปิดรายการ (ส่งมอบคืนแล้ว)”' : '“ยังไม่ได้รับคืน (เปิดค้นหาต่อ)”'} ใช่หรือไม่?
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setStatusAction(null)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={confirmStatusChange}
                className={`flex-1 py-2 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm ${
                  statusAction.action === 'resolve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                ยืนยันเปลี่ยนสถานะ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

