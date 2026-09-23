import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Item, ChatMessage } from '../types';
import { 
  Send, 
  MessageSquare, 
  Trash2, 
  ShieldCheck, 
  User as UserIcon, 
  Sparkles,
  Smile,
  AlertCircle
} from 'lucide-react';

interface ItemChatProps {
  item: Item;
  isOwner: boolean;
  onStageAutoAdvance?: () => void;
}

const QUICK_LEAD_CHIPS = [
  '👋 ฉันคิดว่าเคยเห็นของชิ้นนี้!',
  '📍 ลองติดต่อจุดประชาสัมพันธ์หรือยังครับ',
  '🔍 มีตำหนิหรือสัญลักษณ์อะไรเพิ่มเติมไหมครับ',
  '✅ ติดต่อไปทางเบอร์/LINE ที่ให้ไว้แล้วครับ'
];

export function ItemChat({ item, isOwner, onStageAutoAdvance }: ItemChatProps) {
  const { user, effectiveUser, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [guestName, setGuestName] = useState(() => {
    return localStorage.getItem('guestChatName') || '';
  });
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeUser = effectiveUser || user;
  const currentUid = activeUser?.uid;
  const currentDisplayName = activeUser?.displayName || (activeUser?.email ? activeUser.email.split('@')[0] : '');

  // 1. Subscribe to real-time chat messages
  useEffect(() => {
    if (!item.id) return;

    const messagesRef = collection(db, 'items', item.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          list.push({
            id: docSnap.id,
            ...docSnap.data()
          } as ChatMessage);
        });
        setMessages(list);
      },
      (err) => {
        console.error('Error listening to chat messages:', err);
      }
    );

    return () => unsubscribe();
  }, [item.id]);

  // 2. Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Send message handler
  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || !item.id || sending) return;

    setErrorMsg('');
    const finalAuthorName = currentDisplayName || guestName.trim() || 'ผู้หวังดี (Guest)';

    if (!activeUser && !guestName.trim()) {
      localStorage.setItem('guestChatName', finalAuthorName);
    }

    setSending(true);

    try {
      const messagesRef = collection(db, 'items', item.id, 'messages');
      await addDoc(messagesRef, {
        itemId: item.id,
        text: messageContent,
        authorName: finalAuthorName,
        authorId: currentUid || 'guest',
        authorEmail: activeUser?.email || null,
        authorAvatar: activeUser?.photoURL || null,
        isOwner: isOwner,
        isAdmin: isAdmin,
        createdAt: serverTimestamp()
      });

      // AUTO-PROMOTE: If someone sends a chat message and item is still active,
      // automatically advance status/stage to 'contacted' (มีคนแจ้งเบาะแสแล้ว)
      if (item.status !== 'resolved' && item.stage !== 'contacted') {
        try {
          await updateDoc(doc(db, 'items', item.id), {
            stage: 'contacted'
          });
          if (onStageAutoAdvance) {
            onStageAutoAdvance();
          }
        } catch (stageErr) {
          console.warn('Could not auto-update stage:', stageErr);
        }
      }

      setInputText('');
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setErrorMsg('ส่งข้อความไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 4. Delete message handler
  const handleDeleteMessage = async (msgId: string) => {
    if (!item.id) return;
    try {
      await deleteDoc(doc(db, 'items', item.id, 'messages', msgId));
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // Format message timestamp
  const formatTime = (createdAt: any) => {
    if (!createdAt) return 'เมื่อสักครู่';
    try {
      let date: Date;
      if (createdAt instanceof Timestamp) {
        date = createdAt.toDate();
      } else if (createdAt.seconds) {
        date = new Date(createdAt.seconds * 1000);
      } else {
        date = new Date(createdAt);
      }
      return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-teal-100 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-teal-50 via-cyan-50/50 to-white border-b border-teal-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-xs">
            <MessageSquare className="w-4 h-4 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                พูดคุย & แจ้งเบาะแส (Post Chat)
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                {messages.length} ข้อความ
              </span>
            </div>
            <p className="text-xs text-slate-500">
              สอบถามข้อมูล แจ้งพบเห็น หรือนัดหมายรับของคืนที่นี่ได้เลย
            </p>
          </div>
        </div>
      </div>

      {/* Messages Thread Container */}
      <div className="p-4 sm:p-6 space-y-4 max-h-[380px] min-h-[160px] overflow-y-auto bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-white border border-teal-100 text-teal-600 flex items-center justify-center mx-auto shadow-2xs">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-700">ยังไม่มีข้อความในประกาศนี้</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              หากคุณมีเบาะแสเกี่ยวกับสิ่งของนี้ หรือต้องการสอบถามรายละเอียดเพิ่มเติม พิมพ์ข้อความไว้ได้เลย
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMyMsg = (currentUid && msg.authorId === currentUid) || (msg.isOwner && isOwner);
            const canDelete = isMyMsg || isAdmin;

            return (
              <div 
                key={msg.id} 
                className={`flex items-start gap-2.5 group ${isMyMsg ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold shadow-2xs overflow-hidden ${
                  msg.isAdmin 
                    ? 'bg-purple-600 text-white' 
                    : msg.isOwner 
                      ? 'bg-teal-600 text-white' 
                      : 'bg-slate-200 text-slate-700'
                }`}>
                  {msg.authorAvatar ? (
                    <img src={msg.authorAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{msg.authorName ? msg.authorName.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                </div>

                {/* Message Bubble & Meta */}
                <div className={`max-w-[78%] space-y-1 ${isMyMsg ? 'items-end' : 'items-start'}`}>
                  {/* Sender label and role badge */}
                  <div className={`flex items-center gap-1.5 text-[11px] ${isMyMsg ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="font-bold text-slate-800">
                      {msg.authorName}
                    </span>

                    {msg.isOwner && (
                      <span className="px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 font-bold text-[9px]">
                        เจ้าของโพสต์
                      </span>
                    )}

                    {msg.isAdmin && (
                      <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 font-bold text-[9px] flex items-center gap-0.5">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        <span>เจ้าหน้าที่</span>
                      </span>
                    )}

                    <span className="text-slate-400 text-[10px]">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>

                  {/* Bubble */}
                  <div className="flex items-center gap-1.5">
                    {canDelete && isMyMsg && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded transition-all active:scale-90"
                        title="ลบข้อความนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs break-words ${
                      isMyMsg
                        ? 'bg-teal-600 text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                    }`}>
                      {msg.text}
                    </div>

                    {canDelete && !isMyMsg && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded transition-all active:scale-90"
                        title="ลบข้อความนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Lead Chips */}
      <div className="px-4 sm:px-6 py-2 bg-slate-50 border-t border-slate-100 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
        <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-teal-600" />
          <span>ด่วน:</span>
        </span>
        {QUICK_LEAD_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(chip)}
            disabled={sending}
            className="shrink-0 px-2.5 py-1 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-900 rounded-xl text-[11px] font-medium transition-all active:scale-95 shadow-2xs"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Box Bar */}
      <div className="p-4 sm:p-5 bg-white border-t border-slate-100 space-y-3">
        {/* Guest Name input if not logged in */}
        {!activeUser && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">ชื่อของคุณ:</span>
            <input
              type="text"
              value={guestName}
              onChange={(e) => {
                setGuestName(e.target.value);
                localStorage.setItem('guestChatName', e.target.value);
              }}
              placeholder="ระบุชื่อหรือเบอร์ติดต่อ (เช่น นิด้า หรือ กาย)"
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 w-56"
            />
            <span className="text-[10px] text-slate-400">
              (หรือลงชื่อเข้าใช้ด้วย Google เพื่อแสดงรูปโปรไฟล์)
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="text-xs text-rose-600 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              placeholder="พิมพ์ข้อความ พูดคุย หรือแจ้งเบาะแสเพิ่มเติม..."
              className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all shadow-inner"
            />
          </div>

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={sending || !inputText.trim()}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all duration-150 active:scale-95 shadow-sm disabled:cursor-not-allowed shrink-0"
          >
            <span>ส่ง</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
