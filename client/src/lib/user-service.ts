import { apiRequest } from "./queryClient";
import { User, UserAvailability } from "@shared/schema";

export async function getCurrentUser(): Promise<User> {
  const response = await fetch("/api/users/current", { credentials: "include" });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch current user: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`, { credentials: "include" });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.statusText}`);
  }
  
  return response.json();
}

export async function updateUserAvailability(
  userId: number,
  date: string,
  timeslots: string[]
): Promise<UserAvailability> {
  const response = await apiRequest("POST", "/api/availability", {
    userId,
    date,
    timeslots,
  });
  
  return response.json();
}

export async function getUserAvailability(userId: number): Promise<UserAvailability[]> {
  const response = await fetch(`/api/availability/user/${userId}`, { credentials: "include" });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user availability: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getUsersAvailableOnDate(date: string): Promise<User[]> {
  const response = await fetch(`/api/availability/date/${date}`, { credentials: "include" });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch available users: ${response.statusText}`);
  }
  
  return response.json();
}
