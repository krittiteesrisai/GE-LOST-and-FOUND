import { useState, FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Mail, 
  CheckCircle2, 
  LogOut,
  AlertCircle,
  UserCheck
} from 'lucide-react';

export default function Login() {
  const { 
    user, 
    isAdmin, 
    loginWithGoogle, 
    loginWithEmail, 
    registerWithEmail, 
    loginAsAdmin, 
    logout 
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // Mode state: 'user' | 'register' | 'admin'
  const [authMode, setAuthMode] = useState<'signin' | 'register' | 'admin'>('signin');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err?.message?.includes('popup-closed') 
        ? 'ปิดหน้าต่างเข้าสู่ระบบก่อนทำรายการสำเร็จ' 
        : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google');
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
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found') {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else if (err?.code === 'auth/invalid-email') {
        setError('รูปแบบอีเมลไม่ถูกต้อง');
      } else {
        setError('เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('กรุณาระบุชื่อผู้ใช้งานที่จะแสดงในประกาศ');
      return;
    }
    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    if (password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await registerWithEmail(email, password, displayName.trim());
      setSuccessMsg('สมัครสมาชิกสำเร็จ!');
      setTimeout(() => navigate('/'), 1000);
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/email-already-in-use') {
        setError('อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบแทน');
      } else {
        setError('ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin Login
  const handleAdminAuth = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const success = loginAsAdmin(adminPassword);
    if (success) {
      navigate('/admin');
    } else {
      setError('รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง');
    }
  };

  // If already logged in
  if (user || isAdmin) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <UserCheck className="w-8 h-8" />
          </div>
          
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2">
            {isAdmin ? '🛡️ ผู้ดูแลระบบ (Admin)' : '👤 เข้าสู่ระบบแล้ว'}
          </span>

          <h2 className="text-xl font-bold text-slate-900 mb-1">
            {isAdmin ? 'เจ้าหน้าที่ดูแลระบบ' : (user?.displayName || 'ผู้ใช้งานระบบ')}
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            {user?.email || 'สิทธิ์การจัดการระบบเต็มรูปแบบ'}
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 mb-6 space-y-1">
            <p className="font-semibold text-slate-900">สถานะการลงประกาศ:</p>
            <p>• เมื่อคุณลงประกาศ รายการจะแสดงชื่อผู้โพสต์เป็น <span className="font-bold text-orange-600">"{user?.displayName || 'คุณ'}"</span></p>
            <p>• คุณสามารถกลับมาแก้ไขประกาศของคุณได้</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/report/lost"
              className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors text-center"
            >
              ไปลงประกาศ
            </Link>
            <button
              onClick={async () => {
                await logout();
              }}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 mb-3">
          <Lock className="w-3.5 h-3.5" /> ระบบบัญชีผู้ใช้งาน
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          เข้าสู่ระบบ หรือเลือกใช้งานแบบ Guest
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-lg mx-auto">
          เข้าสู่ระบบเพื่อให้ประกาศระบุชื่อของคุณ หรือใช้งานแบบ Guest ได้ทันทีโดยไม่ต้องเข้าสู่ระบบ
        </p>
      </div>

      <div className="grid md:grid-cols-12 gap-6 items-start">
        {/* Main User Auth Box (7 cols) */}
        <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm">
          {/* Tabs: Sign In vs Register */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setError(''); }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                authMode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              เข้าสู่ระบบ (User)
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setError(''); }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                authMode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              สมัครสมาชิกใหม่
            </button>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1-Click Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>เข้าสู่ระบบด่วนด้วย Google</span>
          </button>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-xs text-slate-400 font-medium">
              หรือใช้อีเมล
            </span>
          </div>

          {/* Form */}
          <form onSubmit={authMode === 'signin' ? handleEmailLogin : handleRegister} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ชื่อที่ต้องการให้แสดงในประกาศ *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="เช่น กฤตติพงศ์ หรือ สมชาย ใจดี"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                อีเมล *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                รหัสผ่าน *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs sm:text-sm shadow-sm transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'กำลังดำเนินการ...' : authMode === 'signin' ? 'เข้าสู่ระบบ' : 'สร้างบัญชีผู้ใช้งาน'}
            </button>
          </form>
        </div>

        {/* Side Options: Guest & Admin (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          {/* Guest Mode Card */}
          <div className="bg-white p-6 rounded-3xl border border-orange-200/90 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                  ไม่ต้องสมัคร
                </span>
                <h3 className="text-base font-bold text-slate-900">ใช้งานแบบ Guest</h3>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              คุณสามารถดูรายการหรือลงประกาศตามหา/แจ้งพบของได้ทันทีโดยไม่ต้องล็อกอิน ซึ่งในประกาศจะระบุชื่อผู้ลงเป็น <strong className="text-slate-800 font-semibold">"Guest"</strong>
            </p>

            <Link
              to="/report/lost"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-orange-50 hover:bg-orange-100/80 text-orange-800 text-xs font-bold transition-all group"
            >
              <span>ไปลงประกาศในฐานะ Guest</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Admin / Staff Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  สำหรับเจ้าหน้าที่
                </span>
                <h3 className="text-base font-bold text-slate-900">ผู้ดูแลระบบ (Admin)</h3>
              </div>
            </div>

            {authMode !== 'admin' ? (
              <button
                type="button"
                onClick={() => { setAuthMode('admin'); setError(''); }}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-between transition-colors"
              >
                <span>เข้าสู่ระบบด้วยรหัสแอดมิน</span>
                <KeyRound className="w-4 h-4 text-slate-400" />
              </button>
            ) : (
              <form onSubmit={handleAdminAuth} className="space-y-3 animate-in fade-in duration-150">
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    autoFocus
                    placeholder="รหัสผ่านเจ้าหน้าที่"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signin'); setAdminPassword(''); }}
                    className="flex-1 bg-slate-100 text-slate-700 py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-200"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-slate-900 text-white py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-800"
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
