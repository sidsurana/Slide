import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  bio: text("bio"),
  profession: text("profession"),
  profileImage: text("profile_image"),
  
  // New fields for enhanced matching
  interests: json("interests").default("[]"), // Array of interest strings
  skills: json("skills").default("[]"), // Array of skill strings
  careerPath: text("career_path"), // E.g., "Software Engineer", "Designer"
  latitude: text("latitude"), // For geolocation matching
  longitude: text("longitude"), // For geolocation matching
  availabilityPreferences: json("availability_preferences").default("{}"), // General time preferences
  timezone: text("timezone").default("America/New_York"), // User's timezone
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  bio: true,
  profession: true,
  profileImage: true,
  interests: true,
  skills: true,
  careerPath: true,
  latitude: true,
  longitude: true,
  availabilityPreferences: true,
  timezone: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Events model
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  location: text("location"),
  imageUrl: text("image_url"),
  hostId: integer("host_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  type: text("type").notNull(), // 'social' or 'networking'
  category: text("category"), // For networking events
  maxAttendees: integer("max_attendees"), // For networking events
  friendGroupId: text("friend_group_id"), // For social events
  
  // New fields for enhanced matching and features
  tags: json("tags").default("[]"), // Array of interest/skill tags for the event
  interestCategories: json("interest_categories").default("[]"), // Array of interest categories
  latitude: text("latitude"), // For geolocation matching
  longitude: text("longitude"), // For geolocation matching
  radius: integer("radius"), // Search radius in meters
  requiredSkills: json("required_skills").default("[]"), // Skills needed for the event
  careerFocus: text("career_focus"), // Career area this event is focused on
  isGroupEvent: boolean("is_group_event").default(false), // True if this is a group-initiated event
  groupId: integer("group_id"), // Reference to a chat/friend group
  mutualTimeSlot: json("mutual_time_slot").default("{}"), // Calculated best time slot
});

export const insertEventSchema = createInsertSchema(events).pick({
  title: true,
  description: true,
  date: true,
  location: true,
  imageUrl: true,
  hostId: true,
  type: true,
  category: true,
  maxAttendees: true,
  friendGroupId: true,
  tags: true,
  interestCategories: true,
  latitude: true,
  longitude: true,
  radius: true,
  requiredSkills: true,
  careerFocus: true,
  isGroupEvent: true,
  groupId: true,
  mutualTimeSlot: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Event Participants model
export const eventParticipants = pgTable("event_participants", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull(), // 'going', 'pending', 'declined'
  responseDate: timestamp("response_date").defaultNow(),
});

export const insertEventParticipantSchema = createInsertSchema(eventParticipants).pick({
  eventId: true,
  userId: true,
  status: true,
});

export type InsertEventParticipant = z.infer<typeof insertEventParticipantSchema>;
export type EventParticipant = typeof eventParticipants.$inferSelect;

// User Availability model
export const userAvailability = pgTable("user_availability", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull(),
  timeslots: json("timeslots").notNull(), // ['morning', 'afternoon', 'evening', 'late_night']
});

export const insertUserAvailabilitySchema = createInsertSchema(userAvailability).pick({
  userId: true,
  date: true,
  timeslots: true,
});

export type InsertUserAvailability = z.infer<typeof insertUserAvailabilitySchema>;
export type UserAvailability = typeof userAvailability.$inferSelect;

// Friendships model
export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  friendId: integer("friend_id").notNull(),
  status: text("status").notNull(), // 'pending', 'accepted'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFriendshipSchema = createInsertSchema(friendships).pick({
  userId: true,
  friendId: true,
  status: true,
});

export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendships.$inferSelect;

// Groups model - For group chats and group-based event creation
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  memberCount: integer("member_count").default(1),
  type: text("type").default("social"), // 'social', 'professional', 'interest'
});

export const insertGroupSchema = createInsertSchema(groups).pick({
  name: true,
  description: true,
  createdBy: true,
  imageUrl: true,
  type: true,
});

export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;

// Group Members model
export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: integer("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  role: text("role").default("member"), // 'admin', 'member'
  isActive: boolean("is_active").default(true),
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).pick({
  groupId: true,
  userId: true,
  role: true,
});

export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type GroupMember = typeof groupMembers.$inferSelect;

// Group Event Votes - For tracking group members' votes on potential events
export const groupEventVotes = pgTable("group_event_votes", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: integer("user_id").notNull(),
  eventId: integer("event_id").notNull(),
  vote: text("vote").notNull(), // 'yes', 'no', 'maybe'
  votedAt: timestamp("voted_at").defaultNow(),
});

export const insertGroupEventVoteSchema = createInsertSchema(groupEventVotes).pick({
  groupId: true,
  userId: true,
  eventId: true,
  vote: true,
});

export type InsertGroupEventVote = z.infer<typeof insertGroupEventVoteSchema>;
export type GroupEventVote = typeof groupEventVotes.$inferSelect;

// Chat Messages model
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: integer("user_id").notNull(),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  isRead: boolean("is_read").default(false),
  attachmentUrl: text("attachment_url"),
  messageType: text("message_type").default("text"), // 'text', 'image', 'event', 'location'
  referenceData: json("reference_data").default("{}"), // For special message types
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  groupId: true,
  userId: true,
  message: true,
  attachmentUrl: true,
  messageType: true,
  referenceData: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
