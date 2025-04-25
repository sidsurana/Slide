import { useState, useEffect } from 'react';
import { Bell, BellRing, Check, X, Info, AlertTriangle, Calendar } from 'lucide-react';
import { Link } from 'wouter';
import { formatDistanceToNow } from 'date-fns';
import { 
  Button,
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui';
import { 
  Notification, 
  NotificationType, 
  notificationService, 
  useNotificationStore 
} from '@/lib/notification-service';

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  event_notification: <Calendar className="h-4 w-4 text-blue-500" />,
  event_update: <Info className="h-4 w-4 text-amber-500" />,
  event_canceled: <AlertTriangle className="h-4 w-4 text-destructive" />,
  new_participant: <Calendar className="h-4 w-4 text-green-500" />,
  participant_update: <Calendar className="h-4 w-4 text-indigo-500" />
};

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotificationStore();
  
  // Initialize notification service
  useEffect(() => {
    notificationService.initialize();
  }, []);
  
  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      notificationService.requestNotificationPermission();
    }
  }, []);
  
  // Mark notification as read when clicked
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
  };
  
  // Filter notifications by read/unread
  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <>
              <BellRing className="h-5 w-5 text-foreground" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            </>
          ) : (
            <Bell className="h-5 w-5 text-foreground" />
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-medium text-lg">Notifications</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={markAllAsRead} 
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
        </div>
        
        <Tabs defaultValue="unread" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="unread" className="relative">
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          <TabsContent value="unread">
            {unreadNotifications.length > 0 ? (
              <ScrollArea className="h-[300px]">
                {unreadNotifications.map((notification) => (
                  <NotificationItem 
                    key={notification.id} 
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onDismiss={() => removeNotification(notification.id)}
                  />
                ))}
              </ScrollArea>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-center p-4">
                <Bell className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No unread notifications</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="all">
            {notifications.length > 0 ? (
              <ScrollArea className="h-[300px]">
                {[...unreadNotifications, ...readNotifications].map((notification) => (
                  <NotificationItem 
                    key={notification.id} 
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onDismiss={() => removeNotification(notification.id)}
                  />
                ))}
              </ScrollArea>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-center p-4">
                <Bell className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No notifications</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <Separator />
        <div className="p-2">
          <Button asChild variant="ghost" className="w-full justify-center" onClick={() => setOpen(false)}>
            <Link href="/notifications">
              View all notifications
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onDismiss: () => void;
}

function NotificationItem({ notification, onClick, onDismiss }: NotificationItemProps) {
  const NotificationIcon = notificationIcons[notification.type] || <Info className="h-4 w-4" />;
  const timeAgo = formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true });
  
  return (
    <div
      className={`
        relative p-4 border-b border-border hover:bg-muted/50 transition-colors
        ${notification.read ? 'bg-background' : 'bg-accent/5'}
      `}
    >
      <div className="grid grid-cols-[25px_1fr_16px] gap-2">
        <div className="mt-0.5">{NotificationIcon}</div>
        <div>
          {notification.actionUrl ? (
            <Link 
              href={notification.actionUrl} 
              className="font-medium hover:underline"
              onClick={onClick}
            >
              {notification.title}
            </Link>
          ) : (
            <div className="font-medium" onClick={onClick}>
              {notification.title}
            </div>
          )}
          <p className="text-sm text-muted-foreground">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
        </div>
        <Button
          variant="ghost" 
          size="icon" 
          className="h-4 w-4 opacity-70 hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </div>
      {!notification.read && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
      )}
    </div>
  );
}