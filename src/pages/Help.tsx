import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AdminSupportChatBox } from '../components/AdminSupportChatBox';
import { 
  Headphones, 
  MapPin, 
  Clock, 
  Phone, 
  HelpCircle, 
  ShieldCheck, 
  ChevronDown, 
  Package, 
  PlusCircle, 
  MessageSquare,
  Sparkles,
  Search
} from 'lucide-react';

export default function Help() {
  const [searchParams] = useSearchParams();
  const itemIdParam = searchParams.get('itemId');
  const { user, effectiveUser, authorDisplayName, isGuest } = useAuth();

  // Manage persistent guest ID
  const [guestId, setGuestId] = useState<string>(() => {
    let gid = localStorage.getItem('campus_lf_guest_id');
    if (!gid) {
      gid = 'guest_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('campus_lf_guest_id', gid);
    }
    return gid;
  });

  const activeUid = effectiveUser?.uid || user?.uid || guestId;
  const isGuestUser = !effectiveUser && !user;
  const activeChatId = `chat_${activeUid}`;

  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'ขั้นตอนการขอรับของคืนที่จุดรับฝาก ต้องเตรียมอะไรบ้าง?',
      a: 'ให้เตรียมบัตรนักศึกษาหรือบัตรประจำตัวประชาชน พร้อมหลักฐานแสดงความเป็นเจ้าของ เช่น ภาพถ่ายสิ่งของ, ใบเสร็จ, หรือสามารถปลดล็อกหน้าจอโทรศัพท์/iPad ให้เจ้าหน้าที่ตรวจสอบต่อหน้าได้'
    },
    {
      q: 'หากเก็บของมีค่าได้ ควรนำไปไว้ที่ไหน?',
      a: 'สามารถลงประกาศในหมวด "พบของ" ในระบบนี้ และนำสิ่งของมาฝากไว้ที่จุดรับฝากส่วนกลาง อาคาร 1 ชั้น 1 (งานบริการนักศึกษา) เพื่อความปลอดภัยและความโปร่งใส'
    },
    {
      q: 'หลังจากส่งมอบของคืนเจ้าของแล้ว ต้องทำอย่างไร?',
      a: 'เมื่อส่งมอบของคืนเรียบร้อยแล้ว ให้เข้าไปที่หน้ารายละเอียดของประกาศนั้น แล้วกดปุ่ม "ส่งคืนสำเร็จ / ได้ของคืนแล้ว" เพื่อบันทึกประวัติและปิดเคสในระบบ'
    },
    {
      q: 'สิ่งของที่ไม่มีผู้มารับ จะถูกจัดเก็บไว้นานเท่าใด?',
      a: 'ศูนย์รับฝากจะจัดเก็บสิ่งของไว้เป็นเวลาอย่างน้อย 90 วัน หากเป็นเอกสารสำคัญหรือบัตรประจำตัวจะมีการประสานงานส่งต่อไปยังสำนักทะเบียนของมหาวิทยาลัย'
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              ติดต่อสอบถามเจ้าหน้าที่
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ศูนย์รับฝากและดูแลทรัพย์สินสูญหาย งานบริการนักศึกษา
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Chat Box & Contact Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Admin Live Chat Box (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                ห้องแชตติดต่อ Admin (Live Support)
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              สถานะ: <strong className="text-teal-700 font-bold">ออนไลน์</strong>
            </span>
          </div>

          <AdminSupportChatBox
            chatId={activeChatId}
            targetUserName={authorDisplayName || effectiveUser?.displayName || 'นักศึกษา / ผู้ใช้งาน'}
            targetUserEmail={effectiveUser?.email || ''}
            isGuestUser={isGuestUser}
            currentRole="user"
            initialMentionedItemId={itemIdParam}
          />
        </div>

        {/* Right Column: Information, Office Location & FAQs (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Drop-off & Return Counter Info */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                🏢
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  จุดรับฝากและส่งคืนสิ่งของส่วนกลาง
                </h3>
                <p className="text-[11px] text-slate-400">Campus Care & Return Counter</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block">สถานที่ตั้ง:</strong>
                  <span>อาคาร 1 (ตึกอำนวยการ) ชั้น 1 โต๊ะธุรการงานกิจการนักศึกษา</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block">เวลาให้บริการ:</strong>
                  <span>จันทร์ - ศุกร์: 08:30 - 16:30 น. (เว้นวันหยุดราชการ)</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block">ติดต่อโทรศัพท์:</strong>
                  <span>02-123-4567 ต่อ 101 หรือ 102</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/report/found"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs transition-colors cursor-pointer border border-teal-200/80"
              >
                <PlusCircle className="w-4 h-4" />
                <span>แจ้งส่งมอบสิ่งของที่เก็บได้ &rarr;</span>
              </Link>
            </div>
          </div>

          {/* FAQs Accordion */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <HelpCircle className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">
                คำถามที่พบบ่อย (FAQs)
              </h3>
            </div>

            <div className="space-y-2.5">
              {faqs.map((faq, index) => {
                const isOpen = activeFaq === index;
                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-100 overflow-hidden transition-all bg-slate-50/50"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveFaq(isOpen ? null : index)}
                      className="w-full p-3.5 text-left text-xs font-bold text-slate-800 hover:text-teal-800 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                    >
                      <span className="leading-snug">{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-teal-600' : ''
                      }`} />
                    </button>
                    {isOpen && (
                      <div className="px-3.5 pb-3.5 text-[11px] sm:text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2.5 bg-white">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
