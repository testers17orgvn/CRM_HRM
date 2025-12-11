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

 const groupedNotifications = groupNotificationsByTime(notifications);

 return (
  <Popover open={open} onOpenChange={setOpen}>
   <PopoverTrigger asChild>
    <Button variant="ghost" size="icon" className="relative hover:bg-secondary">
     <Bell className="h-5 w-5" />
     {unreadCount > 0 && (
      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-600">
       {unreadCount > 9 ? '9+' : unreadCount}
      </Badge>
     )}
    </Button>
   </PopoverTrigger>
   <PopoverContent className="w-96 p-0" align="end">
    <div className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
     <div>
      <h3 className="font-semibold">Thông báo</h3>
      {unreadCount > 0 && (
       <p className="text-xs text-muted-foreground">{unreadCount} tin nhắn chưa đọc</p>
      )}
     </div>
     {unreadCount > 0 && (
      <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
       Đánh dấu đã đọc
      </Button>
     )}
    </div>
    <ScrollArea className="h-96">
     {notifications.length === 0 ? (
      <div className="flex flex-col items-center justify-center p-8 text-center">
       <Bell className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
       <p className="text-sm font-medium text-muted-foreground">Không có thông báo</p>
       <p className="text-xs text-muted-foreground mt-1">Bạn sẽ nhận thông báo khi có hoạt động mới</p>
      </div>
     ) : (
      <div className="divide-y">
       {groupedNotifications.map((group) => (
        <div key={group.label}>
         <div className="px-4 py-2 bg-secondary/50 sticky top-0 z-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
           {group.label}
          </p>
         </div>
         {group.notifications.map((notification) => (
          <div
           key={notification.id}
           className={`px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors border-l-2 ${
            !notification.read
             ? "bg-primary/5 border-l-primary"
             : "border-l-transparent hover:border-l-primary/30"
           }`}
           onClick={() => handleNotificationClick(notification)}
          >
           <div className="flex items-start gap-3">
            <div className="mt-1">
             {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
             <p className="font-medium text-sm leading-tight text-foreground">
              {notification.title}
             </p>
             <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {notification.message}
             </p>
             <p className="text-xs text-muted-foreground mt-2">
              {formatDistanceToNow(new Date(notification.created_at), {
               addSuffix: true,
              })}
             </p>
            </div>
            {!notification.read && (
             <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
            )}
           </div>
          </div>
         ))}
        </div>
       ))}
      </div>
     )}
    </ScrollArea>
   </PopoverContent>
  </Popover>
 );
}
