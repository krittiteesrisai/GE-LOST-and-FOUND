import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Item } from '../types';
import { Trash2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
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

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'items', id));
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await updateDoc(doc(db, 'items', id), {
        status: 'resolved'
      });
      setItems(items.map(item => item.id === id ? { ...item, status: 'resolved' } : item));
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
                      {item.status !== 'resolved' && (
                        <button 
                          onClick={() => handleResolve(item.id!)}
                          className="text-green-600 hover:text-green-800 font-medium text-xs border border-green-200 bg-green-50 px-3 py-1.5 rounded-lg"
                        >
                          เปลี่ยนสถานะเป็นได้คืน
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(item.id!)}
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
    </div>
  );
}
