import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { SupportMessage, MentionedItemSummary, Item } from '../types';
import { MentionItemPickerModal } from './MentionItemPickerModal';
import { MentionedItemCard } from './MentionedItemCard';
import { 
  Send, 
  AtSign, 
  Shield, 
  User as UserIcon, 
  Clock, 
  Sparkles, 
  MessageSquare, 
  CheckCheck,
  Headphones,
  Info
} from 'lucide-react';

interface AdminSupportChatBoxProps {
  key?: React.Key;
  chatId: string;
  targetUserName?: string;
  targetUserEmail?: string;
  isGuestUser?: boolean;
  currentRole: 'user' | 'admin';
  initialMentionedItemId?: string | null;
  onClose?: () => void;
}

export function AdminSupportChatBox({
  chatId,
  targetUserName,
  targetUserEmail,
  isGuestUser = false,
  currentRole,
  initialMentionedItemId,
  onClose
}: AdminSupportChatBoxProps) {
  const { user, effectiveUser, authorDisplayName, isAdmin } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [isMentionPickerOpen, setIsMentionPickerOpen] = useState(false);
  const [selectedMentionItem, setSelectedMentionItem] = useState<MentionedItemSummary | null>(null);
  const [loadingInitialMention, setLoadingInitialMention] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine current sender info
  const myUid = effectiveUser?.uid || user?.uid || (
    typeof window !== 'undefined' ? (localStorage.getItem('campus_lf_guest_id') || 'guest') : 'guest'
  );
  
  const myName = currentRole === 'admin' 
    ? 'เจ้าหน้าที่ดูแลระบบ (Admin)' 
    : (authorDisplayName || effectiveUser?.displayName || (targetUserName || 'ผู้ใช้งาน'));

  // Pre-load initial mentioned item if provided from URL query param
  useEffect(() => {
    if (!initialMentionedItemId) return;
    const fetchInitialItem = async () => {
      try {
        setLoadingInitialMention(true);
        const docRef = doc(db, 'items', initialMentionedItemId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const d = snap.data() as Item;
          setSelectedMentionItem({
            id: snap.id,
            title: d.title,
            type: d.type,
            category: d.category,
            imageUrl: d.imageUrl,
            status: d.status,
            location: d.location,
            date: d.date
          });
        }
      } catch (err) {
        console.error('Error fetching initial mentioned item:', err);
      } finally {
        setLoadingInitialMention(false);
      }
    };
    fetchInitialItem();
  }, [initialMentionedItemId]);

  // Real-time listener for messages in this thread
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, 'support_chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: SupportMessage[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          chatId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderRole: data.senderRole,
          senderAvatar: data.senderAvatar,
          text: data.text,
          mentionedItem: data.mentionedItem || null,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
        };
      });
      setMessages(msgs);

      // Auto scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (error) => {
      console.error('Error listening to support messages:', error);
    });

    // Mark unread as read
    const markAsRead = async () => {
      try {
        const chatDocRef = doc(db, 'support_chats', chatId);
        if (currentRole === 'admin') {
          await updateDoc(chatDocRef, { unreadByAdmin: false });
        } else {
          await updateDoc(chatDocRef, { unreadByUser: false });
        }
      } catch {
        // Chat doc might not exist yet, which is normal
      }
    };
    markAsRead();

    return () => unsubscribe();
  }, [chatId, currentRole]);

  // Handle typing '@'
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    if (val.endsWith('@') && !selectedMentionItem) {
      setIsMentionPickerOpen(true);
    }
  };

  // Quick suggestions
  const quickPrompts = [
    'สวัสดีครับ ต้องการสอบถามเกี่ยวกับขั้นตอนการรับของคืน',
    'ต้องการสอบถามของที่ทำหายในมหาวิทยาลัย',
    'พบของมีค่าต้องการติดต่อส่งมอบที่ห้องธุรการ อาคาร 1',
    'ต้องการแจ้งยกเลิกหรือปิดประกาศเนื่องจากได้ของคืนแล้ว'
  ];

  const handleSend = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend && !selectedMentionItem) return;
    if (sending) return;

    try {
      setSending(true);

      const messageData: any = {
        chatId,
        senderId: myUid,
        senderName: myName,
        senderRole: currentRole,
        text: textToSend || (selectedMentionItem ? `[อ้างอิงประกาศ: ${selectedMentionItem.title}]` : ''),
        createdAt: serverTimestamp()
      };

      if (selectedMentionItem) {
        messageData.mentionedItem = selectedMentionItem;
      }

      // 1. Add message document
      const messagesRef = collection(db, 'support_chats', chatId, 'messages');
      await addDoc(messagesRef, messageData);

      // 2. Upsert thread summary
      const chatDocRef = doc(db, 'support_chats', chatId);
      await setDoc(chatDocRef, {
        id: chatId,
        userId: myUid,
        userName: currentRole === 'user' ? myName : (targetUserName || 'ผู้ใช้งาน'),
        userEmail: targetUserEmail || effectiveUser?.email || user?.email || '',
        isGuest: isGuestUser,
        lastMessage: textToSend || (selectedMentionItem ? `[อ้างอิงประกาศ: ${selectedMentionItem.title}]` : ''),
        lastMessageAt: serverTimestamp(),
        unreadByAdmin: currentRole === 'user',
        unreadByUser: currentRole === 'admin',
        status: 'open'
      }, { merge: true });

      // Reset form
      setInputText('');
      setSelectedMentionItem(null);
    } catch (error) {
      console.error('Error sending support message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[580px] sm:h-[640px] bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 sm:px-6 py-3.5 bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/25 border border-teal-400/30 flex items-center justify-center text-teal-200 shadow-inner">
            {currentRole === 'admin' ? (
              <UserIcon className="w-5 h-5 text-teal-300" />
            ) : (
              <Headphones className="w-5 h-5 text-teal-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                {currentRole === 'admin' 
                  ? (targetUserName || 'ผู้ใช้งาน / นักศึกษา') 
                  : 'เจ้าหน้าที่ดูแลระบบ Campus Lost & Found'}
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-teal-200/80">
              {currentRole === 'admin' 
                ? (targetUserEmail || (isGuestUser ? 'เข้าใช้งานในฐานะ Guest' : 'ผู้ใช้งานในระบบ'))
                : 'ศูนย์ดูแลและรับฝากสิ่งของสูญหาย (อาคาร 1 ชั้น 1)'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            ปิด
          </button>
        )}
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center text-2xl shadow-2xs">
              💬
            </div>
            <div className="max-w-sm space-y-1">
              <h4 className="text-sm font-bold text-slate-800">
                สอบถามเจ้าหน้าที่
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                พิมพ์ข้อความเพื่อสอบถามเรื่องของหายหรือการรับของคืนกับแอดมินได้ที่นี่
              </p>
            </div>

            {/* Quick Prompts */}
            {currentRole === 'user' && (
              <div className="pt-2 w-full max-w-md space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">
                  คำถามที่พบบ่อย:
                </span>
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setInputText(prompt);
                    }}
                    className="w-full text-left p-2 rounded-xl bg-white hover:bg-teal-50 border border-slate-200/80 hover:border-teal-200 text-slate-700 text-xs transition-all shadow-2xs cursor-pointer flex items-center justify-between group"
                  >
                    <span className="truncate">{prompt}</span>
                    <span className="text-teal-600 opacity-0 group-hover:opacity-100 text-[11px] font-bold shrink-0">
                      ใช้ข้อความนี้ &rarr;
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderRole === currentRole;
            const isAdminSender = msg.senderRole === 'admin';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                {/* Sender Name & Role Label */}
                <div className="flex items-center gap-1.5 px-1 text-[11px] text-slate-400 font-medium">
                  {isAdminSender ? (
                    <span className="inline-flex items-center gap-1 text-teal-800 font-bold bg-teal-100/70 px-2 py-0.2 rounded-full text-[10px]">
                      <Shield className="w-3 h-3 text-teal-700" />
                      เจ้าหน้าที่ดูแลระบบ (Admin)
                    </span>
                  ) : (
                    <span>{msg.senderName}</span>
                  )}
                  {msg.createdAt && (
                    <span className="text-[10px] text-slate-400">
                      {new Date(msg.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-3.5 space-y-2.5 shadow-2xs ${
                  isMe
                    ? 'bg-teal-700 text-white rounded-tr-xs'
                    : isAdminSender
                      ? 'bg-white border-2 border-teal-200/90 text-slate-900 rounded-tl-xs shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs'
                }`}>
                  {/* Mentioned Item Attachment Card inside bubble */}
                  {msg.mentionedItem && (
                    <div className="mb-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1 text-teal-200">
                        <span>📌 ประกาศที่อ้างอิง</span>
                      </div>
                      <MentionedItemCard item={msg.mentionedItem} />
                    </div>
                  )}

                  {/* Main Text */}
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input & Mention Bar */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200 space-y-2 shrink-0">
        {/* Active Mentioned Item Preview Chip */}
        {selectedMentionItem && (
          <div className="animate-fadeIn">
            <div className="flex items-center justify-between text-[11px] font-bold text-teal-800 px-1 mb-1">
              <span>กำลังแนบประกาศนี้ในข้อความ:</span>
            </div>
            <MentionedItemCard
              item={selectedMentionItem}
              onRemove={() => setSelectedMentionItem(null)}
              isCompact={true}
            />
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* Mention Button */}
          <button
            type="button"
            onClick={() => setIsMentionPickerOpen(true)}
            className={`p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0 cursor-pointer ${
              selectedMentionItem
                ? 'bg-teal-50 border-teal-300 text-teal-700'
                : 'bg-slate-100 hover:bg-teal-50 border-slate-200 hover:border-teal-200 text-slate-700'
            }`}
            title="แนบประกาศสิ่งของ"
          >
            <AtSign className="w-4 h-4 text-teal-600" />
            <span className="hidden sm:inline">แนบประกาศ</span>
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={
                selectedMentionItem 
                  ? "พิมพ์ข้อความเกี่ยวกับประกาศนี้แล้วกดส่ง..." 
                  : "พิมพ์ข้อความสอบถาม..."
              }
              value={inputText}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedMentionItem) || sending}
            className="p-2.5 sm:px-4 sm:py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 disabled:opacity-40 disabled:hover:bg-teal-600 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">ส่ง</span>
          </button>
        </form>
      </div>

      {/* Modal for Selecting Item to Mention */}
      <MentionItemPickerModal
        isOpen={isMentionPickerOpen}
        onClose={() => setIsMentionPickerOpen(false)}
        onSelectItem={(item) => setSelectedMentionItem(item)}
      />
    </div>
  );
}
