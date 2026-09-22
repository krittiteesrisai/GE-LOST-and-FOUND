import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, ArrowRight, Lock, KeyRound, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGuest = () => {
    navigate('/');
  };

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    const adminPassword = (import.meta as any).env?.VITE_ADMIN_PASSWORD || 'admin';
    
    if (password === adminPassword) {
      sessionStorage.setItem('isAdmin', 'true');
      navigate('/admin');
    } else {
      setError('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 mb-3">
          <Lock className="w-3.5 h-3.5" /> ระบบยืนยันตัวตน
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          เลือกรูปแบบการเข้าใช้งาน
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto">
          นักศึกษาและบุคคลทั่วไปสามารถเข้าดูและแจ้งเรื่องได้ทันทีโดยไม่ต้องเข้าสู่ระบบ
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Guest Card */}
        <div 
          onClick={handleGuest}
          className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm cursor-pointer hover:border-orange-500 hover:shadow-md transition-all flex flex-col group relative overflow-hidden"
        >
          <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
            <User className="w-7 h-7" />
          </div>
          
          <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider mb-1">
            บุคคลทั่วไป / นักศึกษา
          </span>
          <h2 className="text-lg font-bold text-slate-900 mb-2">เข้าใช้งานทั่วไป (Guest)</h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            ค้นหารายการของหาย แจ้งเรื่องของหาย หรือแจ้งพบสิ่งของได้ทันที สะดวกรวดเร็ว
          </p>

          <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-orange-600 group-hover:text-orange-700">
            <span>เข้าสู่ระบบทั่วไป</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Admin Card */}
        <div className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col">
          <div className="w-14 h-14 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center mb-5">
            <ShieldCheck className="w-7 h-7" />
          </div>
          
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            เจ้าหน้าที่ / ผู้ดูแล
          </span>
          <h2 className="text-lg font-bold text-slate-900 mb-2">เจ้าหน้าที่ระบบ (Staff)</h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            สำหรับบุคลากรในการยืนยันส่งมอบ จัดการสถานะ และดูแลความเรียบร้อยของรายการ
          </p>
          
          <div className="mt-auto">
            {!showAdminLogin ? (
              <button 
                onClick={() => setShowAdminLogin(true)}
                className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
              >
                เข้าสู่ระบบสำหรับเจ้าหน้าที่
              </button>
            ) : (
              <form onSubmit={handleAdminLogin} className="w-full space-y-3">
                {error && (
                  <div className="text-rose-600 text-xs font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    {error}
                  </div>
                )}
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="รหัสผ่านเจ้าหน้าที่"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-10 py-2 text-xs sm:text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => { setShowAdminLogin(false); setError(''); setPassword(''); }}
                    className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-slate-900 text-white py-2 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    เข้าสู่ระบบ
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

