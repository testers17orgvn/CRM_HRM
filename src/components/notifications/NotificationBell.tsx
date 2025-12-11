import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCircle2, AlertCircle, Clock, Users, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, isToday, isYesterday, startOfDay } from "date-fns";

interface Notification {
 id: string;
 type: string;
 title: string;
 message: string;
 link: string | null;
 read: boolean;
 created_at: string;
}

interface NotificationGroup {
 label: string;
 notifications: Notification[];
}

// Helper to get icon and color based on notification type
const getNotificationIcon = (type: string) => {
 switch (type) {
  case 'task':
   return <FileText className="h-4 w-4 text-blue-500" />;
  case 'approval':
   return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  case 'meeting':
   return <Users className="h-4 w-4 text-purple-500" />;
  case 'alert':
   return <AlertCircle className="h-4 w-4 text-orange-500" />;
  case 'reminder':
   return <Clock className="h-4 w-4 text-yellow-500" />;
  default:
   return <Bell className="h-4 w-4 text-gray-500" />;
 }
};

// Helper to group notifications by time
const groupNotificationsByTime = (notifications: Notification[]): NotificationGroup[] => {
 const today = new Date();
 const yesterday = new Date(today);
 yesterday.setDate(yesterday.getDate() - 1);

 const todayStart = startOfDay(today);
 const yesterdayStart = startOfDay(yesterday);

 const groups: Record<string, Notification[]> = {
  'Hôm nay': [],
  'Hôm qua': [],
  'Trước đó': []
 };

 notifications.forEach(notif => {
  const notifDate = new Date(notif.created_at);
  if (notifDate >= todayStart) {
   groups['Hôm nay'].push(notif);
  } else if (notifDate >= yesterdayStart) {
   groups['Hôm qua'].push(notif);
  } else {
   groups['Trước đó'].push(notif);
  }
 });

 return Object.entries(groups)
  .filter(([_, notifs]) => notifs.length > 0)
  .map(([label, notifs]) => ({ label, notifications: notifs }));
};

export default function NotificationBell() {
 const [notifications, setNotifications] = useState<Notification[]>([]);
 const [unreadCount, setUnreadCount] = useState(0);
 const [open, setOpen] = useState(false);
 const navigate = useNavigate();

  // 👇 Ổn định hàm fetchNotifications bằng useCallback
 const fetchNotifications = useCallback(async () => {
  const user = await getCurrentUser();
  if (!user) return;

  const { data } = await supabase
   .from("notifications")
   .select("*")
   .eq("user_id", user.id)
   .order("created_at", { ascending: false })
   .limit(10);

  if (data) {
   setNotifications(data as Notification[]);
   setUnreadCount(data.filter((n) => !n.read).length);
  }
 }, [setNotifications, setUnreadCount]);

  // 👇 Ổn định hàm subscribeToNotifications bằng useCallback (Phụ thuộc vào fetchNotifications)
 const subscribeToNotifications = useCallback(async () => {
  const user = await getCurrentUser();
  if (!user) return () => {}; // Trả về hàm rỗng nếu không có user

  const channel = supabase
   .channel("notifications-changes")
   .on(
    "postgres_changes",
    {
     event: "*",
     schema: "public",
     table: "notifications",
     filter: `user_id=eq.${user.id}`,
    },
    () => {
     fetchNotifications();
    }
   )
   .subscribe();

  return () => {
   supabase.removeChannel(channel);
  };
 }, [fetchNotifications]);


 // 👇 KHẮC PHỤC LỖI TS 2345: Sử dụng IIFE để gọi hàm async và trả về hàm cleanup đồng bộ
 useEffect(() => {
  let cleanupFn: (() => void) | undefined;

    // Chạy logic async và lưu lại hàm cleanup
  (async () => {
   // Chạy fetchNotifications lần đầu
   await fetchNotifications(); 
      
      // Chạy subscribe và lấy hàm cleanup đồng bộ
   cleanupFn = await subscribeToNotifications(); 
  })();

    // Trả về hàm dọn dẹp đồng bộ, gọi hàm cleanup đã được lưu
  return () => {
   if (cleanupFn) {
    cleanupFn();
   }
  };
    // Thêm các dependencies đã ổn định vào mảng
 }, [fetchNotifications, subscribeToNotifications]);

 const markAsRead = async (notificationId: string) => {
  await supabase
   .from("notifications")
   .update({ read: true })
   .eq("id", notificationId);
  
  fetchNotifications();
 };

 const handleNotificationClick = (notification: Notification) => {
  markAsRead(notification.id);
  if (notification.link) {
   navigate(notification.link);
  }
  setOpen(false);
 };

 const markAllAsRead = async () => {
  const user = await getCurrentUser();
  if (!user) return;

  await supabase
   .from("notifications")
   .update({ read: true })
   .eq("user_id", user.id)
   .eq("read", false);
  
  fetchNotifications();
 };

 return (
  <Popover open={open} onOpenChange={setOpen}>
   <PopoverTrigger asChild>
    <Button variant="ghost" size="icon" className="relative">
     <Bell className="h-5 w-5" />
     {unreadCount > 0 && (
      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
       {unreadCount}
      </Badge>
     )}
    </Button>
   </PopoverTrigger>
   <PopoverContent className="w-80 p-0" align="end">
    <div className="flex items-center justify-between p-4 border-b">
     <h3 className="font-semibold">Notifications</h3>
     {unreadCount > 0 && (
      <Button variant="ghost" size="sm" onClick={markAllAsRead}>
       Mark all read
      </Button>
     )}
    </div>
    <ScrollArea className="h-80">
     {notifications.length === 0 ? (
      <div className="p-4 text-center text-muted-foreground">
       No notifications
      </div>
     ) : (
      <div className="divide-y">
       {notifications.map((notification) => (
        <div
         key={notification.id}
         className={`p-4 cursor-pointer hover:bg-secondary/50 transition-smooth ${
          !notification.read ? "bg-primary/5" : ""
         }`}
         onClick={() => handleNotificationClick(notification)}
        >
         <div className="flex items-start gap-2">
          <div className="flex-1">
           <p className="font-medium text-sm">{notification.title}</p>
           <p className="text-xs text-muted-foreground mt-1">
            {notification.message}
           </p>
           <p className="text-xs text-muted-foreground mt-2">
            {formatDistanceToNow(new Date(notification.created_at), {
             addSuffix: true,
            })}
           </p>
          </div>
          {!notification.read && (
           <div className="h-2 w-2 rounded-full bg-primary mt-1" />
          )}
         </div>
        </div>
       ))}
      </div>
     )}
    </ScrollArea>
   </PopoverContent>
  </Popover>
 );
}
