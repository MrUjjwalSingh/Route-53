"use client";

import Flashbar from "@cloudscape-design/components/flashbar";

import { useNotifications } from "@/lib/hooks/useNotifications";

export function NotificationFlashbar() {
  const { notifications, dismiss } = useNotifications();

  return (
    <Flashbar
      items={notifications.map((n) => ({
        id: n.id,
        type: n.type,
        header: n.header,
        content: n.content,
        dismissible: true,
        onDismiss: () => dismiss(n.id),
      }))}
    />
  );
}
