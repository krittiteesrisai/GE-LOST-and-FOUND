import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  LogOut,
  ShieldCheck,
  Eye, 
  EyeOff,
  Trash2,
  AlertTriangle,
  Camera,
  Upload,
  Sparkles,
  Check
} from 'lucide-react';

const AVATAR_PRESETS = ['🎒', '🎓', '🦊', '🐱', '🐼', '🦁', '🐻', '🦉', '⚡', '🌟', '🎨', '🚀'];

const createEmojiAvatar = (emoji: string) => {
  return `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.85em%22 font-size=%2280%22>${emoji}</text></svg>`;
};

export default function Login() {
  const { 
    user, 
    effectiveUser,
    isAdmin, 
    loginWithGoogle, 
    loginWithEmail, 
    registerWithEmail, 
    loginAsAdmin, 
    logout,
    updateUserProfile,
    deleteCurrentAccount
  } = useAuth();
  
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const navigate = useNavigate();

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const loggedUser = await loginWithGoogle();
      if (loggedUser) {
        navigate('/');
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        return;
      }
      if (err?.code === 'auth/popup-blocked') {
        setError('เบราว์เซอร์บล็อกป๊อปอัป กรุณาอนุญาตเพื่อเข้าสู่ระบบ');
      } else {
        setError('เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Email Login
  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      setSuccessMsg('เข้าสู่ระบบสำเร็จ');
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (err: any) {
      if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else if (err?.code === 'auth/invalid-email') {
        setError('รูปแบบอีเมลไม่ถูกต้อง');
      } else if (err?.code === 'auth/weak-password') {
        setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      } else {
        setError(err?.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('กรุณาระบุชื่อผู้ใช้งาน');
      return;
    }
    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await registerWithEmail(email, password, displayName.trim());
      setSuccessMsg('ลงทะเบียนสำเร็จ');
      setTimeout(() => {
        navigate('/');
      }, 600);
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        setError('อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบ');
      } else if (err?.code === 'auth/invalid-email') {
        setError('รูปแบบอีเมลไม่ถูกต้อง');
      } else {
        setError(err?.message || 'ลงทะเบียนไม่สำเร็จ กรุณาลองใหม่');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin Passphrase
  const handleAdminAuth = (e: FormEvent) => {
    e.preventDefault();
    if (!adminPassword) return;
    const success = loginAsAdmin(adminPassword);
    if (success) {
      navigate('/admin');
    } else {
      setError('รหัสผ่านแอดมินไม่ถูกต้อง');
    }
  };

  // Handle Delete Account
  const handleDeleteMyAccount = async () => {
    setDeletingAccount(true);
    try {
      await deleteCurrentAccount();
      setShowDeleteModal(false);
      navigate('/');
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการลบบัญชี');
    } finally {
      setDeletingAccount(false);
    }
  };

  // Current active user representation
  const currentUser = effectiveUser || (user ? {
    displayName: user.displayName || user.email?.split('@')[0],
    email: user.email,
    photoURL: user.photoURL || undefined
  } : null);

  // Profile Edit State
  const [editName, setEditName] = useState(currentUser?.displayName || '');
  const [editPhoto, setEditPhoto] = useState(currentUser?.photoURL || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [showCustomUrl, setShowCustomUrl] = useState(false);

  // Sync profile editing fields when currentUser updates
  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.displayName || '');
      setEditPhoto(currentUser.photoURL || '');
    }
  }, [currentUser?.displayName, currentUser?.photoURL]);

  const handleAvatarFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setProfileError('กรุณาเลือกไฟล์ภาพขนาดไม่เกิน 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditPhoto(reader.result);
        setProfileError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setProfileError('กรุณาระบุชื่อผู้ใช้งาน');
      return;
    }
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      await updateUserProfile(editName.trim(), editPhoto);
      setProfileSuccess('อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err: any) {
      setProfileError(err?.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setProfileSaving(false);
    }
  };

  // Logged In View
  if (currentUser || isAdmin) {
    if (isAdmin) {
      return (
        <div className="max-w-md mx-auto py-12">
          <div className="bg-white p-7 rounded-3xl border border-stone-200 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto border border-teal-100">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">
                ผู้ดูแลระบบ (Admin)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                มีสิทธิ์ตรวจสอบและจัดการข้อมูลทั้งหมดในระบบ
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/admin"
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm transition-colors"
              >
                เข้าสู่แผงจัดการระบบ Admin
              </Link>
              
              <button
                onClick={async () => {
                  await logout();
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-xl mx-auto py-8 space-y-6">
        {/* Profile Card & Editor */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-300/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                จัดการโปรไฟล์ผู้ใช้งาน
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                แก้ไขชื่อที่แสดงและเลือกรูปภาพประจำตัวสำหรับลงประกาศและติดต่อ
              </p>
            </div>
            <button
              onClick={async () => await logout()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
              title="ออกจากระบบ"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>

          {/* Feedback alerts */}
          {profileSuccess && (
            <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="flex items-center gap-2 text-rose-800 bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* 1. Avatar Display & Controls */}
            <div>
              <label className="block font-display text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                รูปโปรไฟล์ / อวาตาร์
              </label>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-[#faf9f5] border border-stone-200">
                {/* Avatar Preview */}
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-white border-2 border-stone-300 overflow-hidden shadow-xs flex items-center justify-center">
                    {editPhoto ? (
                      <img 
                        src={editPhoto} 
                        alt="Profile preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-teal-600 to-cyan-500 text-white flex items-center justify-center font-display font-bold text-2xl">
                        {editName?.[0] || 'U'}
                      </div>
                    )}
                  </div>
                  {editPhoto && (
                    <button
                      type="button"
                      onClick={() => setEditPhoto('')}
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-1 text-[10px] hover:bg-rose-600 shadow cursor-pointer"
                      title="ลบรูปโปรไฟล์"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Upload & Preset Options */}
                <div className="flex-1 w-full space-y-3 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* File upload button */}
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-300 hover:border-teal-500 text-xs font-semibold text-slate-700 hover:bg-teal-50/50 cursor-pointer shadow-2xs transition-all">
                      <Upload className="w-3.5 h-3.5 text-teal-600" />
                      <span>อัปโหลดรูปภาพ</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarFile} 
                        className="hidden" 
                      />
                    </label>

                    {/* URL toggle */}
                    <button
                      type="button"
                      onClick={() => setShowCustomUrl(!showCustomUrl)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-stone-300 hover:border-stone-400 text-xs font-semibold text-slate-600 hover:bg-stone-50 cursor-pointer shadow-2xs transition-all"
                    >
                      <Camera className="w-3.5 h-3.5 text-slate-500" />
                      <span>ใส่ลิงก์รูปภาพ</span>
                    </button>
                  </div>

                  {showCustomUrl && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="url"
                        placeholder="https://example.com/avatar.jpg"
                        value={editPhoto}
                        onChange={(e) => setEditPhoto(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-xl outline-none focus:border-teal-500"
                      />
                    </div>
                  )}

                  {/* Preset Emojis */}
                  <div>
                    <span className="text-[11px] font-semibold text-stone-500 block mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>หรือเลือกอวาตาร์สำเร็จรูป:</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {AVATAR_PRESETS.map((emoji) => {
                        const avatarUri = createEmojiAvatar(emoji);
                        const isSelected = editPhoto === avatarUri;

                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setEditPhoto(avatarUri);
                              setProfileError('');
                            }}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-base transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-teal-100 border-2 border-teal-600 scale-105 shadow-2xs' 
                                : 'bg-white hover:bg-stone-100 border border-stone-200'
                            }`}
                            title={`เลือกอวาตาร์ ${emoji}`}
                          >
                            {emoji}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Display Name */}
            <div>
              <label className="block font-display text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                ชื่อที่แสดงในระบบ (Display Name)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="เช่น มานี รักดี, ช่างไอที"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50/70 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all font-medium"
                />
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                ชื่อนี้จะปรากฏบนตั๋วเคลม ประกาศของหาย/พบของ และข้อความแชตของคุณ
              </p>
            </div>

            {/* 3. Account Email (Read-only) */}
            <div>
              <label className="block font-display text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                อีเมลบัญชีผู้ใช้
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled
                  value={currentUser.email || 'ไม่มีข้อมูลอีเมล'}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-xs text-stone-600 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={profileSaving}
                className="w-full bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {profileSaving ? (
                  <span>กำลังบันทึก...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>บันทึกการเปลี่ยนแปลงโปรไฟล์</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Actions Links */}
          <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Link
                to="/my-posts"
                className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-teal-50 text-stone-700 hover:text-teal-800 font-semibold transition-colors"
              >
                ติดตามประกาศของฉัน
              </Link>
              <Link
                to="/report/lost"
                className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold transition-colors"
              >
                + ลงประกาศสิ่งของ
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1 text-rose-500 hover:text-rose-700 hover:underline cursor-pointer py-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ลบบัญชีของฉัน</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-3 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-display text-base font-bold text-slate-900 mb-1">ยืนยันการลบบัญชี</h3>
              <p className="text-slate-500 text-xs mb-5">
                บัญชีและข้อมูลของคุณจะถูกลบออกจากระบบอย่างถาวร
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deletingAccount}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={handleDeleteMyAccount}
                  disabled={deletingAccount}
                  className="flex-1 py-2 bg-rose-600 text-white font-semibold text-xs rounded-xl hover:bg-rose-700 shadow-sm cursor-pointer"
                >
                  {deletingAccount ? 'กำลังลบ...' : 'ยืนยันลบบัญชี'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="grid md:grid-cols-12 gap-6 items-start">
        {/* Main Auth Form (7 cols) */}
        <div className="md:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              {authMode === 'signin' ? 'เข้าสู่ระบบ' : 'สร้างบัญชีผู้ใช้'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {authMode === 'signin' ? 'ลงชื่อเข้าใช้เพื่อจัดการประกาศของคุณ' : 'กรอกข้อมูลเพื่อเริ่มต้นใช้งาน'}
            </p>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs shadow-xs transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>ดำเนินการต่อด้วย Google</span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="bg-white px-2.5 text-slate-400 font-medium">หรือ</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 text-teal-700 bg-teal-50 border border-teal-200 p-2.5 rounded-xl text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={authMode === 'signin' ? handleEmailLogin : handleRegister} className="space-y-3.5">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อที่แสดงในประกาศ
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="เช่น สมชาย, มานี"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-teal-500 focus:bg-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                อีเมล
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-teal-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm transition-all disabled:opacity-50 mt-1"
            >
              {loading ? 'กำลังดำเนินการ...' : authMode === 'signin' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>
          </form>

          {/* Toggle Signin / Register */}
          <div className="text-center pt-2 border-t border-slate-100">
            {authMode === 'signin' ? (
              <p className="text-xs text-slate-500">
                ยังไม่มีบัญชี?{' '}
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setError(''); }}
                  className="font-bold text-teal-700 hover:underline"
                >
                  สมัครสมาชิก
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                มีบัญชีแล้ว?{' '}
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setError(''); }}
                  className="font-bold text-teal-700 hover:underline"
                >
                  เข้าสู่ระบบ
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Side Options: Guest & Admin (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          {/* Guest Mode Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2.5">
            <h3 className="text-sm font-bold text-slate-900">ใช้งานแบบ Guest</h3>
            <p className="text-xs text-slate-500">
              ลงประกาศได้ทันทีโดยไม่ต้องเข้าสู่ระบบ
            </p>
            <Link
              to="/report/lost"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-800 text-xs font-semibold transition-all border border-slate-100 group"
            >
              <span>ไปหน้าลงประกาศ</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Admin Access Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2.5">
            <h3 className="text-sm font-bold text-slate-900">สำหรับเจ้าหน้าที่</h3>
            {!showAdminLogin ? (
              <button
                type="button"
                onClick={() => { setShowAdminLogin(true); setError(''); }}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-between transition-colors border border-slate-100"
              >
                <span>เข้าสู่ระบบ Admin</span>
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ) : (
              <form onSubmit={handleAdminAuth} className="space-y-2">
                <input
                  type="password"
                  autoFocus
                  placeholder="รหัสผ่าน Admin"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-teal-500"
                />
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setShowAdminLogin(false); setAdminPassword(''); }}
                    className="flex-1 bg-slate-100 text-slate-600 py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-200"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-teal-700 text-white py-1.5 rounded-xl text-xs font-semibold hover:bg-teal-800"
                  >
                    ยืนยัน
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
