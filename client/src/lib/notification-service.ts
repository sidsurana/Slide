import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string; // 'event_notification' | 'event_update' | 'event_canceled' | 'new_participant' | 'participant_update'
  read: boolean;
  timestamp: string;
  actionUrl?: string;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      
      addNotification: (notification) => set((state) => {
        const now = new Date().toISOString();
        const id = `notification-${now}-${Math.random().toString(36).substring(2, 9)}`;
        
        return {
          notifications: [
            {
              ...notification,
              id,
              read: false,
              timestamp: now,
            },
            ...state.notifications,
          ],
        };
      }),
      
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        ),
      })),
      
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map((notification) => ({
          ...notification,
          read: true,
        })),
      })),
      
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(
          (notification) => notification.id !== id
        ),
      })),
      
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'link-notifications-storage',
    }
  )
);

// Example notifications for testing
const exampleNotifications = [
  {
    title: "New Event Invitation",
    message: "John invited you to 'Tech Meetup' on May 15th",
    type: "event_notification",
    actionUrl: "/events/123"
  },
  {
    title: "Event Update",
    message: "The location for 'Coffee Catchup' has been changed",
    type: "event_update",
    actionUrl: "/events/456"
  },
  {
    title: "Event Cancelled",
    message: "'Team Dinner' scheduled for tomorrow has been cancelled",
    type: "event_canceled",
    actionUrl: "/events/789"
  }
];

// Notification service for real-time updates
class NotificationService {
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  initialize() {
    this.connectWebSocket();
    
    // Add a few example notifications for testing - remove in production
    setTimeout(() => {
      exampleNotifications.forEach(notification => {
        useNotificationStore.getState().addNotification(notification);
      });
    }, 2000);
  }
  
  private connectWebSocket() {
    // Don't try to connect WebSockets in development mode initially
    // In production, this would connect to real WebSocket server
    if (process.env.NODE_ENV === 'development') {
      return;
    }
    
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      this.websocket = new WebSocket(`${protocol}//${host}/ws`);
      
      this.websocket.onopen = this.handleOpen;
      this.websocket.onmessage = this.handleMessage;
      this.websocket.onclose = this.handleClose;
      this.websocket.onerror = this.handleError;
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }
  
  private handleOpen = () => {
    console.log('WebSocket connection established');
    this.reconnectAttempts = 0;
    
    // Send authentication message
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'auth',
        data: {
          userId: 1, // This would come from authentication
        },
      }));
    }
  };
  
  private handleMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'notification') {
        useNotificationStore.getState().addNotification(data.notification);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  };
  
  private handleClose = (event: CloseEvent) => {
    console.log('WebSocket connection closed', event.code, event.reason);
    
    // Attempt reconnection if not a normal closure
    if (event.code !== 1000) {
      this.attemptReconnect();
    }
  };
  
  private handleError = (error: Event) => {
    console.error('WebSocket error:', error);
    
    // Close the connection if it's still open
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.close();
    }
  };
  
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connectWebSocket();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }
  
  // For manual sending of test notifications
  sendTestNotification(type: string = 'event_notification') {
    const types = {
      'event_notification': {
        title: 'New Event Invitation',
        message: 'Sarah invited you to "Coffee Chat" tomorrow at 3pm',
      },
      'event_update': {
        title: 'Event Updated',
        message: 'The time for "Team Meeting" has changed to 2pm',
      },
      'event_canceled': {
        title: 'Event Canceled',
        message: '"Lunch Meetup" has been canceled',
      },
      'new_participant': {
        title: 'New Participant',
        message: 'Alex joined "Weekend Hiking Trip"',
      },
      'participant_update': {
        title: 'Participant Update',
        message: 'Emma changed their status to "Going" for "Movie Night"',
      },
    };
    
    const notification = types[type as keyof typeof types] || types.event_notification;
    
    useNotificationStore.getState().addNotification({
      ...notification,
      type,
      actionUrl: '/events/test',
    });
  }
}

export const notificationService = new NotificationService();