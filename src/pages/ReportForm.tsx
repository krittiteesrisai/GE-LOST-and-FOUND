import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../types';
import { 
  X, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  Camera, 
  Check,
  CheckCircle2,
  MapPin, 
  Tag, 
  Phone, 
  Image as ImageIcon,
  Sparkles,
  FileText
} from 'lucide-react';

export default function ReportForm() {
  const { type, id } = useParams<{ type?: string, id?: string }>();
  const navigate = useNavigate();
  const { user, effectiveUser } = useAuth();
  const isEditMode = !!id;
  
  const [currentStep, setCurrentStep] = useState<number>(1);
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
            setTitle(data.title || '');
            setCategory(data.category || CATEGORIES[0]);
            setDescription(data.description || '');
            setLocation(data.location || '');
            if (data.currentLocation) setCurrentLocation(data.currentLocation);
            setDate(data.date || '');
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
      try {
        const compressedBase64 = await compressImage(file);
        setImagePreview(compressedBase64);
        setError('');
      } catch (err) {
        setError('ไม่สามารถประมวลผลรูปภาพได้');
      }
    }
  };

  // Step Validation
  const validateStep = (step: number): boolean => {
    setError('');
    if (step === 1) {
      if (!title.trim()) {
        setError('กรุณาระบุชื่อสิ่งของ');
        return false;
      }
    } else if (step === 2) {
      if (!location.trim()) {
        setError(isLost ? 'กรุณาระบุสถานที่ที่คาดว่าทำหาย' : 'กรุณาระบุสถานที่ที่พบสิ่งของ');
        return false;
      }
      if (!date) {
        setError('กรุณาเลือกวันที่');
        return false;
      }
      if (!isLost && !currentLocation.trim()) {
        setError('กรุณาระบุจุดฝากสิ่งของปัจจุบัน');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handlePrevStep = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2)) return;

    if (!contact.trim()) {
      setError('กรุณากรอกข้อมูลติดต่อกลับ (เบอร์โทร หรือ LINE ID)');
      return;
    }

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
        
        if (activeUser) {
          itemData.authorName = activeUser.displayName || activeUser.email?.split('@')[0] || 'ผู้ใช้งาน';
          itemData.authorEmail = activeUser.email || '';
          itemData.authorId = activeUser.uid;
          itemData.isGuest = false;
        } else {
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

  const steps = [
    { number: 1, label: 'ข้อมูลสิ่งของ', icon: Tag },
    { number: 2, label: 'สถานที่ & วันที่', icon: MapPin },
    { number: 3, label: 'รูปภาพ & ติดต่อ', icon: Phone }
  ];

  return (
    <div className="max-w-2xl mx-auto py-3 sm:py-6">
      {/* Top back button */}
      <Link 
        to="/" 
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 mb-4 transition-all duration-150 active:scale-95 group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
        <span>กลับหน้าแรก</span>
      </Link>

      <div className="bg-white rounded-3xl border border-teal-100 shadow-sm overflow-hidden">
        {/* Header & Stepper Progress */}
        <div className={`p-4 sm:p-5 border-b border-slate-100 ${isLost ? 'bg-rose-50/40' : 'bg-teal-50/40'}`}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900">
              {isEditMode ? 'แก้ไขประกาศ' : isLost ? 'แจ้งของหาย' : 'แจ้งพบของ'}
            </h1>

            {/* Toggle Lost/Found Type */}
            {!isEditMode && (
              <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setItemType('lost')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-90 ${
                    isLost ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ของหาย
                </button>
                <button
                  type="button"
                  onClick={() => setItemType('found')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-90 ${
                    !isLost ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  พบของ
                </button>
              </div>
            )}
          </div>

          {/* Stepper Bar */}
          <div className="flex items-center justify-between relative gap-2">
            {/* Progress line behind */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0">
              <div 
                className="h-full bg-teal-600 transition-all duration-300"
                style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
              />
            </div>

            {steps.map((s) => {
              const isDone = s.number < currentStep;
              const isActive = s.number === currentStep;
              const Icon = s.icon;

              return (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => {
                    if (s.number < currentStep || validateStep(currentStep)) {
                      setCurrentStep(s.number);
                    }
                  }}
                  className="flex flex-col items-center gap-1.5 z-10 group active:scale-90 transition-all duration-150"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                    isDone 
                      ? 'bg-teal-600 text-white shadow-xs' 
                      : isActive 
                      ? isLost 
                        ? 'bg-rose-600 text-white ring-4 ring-rose-100 shadow-xs scale-105' 
                        : 'bg-teal-600 text-white ring-4 ring-teal-100 shadow-xs scale-105'
                      : 'bg-white border border-slate-200 text-slate-400'
                  }`}>
                    {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-[11px] font-semibold transition-colors ${
                    isActive ? 'text-slate-900 font-bold' : isDone ? 'text-teal-700' : 'text-slate-400'
                  }`}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Identity row */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
          {activeUser ? (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              <span>ผู้ลงประกาศ: <strong className="text-slate-900">{activeUser.displayName || activeUser.email}</strong></span>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full justify-between">
              <span className="text-slate-500 text-[11px]">โหมด Guest (ไม่ได้ล็อกอิน)</span>
              <input
                type="text"
                placeholder="ระบุชื่อที่แสดงในประกาศ"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white outline-none focus:border-teal-500"
              />
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="m-5 mb-0 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6">
          {/* STEP 1: ข้อมูลสิ่งของ */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อสิ่งของ *
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder={isLost ? "เช่น กระเป๋าสตางค์สีดำ, บัตรนักศึกษา" : "เช่น กุญแจรถ, ไอโฟน 13 เคสใส"}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมวดหมู่ *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-teal-500 bg-white transition-all cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รายละเอียด / จุดสังเกต
                </label>
                <textarea
                  rows={3}
                  placeholder="เช่น สี, รอยตำหนิ, พวงกุญแจ, สติ๊กเกอร์..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                ></textarea>
              </div>
            </div>
          )}

          {/* STEP 2: สถานที่ & วันที่ */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isLost ? "สถานที่คาดว่าทำหาย *" : "สถานที่ที่พบสิ่งของ *" }
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="เช่น อาคารทันตะ 1 ชั้น 3, โรงอาหารคณะ, ป้ายรถเมล์"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isLost ? "วันที่ทำหาย *" : "วันที่พบเจอ *"}
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-teal-500 bg-white transition-all cursor-pointer"
                />
              </div>

              {!isLost && (
                <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-100 space-y-1.5">
                  <label className="block text-xs font-semibold text-teal-900">
                    จุดฝากสิ่งของในปัจจุบัน *
                  </label>
                  <input
                    type="text"
                    required={!isLost}
                    placeholder="เช่น ป้อม รปภ. ประตู 1, ห้องธุรการ หรือ อยู่กับผู้แจ้ง"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-teal-200 bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-teal-500"
                  />
                  <p className="text-[11px] text-teal-700/80">
                    ช่วยให้เจ้าของสามารถเข้าไปติดต่อขอรับคืนได้ถูกที่
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: รูปภาพ & ข้อมูลติดต่อ */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Contact */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ / LINE ID *
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="เช่น 081-234-5678 หรือ LINE ID"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                />
              </div>

              {/* Image Upload Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  รูปภาพประกอบ (ถ้ามี)
                </label>
                
                {imagePreview || existingImageUrl ? (
                  <div className="relative inline-block border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 p-1.5">
                    <img
                      src={imagePreview || existingImageUrl}
                      alt="Preview"
                      className="w-36 h-36 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setExistingImageUrl('');
                      }}
                      className="absolute top-3 right-3 bg-rose-600 text-white p-1 rounded-full shadow-md hover:bg-rose-700 active:scale-75 transition-all duration-150"
                      title="ลบรูปภาพ"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-teal-200 hover:border-teal-400 bg-teal-50/20 hover:bg-teal-50/50 rounded-2xl cursor-pointer transition-all duration-150 active:scale-[0.98]">
                    <Camera className="w-6 h-6 text-teal-600 mb-1.5" />
                    <span className="text-xs font-semibold text-slate-700">แตะเพื่ออัปโหลดรูปภาพ</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG บีบอัดอัตโนมัติ</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Admin Note field */}
              {isAdmin && isEditMode && (
                <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 space-y-1">
                  <label className="block text-xs font-semibold text-slate-800">
                    🛡️ บันทึกช่วยจำสำหรับแอดมิน
                  </label>
                  <textarea
                    rows={2}
                    placeholder="โน้ตสำหรับเจ้าหน้าที่..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 outline-none focus:border-teal-500 bg-white"
                  />
                </div>
              )}

              {/* Quick Summary Pill */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1 text-slate-600">
                <div className="font-semibold text-slate-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>สรุปข้อมูลก่อนเผยแพร่</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                  <div>สิ่งของ: <strong className="text-slate-800">{title || '-'}</strong></div>
                  <div>หมวดหมู่: <strong className="text-slate-800">{category}</strong></div>
                  <div>สถานที่: <strong className="text-slate-800">{location || '-'}</strong></div>
                  <div>วันที่: <strong className="text-slate-800">{date || '-'}</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons with Tactile Press Effects */}
          <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all duration-150 active:scale-95 active:bg-slate-100 cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>ย้อนกลับ</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-600 transition-all duration-150 active:scale-95"
              >
                ยกเลิก
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all duration-150 active:scale-95 cursor-pointer ${
                  isLost 
                    ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-600/20' 
                    : 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 shadow-teal-600/20'
                }`}
              >
                <span>ถัดไป</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all duration-150 active:scale-95 disabled:opacity-50 cursor-pointer ${
                  isLost
                    ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-600/25'
                    : 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 shadow-teal-600/25'
                }`}
              >
                {loading ? (
                  <span>กำลังบันทึก...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>{isEditMode ? 'บันทึกการแก้ไข' : 'เผยแพร่ประกาศ'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
