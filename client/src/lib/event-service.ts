import { apiRequest } from "./queryClient";
import { Event, EventParticipant } from "@shared/schema";

export async function createEvent(eventData: {
  title: string;
  description: string;
  date: string;
  location?: string;
  imageUrl?: string;
  hostId: number;
  type: string;
  category?: string;
  maxAttendees?: number;
  friendGroupId?: string;
}): Promise<Event> {
  const response = await apiRequest("POST", "/api/events", eventData);
  return response.json();
}

export async function getEvents(type?: string): Promise<Event[]> {
  const url = type ? `/api/events?type=${type}` : "/api/events";
  const response = await fetch(url, { credentials: "include" });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getEvent(id: number): Promise<Event> {
  const response = await fetch(`/api/events/${id}`, { credentials: "include" });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch event: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getUserEvents(userId: number): Promise<Event[]> {
  const response = await fetch(`/api/events/user/${userId}`, { credentials: "include" });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user events: ${response.statusText}`);
  }
  
  return response.json();
}

export async function joinEvent(eventId: number, userId: number, status: string = "going"): Promise<EventParticipant> {
  const response = await apiRequest("POST", "/api/event-participants", {
    eventId,
    userId,
    status,
  });
  
  return response.json();
}

export async function updateEventParticipation(participantId: number, status: string): Promise<EventParticipant> {
  const response = await apiRequest("PATCH", `/api/event-participants/${participantId}`, {
    status,
  });
  
  return response.json();
}

export async function getEventParticipants(eventId: number): Promise<EventParticipant[]> {
  const response = await fetch(`/api/event-participants/${eventId}`, { credentials: "include" });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch event participants: ${response.statusText}`);
  }
  
  return response.json();
}
