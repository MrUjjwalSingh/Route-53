"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  header?: string;
  content: ReactNode;
}

interface NotificationContextValue {
  notifications: Notification[];
  push: (notification: Omit<Notification, "id">) => string;
  dismiss: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const AUTO_DISMISS_MS = 5000;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setNotifications((current) => current.filter((n) => n.id !== id));
  }, []);

  const push = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = `notif-${++counter.current}`;
      setNotifications((current) => [...current, { ...notification, id }]);
      if (notification.type === "success") {
        setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      }
      return id;
    },
    [dismiss]
  );

  return (
    <NotificationContext.Provider value={{ notifications, push, dismiss }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return context;
}
