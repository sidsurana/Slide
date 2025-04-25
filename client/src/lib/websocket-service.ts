import { User } from '@shared/schema';

// Event types
export type WebSocketMessageType = 
  | 'auth'
  | 'auth_success'
  | 'auth_error'
  | 'join_group'
  | 'leave_group'
  | 'chat_message'
  | 'new_message'
  | 'recent_messages'
  | 'event_vote'
  | 'vote_update'
  | 'error'
  | 'unread_count'
  | 'left_group'
  | 'event_notification'
  | 'event_update'
  | 'event_canceled'
  | 'new_participant'
  | 'participant_update';

// Message interfaces
interface BaseWebSocketMessage {
  type: WebSocketMessageType;
}

interface AuthMessage extends BaseWebSocketMessage {
  type: 'auth';
  userId: number;
}

interface JoinGroupMessage extends BaseWebSocketMessage {
  type: 'join_group';
  groupId: number;
}

interface LeaveGroupMessage extends BaseWebSocketMessage {
  type: 'leave_group';
  groupId: number;
}

interface ChatMessage extends BaseWebSocketMessage {
  type: 'chat_message';
  groupId: number;
  message: string;
  messageType?: string;
  attachmentUrl?: string;
  referenceData?: any;
}

interface EventVoteMessage extends BaseWebSocketMessage {
  type: 'event_vote';
  groupId: number;
  eventId: number;
  vote: 'yes' | 'no' | 'maybe';
}

interface EventNotification extends BaseWebSocketMessage {
  type: 'event_notification' | 'event_update' | 'event_canceled' | 'new_participant' | 'participant_update';
  eventId: number;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  eventData?: any;
}

// Callback types
type MessageHandler = (data: any) => void;
type ConnectionStateHandler = () => void;

/**
 * Client-side WebSocket service for Link app
 * Provides real-time communication for group chat and event voting
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private messageHandlers: Map<WebSocketMessageType, MessageHandler[]> = new Map();
  private onConnectHandlers: ConnectionStateHandler[] = [];
  private onDisconnectHandlers: ConnectionStateHandler[] = [];
  private authenticated = false;
  private groupIds: number[] = [];
  private userId: number | null = null;
  
  /**
   * Initialize the WebSocket connection
   */
  connect(user: User) {
    // Store user ID for reconnect
    this.userId = user.id;
    
    // Only connect if not already connected
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    this.ws = new WebSocket(wsUrl);
    
    // Set up event handlers
    this.ws.onopen = () => {
      console.log('WebSocket connection established');
      
      // Clear reconnect timer
      if (this.reconnectTimer) {
        window.clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      // Authenticate
      this.authenticate(user.id);
      
      // Notify listeners
      this.onConnectHandlers.forEach(handler => handler());
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
      
      // Notify listeners
      this.onDisconnectHandlers.forEach(handler => handler());
      
      // Reset state
      this.authenticated = false;
      
      // Reconnect after delay
      this.reconnectTimer = window.setTimeout(() => {
        if (this.userId) {
          this.connect({ id: this.userId } as User);
        }
      }, 3000);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  /**
   * Authenticate with the server
   */
  private authenticate(userId: number) {
    const authMessage: AuthMessage = {
      type: 'auth',
      userId
    };
    
    this.send(authMessage);
  }
  
  /**
   * Send a message to the server
   */
  send(message: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message, WebSocket is not connected');
      return;
    }
    
    this.ws.send(JSON.stringify(message));
  }
  
  /**
   * Handle incoming messages
   */
  private handleMessage(data: any) {
    // Check for authentication response
    if (data.type === 'auth_success') {
      this.authenticated = true;
      this.groupIds = (data.groups || []).map((g: any) => g.id);
    }
    
    // Find handlers for this message type
    const handlers = this.messageHandlers.get(data.type);
    
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
  
  /**
   * Join a group chat
   */
  joinGroup(groupId: number) {
    if (!this.authenticated) {
      console.error('Cannot join group, not authenticated');
      return;
    }
    
    const message: JoinGroupMessage = {
      type: 'join_group',
      groupId
    };
    
    this.send(message);
  }
  
  /**
   * Leave a group chat
   */
  leaveGroup(groupId: number) {
    if (!this.authenticated) {
      console.error('Cannot leave group, not authenticated');
      return;
    }
    
    const message: LeaveGroupMessage = {
      type: 'leave_group',
      groupId
    };
    
    this.send(message);
  }
  
  /**
   * Send a chat message
   */
  sendChatMessage(groupId: number, message: string, messageType?: string, attachmentUrl?: string, referenceData?: any) {
    if (!this.authenticated) {
      console.error('Cannot send message, not authenticated');
      return;
    }
    
    const chatMessage: ChatMessage = {
      type: 'chat_message',
      groupId,
      message,
      messageType,
      attachmentUrl,
      referenceData
    };
    
    this.send(chatMessage);
  }
  
  /**
   * Send an event vote
   */
  voteForEvent(groupId: number, eventId: number, vote: 'yes' | 'no' | 'maybe') {
    if (!this.authenticated) {
      console.error('Cannot vote, not authenticated');
      return;
    }
    
    const voteMessage: EventVoteMessage = {
      type: 'event_vote',
      groupId,
      eventId,
      vote
    };
    
    this.send(voteMessage);
  }
  
  /**
   * Register a message handler
   */
  on(type: WebSocketMessageType, handler: MessageHandler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    
    this.messageHandlers.get(type)!.push(handler);
  }
  
  /**
   * Remove a message handler
   */
  off(type: WebSocketMessageType, handler: MessageHandler) {
    if (!this.messageHandlers.has(type)) {
      return;
    }
    
    const handlers = this.messageHandlers.get(type)!;
    const index = handlers.indexOf(handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }
  
  /**
   * Register a connection handler
   */
  onConnect(handler: ConnectionStateHandler) {
    this.onConnectHandlers.push(handler);
  }
  
  /**
   * Register a disconnection handler
   */
  onDisconnect(handler: ConnectionStateHandler) {
    this.onDisconnectHandlers.push(handler);
  }
  
  /**
   * Close the WebSocket connection
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.authenticated = false;
    this.groupIds = [];
  }
}

// Create singleton instance
export const websocketClient = new WebSocketClient();