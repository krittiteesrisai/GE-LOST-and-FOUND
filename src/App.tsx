import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import Home from './pages/Home';
import ItemsList from './pages/ItemsList';
import ReportForm from './pages/ReportForm';
import ItemDetail from './pages/ItemDetail';
import Admin from './pages/Admin';
import Login from './pages/Login';
import MyPosts from './pages/MyPosts';
import Help from './pages/Help';
import { HeartHandshake, ShieldCheck, Sparkles, HelpCircle, MessageSquare } from 'lucide-react';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#f7fafc] flex flex-col font-sans text-slate-800 selection:bg-teal-500/20 selection:text-teal-900">
          <Navbar />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/list" element={<ItemsList />} />
              <Route path="/my-posts" element={<MyPosts />} />
              <Route path="/report" element={<ReportForm />} />
              <Route path="/report/:type" element={<ReportForm />} />
              <Route path="/edit/:id" element={<ReportForm />} />
              <Route path="/item/:id" element={<ItemDetail />} />
              <Route path="/help" element={<Help />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </main>
          
          {/* Dental Clinic Aesthetic Footer */}
          <footer className="bg-white/90 backdrop-blur-md border-t border-slate-200/80 mt-auto">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs text-slate-500">
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-400 flex items-center justify-center text-white shadow-sm shadow-teal-500/25">
                      <span className="text-base font-bold">✦</span>
                    </div>
                    <span className="font-extrabold text-base text-slate-900 tracking-tight">Campus <span className="text-teal-600">Lost&Found</span></span>
                  </div>
                  <p className="text-slate-500 max-w-sm leading-relaxed text-xs">
                    ระบบแจ้งของหายและของพบภายในมหาวิทยาลัย ออกแบบด้วยแนวคิดความโปร่งใส สะอาดตา ใช้งานง่าย และส่งต่อรอยยิ้มในการพบของคืนเจ้าของ
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-teal-700 font-medium">
                    <span className="inline-flex items-center gap-1 bg-teal-50 border border-teal-200/70 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3 text-teal-600" /> มหาวิทยาลัยดูแลร่วมกับนักศึกษา
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">เมนูระบบ</h4>
                  <ul className="space-y-2">
                    <li><Link to="/" className="hover:text-teal-600 transition-colors">หน้าแรก (Home)</Link></li>
                    <li><Link to="/list" className="hover:text-teal-600 transition-colors">ค้นหารายการทั้งหมด</Link></li>
                    <li><Link to="/report/lost" className="hover:text-teal-600 transition-colors">แจ้งสิ่งของสูญหาย</Link></li>
                    <li><Link to="/report/found" className="hover:text-teal-600 transition-colors">แจ้งเก็บของได้</Link></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">ความช่วยเหลือ</h4>
                  <ul className="space-y-2">
                    <li>
                      <Link to="/help" className="hover:text-teal-600 transition-colors">
                        ติดต่อเจ้าหน้าที่ / ศูนย์ช่วยเหลือ
                      </Link>
                    </li>
                    <li><Link to="/login" className="hover:text-teal-600 transition-colors">เข้าสู่ระบบผู้ใช้งาน</Link></li>
                    <li><Link to="/login" className="hover:text-teal-600 transition-colors">เจ้าหน้าที่ดูแลระบบ (Admin)</Link></li>
                    <li className="text-slate-400 text-[11px]">ติดต่อจุดรับฝากของ: อาคาร 1 ชั้น 1</li>
                  </ul>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
                <p>วิทยาลัยการคอมพิวเตอร์ (กลุ่มการเรียนที่ 17 กลุ่มย่อยที่ 7)</p>
                <p>&copy; {new Date().getFullYear()} Campus Lost & Found. Crafted with Care.</p>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}
