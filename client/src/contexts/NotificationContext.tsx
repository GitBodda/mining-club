import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Notification types matching the backend
export type NotificationType = 
  | "deposit" 
  | "withdrawal" 
  | "reward" 
  | "daily_return" 
  | "promotion" 
  | "system" 
  | "admin_alert"
  | "new_order"
  | "withdrawal_request"
  | "support_ticket"
  | "milestone"
  | "offer"
  | "payout"
  | "news";

export interface AppNotification {
  id: string;
  userId?: string;
  type: NotificationType;
  category: "user" | "admin";
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  priority: "low" | "normal" | "high" | "urgent";
  createdAt: string;
  readAt?: string;
  // Legacy fields for compatibility
  time?: string;
  read?: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (notification: Omit<AppNotification, "id" | "createdAt" | "isRead" | "category">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  refetch: () => void;
  // Admin-specific
  adminNotifications: AppNotification[];
  adminUnreadCount: number;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Get current user ID from localStorage or auth context
function getCurrentUserId(): string | null {
  // Try to get from localStorage where auth might store it
  const authData = localStorage.getItem("user");
  if (authData) {
    try {
      const user = JSON.parse(authData);
      return user.id || user.uid || null;
    } catch {
      return null;
    }
  }
  return null;
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID on mount
  useEffect(() => {
    const id = getCurrentUserId();
    setUserId(id);

    // Check if user is admin
    const authData = localStorage.getItem("user");
    if (authData) {
      try {
        const user = JSON.parse(authData);
        setIsAdmin(user.role === "admin" || user.isAdmin === true);
      } catch {
        setIsAdmin(false);
      }
    }
  }, []);

  // Fetch user notifications
  const { 
    data: userNotificationData, 
    isLoading: isLoadingUser,
    refetch: refetchUser 
  } = useQuery({
    queryKey: ["/api/notifications", userId],
    queryFn: async () => {
      if (!userId) return { notifications: [], unreadCount: 0 };
      const res = await fetch(`/api/notifications/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    enabled: !!userId,
    refetchInterval: 60000, // Refresh every 60 seconds
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  // Fetch admin notifications (only if admin)
  const { 
    data: adminNotificationData, 
    isLoading: isLoadingAdmin,
    refetch: refetchAdmin 
  } = useQuery({
    queryKey: ["/api/admin/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) throw new Error("Failed to fetch admin notifications");
      return res.json();
    },
    enabled: isAdmin,
    refetchInterval: 30000, // Refresh every 30 seconds for admins
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    staleTime: 15000,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const res = await fetch(`/api/notifications/${userId}/mark-all-read`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to mark all as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Transform notifications to include legacy fields
  const transformNotification = (n: any): AppNotification => ({
    ...n,
    time: n.createdAt ? formatTimeAgo(new Date(n.createdAt)) : "Just now",
    read: n.isRead,
  });

  const notifications = (userNotificationData?.notifications || []).map(transformNotification);
  const unreadCount = userNotificationData?.unreadCount || 0;

  const adminNotifications = (adminNotificationData?.notifications || []).map(transformNotification);
  const adminUnreadCount = adminNotificationData?.unreadCount || 0;

  const addNotification = useCallback(
    (notification: Omit<AppNotification, "id" | "createdAt" | "isRead" | "category">) => {
      // Show toast immediately for local feedback
      toast({
        title: notification.title,
        description: notification.message,
      });
      
      // Refetch to get the new notification from server
      setTimeout(() => {
        refetchUser();
      }, 1000);
    },
    [toast, refetchUser]
  );

  const markAsRead = useCallback((id: string) => {
    markAsReadMutation.mutate(id);
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const clearNotifications = useCallback(() => {
    // This would need a bulk delete endpoint
    // For now, just refetch
    refetchUser();
  }, [refetchUser]);

  const refetch = useCallback(() => {
    refetchUser();
    if (isAdmin) refetchAdmin();
  }, [refetchUser, refetchAdmin, isAdmin]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading: isLoadingUser || isLoadingAdmin,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        refetch,
        adminNotifications,
        adminUnreadCount,
        isAdmin,
        setIsAdmin,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
