import { User, Event } from '@shared/schema';
import { apiRequest } from './queryClient';

/**
 * Client-side geolocation service for Link app
 * Provides location-based searching and distance calculations
 */
export class GeolocationService {
  
  /**
   * Get the current user's location
   * @returns Promise with coordinates or error
   */
  async getCurrentPosition(): Promise<GeolocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        position => resolve(position.coords),
        error => reject(error),
        { enableHighAccuracy: true }
      );
    });
  }
  
  /**
   * Calculate distance between two coordinates
   * @param lat1 - Latitude of first position
   * @param lon1 - Longitude of first position
   * @param lat2 - Latitude of second position
   * @param lon2 - Longitude of second position
   * @returns Distance in kilometers
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Convert degrees to radians
    const toRad = (value: number) => value * Math.PI / 180;
    
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }
  
  /**
   * Format distance for display
   * @param distance - Distance in kilometers
   * @returns Formatted distance string
   */
  formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    } else if (distance < 10) {
      return `${distance.toFixed(1)} km`;
    } else {
      return `${Math.round(distance)} km`;
    }
  }
  
  /**
   * Get nearby users
   * @param radius - Search radius in kilometers
   * @returns Promise with array of users
   */
  async getNearbyUsers(radius: number = 10): Promise<User[]> {
    try {
      const coords = await this.getCurrentPosition();
      
      const response = await apiRequest('GET', 
        `/api/users/nearby?lat=${coords.latitude}&lng=${coords.longitude}&radius=${radius}`
      );
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching nearby users:', error);
      throw error;
    }
  }
  
  /**
   * Get nearby events
   * @param radius - Search radius in kilometers
   * @returns Promise with array of events
   */
  async getNearbyEvents(radius: number = 10): Promise<Event[]> {
    try {
      const coords = await this.getCurrentPosition();
      
      const response = await apiRequest('GET', 
        `/api/events/nearby?lat=${coords.latitude}&lng=${coords.longitude}&radius=${radius}`
      );
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching nearby events:', error);
      throw error;
    }
  }
  
  /**
   * Save user's current location
   * @param userId - User ID
   * @returns Promise with updated user data
   */
  async saveUserLocation(userId: number): Promise<User> {
    try {
      const coords = await this.getCurrentPosition();
      
      const response = await apiRequest('PATCH', `/api/users/${userId}`, {
        latitude: coords.latitude.toString(),
        longitude: coords.longitude.toString()
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error saving user location:', error);
      throw error;
    }
  }
  
  /**
   * Save event location
   * @param eventId - Event ID
   * @param address - Address string
   * @returns Promise with updated event data
   */
  async saveEventLocation(eventId: number, address: string): Promise<Event> {
    try {
      // For a real app, here we would use a geocoding service
      // to convert address to coordinates
      
      // For demo purposes, just use current location
      const coords = await this.getCurrentPosition();
      
      const response = await apiRequest('PATCH', `/api/events/${eventId}`, {
        location: address,
        latitude: coords.latitude.toString(),
        longitude: coords.longitude.toString()
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error saving event location:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const geolocationService = new GeolocationService();