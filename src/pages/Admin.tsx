import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Item } from '../types';
import { 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Edit3, 
  Search, 
  LogOut, 
  ShieldCheck, 
  Check, 
  Clock, 
  Users, 
  Mail, 
  Package, 
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RegisteredUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: 'google' | 'email' | 'guest';
  lastSeen?: string;
  itemCount: number;
}

export default function Admin() {
  const { deleteUserRecord } = useAuth();
  const [activeTab, setActiveTab] = useState<'items' | 'users'>('items');
  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');
  
  // Modals
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<RegisteredUser | null>(null);
  const [statusAction, setStatusAction] = useState<{id: string, action: 'resolve' | 'active'} | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Items
      const q = query(collection(db, 'items'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const itemsData = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Item));
      setItems(itemsData);

      // 2. Fetch Users
      const usersMap = new Map<string, RegisteredUser>();

      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach((docSnap) => {
          const data = docSnap.data();
          const email = (data.email || '').trim().toLowerCase();
          const key = email || docSnap.id;
          usersMap.set(key, {
            uid: docSnap.id,
            email: email || 'ไม่ได้ระบุอีเมล',
            displayName: data.displayName || email.split('@')[0] || 'ผู้ใช้งาน',
            photoURL: data.photoURL || '',
            provider: data.provider || 'email',
            lastSeen: data.lastLoginAt ? new Date(data.lastLoginAt.toDate?.() || data.lastLoginAt).toLocaleDateString('th-TH') : 'ล่าสุด',
            itemCount: 0
          });
        });
      } catch (err) {
        console.warn('Could not fetch Firestore users:', err);
      }

      // Merge local storage users
      try {
        const localAccounts = JSON.parse(localStorage.getItem('campus_lf_registered_accounts') || '[]');
        localAccounts.forEach((acc: any) => {
          const email = (acc.email || '').trim().toLowerCase();
          const key = email || acc.uid;
          if (!usersMap.has(key)) {
            usersMap.set(key, {
              uid: acc.uid,
              email: email,
              displayName: acc.displayName || email.split('@')[0] || 'ผู้ใช้งาน',
              provider: 'email',
              lastSeen: acc.createdAt ? new Date(acc.createdAt).toLocaleDateString('th-TH') : 'บันทึกในเครื่อง',
              itemCount: 0
            });
          }
        });
      } catch (e) {
        console.warn('Local account read error:', e);
      }

      // Merge posters from items
      itemsData.forEach((item) => {
        const email = (item.authorEmail || '').trim().toLowerCase();
        if (email) {
          if (usersMap.has(email)) {
            usersMap.get(email)!.itemCount += 1;
          } else {
            usersMap.set(email, {
              uid: item.authorId || 'item_author',
              email: email,
              displayName: item.authorName || email.split('@')[0] || 'ผู้ลงประกาศ',
              provider: item.isGuest ? 'guest' : 'email',
              lastSeen: item.date || 'มีรายการ',
              itemCount: 1
            });
          }
        }
      });

      setUsers(Array.from(usersMap.values()));
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

  const confirmDeleteItem = async () => {
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

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    const target = userToDelete;
    setUserToDelete(null);
    try {
      await deleteUserRecord(target.uid, target.email);
      setUsers(users.filter(u => u.uid !== target.uid && u.email !== target.email));
    } catch (error) {
      console.error("Error deleting user: ", error);
    }
  };

  const confirmStatusChange = async () => {
    if (!statusAction) return;
    const { id, action } = statusAction;
    setStatusAction(null);
    try {
      const newStatus = action === 'resolve' ? 'resolved' : 'active';
      const newStage = newStatus === 'resolved' ? 'resolved' : 'review';
      await updateDoc(doc(db, 'items', id), { status: newStatus, stage: newStage });
      setItems(items.map(item => item.id === id ? { ...item, status: newStatus, stage: newStage } : item));
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = `${item.title} ${item.contact} ${item.location} ${item.authorEmail || ''} ${item.authorName || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = users.filter(user => {
    return `${user.email} ${user.displayName} ${user.uid}`.toLowerCase().includes(userSearchQuery.toLowerCase());
  });

  const totalCount = items.length;
  const activeCount = items.filter(i => i.status !== 'resolved').length;
  const resolvedCount = items.filter(i => i.status === 'resolved').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-teal-800 text-white shadow-xs">
            <ShieldCheck className="w-4 h-4 text-cyan-300" />
          </span>
          <h1 className="text-xl font-extrabold text-slate-900">
            ระบบจัดการ (Staff Portal)
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData} 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>
          <button 
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700 rounded-xl hover:bg-rose-100 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออก</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'items' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-teal-600" />
          <span>ประกาศ ({items.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'users' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-teal-600" />
          <span>บัญชีผู้ใช้ ({users.length})</span>
        </button>
      </div>

      {activeTab === 'items' ? (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">ทั้งหมด</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalCount}</p>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
              <span className="text-[10px] font-bold text-amber-600 uppercase">ยังไม่คืน</span>
              <p className="text-2xl font-extrabold text-amber-700 mt-0.5">{activeCount}</p>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
              <span className="text-[10px] font-bold text-teal-600 uppercase">คืนแล้ว</span>
              <p className="text-2xl font-extrabold text-teal-700 mt-0.5">{resolvedCount}</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="ค้นหาชื่อ, สถานที่, ผู้ติดต่อ, อีเมล..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>

            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === 'active' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                ยังไม่คืน
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === 'resolved' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                คืนแล้ว
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">กำลังโหลด...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">รายการ</th>
                      <th className="px-3 py-3">ประเภท</th>
                      <th className="px-3 py-3">ผู้ติดต่อ</th>
                      <th className="px-3 py-3">สถานะ</th>
                      <th className="px-4 py-3 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400 font-bold">
                                  -
                                </div>
                              )}
                            </div>
                            <div>
                              <div 
                                onClick={() => navigate(`/item/${item.id}`)}
                                className="font-bold text-slate-900 hover:text-teal-600 cursor-pointer line-clamp-1 max-w-[180px]"
                              >
                                {item.title}
                              </div>
                              <div className="text-[10px] text-slate-400">{item.location}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.type === 'lost' 
                              ? 'bg-orange-50 text-orange-700 border border-orange-200' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {item.type === 'lost' ? 'ของหาย' : 'พบของ'}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <div className="font-mono text-slate-800">{item.contact}</div>
                          {item.authorEmail && (
                            <div className="text-[10px] text-slate-400">{item.authorEmail}</div>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.status === 'resolved' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'resolved' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                            <span>{item.status === 'resolved' ? 'คืนแล้ว' : 'ยังไม่คืน'}</span>
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                          {item.status !== 'resolved' ? (
                            <button 
                              onClick={() => setStatusAction({ id: item.id!, action: 'resolve' })}
                              className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-lg text-[11px] font-semibold"
                            >
                              คืนแล้ว
                            </button>
                          ) : (
                            <button 
                              onClick={() => setStatusAction({ id: item.id!, action: 'active' })}
                              className="text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg text-[11px] font-semibold"
                            >
                              เปิดใหม่
                            </button>
                          )}

                          <button 
                            onClick={() => navigate(`/edit/${item.id}`)}
                            className="text-slate-600 hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg text-[11px] font-semibold"
                          >
                            <Edit3 className="w-3 h-3 inline" />
                          </button>

                          <button 
                            onClick={() => setItemToDelete(item.id!)}
                            className="text-rose-600 hover:bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg text-[11px] font-semibold"
                          >
                            <Trash2 className="w-3 h-3 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">
                          ไม่พบรายการ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* USERS DIRECTORY */
        <div className="space-y-3">
          {/* User Search Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="ค้นหาอีเมล หรือชื่อผู้ใช้..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-teal-500 focus:bg-white"
              />
            </div>
            <span className="text-xs text-slate-500 shrink-0 font-medium">
              {filteredUsers.length} บัญชี
            </span>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">กำลังโหลด...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">ผู้ใช้งาน</th>
                      <th className="px-3 py-3">อีเมล</th>
                      <th className="px-3 py-3">ประเภท</th>
                      <th className="px-3 py-3">ประกาศ</th>
                      <th className="px-4 py-3 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u, idx) => (
                      <tr key={u.uid + '_' + idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-[11px] border border-teal-100">
                                {u.displayName?.[0] || 'U'}
                              </div>
                            )}
                            <div className="font-semibold text-slate-900">{u.displayName}</div>
                          </div>
                        </td>

                        <td className="px-3 py-3 font-mono text-slate-700">
                          {u.email}
                        </td>

                        <td className="px-3 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            u.provider === 'google' 
                              ? 'bg-blue-50 text-blue-700' 
                              : u.provider === 'email'
                              ? 'bg-teal-50 text-teal-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {u.provider === 'google' ? 'Google' : u.provider === 'email' ? 'อีเมล' : 'Guest'}
                          </span>
                        </td>

                        <td className="px-3 py-3 font-medium text-slate-700">
                          {u.itemCount} รายการ
                        </td>

                        <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                          {u.itemCount > 0 && (
                            <button
                              onClick={() => {
                                setSearchQuery(u.email);
                                setActiveTab('items');
                              }}
                              className="text-teal-700 hover:bg-teal-50 border border-teal-200 px-2 py-1 rounded-lg text-[11px] font-semibold"
                              title="ดูประกาศ"
                            >
                              ดูประกาศ
                            </button>
                          )}

                          <button
                            onClick={() => setUserToDelete(u)}
                            className="text-rose-600 hover:bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg text-[11px] font-semibold"
                            title="ลบบัญชีผู้ใช้"
                          >
                            <Trash2 className="w-3 h-3 inline" />
                            <span className="ml-1">ลบบัญชี</span>
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">
                          ไม่พบบัญชีผู้ใช้
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Item Delete Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-xl border border-slate-100 text-center">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-2 mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">ลบประกาศนี้?</h3>
            <p className="text-slate-500 text-xs mb-4">ข้อมูลจะถูกลบถาวร</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200"
              >
                ยกเลิก
              </button>
              <button 
                onClick={confirmDeleteItem}
                className="flex-1 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Delete Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-xl border border-slate-100 text-center">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-2 mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">ลบบัญชีผู้ใช้นี้?</h3>
            <p className="text-slate-500 text-xs mb-1 font-mono">{userToDelete.email}</p>
            <p className="text-slate-400 text-[11px] mb-4">บัญชีจะถูกลบออกจากระบบ</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200"
              >
                ยกเลิก
              </button>
              <button 
                onClick={confirmDeleteUser}
                className="flex-1 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {statusAction && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-xl border border-slate-100 text-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 mx-auto ${
              statusAction.action === 'resolve' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
            }`}>
              {statusAction.action === 'resolve' ? <Check className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">เปลี่ยนสถานะประกาศ</h3>
            <p className="text-slate-500 text-xs mb-4">
              {statusAction.action === 'resolve' ? 'ทำเครื่องหมายว่า “คืนแล้ว”' : 'เปลี่ยนเป็น “ยังไม่คืน”'}
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setStatusAction(null)}
                className="flex-1 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200"
              >
                ยกเลิก
              </button>
              <button 
                onClick={confirmStatusChange}
                className={`flex-1 py-1.5 text-white text-xs font-semibold rounded-xl ${
                  statusAction.action === 'resolve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
