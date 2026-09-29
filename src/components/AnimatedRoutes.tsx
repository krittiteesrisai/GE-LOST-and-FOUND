import { Routes, Route, useLocation } from 'react-router-dom';
import { useTransitionDirection } from '../context/TransitionContext';
import Home from '../pages/Home';
import ItemsList from '../pages/ItemsList';
import ReportForm from '../pages/ReportForm';
import ItemDetail from '../pages/ItemDetail';
import Admin from '../pages/Admin';
import Login from '../pages/Login';
import MyPosts from '../pages/MyPosts';
import Help from '../pages/Help';

export function AnimatedRoutes() {
  const location = useLocation();
  const { direction } = useTransitionDirection();

  const animationClass = 
    direction === 'left' 
      ? 'animate-page-slide-left' 
      : direction === 'right' 
      ? 'animate-page-slide-right' 
      : 'animate-page-slide-left';

  return (
    <div key={location.pathname} className={`w-full ${animationClass}`}>
      <Routes location={location}>
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
    </div>
  );
}
