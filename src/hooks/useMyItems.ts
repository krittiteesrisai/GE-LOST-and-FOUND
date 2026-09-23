import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Item } from '../types';

export function useMyItems() {
  const { user, effectiveUser, isAdmin } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyItems = useCallback(async () => {
    setLoading(true);
    try {
      const activeUid = effectiveUser?.uid || user?.uid;
      const activeEmail = effectiveUser?.email || user?.email;
      
      const localIds: string[] = JSON.parse(localStorage.getItem('myItems') || '[]');
      const itemsMap = new Map<string, Item>();

      // 1. Fetch by local IDs (saved in this browser / Guest posts)
      if (localIds.length > 0) {
        const promises = localIds.slice(-50).map(async (id) => {
          try {
            const snap = await getDoc(doc(db, 'items', id));
            if (snap.exists()) {
              itemsMap.set(snap.id, { id: snap.id, ...snap.data() } as Item);
            }
          } catch (e) {
            console.warn('Error fetching local item:', id, e);
          }
        });
        await Promise.all(promises);
      }

      // 2. Fetch by authorId if logged in
      if (activeUid) {
        try {
          const qUid = query(collection(db, 'items'), where('authorId', '==', activeUid));
          const snapUid = await getDocs(qUid);
          snapUid.forEach(d => {
            itemsMap.set(d.id, { id: d.id, ...d.data() } as Item);
          });
        } catch (e) {
          console.warn('Error fetching by authorId:', e);
        }
      }

      // 3. Fetch by authorEmail if logged in
      if (activeEmail) {
        try {
          const qEmail = query(collection(db, 'items'), where('authorEmail', '==', activeEmail));
          const snapEmail = await getDocs(qEmail);
          snapEmail.forEach(d => {
            itemsMap.set(d.id, { id: d.id, ...d.data() } as Item);
          });
        } catch (e) {
          console.warn('Error fetching by authorEmail:', e);
        }
      }

      const list = Array.from(itemsMap.values());
      // Sort newest first
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.date ? new Date(a.date).getTime() : 0);
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.date ? new Date(b.date).getTime() : 0);
        return timeB - timeA;
      });

      setItems(list);
    } catch (err) {
      console.error('Error in fetchMyItems:', err);
    } finally {
      setLoading(false);
    }
  }, [user, effectiveUser]);

  useEffect(() => {
    fetchMyItems();
  }, [fetchMyItems]);

  const toggleStatus = async (id: string, currentStatus: string) => {
    // If already resolved and not admin, locked! Prevent toggling back to active
    if (currentStatus === 'resolved' && !isAdmin) {
      console.warn('Cannot reopen resolved item: action locked for non-admins.');
      return false;
    }

    const newStatus = currentStatus === 'resolved' ? 'active' : 'resolved';
    const newStage = newStatus === 'resolved' ? 'resolved' : 'review';
    try {
      await updateDoc(doc(db, 'items', id), { status: newStatus, stage: newStage });
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus as any, stage: newStage as any } : item));
      return true;
    } catch (e) {
      console.error('Error toggling status:', e);
      return false;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'items', id));
      const localIds: string[] = JSON.parse(localStorage.getItem('myItems') || '[]');
      const filtered = localIds.filter(itemId => itemId !== id);
      localStorage.setItem('myItems', JSON.stringify(filtered));
      setItems(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (e) {
      console.error('Error deleting item:', e);
      return false;
    }
  };

  return {
    items,
    loading,
    refresh: fetchMyItems,
    toggleStatus,
    deleteItem,
    totalCount: items.length,
    activeCount: items.filter(i => i.status === 'active').length,
    resolvedCount: items.filter(i => i.status === 'resolved').length
  };
}
