export interface Property {
  id: string;
  landlord_id: string;
  property_name: string;
  full_address: string;
  postcode: string;
  // New address fields
  house_address?: string;
  locality?: string;
  city?: string;
  county?: string;
  country?: string;
  property_type: string;
  bedrooms: number;
  beds: number;
  beds_breakdown?: string;
  bathrooms: number;
  max_occupancy: number;
  parking_type?: string;
  relevant_contact?: string;
  photos?: string[];
  
  // Amenities
  workspace_desk: boolean;
  high_speed_wifi: boolean;
  smart_tv: boolean;
  fully_equipped_kitchen: boolean;
  living_dining_space: boolean;
  washing_machine: boolean;
  iron_ironing_board: boolean;
  linen_towels_provided: boolean;
  consumables_provided: boolean;
  
  // Safety & Compliance
  smoke_alarm: boolean;
  co_alarm: boolean;
  fire_extinguisher_blanket: boolean;
  epc: boolean;
  gas_safety_certificate: boolean;
  eicr: boolean;
  
  // Additional Information
  additional_info?: string;
  
  // Pricing
  weekly_rate: number;
  monthly_rate: number;
  bills_included: boolean;
  
  // Status and metadata
  is_available: boolean;
  created_at: string;
  updated_at: string;
  
  // Index signature for additional properties
  [key: string]: unknown;
}

export interface LandlordProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'landlord';
  company_name?: string;
  company_email?: string;
  company_address?: string;
  contact_number?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyWithOwner extends Property {
  owner: LandlordProfile;
}

export interface BookingDate {
  id: string;
  booking_request_id: string;
  start_date: string;
  end_date: string;
  status?: string;
  created_at: string;
}

export interface Booking {
  id: string;
  full_name: string;
  company_name?: string;
  email: string;
  phone: string;
  project_postcode?: string;
  city?: string;
  team_size?: number;
  budget_per_person_week?: string;
  status: 'pending' | 'reviewing' | 'property_assigned' | 'confirmed' | 'cancelled';
  assigned_property_id?: string;
  user_id?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  booking_dates: BookingDate[];
  assigned_property?: {
    id: string;
    property_name?: string;
    full_address: string;
    weekly_rate: number;
    monthly_rate: number;
  };
  contractor?: {
    id: string;
    full_name: string;
    email: string;
    code?: string | null;
  };
}

export class ApiService {
  constructor() {}

  // Properties API - fetch all properties with owner information (requires admin auth)
  async getAllProperties(accessToken: string): Promise<PropertyWithOwner[]> {
    try {
      // Call backend API to fetch properties (requires authentication)
      const backendUrl = 'https://jfgm6v6pkw.us-east-1.awsapprunner.com';
      const response = await fetch(`${backendUrl}/api/properties`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch properties from backend:', response.status, response.statusText);
        return [];
      }

      const result = await response.json();
      console.log('Properties fetched from backend:', result.data?.length || 0);
      return result.data || [];
    } catch (error) {
      console.error('Error in getAllProperties:', error);
      // Return empty array to prevent crashes
      return [];
    }
  }

  // Get dashboard statistics (requires admin auth)
  async getDashboardStats(accessToken: string): Promise<{
    totalProperties: number;
    bookedProperties: number;
    activeBookings: number;
    pendingBookings: number;
    completeBookings: number;
  }> {
    try {
      // Call backend API to fetch dashboard stats (requires authentication)
      const backendUrl = 'https://jfgm6v6pkw.us-east-1.awsapprunner.com';
      const response = await fetch(`${backendUrl}/api/properties/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch dashboard stats from backend:', response.status, response.statusText);
        return {
          totalProperties: 0,
          bookedProperties: 0,
          activeBookings: 0,
          pendingBookings: 0,
          completeBookings: 0,
        };
      }

      const result = await response.json();
      return result.data || {
        totalProperties: 0,
        bookedProperties: 0,
        activeBookings: 0,
        pendingBookings: 0,
        completeBookings: 0,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalProperties: 0,
        bookedProperties: 0,
        activeBookings: 0,
        pendingBookings: 0,
        completeBookings: 0,
      };
    }
  }

  // Bookings API - fetch all booking requests with related data
  async getAllBookings(): Promise<Booking[]> {
    try {
      // Call backend API to fetch bookings (bypasses RLS)
      const backendUrl = 'https://jfgm6v6pkw.us-east-1.awsapprunner.com';
      const response = await fetch(`${backendUrl}/api/admin-bookings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch bookings from backend');
        return [];
      }

      const result = await response.json();
      console.log('Bookings fetched from backend:', result.bookings?.length || 0);
      return result.bookings || [];
    } catch (error) {
      console.error('Error in getAllBookings:', error);
      // Return empty array to prevent crashes
      return [];
    }
  }
}

// Helper function to format full address from individual address fields
export const formatFullAddress = (property: Property | PropertyWithOwner): string => {
  const addressParts: string[] = [];
  
  // Add address parts in the specified hierarchy, skipping null/undefined values
  if (property.house_address) addressParts.push(property.house_address);
  if (property.locality) addressParts.push(property.locality);
  if (property.city) addressParts.push(property.city);
  if (property.county) addressParts.push(property.county);
  if (property.postcode) addressParts.push(property.postcode);
  if (property.country) addressParts.push(property.country);
  
  // Join with commas and return, or fallback to full_address if no parts
  return addressParts.length > 0 ? addressParts.join(', ') : property.full_address || '';
};

export const apiService = new ApiService();