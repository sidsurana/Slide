import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertEventSchema,
  insertUserSchema,
  insertEventParticipantSchema,
  insertUserAvailabilitySchema,
  insertGroupSchema,
  insertGroupMemberSchema,
  insertGroupEventVoteSchema,
  insertChatMessageSchema,
  insertFriendshipSchema
} from "@shared/schema";
import { setupAuth } from "./auth";
import { wsService } from "./ws-service";
import { aiService } from "./ai-service";
import { geoService } from "./geo-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // Get current user
  app.get("/api/users/current", async (req, res) => {
    // In a real app, this would use the session to get the current user
    // For this demo, we'll just return the first user
    const user = await storage.getCurrentUser();
    if (!user) {
      return res.status(404).json({ message: "Not logged in" });
    }
    res.json(user);
  });

  // Get user by ID with validation
  app.get("/api/users/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  });
  
  
  app.patch("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const id = Number(req.params.id);
    
    // Only allow users to update their own profile
    if (req.user?.id !== id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const updatedUser = await storage.updateUserProfile(id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });
  
  // Update user timezone
  app.patch("/api/users/:id/timezone", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const id = Number(req.params.id);
    
    // Only allow users to update their own timezone
    if (req.user?.id !== id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const { timezone } = req.body;
    
    if (!timezone || typeof timezone !== 'string') {
      return res.status(400).json({ message: "Invalid timezone" });
    }
    
    try {
      const updatedUser = await storage.updateUserTimezone(id, timezone);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ message: "Failed to update timezone" });
    }
  });
  
  // User search by interests/skills/location routes - ORDER IS IMPORTANT - place specific routes before :id route
  app.get("/api/users/nearby", async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius) || 10; // default 10km
    
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: "Invalid location data" });
    }
    
    const users = await storage.getUsersByLocation(lat, lng, radius);
    res.json(users);
  });

  app.get("/api/users/interests/:interests", async (req, res) => {
    const interests = req.params.interests.split(',');
    const users = await storage.getUsersByInterests(interests);
    res.json(users);
  });
  
  app.get("/api/users/skills/:skills", async (req, res) => {
    const skills = req.params.skills.split(',');
    const users = await storage.getUsersBySkills(skills);
    res.json(users);
  });
  
  app.get("/api/users/career/:path", async (req, res) => {
    const careerPath = req.params.path;
    const users = await storage.getUsersByCareerPath(careerPath);
    res.json(users);
  });

  // Event routes
  app.post("/api/events", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Set the host to the current user
      const eventData = insertEventSchema.parse({
        ...req.body,
        hostId: req.user.id
      });
      
      // If no tags are provided, generate them using AI
      if (!eventData.tags || !Array.isArray(eventData.tags) || eventData.tags.length === 0) {
        try {
          const generatedTags = await aiService.generateEventTags({
            title: eventData.title,
            description: eventData.description,
            type: eventData.type
          });
          
          eventData.tags = generatedTags;
        } catch (error) {
          console.error("Failed to generate event tags:", error);
          // Continue without tags if AI fails
        }
      }
      
      const event = await storage.createEvent(eventData);
      
      // Add the host as a participant automatically
      await storage.createEventParticipant({
        eventId: event.id,
        userId: req.user.id,
        status: "going"
      });
      
      res.json(event);
    } catch (error) {
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  app.get("/api/events", async (req, res) => {
    const type = req.query.type as string | undefined;
    const events = await storage.getEvents(type);
    res.json(events);
  });

  // Event search by tags/location/interests routes - SPECIFIC ROUTES BEFORE :id
  app.get("/api/events/user/:userId", async (req, res) => {
    const userId = Number(req.params.userId);
    const events = await storage.getUserEvents(userId);
    res.json(events);
  });

  app.get("/api/events/nearby", async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius) || 10; // default 10km
    
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: "Invalid location data" });
    }
    
    const events = await storage.getEventsByLocation(lat, lng, radius);
    res.json(events);
  });

  app.get("/api/events/tags/:tags", async (req, res) => {
    const tags = req.params.tags.split(',');
    const events = await storage.getEventsByTags(tags);
    res.json(events);
  });
  
  app.get("/api/events/interests/:interests", async (req, res) => {
    const interests = req.params.interests.split(',');
    const events = await storage.getEventsByInterests(interests);
    res.json(events);
  });
  
  app.get("/api/events/career/:focus", async (req, res) => {
    const careerFocus = req.params.focus;
    const events = await storage.getEventsByCareerFocus(careerFocus);
    res.json(events);
  });

  // Generic event routes using ID
  app.get("/api/events/:id", async (req, res) => {
    const id = Number(req.params.id);
    const event = await storage.getEvent(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  });
  
  app.patch("/api/events/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const id = Number(req.params.id);
    const event = await storage.getEvent(id);
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    // Only allow the host to update the event
    if (event.hostId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const updatedEvent = await storage.updateEvent(id, req.body);
      res.json(updatedEvent);
    } catch (error) {
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  // Event participation routes
  app.post("/api/event-participants", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const participantData = insertEventParticipantSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const participant = await storage.createEventParticipant(participantData);
      res.json(participant);
    } catch (error) {
      res.status(400).json({ message: "Invalid participant data" });
    }
  });

  app.get("/api/event-participants/:eventId", async (req, res) => {
    const eventId = Number(req.params.eventId);
    const participants = await storage.getEventParticipants(eventId);
    res.json(participants);
  });

  app.patch("/api/event-participants/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const id = Number(req.params.id);
    const { status } = req.body;
    
    if (!status || !["going", "pending", "declined"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    // Only allow users to update their own participation
    const participant = await storage.getEventParticipant(id);
    if (!participant || participant.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const updatedParticipant = await storage.updateEventParticipantStatus(id, status);
    if (!updatedParticipant) {
      return res.status(404).json({ message: "Participant not found" });
    }
    
    res.json(updatedParticipant);
  });

  // User availability routes
  app.post("/api/availability", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      console.log("Received availability data:", req.body);
      
      // Parse timeslots if it's a string
      let timeslots = req.body.timeslots;
      if (typeof timeslots === 'string') {
        try {
          timeslots = JSON.parse(timeslots);
        } catch (e) {
          console.error("Failed to parse timeslots:", e);
        }
      }
      
      const availabilityData = insertUserAvailabilitySchema.parse({
        ...req.body,
        userId: req.user.id,
        timeslots: timeslots
      });
      
      console.log("Parsed availability data:", availabilityData);
      
      const availability = await storage.createUserAvailability(availabilityData);
      res.json(availability);
    } catch (error) {
      console.error("Availability validation error:", error);
      res.status(400).json({ message: "Invalid availability data" });
    }
  });

  app.get("/api/availability/user/:userId", async (req, res) => {
    const userId = Number(req.params.userId);
    const availability = await storage.getUserAvailability(userId);
    res.json(availability);
  });

  app.get("/api/availability/date/:date", async (req, res) => {
    const dateStr = req.params.date;
    try {
      const date = new Date(dateStr);
      const availableUsers = await storage.getUsersAvailableOnDate(date);
      res.json(availableUsers);
    } catch (error) {
      res.status(400).json({ message: "Invalid date format" });
    }
  });
  
  app.post("/api/availability/mutual", async (req, res) => {
    const { userIds, date } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "User IDs required" });
    }
    
    try {
      const mutualSlots = await storage.findMutualAvailability(userIds, new Date(date));
      res.json(mutualSlots);
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });
  
  // Group routes
  app.post("/api/groups", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      console.log("Creating group with user:", req.user);
      console.log("Group data:", req.body);
      
      const groupData = insertGroupSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      console.log("Parsed group data:", groupData);
      
      const group = await storage.createGroup(groupData);
      console.log("Group created:", group);
      
      // Add the creator as a member
      const groupMember = await storage.addUserToGroup({
        groupId: group.id,
        userId: req.user.id,
        role: "admin"
      });
      
      console.log("Added user to group:", groupMember);
      
      res.json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(400).json({ message: "Invalid group data" });
    }
  });
  
  // Get the currently logged in user's groups
  app.get("/api/groups/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = req.user.id;
    const groups = await storage.getUserGroups(userId);
    
    // Always return an array, even if empty
    res.json(groups || []);
  });
  
  app.get("/api/groups/user/:userId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = Number(req.params.userId);
    
    // Only allow users to view their own groups
    if (userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const groups = await storage.getUserGroups(userId);
    res.json(groups || []);
  });
  
  app.get("/api/groups/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const id = Number(req.params.id);
    const group = await storage.getGroup(id);
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    
    res.json(group);
  });
  
  // Group members routes
  app.post("/api/group-members", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const memberData = insertGroupMemberSchema.parse(req.body);
      
      // Check if the user is authorized to add members
      const members = await storage.getGroupMembers(memberData.groupId);
      const userMembership = members.find(m => m.userId === req.user.id);
      
      if (!userMembership || userMembership.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const member = await storage.addUserToGroup(memberData);
      res.json(member);
    } catch (error) {
      res.status(400).json({ message: "Invalid member data" });
    }
  });
  
  app.get("/api/group-members/:groupId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const groupId = Number(req.params.groupId);
    
    // Check if the user is a member of the group
    const members = await storage.getGroupMembers(groupId);
    const userMembership = members.find(m => m.userId === req.user.id);
    
    if (!userMembership) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    res.json(members);
  });
  
  // Group event voting routes
  app.post("/api/group-votes", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const voteData = insertGroupEventVoteSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Check if the user is a member of the group
      const members = await storage.getGroupMembers(voteData.groupId);
      const userMembership = members.find(m => m.userId === req.user.id);
      
      if (!userMembership) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const vote = await storage.createGroupEventVote(voteData);
      
      // Notify group members about the vote
      wsService.notifyGroup(voteData.groupId, {
        type: 'new_vote',
        groupId: voteData.groupId,
        eventId: voteData.eventId,
        userId: req.user.id,
        vote: voteData.vote
      });
      
      res.json(vote);
    } catch (error) {
      res.status(400).json({ message: "Invalid vote data" });
    }
  });
  
  app.get("/api/group-votes/:groupId/:eventId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const groupId = Number(req.params.groupId);
    const eventId = Number(req.params.eventId);
    
    // Check if the user is a member of the group
    const members = await storage.getGroupMembers(groupId);
    const userMembership = members.find(m => m.userId === req.user.id);
    
    if (!userMembership) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const votes = await storage.getGroupEventVotes(groupId, eventId);
    res.json(votes);
  });
  
  // Chat message routes (mostly handled by WebSockets, but these are backup REST endpoints)
  app.post("/api/chat/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const messageData = insertChatMessageSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Check if the user is a member of the group
      const members = await storage.getGroupMembers(messageData.groupId);
      const userMembership = members.find(m => m.userId === req.user.id);
      
      if (!userMembership) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const message = await storage.createChatMessage(messageData);
      
      // Notify group members about the message
      wsService.notifyGroup(messageData.groupId, {
        type: 'new_message',
        groupId: messageData.groupId,
        message
      });
      
      res.json(message);
    } catch (error) {
      res.status(400).json({ message: "Invalid message data" });
    }
  });
  
  app.get("/api/chat/messages/:groupId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const groupId = Number(req.params.groupId);
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    
    // Check if the user is a member of the group
    const members = await storage.getGroupMembers(groupId);
    const userMembership = members.find(m => m.userId === req.user.id);
    
    if (!userMembership) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const messages = await storage.getGroupMessages(groupId, limit, offset);
    
    // Mark messages as read
    await storage.markMessagesAsRead(req.user.id, groupId);
    
    res.json(messages);
  });
  
  // Friendship routes
  app.post("/api/friendships", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const friendshipData = insertFriendshipSchema.parse({
        ...req.body,
        userId: req.user.id,
        status: "pending" // Always start as pending
      });
      
      const friendship = await storage.createFriendship(friendshipData);
      res.json(friendship);
    } catch (error) {
      res.status(400).json({ message: "Invalid friendship data" });
    }
  });
  
  app.get("/api/friends/:userId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = Number(req.params.userId);
    
    // Only allow users to view their own friends
    if (userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const friends = await storage.getUserFriends(userId);
    res.json(friends);
  });
  
  // AI matching routes
  app.get("/api/ai/match-events/:userId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = Number(req.params.userId);
    
    // Only allow users to get matches for themselves
    if (userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const matchedEvents = await storage.getMatchedEventsForUser(userId);
      res.json(matchedEvents);
    } catch (error) {
      console.error("Error in AI event matching:", error);
      res.status(500).json({ message: "Failed to get event matches" });
    }
  });
  
  app.get("/api/ai/match-users/:eventId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const eventId = Number(req.params.eventId);
    const event = await storage.getEvent(eventId);
    
    // Only allow the host to get user matches for their event
    if (!event || event.hostId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const matchedUsers = await storage.getMatchedUsersForEvent(eventId);
      res.json(matchedUsers);
    } catch (error) {
      console.error("Error in AI user matching:", error);
      res.status(500).json({ message: "Failed to get user matches" });
    }
  });
  
  app.post("/api/ai/mutual-time", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { userAvailabilities } = req.body;
    
    if (!Array.isArray(userAvailabilities) || userAvailabilities.length === 0) {
      return res.status(400).json({ message: "User availabilities required" });
    }
    
    try {
      const mutualSlot = await aiService.findMutualTimeSlot(userAvailabilities);
      res.json(mutualSlot);
    } catch (error) {
      console.error("Error finding mutual time slot:", error);
      res.status(500).json({ message: "Failed to find mutual time slot" });
    }
  });
  
  app.post("/api/ai/generate-tags", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { title, description, type } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description required" });
    }
    
    try {
      const tags = await aiService.generateEventTags({ title, description, type: type || "social" });
      res.json({ tags });
    } catch (error) {
      console.error("Error generating event tags:", error);
      res.status(500).json({ message: "Failed to generate tags" });
    }
  });

  // Create HTTP server and initialize WebSocket service
  const httpServer = createServer(app);
  wsService.initialize(httpServer);
  
  return httpServer;
}
