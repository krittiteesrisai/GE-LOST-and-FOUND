import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import Home from './pages/Home';
import ItemsList from './pages/ItemsList';
import ReportForm from './pages/ReportForm';
import ItemDetail from './pages/ItemDetail';
import Admin from './pages/Admin';
import Login from './pages/Login';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
        <Navbar />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/list" element={<ItemsList />} />
            <Route path="/report/:type" element={<ReportForm />} />
            <Route path="/item/:id" element={<ItemDetail />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
          <div className="max-w-5xl mx-auto px-4 flex justify-center text-sm text-gray-500">
            <div>&copy; {new Date().getFullYear()} Campus Lost & Found</div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
