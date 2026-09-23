import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X, PlusCircle, Shield, Compass } from 'lucide-react';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, effectiveUser, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentUser = effectiveUser || (user ? {
    displayName: user.displayName || user.email?.split('@')[0],
    email: user.email,
    photoURL: user.photoURL
  } : null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-teal-100 shadow-[0_2px_15px_-3px_rgba(15,118,110,0.05)] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Wordmark */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200">
              <span className="text-xl">🎒</span>
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">Campus</span>
                <span className="font-bold text-lg text-teal-600 tracking-tight">Lost&Found</span>
              </div>
              <span className="text-[10px] font-semibold text-teal-700/80 tracking-wider uppercase">
                Care & Return Center
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium bg-slate-50/80 p-1.5 rounded-2xl border border-slate-200/60">
            <Link
              to="/"
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                location.pathname === '/'
                  ? 'text-teal-950 bg-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              หน้าแรก
            </Link>
            <Link
              to="/list"
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                location.pathname === '/list'
                  ? 'text-teal-950 bg-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-teal-600" />
              รายการทั้งหมด
            </Link>
          </nav>

          {/* Action Zone & User / Admin Controls */}
          <div className="hidden sm:flex items-center gap-3">
            {isAdmin ? (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200/80">
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-900 bg-teal-50 border border-teal-200/80 hover:bg-teal-100/80 rounded-xl transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-teal-600" />
                  แผงจัดการระบบ
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="ออกจากระบบแอดมิน"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : currentUser ? (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200/80">
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200/80 hover:bg-teal-50 hover:border-teal-200 rounded-xl transition-all"
                  title={currentUser.email || ''}
                >
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="" className="w-4 h-4 rounded-full" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">
                      {currentUser.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <span className="max-w-[110px] truncate">{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-600 hover:text-teal-700 px-3.5 py-2 rounded-xl hover:bg-teal-50/50 transition-colors"
              >
                เข้าสู่ระบบ
              </Link>
            )}

            <Link
              to="/report/lost"
              className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-sm shadow-teal-600/25 active:scale-[0.98] transition-all"
            >
              <PlusCircle className="w-4 h-4 text-cyan-200" />
              <span>ลงประกาศสิ่งของ</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
              to="/report/lost"
              className="bg-teal-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm"
            >
              ลงประกาศ
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
              aria-label="เปิดเมนู"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-100 py-3 space-y-2">
            <Link
              to="/"
              className={`block px-3.5 py-2 rounded-xl text-xs font-bold ${
                location.pathname === '/' ? 'bg-teal-50 text-teal-800' : 'text-slate-600'
              }`}
            >
              หน้าแรก
            </Link>
            <Link
              to="/list"
              className={`block px-3.5 py-2 rounded-xl text-xs font-bold ${
                location.pathname === '/list' ? 'bg-teal-50 text-teal-800' : 'text-slate-600'
              }`}
            >
              รายการทั้งหมด
            </Link>
            <Link
              to="/report/lost"
              className="block px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600"
            >
              แจ้งของหาย
            </Link>
            <Link
              to="/report/found"
              className="block px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600"
            >
              แจ้งพบของ
            </Link>
            <div className="pt-2 border-t border-slate-100">
              {isAdmin ? (
                <div className="flex items-center justify-between px-3.5 py-2">
                  <Link to="/admin" className="text-xs font-bold text-slate-900">
                    แผงควบคุม Admin
                  </Link>
                  <button onClick={handleLogout} className="text-xs text-rose-600 font-bold">
                    ออกจากระบบ
                  </button>
                </div>
              ) : currentUser ? (
                <div className="flex items-center justify-between px-3.5 py-2">
                  <span className="text-xs text-slate-700 font-bold">
                    {currentUser.displayName || currentUser.email}
                  </span>
                  <button onClick={handleLogout} className="text-xs text-rose-600 font-bold">
                    ออกจากระบบ
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="block px-3.5 py-2 rounded-xl text-xs font-bold text-teal-700"
                >
                  เข้าสู่ระบบ / บัญชีผู้ใช้
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
