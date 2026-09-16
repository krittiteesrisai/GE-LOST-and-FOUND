import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldUser } from 'lucide-react';

export default function Login() {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGuest = () => {
    navigate('/');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin') {
      sessionStorage.setItem('isAdmin', 'true');
      navigate('/admin');
    } else {
      setError('รหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-12">
      <h1 className="text-3xl font-bold text-center text-gray-900 mb-10">เข้าสู่ระบบ</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Guest Card */}
        <div 
          onClick={handleGuest}
          className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 cursor-pointer hover:border-orange-500 hover:shadow-md transition-all flex flex-col items-center text-center group"
        >
          <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">เข้าใช้งานทั่วไป (Guest)</h2>
          <p className="text-gray-500">สำหรับนักศึกษาและบุคลากร ดูรายการ แจ้งของหาย และแจ้งพบของ โดยไม่ต้องใช้รหัสผ่าน</p>
        </div>

        {/* Admin Card */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gray-50 text-gray-700 rounded-full flex items-center justify-center mb-4">
            <ShieldUser className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">ผู้ดูแลระบบ (Admin)</h2>
          <p className="text-gray-500 mb-6">สำหรับเจ้าหน้าที่ จัดการประกาศและลบข้อมูล</p>
          
          {!showAdminLogin ? (
            <button 
              onClick={() => setShowAdminLogin(true)}
              className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors w-full"
            >
              เข้าสู่ระบบ Admin
            </button>
          ) : (
            <form onSubmit={handleAdminLogin} className="w-full space-y-4">
              {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
              <input 
                type="password" 
                placeholder="รหัสผ่าน (admin)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 text-center"
                autoFocus
              />
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => { setShowAdminLogin(false); setError(''); setPassword(''); }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors"
                >
                  ยืนยัน
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
