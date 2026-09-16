import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, LogOut } from 'lucide-react';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(sessionStorage.getItem('isAdmin') === 'true');
  }, [location]);

  const handleLogout = () => {
    sessionStorage.removeItem('isAdmin');
    setIsAdmin(false);
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-1.5">
              <span className="text-orange-500 font-bold text-xl">Campus</span>
              <span className="text-gray-900 font-bold text-xl">Lost & Found</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium hidden md:block">
              หน้าหลัก
            </Link>
            <Link to="/list" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1">
              <Search className="w-4 h-4" />
              ค้นหาของ
            </Link>
            <Link to="/report/lost" className="bg-orange-50 text-orange-600 hover:bg-orange-100 px-3 py-2 rounded-md text-sm font-medium hidden sm:block">
              แจ้งของหาย
            </Link>
            <Link to="/report/found" className="bg-green-50 text-green-700 hover:bg-green-100 px-3 py-2 rounded-md text-sm font-medium hidden sm:block">
              แจ้งพบของ
            </Link>

            {/* Auth Controls */}
            <div className="ml-2 pl-4 border-l border-gray-200 flex items-center gap-3">
              {isAdmin ? (
                <>
                  <Link to="/admin" className="text-sm font-medium text-gray-900 hover:text-orange-600">
                    Admin Panel
                  </Link>
                  <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="ออกจากระบบ">
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                  เข้าสู่ระบบ
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
