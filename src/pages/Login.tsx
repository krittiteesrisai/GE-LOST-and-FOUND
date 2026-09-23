import { useState, FormEvent } from 'react';
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
  EyeOff
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
  
  const [authMode, setAuthMode] = useState<'signin' | 'register' | 'admin'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
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
        setError('เบราว์เซอร์บล็อกหน้าต่างป๊อปอัป กรุณาอนุญาตการเปิดป๊อปอัปเพื่อเข้าสู่ระบบ');
      } else {
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google กรุณาลองใหม่อีกครั้ง');
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
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
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
      setSuccessMsg('สมัครสมาชิกสำเร็จแล้ว!');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/email-already-in-use') {
        setError('อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบแทน');
      } else if (err?.code === 'auth/invalid-email') {
        setError('รูปแบบอีเมลไม่ถูกต้อง');
      } else if (err?.code === 'auth/weak-password') {
        setError('รหัสผ่านคาดเดาง่ายเกินไป');
      } else {
        setError('เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่');
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
      setError('รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง');
    }
  };

  // Logged In Status Screen
  if (user || isAdmin) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="bg-white p-8 rounded-3xl border border-teal-100 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto border border-teal-100">
            <User className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-teal-700">เข้าสู่ระบบแล้ว</span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              {isAdmin ? 'บัญชีผู้ดูแลระบบ (Admin)' : user?.displayName || user?.email}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isAdmin ? 'มีสิทธิ์จัดการและแก้ไขทุกประกาศในระบบ' : user?.email}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/report/lost"
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-2xl text-xs sm:text-sm shadow-sm transition-colors"
            >
              ไปหน้าลงประกาศ
            </Link>
            <button
              onClick={async () => {
                await logout();
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
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
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 mb-3 shadow-xs">
          <Lock className="w-3.5 h-3.5 text-teal-600" /> ระบบบัญชีผู้ใช้งาน & สิทธิ์การดูแล
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
        <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-teal-100/90 shadow-xs">
          {/* Tabs: Sign In vs Register */}
          <div className="flex bg-teal-50/70 p-1.5 rounded-2xl mb-6 border border-teal-100">
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setError(''); }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                authMode === 'signin' ? 'bg-white text-teal-950 shadow-xs' : 'text-slate-600 hover:text-teal-900'
              }`}
            >
              เข้าสู่ระบบ (User)
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setError(''); }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                authMode === 'register' ? 'bg-white text-teal-950 shadow-xs' : 'text-slate-600 hover:text-teal-900'
              }`}
            >
              สมัครสมาชิกใหม่
            </button>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-center gap-2 text-teal-700 bg-teal-50 border border-teal-200 p-3 rounded-2xl text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1-Click Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-teal-100 hover:border-teal-300 bg-white hover:bg-teal-50/40 text-slate-700 font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400 font-medium">หรือเข้าสู่ระบบด้วยอีเมล</span>
            </div>
          </div>

          <form onSubmit={authMode === 'signin' ? handleEmailLogin : handleRegister} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ชื่อที่จะแสดงในประกาศ *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-teal-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="เช่น สมชาย ใจดี, มินนี่ อักษร"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                อีเมล *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-teal-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                รหัสผ่าน *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-teal-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
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
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold py-3 rounded-2xl text-xs sm:text-sm shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'กำลังดำเนินการ...' : authMode === 'signin' ? 'เข้าสู่ระบบ' : 'สร้างบัญชีผู้ใช้งาน'}
            </button>
          </form>
        </div>

        {/* Side Options: Guest & Admin (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          {/* Guest Mode Card */}
          <div className="bg-white p-6 rounded-3xl border border-teal-100 shadow-xs relative overflow-hidden">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold border border-teal-100">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">
                  ไม่ต้องสมัครสมาชิก
                </span>
                <h3 className="text-base font-bold text-slate-900">ใช้งานแบบ Guest</h3>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              คุณสามารถลงประกาศได้ทันที โดยเลือกใส่ชื่อของคุณเองหรือแสดงเป็น "Guest"
            </p>

            <Link
              to="/report/lost"
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-teal-50 hover:bg-teal-100/80 text-teal-800 text-xs font-bold transition-all group border border-teal-100"
            >
              <span>ไปลงประกาศในฐานะ Guest</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Admin / Staff Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center">
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
                className="w-full text-left p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-between transition-colors border border-slate-200/60"
              >
                <span>เข้าสู่ระบบด้วยรหัสแอดมิน</span>
                <KeyRound className="w-4 h-4 text-slate-400" />
              </button>
            ) : (
              <form onSubmit={handleAdminAuth} className="space-y-3">
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    autoFocus
                    placeholder="รหัสผ่านเจ้าหน้าที่"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-teal-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signin'); setAdminPassword(''); }}
                    className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-xl text-xs font-bold hover:bg-slate-200"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-teal-700 text-white py-2 rounded-xl text-xs font-bold hover:bg-teal-800"
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
