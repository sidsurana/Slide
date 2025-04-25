import {
  users, type User, type InsertUser,
  events, type Event, type InsertEvent,
  eventParticipants, type EventParticipant, type InsertEventParticipant,
  userAvailability, type UserAvailability, type InsertUserAvailability,
  friendships, type Friendship, type InsertFriendship,
  groups, type Group, type InsertGroup,
  groupMembers, type GroupMember, type InsertGroupMember,
  groupEventVotes, type GroupEventVote, type InsertGroupEventVote,
  chatMessages, type ChatMessage, type InsertChatMessage
} from "@shared/schema";

import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getCurrentUser(): Promise<User | undefined>;
  updateUserProfile(userId: number, userData: Partial<User>): Promise<User | undefined>;
  updateUserTimezone(userId: number, timezone: string): Promise<User | undefined>;
  getUsersByInterests(interests: string[]): Promise<User[]>;
  getUsersByLocation(lat: number, lng: number, radiusInKm: number): Promise<User[]>;
  getUsersByCareerPath(careerPath: string): Promise<User[]>;
  getUsersBySkills(skills: string[]): Promise<User[]>;
  
  // Event methods
  createEvent(event: InsertEvent): Promise<Event>;
  getEvent(id: number): Promise<Event | undefined>;
  getEvents(type?: string): Promise<Event[]>;
  getUserEvents(userId: number): Promise<Event[]>;
  getEventsByTags(tags: string[]): Promise<Event[]>;
  getEventsByLocation(lat: number, lng: number, radiusInKm: number): Promise<Event[]>;
  getEventsByInterests(interests: string[]): Promise<Event[]>;
  getEventsByCareerFocus(careerFocus: string): Promise<Event[]>;
  updateEvent(eventId: number, eventData: Partial<Event>): Promise<Event | undefined>;
  
  // Event participant methods
  createEventParticipant(participant: InsertEventParticipant): Promise<EventParticipant>;
  getEventParticipants(eventId: number): Promise<EventParticipant[]>;
  getEventParticipant(id: number): Promise<EventParticipant | undefined>;
  updateEventParticipantStatus(id: number, status: string): Promise<EventParticipant | undefined>;
  
  // User availability methods
  createUserAvailability(availability: InsertUserAvailability): Promise<UserAvailability>;
  getUserAvailability(userId: number): Promise<UserAvailability[]>;
  getUsersAvailableOnDate(date: Date): Promise<User[]>;
  findMutualAvailability(userIds: number[], date: Date): Promise<string[]>;
  
  // Friendship methods
  createFriendship(friendship: InsertFriendship): Promise<Friendship>;
  getUserFriends(userId: number): Promise<User[]>;
  
  // Group methods
  createGroup(group: InsertGroup): Promise<Group>;
  getGroup(id: number): Promise<Group | undefined>;
  getUserGroups(userId: number): Promise<Group[]>;
  addUserToGroup(groupMember: InsertGroupMember): Promise<GroupMember>;
  getGroupMembers(groupId: number): Promise<GroupMember[]>;
  
  // Group event voting methods
  createGroupEventVote(vote: InsertGroupEventVote): Promise<GroupEventVote>;
  getGroupEventVotes(groupId: number, eventId: number): Promise<GroupEventVote[]>;
  getEventVotesByUser(userId: number): Promise<GroupEventVote[]>;
  
  // Chat methods
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getGroupMessages(groupId: number, limit?: number, offset?: number): Promise<ChatMessage[]>;
  markMessagesAsRead(userId: number, groupId: number): Promise<void>;
  
  // AI matching methods
  getMatchedEventsForUser(userId: number): Promise<Event[]>;
  getMatchedUsersForEvent(eventId: number): Promise<User[]>;
  suggestEventBasedOnInterests(userId: number): Promise<Event[]>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private eventParticipants: Map<number, EventParticipant>;
  private userAvailability: Map<number, UserAvailability>;
  private friendships: Map<number, Friendship>;
  private groups: Map<number, Group>;
  private groupMembers: Map<number, GroupMember>;
  private groupEventVotes: Map<number, GroupEventVote>;
  private chatMessages: Map<number, ChatMessage>;
  
  // Counters for generating IDs
  private userIdCounter: number;
  private eventIdCounter: number;
  private participantIdCounter: number;
  private availabilityIdCounter: number;
  private friendshipIdCounter: number;
  private groupIdCounter: number;
  private groupMemberIdCounter: number;
  private groupEventVoteIdCounter: number;
  private chatMessageIdCounter: number;

  // Session store for authentication
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.eventParticipants = new Map();
    this.userAvailability = new Map();
    this.friendships = new Map();
    this.groups = new Map();
    this.groupMembers = new Map();
    this.groupEventVotes = new Map();
    this.chatMessages = new Map();
    
    this.userIdCounter = 1;
    this.eventIdCounter = 1;
    this.participantIdCounter = 1;
    this.availabilityIdCounter = 1;
    this.friendshipIdCounter = 1;
    this.groupIdCounter = 1;
    this.groupMemberIdCounter = 1;
    this.groupEventVoteIdCounter = 1;
    this.chatMessageIdCounter = 1;
    
    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Create some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample users
    const user1 = this.createUser({
      username: "johndoe",
      password: "password123",
      fullName: "John Doe",
      email: "john@example.com",
      bio: "Software developer and outdoor enthusiast",
      profession: "Software Engineer",
      profileImage: "https://randomuser.me/api/portraits/men/1.jpg"
    });
    
    const user2 = this.createUser({
      username: "janedoe",
      password: "password123",
      fullName: "Jane Doe",
      email: "jane@example.com",
      bio: "UX designer with a passion for user-centered design",
      profession: "UX Designer",
      profileImage: "https://randomuser.me/api/portraits/women/1.jpg"
    });
    
    const user3 = this.createUser({
      username: "bobsmith",
      password: "password123",
      fullName: "Bob Smith",
      email: "bob@example.com",
      bio: "Marketing professional and foodie",
      profession: "Marketing Manager",
      profileImage: "https://randomuser.me/api/portraits/men/2.jpg"
    });
    
    // Create sample events
    const event1 = this.createEvent({
      title: "Dinner at Osteria",
      description: "Join us for Italian food and drinks at the new restaurant downtown!",
      date: new Date("2023-10-23T19:30:00"),
      location: "Osteria Restaurant, Downtown",
      imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac",
      hostId: 1,
      type: "social",
      friendGroupId: "all"
    });
    
    const event2 = this.createEvent({
      title: "Tech Startup Mixer",
      description: "Connect with founders and investors in the tech startup ecosystem.",
      date: new Date("2023-10-28T18:00:00"),
      location: "Innovation Hub, Tech District",
      imageUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72",
      hostId: 2,
      type: "networking",
      category: "Tech",
      maxAttendees: 25
    });
    
    const event3 = this.createEvent({
      title: "Design Professionals Dinner",
      description: "Join fellow designers for dinner and conversation about the industry.",
      date: new Date("2023-10-29T19:00:00"),
      location: "Design Studio, Arts District",
      imageUrl: "https://images.unsplash.com/photo-1528605248644-14dd04022da1",
      hostId: 3,
      type: "networking",
      category: "Design",
      maxAttendees: 12
    });
    
    // Add participants to events
    this.createEventParticipant({
      eventId: 1,
      userId: 1,
      status: "going"
    });
    
    this.createEventParticipant({
      eventId: 1,
      userId: 2,
      status: "going"
    });
    
    this.createEventParticipant({
      eventId: 1,
      userId: 3,
      status: "going"
    });
    
    this.createEventParticipant({
      eventId: 2,
      userId: 1,
      status: "pending"
    });
    
    // Create availability data
    this.createUserAvailability({
      userId: 1,
      date: new Date("2023-10-23"),
      timeslots: ["morning", "evening"]
    });
    
    this.createUserAvailability({
      userId: 2,
      date: new Date("2023-10-23"),
      timeslots: ["afternoon", "evening"]
    });
    
    this.createUserAvailability({
      userId: 3,
      date: new Date("2023-10-26"),
      timeslots: ["morning", "afternoon", "evening"]
    });
    
    // Create friendships
    this.createFriendship({
      userId: 1,
      friendId: 2,
      status: "accepted"
    });
    
    this.createFriendship({
      userId: 1,
      friendId: 3,
      status: "accepted"
    });
    
    this.createFriendship({
      userId: 2,
      friendId: 3,
      status: "accepted"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...userData, id };
    this.users.set(id, user);
    return user;
  }
  
  async getCurrentUser(): Promise<User | undefined> {
    // In a real app, this would use session information
    // For demo purposes, just return the first user
    return this.users.get(1);
  }

  // Event methods
  async createEvent(eventData: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    const event: Event = { 
      ...eventData, 
      id, 
      createdAt: new Date() 
    };
    this.events.set(id, event);
    return event;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEvents(type?: string): Promise<Event[]> {
    const allEvents = Array.from(this.events.values());
    
    if (type) {
      return allEvents.filter(event => event.type === type);
    }
    
    return allEvents;
  }

  async getUserEvents(userId: number): Promise<Event[]> {
    // Get events where the user is the host
    const hostedEvents = Array.from(this.events.values()).filter(
      event => event.hostId === userId
    );
    
    // Get events where the user is a participant
    const participantEntries = Array.from(this.eventParticipants.values()).filter(
      participant => participant.userId === userId && participant.status === "going"
    );
    
    const participatingEvents = participantEntries.map(
      entry => this.events.get(entry.eventId)
    ).filter(Boolean) as Event[];
    
    // Combine and return unique events
    const eventMap = new Map<number, Event>();
    [...hostedEvents, ...participatingEvents].forEach(event => {
      eventMap.set(event.id, event);
    });
    
    return Array.from(eventMap.values());
  }

  // Event participant methods
  async createEventParticipant(participantData: InsertEventParticipant): Promise<EventParticipant> {
    const id = this.participantIdCounter++;
    const participant: EventParticipant = { 
      ...participantData, 
      id, 
      responseDate: new Date() 
    };
    this.eventParticipants.set(id, participant);
    return participant;
  }

  async getEventParticipants(eventId: number): Promise<EventParticipant[]> {
    return Array.from(this.eventParticipants.values()).filter(
      participant => participant.eventId === eventId
    );
  }
  
  async getEventParticipant(id: number): Promise<EventParticipant | undefined> {
    return this.eventParticipants.get(id);
  }

  async updateEventParticipantStatus(id: number, status: string): Promise<EventParticipant | undefined> {
    const participant = this.eventParticipants.get(id);
    
    if (!participant) {
      return undefined;
    }
    
    const updatedParticipant: EventParticipant = {
      ...participant,
      status,
      responseDate: new Date()
    };
    
    this.eventParticipants.set(id, updatedParticipant);
    return updatedParticipant;
  }

  // User availability methods
  async createUserAvailability(availabilityData: InsertUserAvailability): Promise<UserAvailability> {
    const id = this.availabilityIdCounter++;
    const availability: UserAvailability = { ...availabilityData, id };
    this.userAvailability.set(id, availability);
    return availability;
  }

  async getUserAvailability(userId: number): Promise<UserAvailability[]> {
    return Array.from(this.userAvailability.values()).filter(
      availability => availability.userId === userId
    );
  }

  async getUsersAvailableOnDate(date: Date): Promise<User[]> {
    // Format date to compare only year, month, day
    const formattedDate = date.toISOString().split('T')[0];
    
    // Find availability entries for this date
    const availableUserIds = Array.from(this.userAvailability.values())
      .filter(availability => {
        const availDate = availability.date.toISOString().split('T')[0];
        return availDate === formattedDate;
      })
      .map(availability => availability.userId);
    
    // Get unique user IDs
    const uniqueUserIds = [...new Set(availableUserIds)];
    
    // Get user objects
    return uniqueUserIds
      .map(id => this.users.get(id))
      .filter(Boolean) as User[];
  }

  // Friendship methods
  async createFriendship(friendshipData: InsertFriendship): Promise<Friendship> {
    const id = this.friendshipIdCounter++;
    const friendship: Friendship = { 
      ...friendshipData, 
      id, 
      createdAt: new Date() 
    };
    this.friendships.set(id, friendship);
    return friendship;
  }

  async getUserFriends(userId: number): Promise<User[]> {
    // Get all friendships where the user is involved and the status is accepted
    const userFriendships = Array.from(this.friendships.values()).filter(
      friendship => 
        (friendship.userId === userId || friendship.friendId === userId) &&
        friendship.status === "accepted"
    );
    
    // Extract the IDs of the friends
    const friendIds = userFriendships.map(friendship => 
      friendship.userId === userId ? friendship.friendId : friendship.userId
    );
    
    // Get the user objects for these IDs
    return friendIds
      .map(id => this.users.get(id))
      .filter(Boolean) as User[];
  }
  
  // New user methods
  async updateUserProfile(userId: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserTimezone(userId: number, timezone: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, timezone };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async getUsersByInterests(interests: string[]): Promise<User[]> {
    if (!interests || interests.length === 0) {
      return [];
    }
    
    return Array.from(this.users.values()).filter(user => {
      const userInterests = user.interests || [];
      // Check if any of the user's interests match the given interests
      return Array.isArray(userInterests) && userInterests.some(interest => 
        interests.includes(interest)
      );
    });
  }
  
  async getUsersByLocation(lat: number, lng: number, radiusInKm: number): Promise<User[]> {
    // Import the geo service
    const { geoService } = await import('./geo-service');
    
    return geoService.findLocationsWithinRadius(
      lat, 
      lng, 
      radiusInKm, 
      Array.from(this.users.values())
    );
  }
  
  async getUsersByCareerPath(careerPath: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => 
      user.careerPath === careerPath
    );
  }
  
  async getUsersBySkills(skills: string[]): Promise<User[]> {
    if (!skills || skills.length === 0) {
      return [];
    }
    
    return Array.from(this.users.values()).filter(user => {
      const userSkills = user.skills || [];
      // Check if any of the user's skills match the given skills
      return Array.isArray(userSkills) && userSkills.some(skill => 
        skills.includes(skill)
      );
    });
  }
  
  // New event methods
  async getEventsByTags(tags: string[]): Promise<Event[]> {
    if (!tags || tags.length === 0) {
      return [];
    }
    
    return Array.from(this.events.values()).filter(event => {
      const eventTags = event.tags || [];
      // Check if any of the event's tags match the given tags
      return Array.isArray(eventTags) && eventTags.some(tag => 
        tags.includes(tag)
      );
    });
  }
  
  async getEventsByLocation(lat: number, lng: number, radiusInKm: number): Promise<Event[]> {
    // Import the geo service
    const { geoService } = await import('./geo-service');
    
    return geoService.findLocationsWithinRadius(
      lat, 
      lng, 
      radiusInKm, 
      Array.from(this.events.values())
    );
  }
  
  async getEventsByInterests(interests: string[]): Promise<Event[]> {
    if (!interests || interests.length === 0) {
      return [];
    }
    
    return Array.from(this.events.values()).filter(event => {
      const eventInterests = event.interestCategories || [];
      // Check if any of the event's interest categories match the given interests
      return Array.isArray(eventInterests) && eventInterests.some(interest => 
        interests.includes(interest)
      );
    });
  }
  
  async getEventsByCareerFocus(careerFocus: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter(event => 
      event.careerFocus === careerFocus
    );
  }
  
  async updateEvent(eventId: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const event = this.events.get(eventId);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...eventData };
    this.events.set(eventId, updatedEvent);
    return updatedEvent;
  }
  
  // Mutual availability methods
  async findMutualAvailability(userIds: number[], date: Date): Promise<string[]> {
    // Get availability for all users on the specified date
    const formattedDate = date.toISOString().split('T')[0];
    
    const availabilities = Array.from(this.userAvailability.values()).filter(avail => {
      const availDate = avail.date.toISOString().split('T')[0];
      return availDate === formattedDate && userIds.includes(avail.userId);
    });
    
    // If no availabilities found, return empty array
    if (availabilities.length === 0) {
      return [];
    }
    
    // Count occurrences of each timeslot
    const timeslotCounts = new Map<string, number>();
    const allTimeslots = new Set<string>();
    
    availabilities.forEach(avail => {
      const timeslots = avail.timeslots as string[];
      timeslots.forEach(slot => {
        allTimeslots.add(slot);
        timeslotCounts.set(slot, (timeslotCounts.get(slot) || 0) + 1);
      });
    });
    
    // Find timeslots that work for all users
    const mutualSlots: string[] = [];
    allTimeslots.forEach(slot => {
      if (timeslotCounts.get(slot) === userIds.length) {
        mutualSlots.push(slot);
      }
    });
    
    // If no mutual slots, return timeslots that work for the majority
    if (mutualSlots.length === 0) {
      const threshold = Math.ceil(userIds.length / 2);
      allTimeslots.forEach(slot => {
        if ((timeslotCounts.get(slot) || 0) >= threshold) {
          mutualSlots.push(slot);
        }
      });
    }
    
    return mutualSlots;
  }
  
  // Group methods
  async createGroup(group: InsertGroup): Promise<Group> {
    const id = this.groupIdCounter++;
    const newGroup: Group = { 
      ...group, 
      id, 
      createdAt: new Date(),
      isActive: true,
      memberCount: 1
    };
    this.groups.set(id, newGroup);
    return newGroup;
  }
  
  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }
  
  async getUserGroups(userId: number): Promise<Group[]> {
    // Get all group memberships for this user
    const memberships = Array.from(this.groupMembers.values()).filter(
      member => member.userId === userId && member.isActive
    );
    
    // Get the groups
    return memberships
      .map(membership => this.groups.get(membership.groupId))
      .filter(Boolean) as Group[];
  }
  
  async addUserToGroup(groupMember: InsertGroupMember): Promise<GroupMember> {
    const id = this.groupMemberIdCounter++;
    const newMember: GroupMember = { 
      ...groupMember, 
      id, 
      joinedAt: new Date(),
      isActive: true
    };
    this.groupMembers.set(id, newMember);
    
    // Update member count in the group
    const group = this.groups.get(groupMember.groupId);
    if (group) {
      group.memberCount = (group.memberCount || 0) + 1;
      this.groups.set(group.id, group);
    }
    
    return newMember;
  }
  
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return Array.from(this.groupMembers.values()).filter(
      member => member.groupId === groupId && member.isActive
    );
  }
  
  // Group event voting methods
  async createGroupEventVote(vote: InsertGroupEventVote): Promise<GroupEventVote> {
    const id = this.groupEventVoteIdCounter++;
    const newVote: GroupEventVote = { 
      ...vote, 
      id, 
      votedAt: new Date()
    };
    this.groupEventVotes.set(id, newVote);
    return newVote;
  }
  
  async getGroupEventVotes(groupId: number, eventId: number): Promise<GroupEventVote[]> {
    return Array.from(this.groupEventVotes.values()).filter(
      vote => vote.groupId === groupId && vote.eventId === eventId
    );
  }
  
  async getEventVotesByUser(userId: number): Promise<GroupEventVote[]> {
    return Array.from(this.groupEventVotes.values()).filter(
      vote => vote.userId === userId
    );
  }
  
  // Chat methods
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageIdCounter++;
    const newMessage: ChatMessage = { 
      ...message, 
      id, 
      sentAt: new Date(),
      isRead: false
    };
    this.chatMessages.set(id, newMessage);
    return newMessage;
  }
  
  async getGroupMessages(groupId: number, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    const messages = Array.from(this.chatMessages.values())
      .filter(msg => msg.groupId === groupId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime()); // newest first
    
    return messages.slice(offset, offset + limit);
  }
  
  async markMessagesAsRead(userId: number, groupId: number): Promise<void> {
    const messages = Array.from(this.chatMessages.values())
      .filter(msg => msg.groupId === groupId && !msg.isRead);
    
    // Mark messages as read
    messages.forEach(msg => {
      msg.isRead = true;
      this.chatMessages.set(msg.id, msg);
    });
  }
  
  // AI matching methods
  async getMatchedEventsForUser(userId: number): Promise<Event[]> {
    const user = await this.getUser(userId);
    if (!user) return [];
    
    // Import the AI service
    const { aiService } = await import('./ai-service');
    
    const allEvents = Array.from(this.events.values());
    return aiService.suggestEventsForUser(user, allEvents);
  }
  
  async getMatchedUsersForEvent(eventId: number): Promise<User[]> {
    const event = await this.getEvent(eventId);
    if (!event) return [];
    
    // For now, just match by interests or skills
    const usersWithMatchingInterests = await this.getUsersByInterests(
      Array.isArray(event.interestCategories) ? event.interestCategories as string[] : []
    );
    
    const usersWithMatchingSkills = await this.getUsersBySkills(
      Array.isArray(event.requiredSkills) ? event.requiredSkills as string[] : []
    );
    
    // Combine and deduplicate
    const allMatchedUserIds = new Set<number>();
    [...usersWithMatchingInterests, ...usersWithMatchingSkills].forEach(user => {
      allMatchedUserIds.add(user.id);
    });
    
    // Convert Set back to array of users
    return Array.from(allMatchedUserIds)
      .map(id => this.users.get(id))
      .filter(Boolean) as User[];
  }
  
  async suggestEventBasedOnInterests(userId: number): Promise<Event[]> {
    const user = await this.getUser(userId);
    if (!user) return [];
    
    // Import the AI service
    const { aiService } = await import('./ai-service');
    
    const allEvents = Array.from(this.events.values());
    return aiService.suggestEventsForUser(user, allEvents);
  }
}

export const storage = new MemStorage();
