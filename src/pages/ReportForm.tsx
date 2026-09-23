import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../types';
import { 
  ShieldAlert, 
  X, 
  AlertCircle, 
  ArrowLeft, 
  Camera, 
  User as UserIcon,
  Check,
  CheckCircle2,
  HeartHandshake
} from 'lucide-react';

export default function ReportForm() {
  const { type, id } = useParams<{ type?: string, id?: string }>();
  const navigate = useNavigate();
  const { user, effectiveUser } = useAuth();
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

  // Guest name state
  const [guestName, setGuestName] = useState('');

  const isLost = itemType === 'lost';
  const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
  const activeUser = effectiveUser || (user ? {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'ผู้ใช้งาน'
  } : null);

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
            setItemType(data.type);
            setTitle(data.title);
            setCategory(data.category);
            setDescription(data.description);
            setLocation(data.location);
            if (data.currentLocation) setCurrentLocation(data.currentLocation);
            setDate(data.date);
            if (data.contact) setContact(data.contact);
            if (data.imageUrl) setExistingImageUrl(data.imageUrl);
            if (data.adminNote) setAdminNote(data.adminNote);
          } else {
            setError('ไม่พบข้อมูลรายการที่ต้องการแก้ไข');
          }
        } catch (err) {
          setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
          setLoading(false);
        }
      };
      fetchItem();
    } else {
      // Set default date to today string YYYY-MM-DD
      const now = new Date();
      const localDateStr = now.toISOString().split('T')[0];
      setDate(localDateStr);
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
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
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
        title: title.trim(),
        category,
        description: description.trim(),
        location: location.trim(),
        date,
        contact: contact.trim(),
        imageUrl,
      };

      if (!isLost) {
        itemData.currentLocation = currentLocation.trim();
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
        
        // Record author identity
        if (activeUser) {
          itemData.authorName = activeUser.displayName || activeUser.email?.split('@')[0] || 'ผู้ใช้งาน';
          itemData.authorEmail = activeUser.email || '';
          itemData.authorId = activeUser.uid;
          itemData.isGuest = false;
        } else {
          // Guest mode: use specified name or fallback to "Guest"
          itemData.authorName = guestName.trim() ? guestName.trim() : 'Guest';
          itemData.authorEmail = '';
          itemData.authorId = 'guest';
          itemData.isGuest = true;
        }
        
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
    <div className="max-w-3xl mx-auto py-4 sm:py-8">
      {/* Back button */}
      <Link 
        to="/" 
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-teal-700 mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>กลับสู่หน้าแรก</span>
      </Link>

      <div className="bg-white rounded-3xl border border-teal-100 shadow-sm overflow-hidden">
        {/* Header Banner */}
        <div className={`p-5 sm:p-6 ${isLost ? 'bg-rose-50/50' : 'bg-teal-50/50'} border-b border-slate-100`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                {isEditMode ? 'แก้ไขประกาศ' : isLost ? 'แจ้งของหาย' : 'แจ้งพบของ'}
              </h1>
            </div>

            {/* Toggle Lost/Found Type if not in edit mode */}
            {!isEditMode && (
              <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setItemType('lost')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isLost ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ของหาย
                </button>
                <button
                  type="button"
                  onClick={() => setItemType('found')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    !isLost ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  พบของ
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Identity Indicator / Guest Name Section */}
        <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          {activeUser ? (
            <div className="flex items-center gap-2 text-slate-700">
              <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[10px]">
                {activeUser.displayName?.[0] || 'U'}
              </div>
              <span>
                ผู้ลงประกาศ: <strong className="text-slate-900 font-semibold">{activeUser.displayName || activeUser.email}</strong>
              </span>
            </div>
          ) : (
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-slate-500">โหมด Guest (ไม่ได้ล็อกอิน)</span>
              <input
                type="text"
                placeholder="ชื่อที่แสดงในประกาศ"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="px-3 py-1 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-teal-500 bg-white"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="m-6 mb-0 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ชื่อสิ่งของ *
            </label>
            <input
              type="text"
              required
              placeholder={isLost ? "เช่น กระเป๋าสตางค์สีดำ, บัตรนักศึกษา" : "เช่น กุญแจรถ, ไอโฟน 13 เคสใส"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-teal-500"
            />
          </div>

          {/* Category & Date Grid */}
          <div className="grid sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                หมวดหมู่ *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-teal-500 bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isLost ? "วันที่หาย *" : "วันที่พบ *"}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-teal-500 bg-white"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {isLost ? "สถานที่คาดว่าทำหาย *" : "สถานที่ที่พบ *" }
            </label>
            <input
              type="text"
              required
              placeholder="เช่น ตึกทันตะ 1 ชั้น 3, โรงอาหารคณะ"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-teal-500"
            />
          </div>

          {/* Current Location (For Found Items) */}
          {!isLost && (
            <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-100 space-y-1.5">
              <label className="block text-xs font-semibold text-teal-900">
                จุดฝากสิ่งของปัจจุบัน *
              </label>
              <input
                type="text"
                required={!isLost}
                placeholder="เช่น ป้อม รปภ. ประตู 1 หรือ อยู่กับผู้แจ้ง"
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-teal-200 bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-teal-500"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              รายละเอียด / จุดสังเกต
            </label>
            <textarea
              rows={3}
              placeholder="เช่น สี, รอยตำหนิ, พวงกุญแจ..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-teal-500"
            ></textarea>
          </div>

          {/* Contact Information */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              เบอร์โทร / LINE ID *
            </label>
            <input
              type="text"
              required
              placeholder="เช่น 081-234-5678 หรือ Line ID"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-teal-500"
            />
          </div>

          {/* Image Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              รูปภาพ (ถ้ามี)
            </label>
            
            {imagePreview || existingImageUrl ? (
              <div className="relative inline-block border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 p-2">
                <img
                  src={imagePreview || existingImageUrl}
                  alt="Preview"
                  className="w-48 h-48 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview('');
                    setExistingImageUrl('');
                    setImageFile(null);
                  }}
                  className="absolute top-4 right-4 bg-rose-600 text-white p-1.5 rounded-full shadow-md hover:bg-rose-700 transition-colors"
                  title="ลบรูปภาพ"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-teal-200 hover:border-teal-400 bg-teal-50/20 hover:bg-teal-50/50 rounded-2xl cursor-pointer transition-all">
                <Camera className="w-8 h-8 text-teal-600 mb-2" />
                <span className="text-xs font-bold text-slate-700">คลิกเพื่ออัปโหลดรูปภาพสิ่งของ</span>
                <span className="text-[10px] text-slate-400 mt-1">รองรับ JPG, PNG สูงสุด 5MB (ระบบบีบอัดอัตโนมัติ)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Admin Note field (Visible only to Admin in Edit Mode) */}
          {isAdmin && isEditMode && (
            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300/80 space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                🛡️ บันทึกช่วยจำสำหรับแอดมิน (Admin Note)
              </label>
              <textarea
                rows={2}
                placeholder="โน้ตสำหรับเจ้าหน้าที่ (เช่น ได้รับคืนแล้วที่ตึก 2 เจ้าของติดต่อผ่าน LINE แล้ว)"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-teal-500"
              />
            </div>
          )}

          {/* Submit Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-bold text-white shadow-md transition-all ${
                isLost
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'
              } disabled:opacity-50`}
            >
              {loading ? (
                <span>กำลังบันทึกข้อมูล...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditMode ? 'บันทึกการแก้ไข' : 'เผยแพร่ประกาศทันที'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
