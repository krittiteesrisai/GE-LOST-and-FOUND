import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X, PlusCircle, Shield, Compass, User as UserIcon } from 'lucide-react';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Wordmark */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-sm shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <span className="text-lg">🎒</span>
            </div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">Campus</span>
              <span className="font-semibold text-lg text-orange-600 tracking-tight">Lost&Found</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              to="/"
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                location.pathname === '/'
                  ? 'text-slate-900 bg-slate-100 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              หน้าแรก
            </Link>
            <Link
              to="/list"
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                location.pathname === '/list'
                  ? 'text-slate-900 bg-slate-100 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-4 h-4 text-slate-500" />
              รายการทั้งหมด
            </Link>
          </nav>

          {/* Action Zone & User / Admin Controls */}
          <div className="hidden sm:flex items-center gap-3">
            {isAdmin ? (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  จัดการระบบ
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="ออกจากระบบแอดมิน"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : user ? (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  title={user.email || ''}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-4 h-4 rounded-full" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-orange-600" />
                  )}
                  <span className="max-w-[100px] truncate">{user.displayName || user.email?.split('@')[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                เข้าสู่ระบบ
              </Link>
            )}

            <Link
              to="/report/lost"
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm hover:shadow active:scale-[0.98] transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5 text-orange-400" />
              <span>ลงประกาศ</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
              to="/report/lost"
              className="bg-slate-900 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium"
            >
              ลงประกาศ
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="เปิดเมนู"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200/80 py-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                location.pathname === '/' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600'
              }`}
            >
              หน้าแรก
            </Link>
            <Link
              to="/list"
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                location.pathname === '/list' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600'
              }`}
            >
              รายการทั้งหมด
            </Link>
            <Link
              to="/report/lost"
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-orange-600 hover:bg-orange-50"
            >
              + ลงประกาศสิ่งของ
            </Link>

            <div className="pt-2 border-t border-slate-200/60 mt-2 flex items-center justify-between px-3">
              {isAdmin ? (
                <>
                  <Link to="/admin" className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-600" />
                    แผงควบคุมผู้ดูแล
                  </Link>
                  <button onClick={handleLogout} className="text-xs text-rose-600 font-medium">
                    ออกจากระบบ
                  </button>
                </>
              ) : user ? (
                <>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                    <UserIcon className="w-4 h-4 text-orange-600" />
                    <span>{user.displayName || user.email?.split('@')[0]}</span>
                  </div>
                  <button onClick={handleLogout} className="text-xs text-rose-600 font-medium">
                    ออกจากระบบ
                  </button>
                </>
              ) : (
                <Link to="/login" className="text-sm font-medium text-orange-600">
                  เข้าสู่ระบบ
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
