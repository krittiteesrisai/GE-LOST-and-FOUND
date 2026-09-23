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
  EyeOff,
  Trash2,
  AlertTriangle
} from 'lucide-react';

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
  } : null);

  // Logged In View
  if (currentUser || isAdmin) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="bg-white p-7 rounded-3xl border border-slate-200/90 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto border border-teal-100">
            {isAdmin ? <ShieldCheck className="w-7 h-7" /> : <User className="w-7 h-7" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isAdmin ? 'ผู้ดูแลระบบ (Admin)' : currentUser?.displayName || 'ผู้ใช้งาน'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAdmin ? 'สิทธิ์จัดการระบบ' : currentUser?.email}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/report/lost"
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm transition-colors"
            >
              ลงประกาศสิ่งของ
            </Link>
            
            <button
              onClick={async () => {
                await logout();
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              ออกจากระบบ
            </button>

            {!isAdmin && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center justify-center gap-1.5 text-xs text-rose-500 hover:text-rose-700 hover:underline pt-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ลบบัญชีผู้ใช้ของฉัน
              </button>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-3 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">ยืนยันการลบบัญชี</h3>
              <p className="text-slate-500 text-xs mb-5">
                บัญชีและข้อมูลของคุณจะถูกลบออกจากระบบ
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deletingAccount}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200"
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={handleDeleteMyAccount}
                  disabled={deletingAccount}
                  className="flex-1 py-2 bg-rose-600 text-white font-semibold text-xs rounded-xl hover:bg-rose-700 shadow-sm"
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
