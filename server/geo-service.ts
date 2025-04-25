/**
 * GeolocationService handles location-based matching between users and events
 */
export class GeolocationService {
  
  /**
   * Calculate the distance between two geographic coordinates using the Haversine formula
   * @param lat1 - Latitude of first point in degrees
   * @param lon1 - Longitude of first point in degrees
   * @param lat2 - Latitude of second point in degrees
   * @param lon2 - Longitude of second point in degrees
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
   * Find locations within a specified radius
   * @param centerLat - Latitude of center point
   * @param centerLon - Longitude of center point
   * @param radiusKm - Radius in kilometers
   * @param locations - Array of location objects with lat and lon properties
   * @returns Array of locations within the radius
   */
  findLocationsWithinRadius<T extends { latitude: string | null; longitude: string | null }>(
    centerLat: number,
    centerLon: number,
    radiusKm: number,
    locations: T[]
  ): T[] {
    return locations.filter(location => {
      // Skip invalid locations
      if (!location.latitude || !location.longitude) {
        return false;
      }
      
      const lat = parseFloat(location.latitude);
      const lon = parseFloat(location.longitude);
      
      // Skip invalid coordinates
      if (isNaN(lat) || isNaN(lon)) {
        return false;
      }
      
      const distance = this.calculateDistance(centerLat, centerLon, lat, lon);
      return distance <= radiusKm;
    });
  }
  
  /**
   * Calculate approximate bounds for a location and radius
   * Useful for quick filtering before more precise calculations
   */
  calculateBounds(lat: number, lon: number, radiusKm: number): {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  } {
    // Approximate degrees per km (varies by latitude but this is a reasonable approximation)
    const latDegreesPerKm = 1 / 110.574;
    const lonDegreesPerKm = 1 / (111.32 * Math.cos(lat * Math.PI / 180));
    
    const latDelta = latDegreesPerKm * radiusKm;
    const lonDelta = lonDegreesPerKm * radiusKm;
    
    return {
      minLat: lat - latDelta,
      maxLat: lat + latDelta,
      minLon: lon - lonDelta,
      maxLon: lon + lonDelta
    };
  }
}

// Create a singleton instance
export const geoService = new GeolocationService();