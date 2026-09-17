import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CATEGORIES, ItemType } from '../types';
import { ShieldUser } from 'lucide-react';

export default function ReportForm() {
  const { type, id } = useParams<{ type?: string, id?: string }>();
  const navigate = useNavigate();
  // If we have an id, we are in edit mode
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [itemType, setItemType] = useState<string>(type || '');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [date, setDate] = useState('');
  const [contact, setContact] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [existingImageUrl, setExistingImageUrl] = useState<string>('');
  const [adminNote, setAdminNote] = useState('');

  const isLost = itemType === 'lost';
  const isAdmin = sessionStorage.getItem('isAdmin') === 'true';

  useEffect(() => {
    if (isEditMode && id) {
      const fetchItem = async () => {
        setLoading(true);
        try {
          const docRef = doc(db, 'items', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setItemType(data.type || 'found'); // load type from db
            setTitle(data.title);
            setCategory(data.category);
            setDescription(data.description);
            setLocation(data.location);
            setCurrentLocation(data.currentLocation || '');
            setDate(data.date || '');
            setContact(data.contact);
            setExistingImageUrl(data.imageUrl || '');
            setAdminNote(data.adminNote || '');
          } else {
            setError('ไม่พบข้อมูลที่ต้องการแก้ไข');
          }
        } catch (err) {
          console.error(err);
          setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
          setLoading(false);
        }
      };
      fetchItem();
    }
  }, [id, isEditMode]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // File size validation (max 5MB before compression)
      if (file.size > 5 * 1024 * 1024) {
        setError('ขนาดรูปภาพต้องไม่เกิน 5MB');
        return;
      }
      setImageFile(file);
      try {
        const compressedBase64 = await compressImage(file);
        setImagePreview(compressedBase64);
      } catch (err) {
        setError('ไม่สามารถประมวลผลรูปภาพได้');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let imageUrl = existingImageUrl;
      
      if (imagePreview) {
        imageUrl = imagePreview;
      }

      const itemData: any = {
        title,
        category,
        description,
        location,
        date,
        contact,
        imageUrl,
      };

      if (!isLost) {
        itemData.currentLocation = currentLocation;
      }

      if (isAdmin && isEditMode) {
        itemData.type = itemType; // allow admin to change type
        itemData.adminNote = adminNote;
      }

      if (isEditMode && id) {
        await updateDoc(doc(db, 'items', id), {
          ...itemData,
          updatedAt: serverTimestamp()
        });
        navigate(`/item/${id}`);
      } else {
        itemData.type = isLost ? 'lost' : 'found';
        itemData.status = 'active';
        itemData.createdAt = serverTimestamp();
        
        const docRef = await addDoc(collection(db, 'items'), itemData);
        
        // Save item ID to local storage so the creator can close/edit the post later
        const myItems = JSON.parse(localStorage.getItem('myItems') || '[]');
        myItems.push(docRef.id);
        localStorage.setItem('myItems', JSON.stringify(myItems));
        
        navigate(`/item/${docRef.id}`);
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        {isLost ? 'แจ้งของหาย' : 'แจ้งพบของ'}
      </h1>
      <p className="text-gray-500 mb-8">
        กรุณากรอกข้อมูลให้ครบถ้วนเพื่อให้ง่ายต่อการค้นหาและติดตามคืน
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {isAdmin && isEditMode && (
        <div className="bg-gray-100 p-6 rounded-2xl mb-8 border border-gray-300">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldUser className="w-5 h-5 text-gray-700" /> เครื่องมือผู้ดูแลระบบ
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ปรับเปลี่ยนประเภทโพสต์</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="type" 
                    value="lost" 
                    checked={itemType === 'lost'}
                    onChange={(e) => setItemType(e.target.value)}
                    className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                  />
                  <span>แจ้งของหาย</span>
                </label>
                <label className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="type" 
                    value="found" 
                    checked={itemType === 'found'}
                    onChange={(e) => setItemType(e.target.value)}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <span>แจ้งพบของ</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ประกาศเพิ่มเติมจากแอดมิน (จะแสดงให้ทุกคนเห็น)</label>
              <textarea 
                rows={2}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full rounded-xl border-gray-300 border px-4 py-2.5 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none resize-none bg-white"
                placeholder="ระบุข้อความอัปเดต เช่น ติดต่อรับของได้ที่ห้องธุรการ..."
              ></textarea>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสิ่งของ *</label>
          <input 
            required 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border-gray-300 border px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow"
            placeholder="เช่น กระเป๋าสตางค์สีดำ, บัตรนักศึกษา"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่ *</label>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border-gray-300 border px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด/ลักษณะเด่น *</label>
          <textarea 
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border-gray-300 border px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
            placeholder="ยี่ห้อ, สี, ลวดลาย, หรือจุดสังเกตอื่นๆ"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isLost ? 'สถานที่ที่คาดว่าทำหาย *' : 'สถานที่ที่พบ *'}
            </label>
            <input 
              required 
              type="text" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-xl border-gray-300 border px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              placeholder="เช่น โรงอาหารคณะ..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isLost ? 'วันที่และเวลาที่คาดว่าหาย *' : 'วันที่และเวลาที่พบ *'}
            </label>
            <input 
              required 
              type="datetime-local" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border-gray-300 border px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>
        </div>

        {!isLost && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">สถานที่ที่ฝากของไว้ตอนนี้ *</label>
            <input 
              required 
              type="text" 
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value)}
              className="w-full rounded-xl border-gray-300 border px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              placeholder="เช่น ฝากไว้ที่ป้อม รปภ., ห้องธุรการ"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ช่องทางติดต่อกลับ *</label>
          <input 
            required 
            type="text" 
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full rounded-xl border-gray-300 border px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            placeholder="เบอร์โทรศัพท์ / LINE ID / อีเมล"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">รูปภาพประกอบ (ถ้ามี)</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={handleImageChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
          />
          <p className="text-xs text-gray-400 mt-2">ขนาดไฟล์ไม่เกิน 5MB</p>
          {imagePreview ? (
            <div className="mt-4 relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button 
                type="button" 
                onClick={() => {setImageFile(null); setImagePreview('');}}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
              >
                &times;
              </button>
            </div>
          ) : existingImageUrl ? (
            <div className="mt-4 relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200">
              <img src={existingImageUrl} alt="Existing" className="w-full h-full object-cover" />
              <button 
                type="button" 
                onClick={() => setExistingImageUrl('')}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                title="ลบรูปภาพเดิม"
              >
                &times;
              </button>
            </div>
          ) : null}
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3.5 rounded-xl text-white font-medium text-lg transition-colors ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : isLost ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? 'กำลังบันทึกข้อมูล...' : isEditMode ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
          </button>
        </div>
      </form>
    </div>
  );
}
