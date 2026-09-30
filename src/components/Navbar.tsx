import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMyItems } from '../hooks/useMyItems';
import { LogOut, Menu, X, PlusCircle, Shield, Compass, Package, Headphones, User as UserIcon } from 'lucide-react';

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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.06)] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Wordmark */}
          <Link to="/" className="flex items-center gap-3 group active:scale-95 transition-all duration-150">
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

          {/* Desktop Navigation Links - High Contrast & Clear Active State */}
          <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium bg-slate-100/90 p-1.5 rounded-2xl border border-slate-300/80 shadow-xs">
            <Link
              to="/"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                location.pathname === '/'
                  ? 'text-white bg-teal-800 shadow-md ring-1 ring-teal-900/20'
                  : 'text-slate-700 hover:text-teal-950 hover:bg-white/80'
              }`}
            >
              หน้าแรก
            </Link>
            <Link
              to="/list"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                location.pathname === '/list'
                  ? 'text-white bg-teal-800 shadow-md ring-1 ring-teal-900/20'
                  : 'text-slate-700 hover:text-teal-950 hover:bg-white/80'
              }`}
            >
              <Compass className={`w-3.5 h-3.5 ${location.pathname === '/list' ? 'text-teal-200' : 'text-teal-700'}`} />
              <span>กระดานตามหาของหาย</span>
            </Link>
            <Link
              to="/my-posts"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                location.pathname === '/my-posts'
                  ? 'text-white bg-teal-800 shadow-md ring-1 ring-teal-900/20'
                  : 'text-slate-700 hover:text-teal-950 hover:bg-white/80'
              }`}
            >
              <Package className={`w-3.5 h-3.5 ${location.pathname === '/my-posts' ? 'text-teal-200' : 'text-teal-700'}`} />
              <span>ประกาศของฉัน</span>
              {totalCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  location.pathname === '/my-posts'
                    ? 'bg-white text-teal-900 shadow-2xs'
                    : 'bg-teal-700 text-white'
                }`}>
                  {totalCount}
                </span>
              )}
            </Link>
          </nav>

          {/* Action Zone & User / Admin Controls */}
          <div className="hidden sm:flex items-center gap-3">
            {isAdmin ? (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200/80">
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-900 bg-teal-50 border border-teal-200/80 hover:bg-teal-100/80 rounded-xl transition-colors active:scale-95"
                >
                  <Shield className="w-3.5 h-3.5 text-teal-600" />
                  แผงจัดการระบบ
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors active:scale-95 cursor-pointer"
                  title="ออกจากระบบแอดมิน"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : currentUser ? (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200/80">
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200/80 hover:bg-teal-50 hover:border-teal-200 rounded-xl transition-all active:scale-95"
                  title={currentUser.email || ''}
                >
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="" className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">
                      {currentUser.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <span className="max-w-[110px] truncate">{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors active:scale-95 cursor-pointer"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-600 hover:text-teal-700 px-3.5 py-2 rounded-xl hover:bg-teal-50/50 transition-colors active:scale-95"
              >
                เข้าสู่ระบบ
              </Link>
            )}

            <Link
              to="/report/lost"
              className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-sm shadow-teal-600/25 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-cyan-200" />
              <span>ลงประกาศสิ่งของ</span>
            </Link>
          </div>

          {/* Mobile Right Controls - Always show user avatar or login icon + post + menu */}
          <div className="flex sm:hidden items-center gap-1.5">
            {/* User Avatar or Direct Login Button on Mobile Header */}
            {isAdmin ? (
              <Link
                to="/admin"
                className="p-1.5 text-teal-800 bg-teal-50 border border-teal-200 rounded-xl active:scale-90"
                title="แผงแอดมิน"
              >
                <Shield className="w-4 h-4 text-teal-600" />
              </Link>
            ) : currentUser ? (
              <Link
                to="/login"
                className="p-1 rounded-full border border-teal-300 hover:ring-2 hover:ring-teal-200 active:scale-90 transition-all shrink-0"
                title={`โปรไฟล์: ${currentUser.displayName || currentUser.email}`}
              >
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold border border-teal-200 active:scale-95 transition-all shrink-0"
                title="เข้าสู่ระบบ"
              >
                <UserIcon className="w-3.5 h-3.5 text-teal-600" />
                <span>เข้าสู่ระบบ</span>
              </Link>
            )}

            <Link
              to="/my-posts"
              className="relative p-1.5 text-slate-600 hover:text-teal-700 rounded-xl hover:bg-slate-100 active:scale-90"
              title="ประกาศของฉัน"
            >
              <Package className="w-4 h-4" />
              {totalCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal-600 ring-2 ring-white" />
              )}
            </Link>

            <Link
              to="/report/lost"
              className="bg-teal-600 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all shrink-0"
            >
              ลงประกาศ
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 active:scale-90"
              aria-label="เปิดเมนู"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu - High Contrast & Clear Active State */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200/90 py-3 space-y-2 bg-slate-50/95 -mx-4 px-4 shadow-lg animate-fadeIn">
            {/* Prominent Login/User Card at top of mobile drawer */}
            <div className="p-3 rounded-2xl bg-white border border-teal-100 shadow-2xs">
              {isAdmin ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">ผู้ดูแลระบบ (Admin)</div>
                      <div className="text-[10px] text-teal-600 font-medium">จัดการประกาศและผู้ใช้</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Link to="/admin" className="px-2.5 py-1 bg-teal-700 text-white rounded-lg text-[11px] font-bold">
                      แผงควบคุม
                    </Link>
                    <button onClick={handleLogout} className="p-1 text-slate-400 hover:text-rose-600 rounded-lg">
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : currentUser ? (
                <div className="flex items-center justify-between gap-2">
                  <Link to="/login" className="flex items-center gap-2.5 min-w-0">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {currentUser.displayName || currentUser.email}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {currentUser.email}
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link to="/login" className="px-2 py-1 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg">
                      โปรไฟล์
                    </Link>
                    <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg" title="ออกจากระบบ">
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">ยังไม่ได้เข้าสู่ระบบ</div>
                      <div className="text-[10px] text-slate-500">ลงชื่อเข้าใช้เพื่อจัดการประกาศ</div>
                    </div>
                  </div>
                  <Link
                    to="/login"
                    className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
                  >
                    เข้าสู่ระบบ
                  </Link>
                </div>
              )}
            </div>

            <Link
              to="/"
              className={`block px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                location.pathname === '/' 
                  ? 'bg-teal-800 text-white shadow-xs' 
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white'
              }`}
            >
              หน้าแรก
            </Link>
            <Link
              to="/list"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                location.pathname === '/list' 
                  ? 'bg-teal-800 text-white shadow-xs' 
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white'
              }`}
            >
              <Compass className={`w-4 h-4 ${location.pathname === '/list' ? 'text-teal-200' : 'text-teal-700'}`} />
              <span>กระดานตามหาของหาย</span>
            </Link>
            <Link
              to="/my-posts"
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                location.pathname === '/my-posts' 
                  ? 'bg-teal-800 text-white shadow-xs' 
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className={`w-4 h-4 ${location.pathname === '/my-posts' ? 'text-teal-200' : 'text-teal-700'}`} />
                <span>ติดตามประกาศของฉัน</span>
              </div>
              {totalCount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  location.pathname === '/my-posts'
                    ? 'bg-white text-teal-900'
                    : 'bg-teal-700 text-white'
                }`}>
                  {totalCount}
                </span>
              )}
            </Link>
            <Link
              to="/report/lost"
              className="block px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-white"
            >
              แจ้งของหาย
            </Link>
            <Link
              to="/report/found"
              className="block px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-white"
            >
              แจ้งพบของ
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
