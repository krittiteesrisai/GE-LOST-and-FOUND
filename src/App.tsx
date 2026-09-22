import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import Home from './pages/Home';
import ItemsList from './pages/ItemsList';
import ReportForm from './pages/ReportForm';
import ItemDetail from './pages/ItemDetail';
import Admin from './pages/Admin';
import Login from './pages/Login';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-orange-500/20 selection:text-orange-900">
          <Navbar />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/list" element={<ItemsList />} />
              <Route path="/report" element={<ReportForm />} />
              <Route path="/report/:type" element={<ReportForm />} />
              <Route path="/edit/:id" element={<ReportForm />} />
              <Route path="/item/:id" element={<ItemDetail />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </main>
          
          {/* Modern Clean Footer */}
          <footer className="bg-white border-t border-slate-200/80 mt-auto">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">Campus Lost & Found</span>
                  <span>·</span>
                  <span>ระบบศูนย์รวมแจ้งของหาย-ของพบภายในมหาวิทยาลัย</span>
                </div>
                <div className="flex items-center gap-4">
                  <Link to="/list" className="hover:text-slate-900 transition-colors">ค้นหารายการ</Link>
                  <Link to="/report/lost" className="hover:text-slate-900 transition-colors">ลงประกาศ</Link>
                  <Link to="/login" className="hover:text-slate-900 transition-colors">เข้าสู่ระบบ</Link>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
                <p>วิทยาลัยการคอมพิวเตอร์ (กลุ่มการเรียนที่ 17 กลุ่มย่อยที่ 7)</p>
                <p>&copy; {new Date().getFullYear()} Campus Lost & Found. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

