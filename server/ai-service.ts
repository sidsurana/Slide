import OpenAI from "openai";
import { User, Event } from "@shared/schema";

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * AI matching service for Link app
 * Provides intelligent matching between users and events based on
 * interests, location, career path, and other profile data
 */
export class AIMatchingService {
  
  /**
   * Find matching users for a given user based on interests, skills, and location
   */
  async findMatchingUsers(user: User, allUsers: User[]): Promise<User[]> {
    try {
      // Filter out the current user
      const otherUsers = allUsers.filter(u => u.id !== user.id);
      
      // If user has no interests or skills, return empty array
      if (!user.interests || !user.skills) {
        return [];
      }
      
      const userInterests = Array.isArray(user.interests) ? user.interests : [];
      const userSkills = Array.isArray(user.skills) ? user.skills : [];
      
      // Prepare prompt for OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { 
            role: "system", 
            content: "You are a matching expert helping to connect users based on compatibility. Return JSON only."
          },
          {
            role: "user",
            content: `Given a user with interests: ${JSON.stringify(userInterests)}, 
                      skills: ${JSON.stringify(userSkills)},
                      and career path: ${user.careerPath ? user.careerPath : "Not specified"},
                      rank the following users by compatibility score from 0 to 1.0.
                      Each user object has an 'id' property and the response should be an array of 
                      {userId: number, compatibilityScore: number} objects, sorted by compatibilityScore in descending order.
                      Users: ${JSON.stringify(otherUsers.map(u => ({
                        id: u.id,
                        interests: u.interests || [],
                        skills: u.skills || [],
                        careerPath: u.careerPath,
                        profession: u.profession
                      })))}
                      `
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });
      
      // Parse the response
      const result = JSON.parse(response.choices[0].message.content);
      
      // Return users sorted by compatibilityScore
      if (result.matches && Array.isArray(result.matches)) {
        const sortedMatches = result.matches.sort(
          (a: {userId: number, compatibilityScore: number}, 
           b: {userId: number, compatibilityScore: number}) => 
            b.compatibilityScore - a.compatibilityScore
        );
        
        // Return the actual user objects in order of compatibility
        return sortedMatches
          .filter((match: {userId: number, compatibilityScore: number}) => 
            match.compatibilityScore > 0.4) // Only return good matches
          .map((match: {userId: number, compatibilityScore: number}) => 
            otherUsers.find(u => u.id === match.userId))
          .filter(Boolean) as User[];
      }
      
      return [];
    } catch (error) {
      console.error("Error finding matching users:", error);
      return [];
    }
  }
  
  /**
   * Suggest events for a user based on their profile
   */
  async suggestEventsForUser(user: User, allEvents: Event[]): Promise<Event[]> {
    try {
      // If user has no interests or skills, return empty array
      if (!user.interests || !user.skills) {
        return [];
      }
      
      const userInterests = Array.isArray(user.interests) ? user.interests : [];
      const userSkills = Array.isArray(user.skills) ? user.skills : [];
      
      // Prepare prompt for OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { 
            role: "system", 
            content: "You are an event recommendation system. Return JSON only."
          },
          {
            role: "user",
            content: `Given a user with interests: ${JSON.stringify(userInterests)}, 
                      skills: ${JSON.stringify(userSkills)},
                      and career path: ${user.careerPath ? user.careerPath : "Not specified"},
                      rank the following events by relevance score from 0 to 1.0.
                      Each event object has an 'id' property and the response should be an array of 
                      {eventId: number, relevanceScore: number, reason: string} objects, sorted by relevanceScore in descending order.
                      Events: ${JSON.stringify(allEvents.map(e => ({
                        id: e.id,
                        title: e.title,
                        description: e.description,
                        tags: e.tags || [],
                        careerFocus: e.careerFocus,
                        interestCategories: e.interestCategories || [],
                        type: e.type,
                        category: e.category
                      })))}
                      `
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });
      
      // Parse the response
      const result = JSON.parse(response.choices[0].message.content);
      
      // Return events sorted by relevanceScore
      if (result.recommendations && Array.isArray(result.recommendations)) {
        const sortedRecommendations = result.recommendations.sort(
          (a: {eventId: number, relevanceScore: number}, 
           b: {eventId: number, relevanceScore: number}) => 
            b.relevanceScore - a.relevanceScore
        );
        
        // Return the actual event objects in order of relevance
        return sortedRecommendations
          .filter((rec: {eventId: number, relevanceScore: number}) => 
            rec.relevanceScore > 0.5) // Only return relevant events
          .map((rec: {eventId: number, relevanceScore: number}) => 
            allEvents.find(e => e.id === rec.eventId))
          .filter(Boolean) as Event[];
      }
      
      return [];
    } catch (error) {
      console.error("Error suggesting events:", error);
      return [];
    }
  }
  
  /**
   * Find a mutually convenient time slot for a group of users
   */
  async findMutualTimeSlot(userAvailabilities: { userId: number, dates: string[], timeSlots: string[] }[]): Promise<{ date: string, timeSlot: string }> {
    try {
      // Prepare prompt for OpenAI to find the best time slot
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { 
            role: "system", 
            content: "You are a scheduling assistant helping to find the best mutual time for a group. Return JSON only."
          },
          {
            role: "user",
            content: `Given the following user availabilities, find the best date and time slot that would work for most or all users.
                      The possible time slots are: 'morning', 'afternoon', 'evening', 'late_night'.
                      Return a JSON object with 'date' and 'timeSlot' properties, along with a 'coverage' property indicating what percentage of users this works for.
                      User availabilities: ${JSON.stringify(userAvailabilities)}
                      `
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });
      
      // Parse the response
      const result = JSON.parse(response.choices[0].message.content);
      
      return {
        date: result.date,
        timeSlot: result.timeSlot
      };
    } catch (error) {
      console.error("Error finding mutual time slot:", error);
      // Fallback to a simple algorithm if AI fails
      return findMutualTimeSlotFallback(userAvailabilities);
    }
  }
  
  /**
   * Generate appropriate tags for an event based on its description
   */
  async generateEventTags(event: { title: string, description: string, type: string }): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { 
            role: "system", 
            content: "You are a tagging system for events. Return JSON only."
          },
          {
            role: "user",
            content: `Given the following event, generate relevant tags that would help match it with interested users.
                      Return an array of tag strings (3-7 tags). Use short, concise tags.
                      Event: 
                      Title: ${event.title}
                      Description: ${event.description}
                      Type: ${event.type}
                      `
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });
      
      // Parse the response
      const result = JSON.parse(response.choices[0].message.content);
      
      return result.tags || [];
    } catch (error) {
      console.error("Error generating event tags:", error);
      return [];
    }
  }
}

/**
 * Fallback function for finding mutual time slots without AI
 */
function findMutualTimeSlotFallback(userAvailabilities: { userId: number, dates: string[], timeSlots: string[] }[]): { date: string, timeSlot: string } {
  // Count occurrences of each date-time combination
  const countMap = new Map<string, number>();
  
  userAvailabilities.forEach(ua => {
    ua.dates.forEach(date => {
      ua.timeSlots.forEach(timeSlot => {
        const key = `${date}:${timeSlot}`;
        countMap.set(key, (countMap.get(key) || 0) + 1);
      });
    });
  });
  
  // Find the combination with highest count
  let bestKey = '';
  let bestCount = 0;
  
  countMap.forEach((count, key) => {
    if (count > bestCount) {
      bestCount = count;
      bestKey = key;
    }
  });
  
  // If we found a mutual slot
  if (bestKey) {
    const [date, timeSlot] = bestKey.split(':');
    return { date, timeSlot };
  }
  
  // Fallback to the first user's first availability if no mutual slot
  if (userAvailabilities.length > 0 && userAvailabilities[0].dates.length > 0) {
    return {
      date: userAvailabilities[0].dates[0],
      timeSlot: userAvailabilities[0].timeSlots[0] || 'evening'
    };
  }
  
  // Ultimate fallback
  return {
    date: new Date().toISOString().split('T')[0], // today
    timeSlot: 'evening'
  };
}

// Create a singleton instance
export const aiService = new AIMatchingService();