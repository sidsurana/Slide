import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { InsertChatMessage, ChatMessage } from '@shared/schema';
import { storage } from './storage';

interface ClientConnection {
  ws: WebSocket;
  userId: number;
  groupIds: number[];
}

/**
 * WebSocketService handles real-time communication for chat and group event voting
 */
export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, ClientConnection> = new Map();
  
  /**
   * Initialize the WebSocket server
   */
  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    
    this.wss.on('connection', (ws) => {
      console.log('WebSocket connection established');
      
      // Setup connection
      this.clients.set(ws, { 
        ws, 
        userId: 0, // Will be set during authentication
        groupIds: []
      });
      
      // Listen for messages
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          await this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Failed to process message' 
          }));
        }
      });
      
      // Handle disconnection
      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('WebSocket connection closed');
      });
    });
    
    console.log('WebSocket server initialized');
  }
  
  /**
   * Process incoming messages
   */
  private async handleMessage(ws: WebSocket, data: any) {
    const client = this.clients.get(ws);
    if (!client) return;
    
    switch (data.type) {
      case 'auth':
        await this.handleAuth(client, data);
        break;
        
      case 'join_group':
        await this.handleJoinGroup(client, data);
        break;
        
      case 'leave_group':
        await this.handleLeaveGroup(client, data);
        break;
        
      case 'chat_message':
        await this.handleChatMessage(client, data);
        break;
        
      case 'event_vote':
        await this.handleEventVote(client, data);
        break;
        
      default:
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Unknown message type' 
        }));
    }
  }
  
  /**
   * Handle user authentication
   */
  private async handleAuth(client: ClientConnection, data: any) {
    const { userId } = data;
    
    // Verify user exists
    const user = await storage.getUser(userId);
    if (!user) {
      client.ws.send(JSON.stringify({ 
        type: 'auth_error', 
        message: 'Invalid user ID' 
      }));
      return;
    }
    
    // Update client data
    client.userId = userId;
    
    // Get user's groups
    const groups = await storage.getUserGroups(userId);
    client.groupIds = groups.map(g => g.id);
    
    // Send confirmation
    client.ws.send(JSON.stringify({ 
      type: 'auth_success', 
      userId, 
      groups: groups.map(g => ({ 
        id: g.id, 
        name: g.name 
      }))
    }));
    
    // Send unread messages count for each group
    for (const group of groups) {
      // Implementation depends on how messages are stored
      // TODO: Get unread message count
      const unreadCount = 0;
      
      client.ws.send(JSON.stringify({ 
        type: 'unread_count', 
        groupId: group.id, 
        count: unreadCount
      }));
    }
  }
  
  /**
   * Handle joining a group chat
   */
  private async handleJoinGroup(client: ClientConnection, data: any) {
    const { groupId } = data;
    
    // Verify user is a member of the group
    const isMember = await this.isGroupMember(client.userId, groupId);
    if (!isMember) {
      client.ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Not a member of this group' 
      }));
      return;
    }
    
    // Add group to client's active groups if not already there
    if (!client.groupIds.includes(groupId)) {
      client.groupIds.push(groupId);
    }
    
    // Send recent messages
    const messages = await storage.getGroupMessages(groupId, 50, 0);
    client.ws.send(JSON.stringify({ 
      type: 'recent_messages', 
      groupId, 
      messages 
    }));
    
    // Mark messages as read
    await storage.markMessagesAsRead(client.userId, groupId);
  }
  
  /**
   * Handle leaving a group chat
   */
  private async handleLeaveGroup(client: ClientConnection, data: any) {
    const { groupId } = data;
    
    // Remove group from client's active groups
    client.groupIds = client.groupIds.filter(id => id !== groupId);
    
    client.ws.send(JSON.stringify({ 
      type: 'left_group', 
      groupId 
    }));
  }
  
  /**
   * Handle new chat message
   */
  private async handleChatMessage(client: ClientConnection, data: any) {
    const { groupId, message, messageType = 'text', attachmentUrl, referenceData } = data;
    
    // Verify user is a member of the group
    const isMember = await this.isGroupMember(client.userId, groupId);
    if (!isMember) {
      client.ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Not a member of this group' 
      }));
      return;
    }
    
    // Create and store the message
    const chatMessage: InsertChatMessage = {
      groupId,
      userId: client.userId,
      message,
      messageType,
      attachmentUrl,
      referenceData
    };
    
    const savedMessage = await storage.createChatMessage(chatMessage);
    
    // Broadcast to all members of the group
    this.broadcastToGroup(groupId, {
      type: 'new_message',
      groupId,
      message: savedMessage
    });
  }
  
  /**
   * Handle event voting
   */
  private async handleEventVote(client: ClientConnection, data: any) {
    const { groupId, eventId, vote } = data;
    
    // Verify user is a member of the group
    const isMember = await this.isGroupMember(client.userId, groupId);
    if (!isMember) {
      client.ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Not a member of this group' 
      }));
      return;
    }
    
    // Save the vote
    const voteData = await storage.createGroupEventVote({
      groupId,
      userId: client.userId,
      eventId,
      vote
    });
    
    // Get current vote counts
    const allVotes = await storage.getGroupEventVotes(groupId, eventId);
    const voteCounts = {
      yes: allVotes.filter(v => v.vote === 'yes').length,
      no: allVotes.filter(v => v.vote === 'no').length,
      maybe: allVotes.filter(v => v.vote === 'maybe').length
    };
    
    // Broadcast to all members of the group
    this.broadcastToGroup(groupId, {
      type: 'vote_update',
      groupId,
      eventId,
      voteCounts,
      vote: {
        userId: client.userId,
        vote
      }
    });
  }
  
  /**
   * Send a message to all clients in a group
   */
  private broadcastToGroup(groupId: number, data: any) {
    for (const client of this.clients.values()) {
      if (client.groupIds.includes(groupId)) {
        client.ws.send(JSON.stringify(data));
      }
    }
  }
  
  /**
   * Check if a user is a member of a group
   */
  private async isGroupMember(userId: number, groupId: number): Promise<boolean> {
    const members = await storage.getGroupMembers(groupId);
    return members.some(member => member.userId === userId && member.isActive);
  }
  
  /**
   * Notify a user of a new event or update
   */
  async notifyUser(userId: number, notification: any) {
    for (const client of this.clients.values()) {
      if (client.userId === userId) {
        client.ws.send(JSON.stringify(notification));
      }
    }
  }
  
  /**
   * Notify all members of a group about a new event
   */
  async notifyGroup(groupId: number, notification: any) {
    this.broadcastToGroup(groupId, notification);
  }
}

// Create a singleton instance
export const wsService = new WebSocketService();