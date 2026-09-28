import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMyItems } from '../hooks/useMyItems';
import { LogOut, Menu, X, PlusCircle, Shield, Compass, Package, Headphones } from 'lucide-react';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, effectiveUser, isAdmin, logout } = useAuth();
  const { totalCount } = useMyItems();
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
    <header className="sticky top-0 z-50 bg-[#fdfbf7]/95 backdrop-blur-md border-b-2 border-amber-900/20 shadow-[0_2px_15px_-3px_rgba(120,53,15,0.08)] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Wordmark - Wild West Cowboy theme */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group active:scale-95 transition-all duration-150">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-800 via-amber-900 to-stone-900 flex items-center justify-center text-amber-100 shadow-md border-2 border-amber-600/50 group-hover:rotate-6 transition-transform duration-200">
              <span className="text-xl">🤠</span>
            </div>
            <div className="flex flex-col leading-tight text-left">
              <div className="flex items-baseline gap-1.5">
                <span className="font-western font-black text-base sm:text-lg text-stone-900 tracking-wide">WILD WEST</span>
                <span className="font-display font-black text-sm sm:text-base text-amber-800 tracking-tight">LOST & FOUND</span>
              </div>
              <span className="text-[10px] font-bold text-amber-900/70 tracking-wider uppercase flex items-center gap-1">
                <span>★</span>
                <span>กระดานของหายแดนคาวบอย</span>
                <span>★</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium bg-[#f5ede1] p-1.5 rounded-2xl border border-amber-900/20">
            <Link
              to="/"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                location.pathname === '/'
                  ? 'text-amber-950 bg-white shadow-xs font-black'
                  : 'text-stone-700 hover:text-stone-950 hover:bg-white/60'
              }`}
            >
              หน้าแรก
            </Link>
            <Link
              to="/list"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                location.pathname === '/list'
                  ? 'text-amber-950 bg-white shadow-xs font-black'
                  : 'text-stone-700 hover:text-stone-950 hover:bg-white/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-amber-800" />
              <span>กระดานประกาศ (Bounty Board)</span>
            </Link>
            <Link
              to="/my-posts"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                location.pathname === '/my-posts'
                  ? 'text-amber-950 bg-white shadow-xs font-black'
                  : 'text-stone-700 hover:text-stone-950 hover:bg-white/60'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-amber-800" />
              <span>ประกาศของฉัน</span>
              {totalCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-800 text-white text-[10px] font-bold">
                  {totalCount}
                </span>
              )}
            </Link>
          </nav>

          {/* Action Zone & User / Admin Controls */}
          <div className="hidden sm:flex items-center gap-3">
            {isAdmin ? (
              <div className="flex items-center gap-2 pl-3 border-l border-amber-900/20">
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-amber-950 bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-300 border border-amber-500/60 hover:brightness-105 rounded-xl transition-all shadow-2xs active:scale-95"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-900 fill-amber-700" />
                  <span>★ สำนักงานนายอำเภอ</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors active:scale-95 cursor-pointer"
                  title="ออกจากระบบแอดมิน"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : currentUser ? (
              <div className="flex items-center gap-2 pl-3 border-l border-amber-900/20">
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-stone-800 bg-white/90 border border-amber-900/20 hover:border-amber-700 rounded-xl transition-all active:scale-95"
                  title={currentUser.email || ''}
                >
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="" className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-amber-800 text-white flex items-center justify-center text-[10px]">
                      {currentUser.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <span className="max-w-[110px] truncate">{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors active:scale-95 cursor-pointer"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs font-bold text-amber-900 hover:text-amber-950 px-3.5 py-2 rounded-xl hover:bg-amber-100/50 transition-colors active:scale-95"
              >
                เข้าสู่ระบบ
              </Link>
            )}

            <Link
              to="/report/lost"
              className="flex items-center gap-2 bg-gradient-to-r from-amber-800 via-amber-900 to-stone-900 hover:from-amber-900 hover:to-black text-amber-50 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-sm shadow-amber-900/20 active:scale-95 transition-all border border-amber-700/40"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>+ ปักป้ายตามหา / แจ้งพบ</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
              to="/my-posts"
              className="relative p-2 text-slate-600 hover:text-teal-700 rounded-xl hover:bg-slate-100 active:scale-90"
              title="ประกาศของฉัน"
            >
              <Package className="w-5 h-5" />
              {totalCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal-600" />
              )}
            </Link>
            <Link
              to="/report/lost"
              className="bg-teal-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all"
            >
              ลงประกาศ
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 active:scale-90"
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
              to="/my-posts"
              className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold ${
                location.pathname === '/my-posts' ? 'bg-teal-50 text-teal-800' : 'text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-teal-600" />
                <span>ติดตามประกาศของฉัน</span>
              </div>
              {totalCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-bold">
                  {totalCount}
                </span>
              )}
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
