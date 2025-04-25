import { User, Event, UserAvailability } from '@shared/schema';
import { apiRequest } from './queryClient';

/**
 * Client-side AI service for Link app
 * Provides interfaces to server-side AI matching functions
 */
export class AIService {
  
  /**
   * Get personalized event recommendations for a user
   * @param userId - User ID
   * @returns Promise with array of recommended events
   */
  async getRecommendedEvents(userId: number): Promise<Event[]> {
    try {
      const response = await apiRequest('GET', `/api/ai/match-events/${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Error getting recommended events:', error);
      throw error;
    }
  }
  
  /**
   * Get matching users for an event
   * @param eventId - Event ID
   * @returns Promise with array of matching users
   */
  async getMatchingUsersForEvent(eventId: number): Promise<User[]> {
    try {
      const response = await apiRequest('GET', `/api/ai/match-users/${eventId}`);
      return await response.json();
    } catch (error) {
      console.error('Error getting matching users:', error);
      throw error;
    }
  }
  
  /**
   * Find a mutually convenient time slot for multiple users
   * @param userAvailabilities - Array of user availabilities
   * @returns Promise with suggested date and time slot
   */
  async findMutualTimeSlot(
    userAvailabilities: Array<{ userId: number, dates: string[], timeSlots: string[] }>
  ): Promise<{ date: string, timeSlot: string }> {
    try {
      const response = await apiRequest('POST', '/api/ai/mutual-time', {
        userAvailabilities
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error finding mutual time slot:', error);
      throw error;
    }
  }
  
  /**
   * Generate suggested tags for an event
   * @param title - Event title
   * @param description - Event description
   * @param type - Event type
   * @returns Promise with array of suggested tags
   */
  async generateEventTags(
    title: string, 
    description: string, 
    type: string = 'social'
  ): Promise<string[]> {
    try {
      const response = await apiRequest('POST', '/api/ai/generate-tags', {
        title,
        description,
        type
      });
      
      const data = await response.json();
      return data.tags;
    } catch (error) {
      console.error('Error generating event tags:', error);
      throw error;
    }
  }
  
  /**
   * Suggest groups based on user interests and location
   * @param userId - User ID
   * @returns Promise with array of suggested users to create groups with
   */
  async suggestGroups(userId: number): Promise<User[]> {
    // For now, this is just a convenience function using other API endpoints
    try {
      // Get the user to find their interests
      const userResponse = await apiRequest('GET', `/api/users/${userId}`);
      const user = await userResponse.json();
      
      // Get users with similar interests (limited implementation for now)
      if (user.interests && Array.isArray(user.interests) && user.interests.length > 0) {
        const interests = user.interests.join(',');
        const response = await apiRequest('GET', `/api/users/interests/${interests}`);
        const users = await response.json();
        
        // Filter out the current user
        return users.filter((u: User) => u.id !== userId);
      }
      
      return [];
    } catch (error) {
      console.error('Error suggesting groups:', error);
      throw error;
    }
  }
  
  /**
   * Determine compatibility percentage between two users
   * This is a simpler client-side version using overlapping interests and skills
   * @param user1 - First user
   * @param user2 - Second user 
   * @returns Compatibility percentage (0-100)
   */
  calculateCompatibility(user1: User, user2: User): number {
    // Initialize scores for different compatibility factors
    let interestsScore = 0;
    let skillsScore = 0;
    let careerScore = 0;
    
    // Compare interests
    if (user1.interests && user2.interests && 
        Array.isArray(user1.interests) && Array.isArray(user2.interests)) {
      const user1Interests = user1.interests as string[];
      const user2Interests = user2.interests as string[];
      
      // Count common interests
      const commonInterests = user1Interests.filter(interest => 
        user2Interests.includes(interest)
      );
      
      // Calculate interest score (max 50%)
      const totalInterests = Math.max(user1Interests.length, user2Interests.length);
      interestsScore = totalInterests > 0 
        ? (commonInterests.length / totalInterests) * 50 
        : 0;
    }
    
    // Compare skills
    if (user1.skills && user2.skills && 
        Array.isArray(user1.skills) && Array.isArray(user2.skills)) {
      const user1Skills = user1.skills as string[];
      const user2Skills = user2.skills as string[];
      
      // Count common skills
      const commonSkills = user1Skills.filter(skill => 
        user2Skills.includes(skill)
      );
      
      // Calculate skills score (max 30%)
      const totalSkills = Math.max(user1Skills.length, user2Skills.length);
      skillsScore = totalSkills > 0 
        ? (commonSkills.length / totalSkills) * 30 
        : 0;
    }
    
    // Compare career path (max 20%)
    if (user1.careerPath && user2.careerPath && user1.careerPath === user2.careerPath) {
      careerScore = 20;
    }
    
    // Return total compatibility percentage
    return Math.round(interestsScore + skillsScore + careerScore);
  }
}

// Create singleton instance
export const aiService = new AIService();