'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { AppNotification, NotificationType } from '@/lib/types';
import { DashboardModuleId } from '@/components/QuickNavigationCommandPalette';
import { playNotificationChime } from '@/lib/audio-chime';

interface UnreadCounts {
  chat: number;
  doubts: number;
  sales: number;
}

interface NotificationContextType {
  activeToasts: AppNotification[];
  unreadCounts: UnreadCounts;
  webNotificationsEnabled: boolean;
  permissionStatus: 'default' | 'granted' | 'denied' | 'unsupported';
  dismissToast: (id: string) => void;
  clearUnread: (tab: DashboardModuleId) => void;
  triggerToast: (notif: Omit<AppNotification, 'id' | 'timestamp'>) => void;
  toggleWebNotifications: () => Promise<void>;
  testNotificationSound: () => void;
  activeTab: DashboardModuleId;
  setActiveTab: (tab: DashboardModuleId) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ 
  children,
  activeTab,
  setActiveTab
}: { 
  children: React.ReactNode;
  activeTab: DashboardModuleId;
  setActiveTab: (tab: DashboardModuleId) => void;
}) {
  const { teamMember, user } = useAuth();
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({
    chat: 0,
    doubts: 0,
    sales: 0,
  });

  const [webNotificationsEnabled, setWebNotificationsEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('trio_notifications_enabled');
      return stored === 'true';
    }
    return false;
  });

  const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>(() => {
    if (typeof window === 'undefined') return 'default';
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });

  // Track activeTab in a ref so Firestore snapshot callbacks always have current tab
  const activeTabRef = useRef<DashboardModuleId>(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Adjust unread state during render when activeTab changes (Official React pattern for prop syncing)
  const [prevTab, setPrevTab] = useState(activeTab);
  if (prevTab !== activeTab) {
    setPrevTab(activeTab);
    if (activeTab === 'chat' && unreadCounts.chat > 0) {
      setUnreadCounts((prev) => ({ ...prev, chat: 0 }));
    } else if (activeTab === 'doubts' && unreadCounts.doubts > 0) {
      setUnreadCounts((prev) => ({ ...prev, doubts: 0 }));
    } else if ((activeTab === 'analytics' || activeTab === 'pod-calc') && unreadCounts.sales > 0) {
      setUnreadCounts((prev) => ({ ...prev, sales: 0 }));
    }
  }

  // Dismiss a toast by ID
  const dismissToast = useCallback((id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Clear unread count for a tab
  const clearUnread = useCallback((tab: DashboardModuleId) => {
    setUnreadCounts((prev) => {
      if (tab === 'chat' && prev.chat > 0) return { ...prev, chat: 0 };
      if (tab === 'doubts' && prev.doubts > 0) return { ...prev, doubts: 0 };
      if ((tab === 'analytics' || tab === 'pod-calc') && prev.sales > 0) return { ...prev, sales: 0 };
      return prev;
    });
  }, []);

  // Trigger toast notification (in-app, chime, and native browser if backgrounded)
  const triggerToast = useCallback((notif: Omit<AppNotification, 'id' | 'timestamp'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: AppNotification = {
      ...notif,
      id,
      timestamp: Date.now(),
    };

    // 1. In-app toast banner (cap at 3 visible at once)
    setActiveToasts((prev) => [newToast, ...prev.slice(0, 2)]);

    // 2. Play Web Audio chime
    if (notif.type === 'sales') {
      playNotificationChime('milestone');
    } else if (notif.type === 'doubt' || notif.type === 'update') {
      playNotificationChime('doubt');
    } else {
      playNotificationChime('message');
    }

    // 3. Web Notification API (PWA Background support)
    if (
      typeof window !== 'undefined' && 
      'Notification' in window && 
      Notification.permission === 'granted' && 
      document.visibilityState === 'hidden'
    ) {
      try {
        const browserNotif = new Notification(notif.title, {
          body: notif.snippet,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: `trio-${notif.targetTab}-${Date.now()}`,
        });

        browserNotif.onclick = () => {
          window.focus();
          setActiveTab(notif.targetTab);
          browserNotif.close();
        };
      } catch (err) {
        console.debug('Browser notification note:', err);
      }
    }

    // Auto-dismiss in-app toast after 6 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 6000);
  }, [dismissToast, setActiveTab]);

  // Request browser Notification permission
  const toggleWebNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('The Web Notification API is not supported in this browser.');
      return;
    }

    if (!webNotificationsEnabled) {
      if (Notification.permission !== 'granted') {
        const result = await Notification.requestPermission();
        setPermissionStatus(result);
        if (result === 'granted') {
          setWebNotificationsEnabled(true);
          localStorage.setItem('trio_notifications_enabled', 'true');
          triggerToast({
            type: 'system',
            title: 'Notifications Activated',
            snippet: 'Real-time team chat, doubts, and POD milestones enabled.',
            targetTab: 'admin',
          });
        } else if (result === 'denied') {
          alert('Notification permission was blocked. Please enable it in your browser site settings.');
        }
      } else {
        setWebNotificationsEnabled(true);
        localStorage.setItem('trio_notifications_enabled', 'true');
        triggerToast({
          type: 'system',
          title: 'Notifications Activated',
          snippet: 'Real-time team chat, doubts, and POD milestones enabled.',
          targetTab: 'admin',
        });
      }
    } else {
      setWebNotificationsEnabled(false);
      localStorage.setItem('trio_notifications_enabled', 'false');
    }
  };

  const testNotificationSound = () => {
    triggerToast({
      type: 'sales',
      title: '🎉 Sound & Toast Test',
      snippet: 'Audio chime synthesized via Web Audio API (Zero external assets).',
      targetTab: 'admin',
    });
  };

  // FIRESTORE REAL-TIME LISTENERS
  // Designed for zero-cost free-tier Spark limits: small queries, clean disconnects, and snapshot caching
  const chatInitializedRef = useRef(false);
  const doubtsInitializedRef = useRef(false);
  const salesInitializedRef = useRef(false);

  // 1. Chat Messages Listener
  useEffect(() => {
    if (!teamMember) return;

    // Listen to latest 10 messages
    const q = query(
      collection(db, 'chat_messages'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // First snapshot loads existing state; do NOT fire historical notifications
      if (!chatInitializedRef.current) {
        chatInitializedRef.current = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const isFromOtherMember = 
            data.senderEmail?.toLowerCase() !== teamMember.email.toLowerCase() &&
            data.senderUid !== teamMember.uid;

          if (isFromOtherMember) {
            const isChatFocused = activeTabRef.current === 'chat' && document.visibilityState === 'visible';

            if (!isChatFocused) {
              setUnreadCounts((prev) => ({ ...prev, chat: prev.chat + 1 }));

              const isVoice = data.type === 'voice';
              triggerToast({
                type: isVoice ? 'voice' : 'chat',
                title: `${data.senderName || 'Team Member'} (${data.senderRole || 'Trio'})`,
                snippet: isVoice 
                  ? `🎙️ Voice Note (${data.audioDuration || 0}s)` 
                  : (data.content?.substring(0, 100) || 'Sent a message'),
                senderName: data.senderName,
                senderAvatar: data.senderName?.substring(0, 2).toUpperCase(),
                senderRole: data.senderRole,
                targetTab: 'chat',
              });
            }
          }
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'chat_messages');
    });

    return () => unsubscribe();
  }, [teamMember, triggerToast]);

  // 2. Doubts & Updates Listener
  useEffect(() => {
    if (!teamMember) return;

    const q = query(
      collection(db, 'doubts_and_updates'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!doubtsInitializedRef.current) {
        doubtsInitializedRef.current = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const isFromOtherMember = 
            data.creatorEmail?.toLowerCase() !== teamMember.email.toLowerCase() &&
            data.createdBy?.toLowerCase() !== teamMember.email.toLowerCase();

          if (isFromOtherMember) {
            const isDoubtsFocused = activeTabRef.current === 'doubts' && document.visibilityState === 'visible';

            if (!isDoubtsFocused) {
              setUnreadCounts((prev) => ({ ...prev, doubts: prev.doubts + 1 }));

              triggerToast({
                type: data.category === 'doubt' ? 'doubt' : 'update',
                title: `${data.category === 'doubt' ? '❓ New Doubt' : '📌 Work Update'}: ${data.title}`,
                snippet: `${data.creatorName || 'Team'}: ${data.description?.substring(0, 90) || 'New update posted.'}`,
                senderName: data.creatorName,
                senderAvatar: data.creatorName?.substring(0, 2).toUpperCase(),
                targetTab: 'doubts',
              });
            }
          }
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'doubts_and_updates');
    });

    return () => unsubscribe();
  }, [teamMember, triggerToast]);

  // 3. Sales Logs Listener (Sales Milestone celebrations)
  useEffect(() => {
    if (!teamMember) return;

    const q = query(
      collection(db, 'sales_logs'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!salesInitializedRef.current) {
        salesInitializedRef.current = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const isAnalyticsFocused = (activeTabRef.current === 'analytics' || activeTabRef.current === 'pod-calc') && document.visibilityState === 'visible';

          if (!isAnalyticsFocused) {
            setUnreadCounts((prev) => ({ ...prev, sales: prev.sales + 1 }));
          }

          triggerToast({
            type: 'sales',
            title: '🎉 POD Profit Milestone Logged!',
            snippet: `${data.productName || 'Product'} &bull; ${data.unitsSold || 1} units sold &bull; Net Profit: ₹${Number(data.netProfit || 0).toLocaleString()}`,
            senderName: data.loggedBy || 'Trio POD Engine',
            targetTab: 'analytics',
          });
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'sales_logs');
    });

    return () => unsubscribe();
  }, [teamMember, triggerToast]);

  return (
    <NotificationContext.Provider
      value={{
        activeToasts,
        unreadCounts,
        webNotificationsEnabled,
        permissionStatus,
        dismissToast,
        clearUnread,
        triggerToast,
        toggleWebNotifications,
        testNotificationSound,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
