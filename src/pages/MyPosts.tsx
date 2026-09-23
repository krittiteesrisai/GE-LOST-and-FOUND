import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMyItems } from '../hooks/useMyItems';
import { useAuth } from '../context/AuthContext';
import { Item } from '../types';
import { ConfirmResolveModal } from '../components/ConfirmResolveModal';
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Calendar, 
  Edit3, 
  ExternalLink, 
  Trash2, 
  PlusCircle, 
  RefreshCw, 
  Share2, 
  Check, 
  ArrowLeft,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Lock,
  RotateCcw
} from 'lucide-react';

export default function MyPosts() {
  const { isAdmin } = useAuth();
  const { items, loading, refresh, toggleStatus, deleteItem, totalCount, activeCount, resolvedCount } = useMyItems();
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToResolve, setItemToResolve] = useState<Item | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const filteredItems = items.filter(item => {
    if (filter === 'active') return item.status !== 'resolved';
    if (filter === 'resolved') return item.status === 'resolved';
    return true;
  });

  const handleToggle = async (id: string, currentStatus: string) => {
    // If already resolved and not admin, locked!
    if (currentStatus === 'resolved' && !isAdmin) return;
    setUpdatingId(id);
    await toggleStatus(id, currentStatus);
    setUpdatingId(null);
  };

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/item/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete;
    setItemToDelete(null);
    await deleteItem(id);
  };

  return (
    <div className="max-w-4xl mx-auto py-3 sm:py-6 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link 
            to="/" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 mb-2 transition-all duration-150 active:scale-95 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>กลับสู่หน้าแรก</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-teal-600 text-white shadow-xs">
              <Package className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                ติดตามประกาศของฉัน
              </h1>
              <p className="text-xs text-slate-500">
                รายการสิ่งของที่คุณเคยลงประกาศไว้ ติดตามสถานะและปรับปรุงข้อมูลได้ทันที
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>

          <Link
            to="/report/lost"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl active:scale-95 transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ลงประกาศใหม่</span>
          </Link>
        </div>
      </div>

      {/* Stats and Filter Header */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFilter('all')}
          className={`p-3.5 rounded-2xl border text-left transition-all duration-150 active:scale-95 cursor-pointer ${
            filter === 'all' 
              ? 'bg-white border-teal-500 ring-2 ring-teal-100 shadow-xs' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ทั้งหมด</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalCount}</div>
        </button>

        <button
          onClick={() => setFilter('active')}
          className={`p-3.5 rounded-2xl border text-left transition-all duration-150 active:scale-95 cursor-pointer ${
            filter === 'active' 
              ? 'bg-amber-50/60 border-amber-500 ring-2 ring-amber-100 shadow-xs' 
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">กำลังตามหา</span>
          <div className="text-2xl font-extrabold text-amber-700 mt-0.5">{activeCount}</div>
        </button>

        <button
          onClick={() => setFilter('resolved')}
          className={`p-3.5 rounded-2xl border text-left transition-all duration-150 active:scale-95 cursor-pointer ${
            filter === 'resolved' 
              ? 'bg-teal-50/60 border-teal-500 ring-2 ring-teal-100 shadow-xs' 
              : 'bg-white border-slate-200 hover:border-teal-200'
          }`}
        >
          <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">ส่งคืนสำเร็จ</span>
          <div className="text-2xl font-extrabold text-teal-700 mt-0.5">{resolvedCount}</div>
        </button>
      </div>

      {/* Items List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-slate-200 animate-pulse flex gap-4">
              <div className="w-24 h-24 bg-slate-100 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2.5">
                <div className="w-1/3 h-4 bg-slate-100 rounded" />
                <div className="w-2/3 h-5 bg-slate-100 rounded" />
                <div className="w-1/2 h-4 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-teal-200 p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center mx-auto border border-teal-100">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {totalCount === 0 ? 'คุณยังไม่มีประกาศสิ่งของ' : 'ไม่มีรายการในหมวดนี้'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
              {totalCount === 0 
                ? 'เมื่อคุณลงประกาศแจ้งของหาย หรือแจ้งพบของ รายการจะมาปรากฏที่นี่โดยอัตโนมัติ เพื่อให้คุณติดตามสถานะได้ทันทีโดยไม่ต้องไปค้นหา'
                : 'ลองสลับตัวกรองเพื่อดูรายการทั้งหมด'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <Link
              to="/report/lost"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-xs"
            >
              แจ้งของหาย
            </Link>
            <Link
              to="/report/found"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-xs"
            >
              แจ้งพบของ
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredItems.map(item => {
            const isResolved = item.status === 'resolved';
            const isLost = item.type === 'lost';

            return (
              <div 
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-teal-300 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
              >
                {/* Left: Thumbnail & Info */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div 
                    onClick={() => navigate(`/item/${item.id}`)}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 cursor-pointer relative group"
                  >
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50">
                        {isLost ? 'ของหาย' : 'พบของ'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isLost ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-teal-50 text-teal-700 border border-teal-200'
                      }`}>
                        {isLost ? 'ตามหาของ' : 'พบของ'}
                      </span>

                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isResolved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isResolved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                        <span>{isResolved ? 'ส่งคืนสำเร็จแล้ว' : 'กำลังตามหา / ยังไม่ได้รับคืน'}</span>
                      </span>

                      <span className="text-[11px] text-slate-400 font-medium">
                        {item.category}
                      </span>
                    </div>

                    <h3 
                      onClick={() => navigate(`/item/${item.id}`)}
                      className="font-bold text-slate-900 text-sm sm:text-base hover:text-teal-700 cursor-pointer truncate"
                    >
                      {item.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 pt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-teal-600" />
                        <span className="truncate max-w-[150px]">{item.location}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.date}</span>
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Instant Actions */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                  {/* Status Toggle Button */}
                  {isResolved ? (
                    isAdmin ? (
                      <button
                        onClick={() => handleToggle(item.id!, item.status)}
                        disabled={updatingId === item.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-90 cursor-pointer shadow-2xs bg-slate-100 hover:bg-slate-200 text-slate-700"
                        title="แอดมิน: เปิดตามหาใหม่"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                        <span>เปิดตามหาใหม่ (Admin)</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>ส่งคืนแล้ว (ปิดเคส)</span>
                      </span>
                    )
                  ) : (
                    <button
                      onClick={() => setItemToResolve(item)}
                      disabled={updatingId === item.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-90 cursor-pointer shadow-2xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ได้ของคืนแล้ว</span>
                    </button>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => navigate(`/item/${item.id}`)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-slate-50 active:scale-90 transition-all"
                      title="ดูรายละเอียด"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => navigate(`/edit/${item.id}`)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-slate-50 active:scale-90 transition-all"
                      title="แก้ไขประกาศ"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleCopyLink(item.id!)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-slate-50 active:scale-90 transition-all"
                      title="คัดลอกลิงก์"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => setItemToDelete(item.id!)}
                      className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 active:scale-90 transition-all"
                      title="ลบประกาศ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-xl border border-slate-100 text-center animate-fadeIn">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-2 mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">ลบประกาศนี้?</h3>
            <p className="text-slate-500 text-xs mb-4">รายการจะถูกลบออกจากระบบถาวร</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 active:scale-95 transition-all"
              >
                ยกเลิก
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 active:scale-95 transition-all"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lock / Resolve Confirmation Modal */}
      <ConfirmResolveModal
        isOpen={!!itemToResolve}
        onClose={() => setItemToResolve(null)}
        onConfirm={async () => {
          if (itemToResolve && itemToResolve.id) {
            await handleToggle(itemToResolve.id, itemToResolve.status);
          }
          setItemToResolve(null);
        }}
        item={itemToResolve}
        loading={!!updatingId}
      />
    </div>
  );
}
