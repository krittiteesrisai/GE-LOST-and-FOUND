import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Item } from '../types';
import { Trash2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">จัดการระบบ (ผู้ดูแล)</h1>
        <button onClick={() => fetchItems()} className="text-sm text-gray-500 hover:text-gray-900">
          รีเฟรชข้อมูล
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">ประเภท</th>
                  <th className="px-6 py-4">ชื่อสิ่งของ</th>
                  <th className="px-6 py-4">ผู้ติดต่อ</th>
                  <th className="px-6 py-4">สถานะ</th>
                  <th className="px-6 py-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.type === 'lost' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {item.type === 'lost' ? 'ของหาย' : 'พบของ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 line-clamp-1 max-w-[200px]">{item.title}</td>
                    <td className="px-6 py-4">{item.contact}</td>
                    <td className="px-6 py-4">
                      {item.status === 'resolved' ? (
                        <span className="text-gray-500 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> ปิดแล้ว</span>
                      ) : (
                        <span className="text-blue-600">กำลังดำเนินการ</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      {item.status !== 'resolved' ? (
                        <button 
                          onClick={() => setStatusAction({ id: item.id!, action: 'resolve' })}
                          className="text-green-600 hover:text-green-800 font-medium text-xs border border-green-200 bg-green-50 px-3 py-1.5 rounded-lg"
                        >
                          เปลี่ยนเป็นปิดรายการ
                        </button>
                      ) : (
                        <button 
                          onClick={() => setStatusAction({ id: item.id!, action: 'active' })}
                          className="text-orange-600 hover:text-orange-800 font-medium text-xs border border-orange-200 bg-orange-50 px-3 py-1.5 rounded-lg"
                        >
                          ย้อนกลับเป็นกำลังดำเนินการ
                        </button>
                      )}
                      <button 
                        onClick={() => requestDelete(item.id!)}
                        className="text-red-500 hover:text-red-700 font-medium text-xs border border-red-100 bg-red-50 px-3 py-1.5 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 inline" /> ลบ
                      </button>
                      <button 
                        onClick={() => navigate(`/edit/${item.id}`)}
                        className="text-gray-500 hover:text-gray-700 font-medium text-xs border border-gray-200 bg-white px-3 py-1.5 rounded-lg ml-2"
                      >
                        แก้ไข
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      ไม่มีรายการ
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-xl">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">ยืนยันการลบข้อมูล</h3>
            <p className="text-gray-500 text-center mb-6 text-sm">
              คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200"
              >
                ยกเลิก
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700"
              >
                ลบข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Confirmation Modal */}
      {statusAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-xl">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto ${
              statusAction.action === 'resolve' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
            }`}>
              {statusAction.action === 'resolve' ? <CheckCircle2 className="w-6 h-6" /> : <RefreshCw className="w-6 h-6" />}
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">ยืนยันการเปลี่ยนสถานะ</h3>
            <p className="text-gray-500 text-center mb-6 text-sm">
              คุณต้องการเปลี่ยนสถานะเป็น {statusAction.action === 'resolve' ? '"ปิดรายการ (ได้คืนแล้ว)"' : '"ยังไม่ได้คืน (กำลังดำเนินการ)"'} ใช่หรือไม่?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setStatusAction(null)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200"
              >
                ยกเลิก
              </button>
              <button 
                onClick={confirmStatusChange}
                className={`flex-1 px-4 py-2.5 text-white font-medium rounded-xl ${
                  statusAction.action === 'resolve' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
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
