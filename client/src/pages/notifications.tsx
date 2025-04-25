import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { 
  Bell, 
  Calendar, 
  Check, 
  ArrowLeft, 
  Info, 
  AlertTriangle,
  XCircle,
  CheckCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Notification,
  useNotificationStore,
  notificationService
} from '@/lib/notification-service';

const notificationIcons: Record<string, React.ReactNode> = {
  event_notification: <Calendar className="h-5 w-5 text-blue-500" />,
  event_update: <Info className="h-5 w-5 text-amber-500" />,
  event_canceled: <AlertTriangle className="h-5 w-5 text-destructive" />,
  new_participant: <Calendar className="h-5 w-5 text-green-500" />,
  participant_update: <Calendar className="h-5 w-5 text-indigo-500" />
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<string>('all');
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearNotifications 
  } = useNotificationStore();

  // Initialize notification service
  useEffect(() => {
    notificationService.initialize();
  }, []);

  // Mark all as read when page is visited
  useEffect(() => {
    if (notifications.some(n => !n.read)) {
      markAllAsRead();
    }
  }, [notifications, markAllAsRead]);
  
  // Filter notifications based on type
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    return notification.type === filter;
  });
  
  // Group notifications by date
  const groupedNotifications: Record<string, Notification[]> = {};
  
  filteredNotifications.forEach(notification => {
    const date = new Date(notification.timestamp).toDateString();
    if (!groupedNotifications[date]) {
      groupedNotifications[date] = [];
    }
    groupedNotifications[date].push(notification);
  });
  
  // Sort dates in descending order
  const sortedDates = Object.keys(groupedNotifications).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Notifications</SelectItem>
              <SelectItem value="event_notification">Event Notifications</SelectItem>
              <SelectItem value="event_update">Event Updates</SelectItem>
              <SelectItem value="event_canceled">Event Cancellations</SelectItem>
              <SelectItem value="new_participant">New Participants</SelectItem>
              <SelectItem value="participant_update">Participant Updates</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="ghost" 
            onClick={clearNotifications}
            disabled={notifications.length === 0}
          >
            Clear All
          </Button>
        </div>
      </div>
      
      {notifications.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
            <CardTitle>No Notifications</CardTitle>
            <CardDescription>
              You don't have any notifications right now.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          {sortedDates.map(date => (
            <div key={date} className="mb-6">
              <h2 className="text-lg font-medium mb-3">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </h2>
              <div className="space-y-3">
                {groupedNotifications[date].map(notification => (
                  <NotificationCard 
                    key={notification.id}
                    notification={notification}
                    onRemove={() => removeNotification(notification.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

interface NotificationCardProps {
  notification: Notification;
  onRemove: () => void;
}

function NotificationCard({ notification, onRemove }: NotificationCardProps) {
  const icon = notificationIcons[notification.type] || <Bell className="h-5 w-5" />;
  const time = format(new Date(notification.timestamp), 'h:mm a');
  
  return (
    <Card className={notification.read ? 'border-border' : 'border-l-4 border-l-accent'}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {icon}
            <CardTitle className="text-base">{notification.title}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onRemove}>
            <XCircle className="h-5 w-5 text-muted-foreground" />
            <span className="sr-only">Remove</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{notification.message}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-0">
        <span className="text-xs text-muted-foreground">{time}</span>
        {notification.actionUrl && (
          <Button asChild variant="outline" size="sm">
            <Link href={notification.actionUrl}>View Details</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}