import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CATEGORIES, ItemType } from '../types';
import { ShieldUser, Upload, X, AlertCircle, CheckCircle2, ArrowLeft, Camera, Image as ImageIcon } from 'lucide-react';

export default function ReportForm() {
  const { type, id } = useParams<{ type?: string, id?: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [itemType, setItemType] = useState<string>(type || 'lost');
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

  // Synchronize itemType when URL parameter (:type) changes
  useEffect(() => {
    if (!isEditMode && type) {
      setItemType(type === 'found' ? 'found' : 'lost');
    }
  }, [type, isEditMode]);

  useEffect(() => {
    if (isEditMode && id) {
      const fetchItem = async () => {
        setLoading(true);
        try {
          const docRef = doc(db, 'items', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setItemType(data.type || 'found');
            setTitle(data.title || '');
            setCategory(data.category || CATEGORIES[0]);
            setDescription(data.description || '');
            setLocation(data.location || '');
            setCurrentLocation(data.currentLocation || '');
            setDate(data.date || '');
            setContact(data.contact || '');
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

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
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

  const handleSubmit = async (e: FormEvent) => {
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
        itemData.type = itemType;
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <Link 
        to="/" 
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> 
        <span>กลับหน้าหลัก</span>
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10">
        {/* Type Switcher Tab */}
        {!isEditMode && (
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
            <button
              type="button"
              onClick={() => {
                setItemType('lost');
                navigate('/report/lost', { replace: true });
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                isLost
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-slate-600 hover:text-orange-600'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>แจ้งของหาย (ตามหา)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setItemType('found');
                navigate('/report/found', { replace: true });
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                !isLost
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>แจ้งพบของ (เก็บได้)</span>
            </button>
          </div>
        )}

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1.5">
            {isEditMode ? 'แก้ไขข้อมูลประกาศ' : isLost ? 'ลงประกาศตามหาของหาย' : 'ลงประกาศเก็บของได้'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mb-6">
            กรอกรายละเอียดให้ครบถ้วน เพื่อให้ผู้อื่นสามารถตรวจสอบและส่งคืนได้ง่าย
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl mb-6 text-xs sm:text-sm">
            {error}
          </div>
        )}

        {/* Admin controls in edit mode */}
        {isAdmin && isEditMode && (
          <div className="bg-slate-50 p-5 rounded-2xl mb-8 border border-slate-200">
            <h2 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldUser className="w-4 h-4 text-amber-600" /> แผงควบคุมพิเศษสำหรับผู้ดูแลระบบ
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">เปลี่ยนประเภทประกาศ</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input 
                      type="radio" 
                      name="type" 
                      value="lost" 
                      checked={itemType === 'lost'}
                      onChange={(e) => setItemType(e.target.value)}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                    />
                    <span>ประกาศของหาย</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input 
                      type="radio" 
                      name="type" 
                      value="found" 
                      checked={itemType === 'found'}
                      onChange={(e) => setItemType(e.target.value)}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>ประกาศพบของ</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมายเหตุจากแอดมิน (แสดงเป็นแถบข้อความให้ทุกคนเห็น)
                </label>
                <textarea 
                  rows={2}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  placeholder="เช่น ผู้เก็บได้นำมาฝากไว้ที่ฝ่ายกิจการนักศึกษาแล้ว ติดต่อรับได้ในเวลาราชการ"
                />
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Item Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ชื่อสิ่งของ <span className="text-rose-500">*</span>
            </label>
            <input 
              required 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all placeholder:text-slate-400"
              placeholder="เช่น หูฟัง AirPods Pro เคสสีใส, บัตรนักศึกษา"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              หมวดหมู่สิ่งของ <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white appearance-none cursor-pointer"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                รายละเอียด / ลักษณะเด่น <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">ยี่ห้อ, สี, รอยตำหนิ</span>
            </div>
            <textarea 
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none transition-all placeholder:text-slate-400"
              placeholder="ระบุสี รอยตำหนิ ลวดลาย หรือสิ่งของที่อยู่ข้างใน เพื่อใช้ในการยืนยันความเป็นเจ้าของ"
            />
          </div>

          {/* Location and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isLost ? 'สถานที่คาดว่าทำหาย' : 'สถานที่ที่พบ'} <span className="text-rose-500">*</span>
              </label>
              <input 
                required 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all placeholder:text-slate-400"
                placeholder="เช่น โรงอาหารกลาง, หน้าตึก 3"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isLost ? 'วันที่และเวลาที่คาดว่าหาย' : 'วันที่และเวลาที่พบ'} <span className="text-rose-500">*</span>
              </label>
              <input 
                required 
                type="datetime-local" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          {/* Current deposit location for found items */}
          {!isLost && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                สถานที่นำของไปฝากไว้ในปัจจุบัน <span className="text-rose-500">*</span>
              </label>
              <input 
                required 
                type="text" 
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                placeholder="เช่น ป้อม รปภ. ประตู 1, ห้องธุรการชั้น 2"
              />
            </div>
          )}

          {/* Contact Information */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ช่องทางติดต่อกลับ <span className="text-rose-500">*</span>
            </label>
            <input 
              required 
              type="text" 
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all placeholder:text-slate-400"
              placeholder="เบอร์โทรศัพท์ / LINE ID / Instagram / อีเมล"
            />
          </div>

          {/* Photo Upload Zone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              รูปภาพสิ่งของ (ถ้ามี)
            </label>
            
            {imagePreview || existingImageUrl ? (
              <div className="relative w-44 h-44 rounded-2xl overflow-hidden border border-slate-200 shadow-xs group">
                <img 
                  src={imagePreview || existingImageUrl} 
                  alt="ตัวอย่างรูปภาพ" 
                  className="w-full h-full object-cover" 
                />
                <button 
                  type="button" 
                  onClick={() => {
                    setImageFile(null); 
                    setImagePreview('');
                    setExistingImageUrl('');
                  }}
                  className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1.5 shadow-md transition-colors"
                  title="ลบรูปภาพ"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-2xl cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-2">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700">คลิกเพื่อเลือกรูปภาพจากเครื่อง</span>
                <span className="text-[11px] text-slate-400 mt-1">รองรับ JPG, PNG (ขนาดไม่เกิน 5MB)</span>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3 rounded-xl text-white font-bold text-sm shadow-sm hover:shadow transition-all active:scale-[0.99] flex items-center justify-center gap-2 ${
                loading 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : isLost 
                    ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20' 
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>กำลังบันทึกข้อมูล...</span>
                </>
              ) : isEditMode ? (
                <span>บันทึกการแก้ไข</span>
              ) : (
                <span>เผยแพร่ประกาศ</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

