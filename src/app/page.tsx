'use client';

import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { apiService, PropertyWithOwner, Booking, formatFullAddress } from '@/lib/api';
import { supabase } from '@/lib/supabase';

// Authentication check flag - set to true to enable authentication requirement
const REQUIRE_AUTH = true;
import PropertyDetailsModal from '@/components/PropertyDetailsModal';
import PropertyAssignmentModal from '@/components/PropertyAssignmentModal';

interface DashboardStats {
  totalProperties: number;
  bookedProperties: number;
  activeBookings: number;
  pendingBookings: number;
  completeBookings: number;
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  role?: string;
  email_verified?: boolean;
  [key: string]: unknown;
}

interface PlatformUser {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  userType: string;
  tableName: string;
  phone?: string;
  contact_number?: string;
  [key: string]: unknown;
}

// UK Cities list for city filter
const UK_CITIES = [
  'Aberdeen',
  'Belfast',
  'Birmingham',
  'Bradford',
  'Brighton',
  'Bristol',
  'Cambridge',
  'Cardiff',
  'Coventry',
  'Derby',
  'Edinburgh',
  'Glasgow',
  'Hull',
  'Leeds',
  'Leicester',
  'Liverpool',
  'London',
  'Luton',
  'Manchester',
  'Milton Keynes',
  'Newcastle upon Tyne',
  'Northampton',
  'Norwich',
  'Nottingham',
  'Oxford',
  'Portsmouth',
  'Reading',
  'Sheffield',
  'Southampton',
  'Swansea',
  'Wolverhampton'
];

// AdminBooking is now the same as Booking from the API
type AdminBooking = Booking;

interface BookedProperty {
  id: string;
  property_id: string;
  contractor_id: string;
  booking_request_id: string;
  booking_id?: string;
  start_date: string;
  end_date: string;
  team_size?: number;
  project_postcode?: string;
  city?: string;
  company_name?: string;
  property_name?: string;
  property_type?: string;
  created_at: string;
  properties?: {
    id: string;
    property_name?: string;
    house_address?: string;
    locality?: string;
    city?: string;
    county?: string;
    country?: string;
    postcode?: string;
    property_type?: string;
    bedrooms?: number;
    beds?: number;
    bathrooms?: number;
  };
  contractor?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  booking_requests?: {
    id: string;
    full_name: string;
    company_name?: string;
    email: string;
    phone?: string;
    city?: string;
  };
}

// Memoized Property Tile Component for optimized rendering
// Uses content-visibility: auto for scroll performance
interface PropertyTileProps {
  property: PropertyWithOwner;
  isPropertySelectionMode: boolean;
  selectedPropertyForAssignment: PropertyWithOwner | null;
  onPropertyClick: (property: PropertyWithOwner) => void;
  onPropertySelect: (property: PropertyWithOwner) => void;
}

const PropertyTile = memo(function PropertyTile({
  property,
  isPropertySelectionMode,
  selectedPropertyForAssignment,
  onPropertyClick,
  onPropertySelect,
}: PropertyTileProps) {
  return (
    <div 
      className={`bg-white rounded-lg sm:rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 ${
        isPropertySelectionMode ? 'cursor-default' : 'cursor-pointer'
      } ${selectedPropertyForAssignment?.id === property.id ? 'ring-2 ring-booking-teal' : ''}`}
      style={{
        transform: 'translateZ(0)', // GPU acceleration for smooth scrolling
        backfaceVisibility: 'hidden', // Prevents flickering during scroll
        willChange: 'transform', // Hints browser to optimize for scroll
      }}
      onClick={() => {
        if (isPropertySelectionMode) {
          onPropertySelect(property);
        } else {
          onPropertyClick(property);
        }
      }}
    >
      {/* Property Image */}
      <div className="relative h-16 sm:h-48 w-[calc(100%-0.5rem)] sm:w-full p-0.5 sm:p-3 mx-1 mt-1 sm:mx-0 sm:mt-0">
        {property.photos && property.photos.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={property.photos[0]} 
            alt={property.property_name || 'Property photo'}
            loading="lazy"
            className="w-full h-full object-cover rounded-md sm:rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
              if (nextElement) {
                nextElement.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div className={`absolute inset-0.5 sm:inset-3 bg-gray-100 rounded-md sm:rounded-lg flex items-center justify-center ${property.photos && property.photos.length > 0 ? 'hidden' : 'flex'}`}>
          <svg className="w-4 h-4 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        
        {/* Radio Button for Selection Mode */}
        {isPropertySelectionMode && (
          <div className="absolute top-0.5 left-0.5 sm:top-6 sm:left-6">
            <input
              type="radio"
              name="property-selection"
              checked={selectedPropertyForAssignment?.id === property.id}
              onChange={() => onPropertySelect(property)}
              className="w-3 h-3 sm:w-8 sm:h-8 text-booking-teal focus:ring-booking-teal border-gray-300 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-1 sm:p-4 mx-1 mb-1 sm:mx-0 sm:mb-0">
        <h3 className="text-[10px] sm:text-lg font-semibold text-booking-dark mb-0.5 sm:mb-2 line-clamp-2">
          {property.property_name}
        </h3>
        
        <div className="text-[8px] sm:text-sm text-blue-600 font-medium mb-0.5 sm:mb-2">
          Property ID: {property.id}
        </div>
        
        <p className="text-[8px] sm:text-sm text-booking-gray mb-0.5 sm:mb-3 line-clamp-2">
          {formatFullAddress(property)}
        </p>

        <div className="flex items-center justify-between mb-0.5 sm:mb-3">
          <span className="text-[8px] sm:text-sm text-booking-gray capitalize">
            {property.property_type}
          </span>
        </div>

        {/* Property Details - Beds, Bedrooms, Bathrooms */}
        <div className="flex items-center justify-between space-x-0.5 sm:space-x-4 mb-0.5 sm:mb-1">
          <div className="text-center flex-1">
            <div className="text-[8px] sm:text-sm font-semibold text-booking-dark">{property.beds || 0}</div>
            <div className="text-[7px] sm:text-xs text-booking-gray">Beds</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-[8px] sm:text-sm font-semibold text-booking-dark">{property.bedrooms || 0}</div>
            <div className="text-[7px] sm:text-xs text-booking-gray">Bedrooms</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-[8px] sm:text-sm font-semibold text-booking-dark">{property.bathrooms || 0}</div>
            <div className="text-[7px] sm:text-xs text-booking-gray">Bathrooms</div>
          </div>
        </div>

        {/* Pricing */}
        <div className="mt-0.5 sm:mt-2 mb-0.5 sm:mb-3">
          {property.weekly_rate && (
            <div className="text-[8px] sm:text-sm text-booking-gray">
              <span className="font-medium">Weekly:</span> £{property.weekly_rate}
            </div>
          )}
          {property.monthly_rate && (
            <div className="text-[8px] sm:text-sm text-booking-gray">
              <span className="font-medium">Monthly:</span> £{property.monthly_rate}
            </div>
          )}
        </div>

        {/* Property Contact Information */}
        {property.relevant_contact && (
          <div className="border-t border-gray-200 pt-0.5 sm:pt-2 mt-0.5 sm:mt-3">
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-[7px] sm:text-xs text-booking-gray">
                <span className="font-medium">Contact:</span> {property.relevant_contact}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default function AdminDashboard() {
  const router = useRouter();
  
  // Helper function to map user types for display
  const getUserTypeDisplay = (userType: string) => {
    if (userType === 'Contractor') return 'Client';
    if (userType === 'Landlord') return 'Partner';
    return userType;
  };
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    bookedProperties: 0,
    activeBookings: 0,
    pendingBookings: 0,
    completeBookings: 0
  });
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [properties, setProperties] = useState<PropertyWithOwner[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPropertyDetailsModalOpen, setIsPropertyDetailsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithOwner | null>(null);
  const [isPropertyAssignmentModalOpen, setIsPropertyAssignmentModalOpen] = useState(false);
  const [isPropertySelectionMode, setIsPropertySelectionMode] = useState(false);
  const [selectedPropertyForAssignment, setSelectedPropertyForAssignment] = useState<PropertyWithOwner | null>(null);
  const [bookingToAssign, setBookingToAssign] = useState<AdminBooking | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set(['search']));
  const [filterValues, setFilterValues] = useState({
    search: '',
    postcode: '',
    city: '',
    property_type: '',
    parking_type: '',
    bedrooms: '',
    beds: '',
    bathrooms: '',
    max_occupancy: '',
    workspace_desk: false,
    high_speed_wifi: false,
    fully_equipped_kitchen: false,
    living_dining_space: false,
    fire_extinguisher_blanket: false,
    gas_safety_certificate: false,
    epc: false,
    eicr: false
  });
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  
  // Booking-specific filter state
  const [selectedBookingFilters, setSelectedBookingFilters] = useState<Set<string>>(new Set(['search']));
  const [bookingFilterValues, setBookingFilterValues] = useState({
    search: '',
    contractor_code: '',
    property_id: '',
    city: '',
    start_date: '',
    end_date: '',
    status: ''
  });
  const [isBookingFilterDropdownOpen, setIsBookingFilterDropdownOpen] = useState(false);

  // Dashboard booked properties state
  const [showBookedProperties, setShowBookedProperties] = useState(false);
  const [bookedProperties, setBookedProperties] = useState<BookedProperty[]>([]);
  
  // Booked properties filter state
  const [selectedBookedPropertiesFilters, setSelectedBookedPropertiesFilters] = useState<Set<string>>(new Set());
  const [bookedPropertiesFilterValues, setBookedPropertiesFilterValues] = useState({
    property_id: '',
    start_date: '',
    end_date: ''
  });
  const [isBookedPropertiesFilterDropdownOpen, setIsBookedPropertiesFilterDropdownOpen] = useState(false);

  // User Management state
  const [activeUserTab, setActiveUserTab] = useState<'administrators' | 'platform-users'>('administrators');
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [platformUsers, setPlatformUsers] = useState<PlatformUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Properties pagination state (infinite scroll - 2 rows of 4 = 8 properties at a time)
  const [visiblePropertiesCount, setVisiblePropertiesCount] = useState(8);
  const propertiesEndRef = useRef<HTMLDivElement>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false
  });

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    confirmColor: 'green' | 'orange' | 'red';
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    confirmColor: 'green'
  });

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 4000);
  };

  // Show confirmation modal
  const showConfirmModal = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = 'Confirm',
    confirmColor: 'green' | 'orange' | 'red' = 'green'
  ) => {
    setConfirmModal({
      visible: true,
      title,
      message,
      onConfirm,
      confirmText,
      confirmColor
    });
  };

  // Close confirmation modal
  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, visible: false }));
  };

  // Authentication check - redirect to login if not authenticated
  useEffect(() => {
    const checkAuth = async () => {
      if (REQUIRE_AUTH) {
        try {
          // Check if user is authenticated via Supabase
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error || !session) {
            console.log('No active session, redirecting to login');
            router.push('/auth/login');
            return;
          }

          console.log('Admin authenticated:', session.user);
        } catch {
          router.push('/auth/login');
        }
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch users when User Management tab is accessed
  useEffect(() => {
    if (activeTab === 'users') {
      if (activeUserTab === 'administrators') {
        fetchAdminUsers();
      } else if (activeUserTab === 'platform-users') {
        fetchPlatformUsers();
      }
    }
  }, [activeTab, activeUserTab]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.filter-dropdown-container')) {
        setIsFilterDropdownOpen(false);
        setIsBookingFilterDropdownOpen(false);
        setIsBookedPropertiesFilterDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset visible properties count when filters change
  useEffect(() => {
    setVisiblePropertiesCount(8);
  }, [filterValues, selectedFilters]);

  // Intersection observer for infinite scroll in All Properties
  const loadMoreProperties = useCallback(() => {
    setVisiblePropertiesCount(prev => prev + 8);
  }, []);

  useEffect(() => {
    const sentinel = propertiesEndRef.current;
    if (!sentinel || activeTab !== 'properties') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreProperties();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, loadMoreProperties]);


  const fetchDashboardData = async () => {
    try {
      // Get auth session for authorization
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        console.error('No session found for fetchDashboardData');
        setProperties([]);
        setBookings([]);
        return;
      }

      // Fetch real data from Supabase (stats and properties now require auth)
      const [statsData, propertiesData, bookingsData] = await Promise.all([
        apiService.getDashboardStats(sessionData.session.access_token),
        apiService.getAllProperties(sessionData.session.access_token),
        apiService.getAllBookings(sessionData.session.access_token)
      ]);

      setStats(statsData);
      setProperties(propertiesData);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      // Fallback to empty data on error
      setStats({
        totalProperties: 0,
        bookedProperties: 0,
        activeBookings: 0,
        pendingBookings: 0,
        completeBookings: 0
      });
      setProperties([]);
      setBookings([]);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchBookedProperties = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        console.error('No session found for fetchBookedProperties');
        setBookedProperties([]);
        return;
      }

      // Call backend API to fetch booked properties with authentication
      const backendUrl = 'https://jfgm6v6pkw.us-east-1.awsapprunner.com';
      const response = await fetch(`${backendUrl}/api/admin-booked-properties`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch booked properties from backend:', response.status, response.statusText);
        setBookedProperties([]);
        return;
      }

      const result = await response.json();
      console.log('Booked properties fetched from backend:', result.bookedProperties?.length || 0);
      setBookedProperties(result.bookedProperties || []);
    } catch (error) {
      console.error('Error fetching booked properties from backend:', error);
      setBookedProperties([]);
    }
  };

  const fetchAdminUsers = async () => {
    setLoadingUsers(true);
    try {
      // Get auth session for authorization
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        console.error('No session found for fetchAdminUsers');
        setAdminUsers([]);
        return;
      }

      // Fetch admin users from backend API with authentication
      const backendUrl = 'https://jfgm6v6pkw.us-east-1.awsapprunner.com';
      const response = await fetch(`${backendUrl}/api/admin-users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
      });
      
      if (!response.ok) {
        console.error('Backend API error:', response.status, response.statusText);
        setAdminUsers([]);
        return;
      }

      const result = await response.json();
      
      if (result.success && result.users) {
        console.log('Admin users fetched from backend:', result.users.length);
        setAdminUsers(result.users);
      } else {
        console.error('Invalid response from backend:', result);
        setAdminUsers([]);
      }
    } catch (error) {
      console.error('Error fetching admin users from backend:', error);
      setAdminUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPlatformUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        console.error('No session found for fetchPlatformUsers');
        setPlatformUsers([]);
        return;
      }

      // Fetch platform users from backend API with authentication
      const backendUrl = 'https://jfgm6v6pkw.us-east-1.awsapprunner.com';
      const response = await fetch(`${backendUrl}/api/platform-users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
      });
      
      if (!response.ok) {
        console.error('Backend API error:', response.status, response.statusText);
        setPlatformUsers([]);
        return;
      }

      const result = await response.json();
      
      if (result.success && result.users) {
        console.log('Platform users fetched from backend:', result.counts);
        setPlatformUsers(result.users);
      } else {
        console.error('Invalid response from backend:', result);
        setPlatformUsers([]);
      }
    } catch (error) {
      console.error('Error fetching platform users from backend:', error);
      setPlatformUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleActivateUser = async (userId: string, tableName: string, userName: string) => {
    console.log('Activating user:', { userId, tableName, userName });
    
    if (!tableName) {
      console.error('Table name is undefined!');
      showToast('Error: Unable to determine user type. Please refresh and try again.', 'error');
      return;
    }

    const performActivation = async () => {
      closeConfirmModal();
      try {
        // Get auth session for authorization
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData.session) {
          console.error('No session found for activating user');
          showToast('Authentication error. Please log in again.', 'error');
          return;
        }

        // Call backend API to activate user (bypasses RLS)
        const backendUrl = 'https://jfgm6v6pkw.us-east-1.awsapprunner.com';
        const response = await fetch(`${backendUrl}/api/admin-users/activate`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({ userId, tableName }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          console.error('Error activating user:', result);
          showToast(`Failed to activate user: ${result.error || 'Unknown error'}`, 'error');
        } else {
          console.log(`User ${userName} activated successfully`);
          showToast(`${userName} has been activated successfully.`, 'success');
          // Refresh the platform users list
          fetchPlatformUsers();
        }
      } catch (error) {
        console.error('Error activating user:', error);
        showToast('An unexpected error occurred while activating the user.', 'error');
      }
    };

    showConfirmModal(
      'Activate User',
      `Are you sure you want to activate ${userName}?`,
      performActivation,
      'Activate',
      'green'
    );
  };

  const handleDeactivateUser = async (userId: string, tableName: string, userName: string) => {
    console.log('Deactivating user:', { userId, tableName, userName });
    
    if (!tableName) {
      console.error('Table name is undefined!');
      showToast('Error: Unable to determine user type. Please refresh and try again.', 'error');
      return;
    }

    const performDeactivation = async () => {
      closeConfirmModal();
      try {
        // Call backend API to deactivate user (bypasses RLS)
        const backendUrl = 'https://jfgm6v6pkw.us-east-1.awsapprunner.com';
        const response = await fetch(`${backendUrl}/api/admin-users/deactivate`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, tableName }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          console.error('Error deactivating user:', result);
          showToast(`Failed to deactivate user: ${result.error || 'Unknown error'}`, 'error');
        } else {
          console.log(`User ${userName} deactivated successfully`);
          showToast(`${userName} has been deactivated successfully.`, 'success');
          // Refresh the platform users list
          fetchPlatformUsers();
        }
      } catch (error) {
        console.error('Error deactivating user:', error);
        showToast('An unexpected error occurred while deactivating the user.', 'error');
      }
    };

    showConfirmModal(
      'Deactivate User',
      `Are you sure you want to deactivate ${userName}? They will not be able to access their account.`,
      performDeactivation,
      'Deactivate',
      'orange'
    );
  };

  const handleDeleteUser = async (userId: string, tableName: string, userName: string) => {
    console.log('Deleting user:', { userId, tableName, userName });
    
    if (!tableName) {
      console.error('Table name is undefined!');
      alert('Error: Unable to determine user type. Please refresh and try again.');
      return;
    }

    if (!confirm(`⚠️ WARNING: Are you sure you want to DELETE ${userName}?\n\nThis action CANNOT be undone. All user data will be permanently removed.`)) {
      return;
    }

    // Double confirmation for delete
    if (!confirm(`This is your final confirmation. Type OK in your mind and click OK to permanently delete ${userName}.`)) {
      return;
    }

    try {
      // Call backend API to delete user (bypasses RLS)
      const backendUrl = 'https://jfgm6v6pkw.us-east-1.awsapprunner.com';
      const response = await fetch(`${backendUrl}/api/admin-users/${tableName}/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('Error deleting user:', result);
        alert(`Failed to delete user: ${result.error || 'Unknown error'}`);
      } else {
        console.log(`User ${userName} deleted successfully`);
        alert(`${userName} has been deleted successfully.`);
        // Refresh the platform users list
        fetchPlatformUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('An unexpected error occurred while deleting the user.');
    }
  };

  const handleShowBookedProperties = async () => {
    await fetchBookedProperties();
    setShowBookedProperties(true);
  };

  const handleBackToDashboard = () => {
    setShowBookedProperties(false);
  };

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
    } catch (err) {
      console.error('Unexpected logout error:', err);
    } finally {
      // Always redirect to login page
      router.push('/auth/login');
    }
  };

  const handlePropertyClick = (property: PropertyWithOwner) => {
    setSelectedProperty(property);
    setIsPropertyDetailsModalOpen(true);
  };

  // Memoized filtered properties - only recalculates when dependencies change
  const filteredProperties = useMemo(() => {
    let filtered = [...properties];

    // Search filter
    if (selectedFilters.has('search') && filterValues.search) {
      const searchTerm = filterValues.search.toLowerCase();
      filtered = filtered.filter(property => 
        property.property_name?.toLowerCase().includes(searchTerm) ||
        formatFullAddress(property).toLowerCase().includes(searchTerm) ||
        property.property_type?.toLowerCase().includes(searchTerm)
      );
    }

    // Postcode filter
    if (selectedFilters.has('postcode') && filterValues.postcode) {
      const postcodeTerm = filterValues.postcode.toLowerCase();
      filtered = filtered.filter(property => 
        property.postcode?.toLowerCase().includes(postcodeTerm)
      );
    }

    // City filter
    if (selectedFilters.has('city') && filterValues.city) {
      filtered = filtered.filter(property => 
        property.city === filterValues.city
      );
    }

    // Property type filter
    if (selectedFilters.has('property_type') && filterValues.property_type) {
      filtered = filtered.filter(property => 
        property.property_type === filterValues.property_type
      );
    }

    // Parking type filter
    if (selectedFilters.has('parking_type') && filterValues.parking_type) {
      filtered = filtered.filter(property => 
        property.parking_type === filterValues.parking_type
      );
    }

    // Numeric filters
    if (selectedFilters.has('bedrooms') && filterValues.bedrooms) {
      filtered = filtered.filter(property => 
        property.bedrooms >= parseInt(filterValues.bedrooms)
      );
    }

    if (selectedFilters.has('beds') && filterValues.beds) {
      filtered = filtered.filter(property => 
        property.beds >= parseInt(filterValues.beds)
      );
    }

    if (selectedFilters.has('bathrooms') && filterValues.bathrooms) {
      filtered = filtered.filter(property => 
        property.bathrooms >= parseInt(filterValues.bathrooms)
      );
    }

    if (selectedFilters.has('max_occupancy') && filterValues.max_occupancy) {
      filtered = filtered.filter(property => 
        property.max_occupancy === parseInt(filterValues.max_occupancy)
      );
    }

    // Checkbox filters for amenities and safety
    if (selectedFilters.has('workspace_desk') && filterValues.workspace_desk) {
      filtered = filtered.filter(property => property.workspace_desk === true);
    }

    if (selectedFilters.has('high_speed_wifi') && filterValues.high_speed_wifi) {
      filtered = filtered.filter(property => property.high_speed_wifi === true);
    }

    if (selectedFilters.has('fully_equipped_kitchen') && filterValues.fully_equipped_kitchen) {
      filtered = filtered.filter(property => property.fully_equipped_kitchen === true);
    }

    if (selectedFilters.has('living_dining_space') && filterValues.living_dining_space) {
      filtered = filtered.filter(property => property.living_dining_space === true);
    }

    if (selectedFilters.has('fire_extinguisher_blanket') && filterValues.fire_extinguisher_blanket) {
      filtered = filtered.filter(property => property.fire_extinguisher_blanket === true);
    }

    if (selectedFilters.has('gas_safety_certificate') && filterValues.gas_safety_certificate) {
      filtered = filtered.filter(property => property.gas_safety_certificate === true);
    }

    if (selectedFilters.has('epc') && filterValues.epc) {
      filtered = filtered.filter(property => property.epc === true);
    }

    if (selectedFilters.has('eicr') && filterValues.eicr) {
      filtered = filtered.filter(property => property.eicr === true);
    }


    return filtered;
  }, [properties, selectedFilters, filterValues]);

  // Filter bookings based on selected filters
  const getFilteredBookings = () => {
    let filtered = [...bookings];

    // Search filter
    if (selectedBookingFilters.has('search') && bookingFilterValues.search) {
      const searchTerm = bookingFilterValues.search.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.full_name?.toLowerCase().includes(searchTerm) ||
        booking.email?.toLowerCase().includes(searchTerm) ||
        booking.company_name?.toLowerCase().includes(searchTerm)
      );
    }

    // Contractor code filter
    if (selectedBookingFilters.has('contractor_code') && bookingFilterValues.contractor_code) {
      const codeTerm = bookingFilterValues.contractor_code.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.contractor?.code?.toLowerCase().includes(codeTerm)
      );
    }

    // Property ID filter
    if (selectedBookingFilters.has('property_id') && bookingFilterValues.property_id) {
      const propertyIdTerm = bookingFilterValues.property_id.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.assigned_property?.id?.toLowerCase().includes(propertyIdTerm)
      );
    }

    // City filter
    if (selectedBookingFilters.has('city') && bookingFilterValues.city) {
      filtered = filtered.filter(booking => 
        booking.city === bookingFilterValues.city
      );
    }

    // Start date filter
    if (selectedBookingFilters.has('start_date') && bookingFilterValues.start_date) {
      filtered = filtered.filter(booking => 
        booking.booking_dates && booking.booking_dates.length > 0 &&
        booking.booking_dates[0].start_date === bookingFilterValues.start_date
      );
    }

    // End date filter
    if (selectedBookingFilters.has('end_date') && bookingFilterValues.end_date) {
      filtered = filtered.filter(booking => 
        booking.booking_dates && booking.booking_dates.length > 0 &&
        booking.booking_dates[0].end_date === bookingFilterValues.end_date
      );
    }

    // Status filter
    if (selectedBookingFilters.has('status') && bookingFilterValues.status) {
      filtered = filtered.filter(booking => 
        booking.status === bookingFilterValues.status
      );
    }

    return filtered;
  };

  // Filter booked properties based on selected filters
  const getFilteredBookedProperties = () => {
    let filtered = [...bookedProperties];

    // Property ID filter
    if (selectedBookedPropertiesFilters.has('property_id') && bookedPropertiesFilterValues.property_id) {
      const propertyIdTerm = bookedPropertiesFilterValues.property_id.toLowerCase();
      filtered = filtered.filter(bookedProperty => 
        bookedProperty.property_id?.toLowerCase().includes(propertyIdTerm)
      );
    }

    // Start date filter
    if (selectedBookedPropertiesFilters.has('start_date') && bookedPropertiesFilterValues.start_date) {
      filtered = filtered.filter(bookedProperty => 
        bookedProperty.start_date === bookedPropertiesFilterValues.start_date
      );
    }

    // End date filter
    if (selectedBookedPropertiesFilters.has('end_date') && bookedPropertiesFilterValues.end_date) {
      filtered = filtered.filter(bookedProperty => 
        bookedProperty.end_date === bookedPropertiesFilterValues.end_date
      );
    }

    return filtered;
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-booking-bg">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-booking-teal"></div>
        </div>
      </div>
    );
  }

  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Content Container with Sliding Animation */}
            <div className="relative overflow-hidden">
              {/* Analytics Content */}
              <div 
                className={`transition-all duration-500 ease-in-out ${
                  showBookedProperties ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'
                }`}
                style={{ 
                  position: showBookedProperties ? 'absolute' : 'relative',
                  width: '100%'
                }}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-lg sm:text-2xl font-bold text-booking-dark">Analytics</h1>
                    <p className="text-xs sm:text-base text-booking-gray">Platform overview and management</p>
                  </div>
                  <div className="p-1">
                  <button
                    onClick={handleShowBookedProperties}
                      className="px-3 py-2 sm:px-6 sm:py-3 text-xs sm:text-base text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                      style={{ 
                        background: 'linear-gradient(135deg, #00BAB5 0%, #0B1D37 100%)',
                        borderRadius: '0.5rem'
                      }}
                  >
                    All Bookings
                  </button>
                  </div>
                </div>
                {/* Analytics Tiles - First Row: Properties */}
                <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 max-w-4xl mx-auto">
              {/* Total Properties Analytics */}
              <div className="rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 text-white" style={{ background: 'linear-gradient(to top, #00BAB5, rgba(0, 186, 181, 0.54))' }}>
                <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
                  <h3 className="text-xs sm:text-base lg:text-lg font-semibold">Total Properties</h3>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <div className="text-lg sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">{stats.totalProperties}</div>
                <div className="text-[10px] sm:text-sm opacity-90 mb-2 sm:mb-3 lg:mb-4">All properties on platform</div>
                <div className="flex flex-row items-center justify-between gap-1 sm:gap-0 text-[10px] sm:text-sm">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                    <span>Listed: {stats.totalProperties}</span>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white bg-opacity-60 rounded-full"></div>
                    <span>Available: {stats.totalProperties - stats.bookedProperties}</span>
                  </div>
                </div>
              </div>

              {/* Booked Properties Analytics */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
                  <h3 className="text-xs sm:text-base lg:text-lg font-semibold text-booking-dark">Booked Properties</h3>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-booking-dark mb-1 sm:mb-2">{stats.bookedProperties}</div>
                <div className="text-[10px] sm:text-sm text-booking-gray mb-2 sm:mb-3 lg:mb-4">Currently occupied</div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mb-2 sm:mb-3 lg:mb-4">
                  <div className="bg-green-500 h-1.5 sm:h-2 rounded-full" style={{width: `${Math.min((stats.bookedProperties / stats.totalProperties) * 100, 100)}%`}}></div>
                </div>
                <div className="flex flex-row items-center justify-between gap-1 sm:gap-0 text-[8px] sm:text-sm text-booking-gray">
                  <span>Occupancy: {Math.round((stats.bookedProperties / stats.totalProperties) * 100)}%</span>
                  <span>+{Math.floor(Math.random() * 5)}% from last week</span>
                </div>
              </div>
            </div>

            {/* Analytics Tiles - Second Row: Booking Requests */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6 max-w-6xl mx-auto mt-3 sm:mt-4 lg:mt-6">
              {/* Active Bookings */}
              <div className="rounded-lg sm:rounded-2xl p-2 sm:p-4 lg:p-6 text-white" style={{ background: 'linear-gradient(to top, #0284c7, rgba(2, 132, 199, 0.54))' }}>
                <div className="flex items-center justify-between mb-1 sm:mb-3 lg:mb-4">
                  <h3 className="text-[8px] sm:text-base lg:text-lg font-semibold">Active Bookings</h3>
                  <div className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="text-base sm:text-2xl lg:text-3xl font-bold mb-0.5 sm:mb-2">{stats.activeBookings}</div>
                <div className="text-[8px] sm:text-sm opacity-90 mb-1 sm:mb-3 lg:mb-4">Currently in progress</div>
                <div className="flex flex-row items-center justify-between gap-0.5 sm:gap-0 text-[6px] sm:text-sm">
                  <div className="flex items-center space-x-0.5 sm:space-x-2">
                    <div className="w-1 h-1 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                    <span>Confirmed: {stats.activeBookings}</span>
                  </div>
                  <div className="flex items-center space-x-0.5 sm:space-x-2">
                    <div className="w-1 h-1 sm:w-2 sm:h-2 bg-white bg-opacity-60 rounded-full"></div>
                    <span>Ongoing: {stats.activeBookings}</span>
                  </div>
                </div>
              </div>

              {/* Pending Bookings - Lighter blue shade */}
              <div className="rounded-lg sm:rounded-2xl p-2 sm:p-4 lg:p-6 text-white" style={{ background: 'linear-gradient(to top, #38bdf8, rgba(56, 189, 248, 0.54))' }}>
                <div className="flex items-center justify-between mb-1 sm:mb-3 lg:mb-4">
                  <h3 className="text-[8px] sm:text-base lg:text-lg font-semibold">Pending Bookings</h3>
                  <div className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-base sm:text-2xl lg:text-3xl font-bold mb-0.5 sm:mb-2">{stats.pendingBookings}</div>
                <div className="text-[8px] sm:text-sm opacity-90 mb-1 sm:mb-3 lg:mb-4">Awaiting approval</div>
                <div className="flex flex-row items-center justify-between gap-0.5 sm:gap-0 text-[6px] sm:text-sm">
                  <div className="flex items-center space-x-0.5 sm:space-x-2">
                    <div className="w-1 h-1 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                    <span>New: {stats.pendingBookings}</span>
                  </div>
                  <div className="flex items-center space-x-0.5 sm:space-x-2">
                    <div className="w-1 h-1 sm:w-2 sm:h-2 bg-white bg-opacity-60 rounded-full"></div>
                    <span>Review: {stats.pendingBookings}</span>
                  </div>
                </div>
              </div>

              {/* Complete Bookings */}
              <div className="bg-white rounded-lg sm:rounded-2xl p-2 sm:p-4 lg:p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-1 sm:mb-3 lg:mb-4">
                  <h3 className="text-[8px] sm:text-base lg:text-lg font-semibold text-booking-dark">Complete Bookings</h3>
                  <div className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-base sm:text-2xl lg:text-3xl font-bold text-booking-dark mb-0.5 sm:mb-2">{stats.completeBookings}</div>
                <div className="text-[8px] sm:text-sm text-booking-gray mb-1 sm:mb-3 lg:mb-4">Successfully completed</div>
                <div className="w-full bg-gray-200 rounded-full h-1 sm:h-2 mb-1 sm:mb-3 lg:mb-4">
                  <div className="bg-green-500 h-1 sm:h-2 rounded-full" style={{width: `${Math.min((stats.completeBookings / 20) * 100, 100)}%`}}></div>
                </div>
                <div className="flex flex-row items-center justify-between gap-0.5 sm:gap-0 text-[5px] sm:text-sm text-booking-gray">
                  <span>This month: {stats.completeBookings}</span>
                  <span>+{Math.floor(Math.random() * 10)}% from last month</span>
                </div>
              </div>
            </div>
                </div>

              {/* Booked Properties Content */}
              <div 
                className={`transition-all duration-500 ease-in-out ${
                  showBookedProperties ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                }`}
                style={{ 
                  position: showBookedProperties ? 'relative' : 'absolute',
                  width: '100%',
                  top: showBookedProperties ? 'auto' : 0
                }}
              >
                {/* Back Button */}
                <div className="mb-6">
                  <button
                    onClick={handleBackToDashboard}
                    className="flex items-center gap-2 px-4 py-2 text-booking-dark hover:text-booking-teal transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="font-medium text-sm sm:text-base">Back to Dashboard</span>
                  </button>
                </div>

                {/* Booked Properties Section */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-booking-dark mb-2">All Booked Properties</h2>
                    <p className="text-xs sm:text-base text-booking-gray">View all currently booked properties from the system</p>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap gap-2 items-start px-2">
                    {/* Filter Type Multi-Select Dropdown */}
                    <div className="relative filter-dropdown-container">
                      <button
                        onClick={() => setIsBookedPropertiesFilterDropdownOpen(!isBookedPropertiesFilterDropdownOpen)}
                        className="w-20 sm:w-28 md:w-32 lg:w-36 px-1.5 sm:px-2 py-1 sm:py-1.5 text-[9px] sm:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent bg-white flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-0.5 sm:space-x-1">
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-booking-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                          <span>
                            {selectedBookedPropertiesFilters.size === 0 ? 'Add Filter' :
                             selectedBookedPropertiesFilters.size === 1 && selectedBookedPropertiesFilters.has('property_id') ? 'Property ID' :
                             selectedBookedPropertiesFilters.size === 1 && selectedBookedPropertiesFilters.has('start_date') ? 'Start Date' :
                             selectedBookedPropertiesFilters.size === 1 && selectedBookedPropertiesFilters.has('end_date') ? 'End Date' :
                             `${selectedBookedPropertiesFilters.size} Filters`}
                          </span>
                        </div>
                        <svg className="w-2 h-2 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    
                      {isBookedPropertiesFilterDropdownOpen && (
                        <div className="absolute top-full left-0 z-10 w-48 bg-white border border-gray-300 rounded-lg shadow-lg mt-1">
                          <div className="p-2 space-y-1">
                            {[
                              { value: 'property_id', label: 'Filter by Property ID' },
                              { value: 'start_date', label: 'Filter by Start Date' },
                              { value: 'end_date', label: 'Filter by End Date' }
                            ].map((option) => (
                              <label key={option.value} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={selectedBookedPropertiesFilters.has(option.value)}
                                  onChange={(e) => {
                                    const newSelectedFilters = new Set(selectedBookedPropertiesFilters);
                                    if (e.target.checked) {
                                      newSelectedFilters.add(option.value);
                                    } else {
                                      newSelectedFilters.delete(option.value);
                                      // Clear the specific filter value when unchecking
                                      setBookedPropertiesFilterValues(prev => ({ ...prev, [option.value]: '' }));
                                    }
                                    setSelectedBookedPropertiesFilters(newSelectedFilters);
                                  }}
                                  className="w-3 h-3 text-booking-teal focus:ring-booking-teal border-gray-300 rounded"
                                />
                                <span className="text-xs" style={{ fontSize: '11px' }}>{option.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Multiple Filter Inputs */}
                    <div className="flex flex-wrap gap-2">
                      {selectedBookedPropertiesFilters.has('property_id') && (
                        <div className="relative min-w-32 sm:min-w-48">
                          <input
                            type="text"
                            placeholder="Property ID..."
                            value={bookedPropertiesFilterValues.property_id}
                            onChange={(e) => setBookedPropertiesFilterValues(prev => ({ ...prev, property_id: e.target.value }))}
                            className="w-full px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent"
                          />
                        </div>
                      )}

                      {selectedBookedPropertiesFilters.has('start_date') && (
                        <div className="relative min-w-28 sm:min-w-40">
                          <input
                            type="date"
                            value={bookedPropertiesFilterValues.start_date}
                            onChange={(e) => setBookedPropertiesFilterValues(prev => ({ ...prev, start_date: e.target.value }))}
                            className="w-full px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent"
                          />
                        </div>
                      )}

                      {selectedBookedPropertiesFilters.has('end_date') && (
                        <div className="relative min-w-28 sm:min-w-40">
                          <input
                            type="date"
                            value={bookedPropertiesFilterValues.end_date}
                            onChange={(e) => setBookedPropertiesFilterValues(prev => ({ ...prev, end_date: e.target.value }))}
                            className="w-full px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {bookedProperties.length > 0 ? (
                    <div className="space-y-4">
                      {/* Booking Cards */}
                      {getFilteredBookedProperties().map((bookedProperty) => (
                        <div 
                          key={bookedProperty.id}
                          className="bg-white border border-booking-teal sm:border-2 rounded-lg sm:rounded-xl p-1 sm:p-2 shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                          <div className="grid grid-cols-3 gap-1 sm:gap-4">
                            {/* Property ID Section */}
                            <div className="p-1 sm:p-4">
                              <div className="m-1 sm:m-0">
                                <div className="text-[6px] sm:text-xs font-medium text-booking-gray uppercase mb-0.5 sm:mb-2">Property ID</div>
                                <div className="text-[9px] sm:text-2xl font-bold text-booking-dark mb-0.5 sm:mb-1">
                                {bookedProperty.property_id || 'N/A'}
                              </div>
                                <div className="text-[6px] sm:text-sm text-booking-gray">
                                {bookedProperty.properties?.property_name || bookedProperty.property_name || 'Property Name N/A'}
                              </div>
                                <div className="mt-0.5 sm:mt-2 text-[5px] sm:text-xs text-booking-gray">
                                {[
                                  bookedProperty.properties?.house_address,
                                  bookedProperty.properties?.locality,
                                  bookedProperty.properties?.city,
                                  bookedProperty.properties?.county,
                                  bookedProperty.properties?.postcode,
                                  bookedProperty.properties?.country
                                ].filter(Boolean).join(', ')}
                                </div>
                              </div>
                            </div>

                            {/* Booking Dates Section */}
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg sm:rounded-xl p-1 sm:p-4">
                              <div className="m-1 sm:m-0">
                                <div className="text-[6px] sm:text-xs font-medium text-blue-700 uppercase mb-0.5 sm:mb-2">Booking Period</div>
                                <div className="space-y-0.5 sm:space-y-2">
                                  <div className="flex items-center space-x-0.5 sm:space-x-2">
                                    <div className="bg-green-500 text-white text-[5px] sm:text-xs font-bold w-8 sm:w-auto px-0.5 sm:px-2 py-0.5 sm:py-1 rounded flex items-center justify-center">START</div>
                                    <div className="text-[6px] sm:text-lg font-bold text-gray-900">
                                    {bookedProperty.start_date ? new Date(bookedProperty.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                  </div>
                                </div>
                                  <div className="flex items-center space-x-0.5 sm:space-x-2">
                                    <div className="bg-red-500 text-white text-[5px] sm:text-xs font-bold w-8 sm:w-auto px-0.5 sm:px-2 py-0.5 sm:py-1 rounded flex items-center justify-center">END</div>
                                    <div className="text-[6px] sm:text-lg font-bold text-gray-900">
                                    {bookedProperty.end_date ? new Date(bookedProperty.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                  </div>
                                </div>
                                {bookedProperty.start_date && bookedProperty.end_date && (
                                    <div className="mt-0.5 sm:mt-3 text-center">
                                      <div className="text-[5px] sm:text-xs font-medium text-gray-600 uppercase mb-0.5 sm:mb-1">Number of Nights</div>
                                      <div className="text-[6px] sm:text-lg font-bold text-gray-900">
                                      {Math.round((new Date(bookedProperty.end_date).getTime() - new Date(bookedProperty.start_date).getTime()) / (1000 * 60 * 60 * 24))}
                                    </div>
                                  </div>
                                )}
                                </div>
                              </div>
                            </div>

                            {/* Booking ID Section */}
                            <div className="p-1 sm:p-4">
                              <div className="m-1 sm:m-0">
                                <div className="text-[6px] sm:text-xs font-medium text-purple-700 uppercase mb-0.5 sm:mb-2">Booking ID</div>
                                <div className="text-[9px] sm:text-2xl font-bold text-booking-dark mb-0.5 sm:mb-2">
                                {bookedProperty.booking_id || bookedProperty.id || 'N/A'}
                              </div>
                              {bookedProperty.project_postcode && (
                                  <div className="text-[6px] sm:text-sm text-booking-gray">
                                  Postcode: {bookedProperty.project_postcode}
                                </div>
                              )}
                              {bookedProperty.booking_requests?.city && (
                                  <div className="text-[6px] sm:text-sm text-booking-gray">
                                  City: {bookedProperty.booking_requests.city}
                                </div>
                              )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="card p-12 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No Booked Properties</h3>
                      <p className="mt-1 text-sm text-gray-500">There are currently no booked properties in the system.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'bookings':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-booking-dark mb-2">All Requests</h2>
              <p className="text-xs sm:text-base text-booking-gray">Manage all booking requests across the platform</p>
            </div>
            
            {/* Search Bar and Filters */}
            <div className="flex flex-wrap gap-2 items-start">
              {/* Filter Type Multi-Select Dropdown */}
              <div className="relative filter-dropdown-container">
                <button
                  onClick={() => setIsBookingFilterDropdownOpen(!isBookingFilterDropdownOpen)}
                  className="w-20 sm:w-28 md:w-32 lg:w-36 px-1.5 sm:px-2 py-1 sm:py-1.5 text-[9px] sm:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent bg-white flex items-center justify-between"
                >
                  <div className="flex items-center space-x-0.5 sm:space-x-1">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-booking-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span>
                      {selectedBookingFilters.size === 1 && selectedBookingFilters.has('search') ? 'Search All' :
                       selectedBookingFilters.size === 1 && selectedBookingFilters.has('contractor_code') ? 'Contractor Code' :
                       selectedBookingFilters.size === 1 && selectedBookingFilters.has('property_id') ? 'Property ID' :
                       selectedBookingFilters.size === 1 && selectedBookingFilters.has('city') ? 'City' :
                       selectedBookingFilters.size === 1 && selectedBookingFilters.has('start_date') ? 'Start Date' :
                       selectedBookingFilters.size === 1 && selectedBookingFilters.has('end_date') ? 'End Date' :
                       selectedBookingFilters.size === 1 && selectedBookingFilters.has('status') ? 'Status' :
                       `${selectedBookingFilters.size} Filters`}
                    </span>
                  </div>
                  <svg className="w-2 h-2 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              
                {isBookingFilterDropdownOpen && (
                  <div className="absolute top-full left-0 z-10 w-48 bg-white border border-gray-300 rounded-lg shadow-lg mt-1">
                    <div className="p-2 space-y-1">
                      {[
                        { value: 'search', label: 'Search All' },
                        { value: 'contractor_code', label: 'Filter by Contractor Code' },
                        { value: 'property_id', label: 'Filter by Property ID' },
                        { value: 'city', label: 'Filter by City' },
                        { value: 'start_date', label: 'Filter by Start Date' },
                        { value: 'end_date', label: 'Filter by End Date' },
                        { value: 'status', label: 'Filter by Status' }
                      ].map((option) => (
                        <label key={option.value} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={selectedBookingFilters.has(option.value)}
                            onChange={(e) => {
                              const newSelectedFilters = new Set(selectedBookingFilters);
                              if (e.target.checked) {
                                newSelectedFilters.add(option.value);
                              } else {
                                newSelectedFilters.delete(option.value);
                                // Clear the specific filter value when unchecking
                                setBookingFilterValues(prev => ({ ...prev, [option.value]: '' }));
                              }
                              setSelectedBookingFilters(newSelectedFilters);
                            }}
                            className="w-3 h-3 text-booking-teal focus:ring-booking-teal border-gray-300 rounded"
                          />
                          <span className="text-xs" style={{ fontSize: '11px' }}>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Multiple Filter Inputs */}
              <div className="flex flex-wrap gap-2">
                  {selectedBookingFilters.has('search') && (
                    <div className="relative min-w-40 sm:min-w-72">
                      <input
                        type="text"
                        placeholder="Search bookings..."
                        value={bookingFilterValues.search}
                        onChange={(e) => setBookingFilterValues(prev => ({ ...prev, search: e.target.value }))}
                        className="w-full px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent"
                      />
                      <svg className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  )}

                  {selectedBookingFilters.has('contractor_code') && (
                    <div className="relative min-w-32 sm:min-w-48">
                      <input
                        type="text"
                        placeholder="Contractor code..."
                        value={bookingFilterValues.contractor_code}
                        onChange={(e) => setBookingFilterValues(prev => ({ ...prev, contractor_code: e.target.value }))}
                        className="w-full px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent"
                      />
                    </div>
                  )}

                  {selectedBookingFilters.has('property_id') && (
                    <div className="relative min-w-32 sm:min-w-48">
                      <input
                        type="text"
                        placeholder="Property ID..."
                        value={bookingFilterValues.property_id}
                        onChange={(e) => setBookingFilterValues(prev => ({ ...prev, property_id: e.target.value }))}
                        className="w-full px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent"
                      />
                    </div>
                  )}

                  {selectedBookingFilters.has('city') && (
                    <div className="relative min-w-32 sm:min-w-52">
                      <select
                        value={bookingFilterValues.city}
                        onChange={(e) => setBookingFilterValues(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent"
                      >
                        <option value="">Select City</option>
                        {UK_CITIES.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedBookingFilters.has('start_date') && (
                    <div className="relative min-w-28 sm:min-w-40">
                      <input
                        type="date"
                        value={bookingFilterValues.start_date}
                        onChange={(e) => setBookingFilterValues(prev => ({ ...prev, start_date: e.target.value }))}
                        className="w-full px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent"
                      />
                    </div>
                  )}

                  {selectedBookingFilters.has('end_date') && (
                    <div className="relative min-w-28 sm:min-w-40">
                      <input
                        type="date"
                        value={bookingFilterValues.end_date}
                        onChange={(e) => setBookingFilterValues(prev => ({ ...prev, end_date: e.target.value }))}
                        className="w-full px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent"
                      />
                    </div>
                  )}

                  {selectedBookingFilters.has('status') && (
                    <div className="relative min-w-24 sm:min-w-32">
                      <select
                        value={bookingFilterValues.status}
                        onChange={(e) => setBookingFilterValues(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent"
                      >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  )}
              </div>
            </div>
            
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm sm:text-lg font-semibold text-gray-900">All Requests</h2>
              </div>
              <AdminBookingTable 
                bookings={getFilteredBookings()}
                onAssignProperty={(booking) => {
                  setBookingToAssign(booking);
                  setIsPropertySelectionMode(true);
                  setSelectedPropertyForAssignment(null);
                  setActiveTab('properties');
                }}
              />
            </div>
          </div>
        );

      case 'properties':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-booking-dark mb-2">All Properties</h2>
                {isPropertySelectionMode ? (
                  <p className="text-xs sm:text-base text-booking-gray">
                    Select a property to assign to booking request: {bookingToAssign?.full_name}
                  </p>
                ) : (
                  <p className="text-xs sm:text-base text-booking-gray">View all properties from all landlords with contact information</p>
                )}
              </div>
              <div className="flex gap-2 items-center">
                {isPropertySelectionMode && selectedPropertyForAssignment && (
                  <>
                    <button
                      onClick={() => {
                        setIsPropertyAssignmentModalOpen(true);
                      }}
                      className="px-4 sm:px-4 py-1.5 sm:py-2 text-[8px] sm:text-sm font-medium text-white bg-booking-teal hover:bg-booking-teal/90 rounded sm:rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-booking-teal focus:ring-offset-1 whitespace-nowrap min-w-[100px] sm:min-w-0"
                    >
                      Select Property
                    </button>
                    <button
                      onClick={() => {
                        setIsPropertySelectionMode(false);
                        setSelectedPropertyForAssignment(null);
                        setBookingToAssign(null);
                      }}
                      className="px-3 sm:px-4 py-0.5 sm:py-2 text-[8px] sm:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Search Bar and Filters */}
            <div className="flex flex-wrap gap-2 items-start">
              {/* Filter Type Multi-Select Dropdown */}
              <div className="relative filter-dropdown-container">
                <button
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className="w-20 sm:w-28 md:w-32 lg:w-36 px-1.5 sm:px-2 py-1 sm:py-1.5 text-[9px] sm:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent bg-white flex items-center justify-between"
                >
                  <div className="flex items-center space-x-0.5 sm:space-x-1">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-booking-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span>
                      {selectedFilters.size === 1 && selectedFilters.has('search') ? 'Search All' :
                       selectedFilters.size === 1 && selectedFilters.has('postcode') ? 'Postcode' :
                       selectedFilters.size === 1 && selectedFilters.has('city') ? 'City' :
                       selectedFilters.size === 1 && selectedFilters.has('property_type') ? 'Property Type' :
                       selectedFilters.size === 1 && selectedFilters.has('parking_type') ? 'Parking Type' :
                       selectedFilters.size === 1 && selectedFilters.has('bedrooms') ? 'Bedrooms' :
                       selectedFilters.size === 1 && selectedFilters.has('beds') ? 'Beds' :
                       selectedFilters.size === 1 && selectedFilters.has('bathrooms') ? 'Bathrooms' :
                       selectedFilters.size === 1 && selectedFilters.has('max_occupancy') ? 'Max Occupancy' :
                       selectedFilters.size === 1 && selectedFilters.has('workspace_desk') ? 'Workspace/Desk' :
                       selectedFilters.size === 1 && selectedFilters.has('high_speed_wifi') ? 'High Speed Wi-Fi' :
                       selectedFilters.size === 1 && selectedFilters.has('fully_equipped_kitchen') ? 'Fully Equipped Kitchen' :
                       selectedFilters.size === 1 && selectedFilters.has('living_dining_space') ? 'Living/Dining Space' :
                       selectedFilters.size === 1 && selectedFilters.has('fire_extinguisher_blanket') ? 'Fire Extinguisher' :
                       selectedFilters.size === 1 && selectedFilters.has('gas_safety_certificate') ? 'Gas Safety' :
                       selectedFilters.size === 1 && selectedFilters.has('epc') ? 'EPC' :
                       selectedFilters.size === 1 && selectedFilters.has('eicr') ? 'EICR' :
                       `${selectedFilters.size} Filters`}
                    </span>
                  </div>
                  <svg className="w-2 h-2 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              
                {isFilterDropdownOpen && (
                  <div className="absolute top-full left-0 z-10 w-48 bg-white border border-gray-300 rounded-lg shadow-lg mt-1">
                    <div className="p-2 space-y-1">
                      {[
                        { value: 'search', label: 'Search All' },
                        { value: 'postcode', label: 'Filter by Postcode' },
                        { value: 'city', label: 'Filter by City' },
                        { value: 'property_type', label: 'Filter by Property Type' },
                        { value: 'parking_type', label: 'Filter by Parking Type' },
                        { value: 'bedrooms', label: 'Filter by Bedrooms' },
                        { value: 'beds', label: 'Filter by Beds' },
                        { value: 'bathrooms', label: 'Filter by Bathrooms' },
                        { value: 'max_occupancy', label: 'Filter by Max Occupancy' },
                        { value: 'workspace_desk', label: 'Workspace/Desk' },
                        { value: 'high_speed_wifi', label: 'High Speed Wi-Fi' },
                        { value: 'fully_equipped_kitchen', label: 'Fully Equipped Kitchen' },
                        { value: 'living_dining_space', label: 'Living/Dining Space' },
                        { value: 'fire_extinguisher_blanket', label: 'Fire Extinguisher' },
                        { value: 'gas_safety_certificate', label: 'Gas Safety' },
                        { value: 'epc', label: 'EPC' },
                        { value: 'eicr', label: 'EICR' }
                      ].map((option) => (
                        <label key={option.value} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={selectedFilters.has(option.value)}
                            onChange={(e) => {
                              const newSelectedFilters = new Set(selectedFilters);
                              if (e.target.checked) {
                                newSelectedFilters.add(option.value);
                              } else {
                                newSelectedFilters.delete(option.value);
                                // Clear the specific filter value when unchecking
                                setFilterValues(prev => ({ ...prev, [option.value]: '' }));
                              }
                              setSelectedFilters(newSelectedFilters);
                            }}
                            className="w-3 h-3 text-booking-teal focus:ring-booking-teal border-gray-300 rounded"
                          />
                          <span className="text-xs" style={{ fontSize: '11px' }}>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Multiple Filter Inputs */}
              <div className="flex flex-wrap gap-2">
                  {selectedFilters.has('search') && (
                    <div className="relative min-w-40 sm:min-w-72">
                      <input
                        type="text"
                        placeholder="Search properties..."
                        value={filterValues.search}
                        onChange={(e) => setFilterValues(prev => ({ ...prev, search: e.target.value }))}
                        className="w-full px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent"
                      />
                      <svg className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  )}
                  
                  {selectedFilters.has('postcode') && (
                    <div className="relative min-w-32 sm:min-w-48">
                      <input
                        type="text"
                        placeholder="e.g., SW1A 1AA"
                        value={filterValues.postcode}
                        onChange={(e) => setFilterValues(prev => ({ ...prev, postcode: e.target.value }))}
                        className="w-full px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent"
                      />
                    </div>
                  )}

                  {selectedFilters.has('city') && (
                    <select
                      value={filterValues.city}
                      onChange={(e) => setFilterValues(prev => ({ ...prev, city: e.target.value }))}
                      className="min-w-32 sm:min-w-52 px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent"
                    >
                      <option value="">Select City</option>
                      {UK_CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  )}

                  {selectedFilters.has('property_type') && (
                    <select
                      value={filterValues.property_type}
                      onChange={(e) => setFilterValues(prev => ({ ...prev, property_type: e.target.value }))}
                      className="min-w-32 sm:min-w-56 px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent"
                    >
                      <option value="">Select Property Type</option>
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="studio">Studio</option>
                      <option value="condo">Condo</option>
                    </select>
                  )}

                  {selectedFilters.has('parking_type') && (
                    <select
                      value={filterValues.parking_type}
                      onChange={(e) => setFilterValues(prev => ({ ...prev, parking_type: e.target.value }))}
                      className="min-w-32 sm:min-w-52 px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent"
                    >
                      <option value="">Select Parking Type</option>
                      <option value="on-street">On Street</option>
                      <option value="off-street">Off Street</option>
                      <option value="garage">Garage</option>
                      <option value="driveway">Driveway</option>
                    </select>
                  )}

                  {selectedFilters.has('bedrooms') && (
                    <select
                      value={filterValues.bedrooms}
                      onChange={(e) => setFilterValues(prev => ({ ...prev, bedrooms: e.target.value }))}
                      className="min-w-32 sm:min-w-56 px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent"
                    >
                      <option value="">Select Minimum Bedrooms</option>
                      <option value="1">1+ Bedrooms</option>
                      <option value="2">2+ Bedrooms</option>
                      <option value="3">3+ Bedrooms</option>
                      <option value="4">4+ Bedrooms</option>
                      <option value="5">5+ Bedrooms</option>
                    </select>
                  )}

                  {selectedFilters.has('beds') && (
                    <select
                      value={filterValues.beds}
                      onChange={(e) => setFilterValues(prev => ({ ...prev, beds: e.target.value }))}
                      className="min-w-32 sm:min-w-48 px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent"
                    >
                      <option value="">Select Minimum Beds</option>
                      <option value="1">1+ Beds</option>
                      <option value="2">2+ Beds</option>
                      <option value="3">3+ Beds</option>
                      <option value="4">4+ Beds</option>
                      <option value="5">5+ Beds</option>
                    </select>
                  )}

                  {selectedFilters.has('bathrooms') && (
                    <select
                      value={filterValues.bathrooms}
                      onChange={(e) => setFilterValues(prev => ({ ...prev, bathrooms: e.target.value }))}
                      className="min-w-32 sm:min-w-56 px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent"
                    >
                      <option value="">Select Minimum Bathrooms</option>
                      <option value="1">1+ Bathrooms</option>
                      <option value="2">2+ Bathrooms</option>
                      <option value="3">3+ Bathrooms</option>
                      <option value="4">4+ Bathrooms</option>
                    </select>
                  )}

                  {selectedFilters.has('max_occupancy') && (
                    <div className="relative min-w-32 sm:min-w-64">
                      <input
                        type="number"
                        placeholder="Enter exact occupancy (e.g., 2)"
                        value={filterValues.max_occupancy}
                        onChange={(e) => setFilterValues(prev => ({ ...prev, max_occupancy: e.target.value }))}
                        className="w-full px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent"
                        min="1"
                      />
                    </div>
                  )}


                  {/* Checkbox filters for amenities and safety */}
                  {selectedFilters.has('workspace_desk') && (
                    <div className="flex items-center space-x-1 sm:space-x-2 min-w-32 sm:min-w-56">
                      <input
                        type="checkbox"
                        checked={filterValues.workspace_desk}
                        onChange={(e) => setFilterValues(prev => ({ ...prev, workspace_desk: e.target.checked }))}
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-booking-teal focus:ring-booking-teal border-gray-300 rounded"
                      />
                      <label className="text-[9px] sm:text-xs text-gray-700">Workspace/Desk Available</label>
                    </div>
                  )}

                  {selectedFilters.has('high_speed_wifi') && (
                    <div className="flex items-center space-x-1 sm:space-x-2 min-w-32 sm:min-w-56">
                      <input
                        type="checkbox"
                        checked={filterValues.high_speed_wifi}
                        onChange={(e) => setFilterValues(prev => ({ ...prev, high_speed_wifi: e.target.checked }))}
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-booking-teal focus:ring-booking-teal border-gray-300 rounded"
                      />
                      <label className="text-[9px] sm:text-xs text-gray-700">High Speed Wi-Fi Available</label>
                    </div>
                  )}

                  {selectedFilters.has('fully_equipped_kitchen') && (
                    <div className="flex items-center space-x-1 sm:space-x-2 min-w-32 sm:min-w-64">
                      <input
                        type="checkbox"
                        checked={filterValues.fully_equipped_kitchen}
                        onChange={(e) => setFilterValues(prev => ({ ...prev, fully_equipped_kitchen: e.target.checked }))}
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-booking-teal focus:ring-booking-teal border-gray-300 rounded"
                      />
                      <label className="text-[9px] sm:text-xs text-gray-700">Fully Equipped Kitchen Available</label>
                    </div>
                  )}

                  {selectedFilters.has('living_dining_space') && (
                    <div className="flex items-center space-x-1 sm:space-x-2 min-w-32 sm:min-w-60">
                      <input
                        type="checkbox"
                        checked={filterValues.living_dining_space}
                        onChange={(e) => setFilterValues(prev => ({ ...prev, living_dining_space: e.target.checked }))}
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-booking-teal focus:ring-booking-teal border-gray-300 rounded"
                      />
                      <label className="text-[9px] sm:text-xs text-gray-700">Living/Dining Space Available</label>
                    </div>
                  )}

                  {selectedFilters.has('fire_extinguisher_blanket') && (
                    <div className="flex items-center space-x-1 sm:space-x-2 min-w-32 sm:min-w-60">
                      <input
                        type="checkbox"
                        checked={filterValues.fire_extinguisher_blanket}
                        onChange={(e) => setFilterValues(prev => ({ ...prev, fire_extinguisher_blanket: e.target.checked }))}
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-booking-teal focus:ring-booking-teal border-gray-300 rounded"
                      />
                      <label className="text-[9px] sm:text-xs text-gray-700">Fire Extinguisher Available</label>
                    </div>
                  )}

                  {selectedFilters.has('gas_safety_certificate') && (
                    <div className="flex items-center space-x-1 sm:space-x-2 min-w-32 sm:min-w-72">
                      <input
                        type="checkbox"
                        checked={filterValues.gas_safety_certificate}
                        onChange={(e) => setFilterValues(prev => ({ ...prev, gas_safety_certificate: e.target.checked }))}
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-booking-teal focus:ring-booking-teal border-gray-300 rounded"
                      />
                      <label className="text-[9px] sm:text-xs text-gray-700">Gas Safety Certificate Available</label>
                    </div>
                  )}

                  {selectedFilters.has('epc') && (
                    <div className="flex items-center space-x-1 sm:space-x-2 min-w-24 sm:min-w-40">
                      <input
                        type="checkbox"
                        checked={filterValues.epc}
                        onChange={(e) => setFilterValues(prev => ({ ...prev, epc: e.target.checked }))}
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-booking-teal focus:ring-booking-teal border-gray-300 rounded"
                      />
                      <label className="text-[9px] sm:text-xs text-gray-700">EPC Available</label>
                    </div>
                  )}

                  {selectedFilters.has('eicr') && (
                    <div className="flex items-center space-x-1 sm:space-x-2 min-w-24 sm:min-w-40">
                      <input
                        type="checkbox"
                        checked={filterValues.eicr}
                        onChange={(e) => setFilterValues(prev => ({ ...prev, eicr: e.target.checked }))}
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-booking-teal focus:ring-booking-teal border-gray-300 rounded"
                      />
                      <label className="text-[9px] sm:text-xs text-gray-700">EICR Available</label>
                    </div>
                  )}
              </div>
            </div>
            
            {filteredProperties.length > 0 ? (
              <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6">
                {filteredProperties.slice(0, visiblePropertiesCount).map((property) => (
                  <PropertyTile
                    key={property.id}
                    property={property}
                    isPropertySelectionMode={isPropertySelectionMode}
                    selectedPropertyForAssignment={selectedPropertyForAssignment}
                    onPropertyClick={handlePropertyClick}
                    onPropertySelect={setSelectedPropertyForAssignment}
                  />
                ))}
              </div>
              {/* Sentinel element for infinite scroll - triggers loading more when visible */}
              {visiblePropertiesCount < filteredProperties.length && (
                <div 
                  ref={propertiesEndRef} 
                  className="flex justify-center items-center py-6"
                >
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-booking-teal"></div>
                  <span className="ml-2 text-sm text-booking-gray">Loading more properties...</span>
                </div>
              )}
              </>
            ) : (
              <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg border border-gray-100">
                <div className="p-6 sm:p-12 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-booking-bg rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-booking-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-sm sm:text-lg font-semibold text-booking-dark mb-1 sm:mb-2">No Properties</h3>
                  <p className="text-xs sm:text-base text-booking-gray">No properties have been added yet.</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl lg:text-2xl text-base sm:text-xl font-bold text-booking-dark mb-2">User Management</h2>
              <p className="text-booking-gray text-xs sm:text-sm lg:text-base">Manage all users on the platform</p>
            </div>
            
            {/* Tab Buttons */}
            <div className="flex gap-2 sm:gap-4 border-b border-gray-200">
              <button
                onClick={() => setActiveUserTab('administrators')}
                className={`pb-3 sm:pb-4 px-2 sm:px-4 text-xs sm:text-sm lg:text-base font-medium border-b-2 transition-colors ${
                  activeUserTab === 'administrators'
                    ? 'border-booking-teal text-booking-teal'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Administrators
              </button>
              <button
                onClick={() => setActiveUserTab('platform-users')}
                className={`pb-3 sm:pb-4 px-2 sm:px-4 text-xs sm:text-sm lg:text-base font-medium border-b-2 transition-colors ${
                  activeUserTab === 'platform-users'
                    ? 'border-booking-teal text-booking-teal'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Platform Users
              </button>
            </div>

            {/* Administrators Tab */}
            {activeUserTab === 'administrators' && (
              <div className="card">
                <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                  <h2 className="text-sm sm:text-lg font-semibold text-gray-900">All Administrators</h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage admin accounts and permissions</p>
                </div>
                
                {loadingUsers ? (
                  <div className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-booking-teal mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-500">Loading administrators...</p>
                  </div>
                ) : adminUsers.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Administrators Found</h3>
                    <p className="mt-1 text-sm text-gray-500">No admin accounts are currently registered.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Role</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Status</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Email Verified</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Last Login</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Created</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {adminUsers.map((admin) => (
                          <tr key={admin.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <div className="text-xs sm:text-sm font-medium text-gray-900">{admin.full_name}</div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <div className="text-xs sm:text-sm text-gray-500">{admin.email}</div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                {admin.role || 'Admin'}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                admin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {admin.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                admin.email_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {admin.email_verified ? 'Verified' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden xl:table-cell">
                              {admin.last_login ? new Date(admin.last_login).toLocaleDateString() : 'Never'}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden xl:table-cell">
                              {new Date(admin.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Platform Users Tab */}
            {activeUserTab === 'platform-users' && (
              <div className="card">
                <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                  <h2 className="text-sm sm:text-lg font-semibold text-gray-900">All Platform Users</h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Contractors and landlords registered on the platform</p>
                </div>
                
                {loadingUsers ? (
                  <div className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-booking-teal mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-500">Loading platform users...</p>
                  </div>
                ) : platformUsers.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Platform Users Found</h3>
                    <p className="mt-1 text-sm text-gray-500">No contractors or landlords are currently registered.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Type</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Phone</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Status</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Email Verified</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Created</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {platformUsers.map((user) => (
                          <tr key={`${user.tableName}-${user.id}`} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <div className="text-xs sm:text-sm font-medium text-gray-900">{user.full_name}</div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <div className="text-xs sm:text-sm text-gray-500">{user.email}</div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.userType === 'Contractor' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {getUserTypeDisplay(user.userType)}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                              {user.phone || user.contact_number || 'N/A'}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.email_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {user.email_verified ? 'Verified' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden xl:table-cell">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                {user.is_active ? (
                                  <button
                                    onClick={() => handleDeactivateUser(user.id, user.userType === 'Contractor' ? 'contractor' : 'landlord', user.full_name)}
                                    className="text-orange-600 hover:text-orange-900 bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded text-xs sm:text-sm transition-colors"
                                    title="Deactivate user"
                                  >
                                    Deactivate
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleActivateUser(user.id, user.userType === 'Contractor' ? 'contractor' : 'landlord', user.full_name)}
                                    className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-2 py-1 rounded text-xs sm:text-sm transition-colors"
                                    title="Activate user"
                                  >
                                    Activate
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.userType === 'Contractor' ? 'contractor' : 'landlord', user.full_name)}
                                  className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs sm:text-sm transition-colors"
                                  title="Delete user permanently"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-booking-bg flex flex-col lg:flex-row">
      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed top-4 right-4 z-[100] animate-slide-in">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(prev => ({ ...prev, visible: false }))}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.visible && (
        <div className="fixed inset-0 z-[99] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`p-2 rounded-full ${
                  confirmModal.confirmColor === 'green'
                    ? 'bg-green-100'
                    : confirmModal.confirmColor === 'orange'
                    ? 'bg-orange-100'
                    : 'bg-red-100'
                }`}
              >
                {confirmModal.confirmColor === 'green' ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : confirmModal.confirmColor === 'orange' ? (
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{confirmModal.title}</h3>
            </div>
            <p className="text-gray-600 mb-6">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeConfirmModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  confirmModal.confirmColor === 'green'
                    ? 'bg-green-600 hover:bg-green-700'
                    : confirmModal.confirmColor === 'orange'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="lg:hidden text-white p-4 flex items-center justify-between" style={{ backgroundColor: '#0B1D37' }}>
        <div className="flex items-center space-x-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/white-teal.webp" 
            alt="Booking Hub Logo" 
            className="h-8 w-auto"
          />
          <div>
            <p className="text-lg font-semibold text-white">Admin Portal</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed top-0 left-0 h-full w-64 bg-booking-dark text-white transform transition-transform duration-300 ease-in-out">
            <div className="p-4 border-b border-gray-700" style={{ backgroundColor: '#0B1D37' }}>
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src="/white-teal.webp" 
                    alt="Booking Hub Logo" 
                    className="h-12 w-auto"
                  />
                  <p className="text-sm font-bold" style={{ color: '#00BAB5' }}>Admin Portal</p>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Mobile Navigation */}
            <nav className="p-4 space-y-2">
              <button
                onClick={() => { 
                  setActiveTab('dashboard'); 
                  setIsMobileMenuOpen(false);
                  setIsPropertySelectionMode(false);
                  setSelectedPropertyForAssignment(null);
                  setBookingToAssign(null);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-booking-dark'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                  </svg>
                  <span className="text-sm font-medium">Dashboard</span>
                  {activeTab === 'dashboard' && <div className="w-1 h-1 bg-booking-teal rounded-full ml-auto"></div>}
                </div>
              </button>

              <button
                onClick={() => { 
                  setActiveTab('bookings'); 
                  setIsMobileMenuOpen(false);
                  setIsPropertySelectionMode(false);
                  setSelectedPropertyForAssignment(null);
                  setBookingToAssign(null);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'bookings'
                    ? 'bg-white text-booking-dark'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-sm font-medium">All Requests</span>
                  {activeTab === 'bookings' && <div className="w-1 h-1 bg-booking-teal rounded-full ml-auto"></div>}
                </div>
              </button>

              <button
                onClick={() => { 
                  setActiveTab('properties'); 
                  setIsMobileMenuOpen(false);
                  setIsPropertySelectionMode(false);
                  setSelectedPropertyForAssignment(null);
                  setBookingToAssign(null);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'properties'
                    ? 'bg-white text-booking-dark'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-sm font-medium">All Properties</span>
                  {activeTab === 'properties' && <div className="w-1 h-1 bg-booking-teal rounded-full ml-auto"></div>}
                </div>
              </button>

              <button
                onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'users'
                    ? 'bg-white text-booking-dark'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span className="text-sm font-medium">User Management</span>
                  {activeTab === 'users' && <div className="w-1 h-1 bg-booking-teal rounded-full ml-auto"></div>}
                </div>
              </button>
            </nav>

            {/* Mobile Profile Section */}
            <div className="p-4 border-t border-gray-700 mt-auto">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-booking-teal rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">A</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Admin</p>
                  <p className="text-xs text-gray-300">Administrator</p>
                </div>
              </div>
              <button
                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-sm font-medium">Logout</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar - Fixed position */}
      <div className="hidden lg:flex w-64 bg-booking-dark text-white flex-col h-screen fixed top-0 left-0 overflow-y-auto z-40">
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-700" style={{ backgroundColor: '#0B1D37' }}>
          <div className="flex flex-col items-center space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/white-teal.webp" 
              alt="Booking Hub Logo" 
              className="h-12 w-auto"
            />
            <p className="text-sm font-bold" style={{ color: '#00BAB5' }}>Admin Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setIsPropertySelectionMode(false);
              setSelectedPropertyForAssignment(null);
              setBookingToAssign(null);
            }}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'dashboard'
                ? 'bg-white text-booking-dark'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
              <span className="text-sm lg:text-sm font-medium">Dashboard</span>
              {activeTab === 'dashboard' && <div className="w-1 h-1 bg-booking-teal rounded-full ml-auto"></div>}
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab('bookings');
              setIsPropertySelectionMode(false);
              setSelectedPropertyForAssignment(null);
              setBookingToAssign(null);
            }}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'bookings'
                ? 'bg-white text-booking-dark'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm lg:text-sm font-medium">All Requests</span>
              {activeTab === 'bookings' && <div className="w-1 h-1 bg-booking-teal rounded-full ml-auto"></div>}
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab('properties');
              setIsPropertySelectionMode(false);
              setSelectedPropertyForAssignment(null);
              setBookingToAssign(null);
            }}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'properties'
                ? 'bg-white text-booking-dark'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-sm lg:text-sm font-medium">All Properties</span>
              {activeTab === 'properties' && <div className="w-1 h-1 bg-booking-teal rounded-full ml-auto"></div>}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'users'
                ? 'bg-white text-booking-dark'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <span className="text-sm lg:text-sm font-medium">User Management</span>
              {activeTab === 'users' && <div className="w-1 h-1 bg-booking-teal rounded-full ml-auto"></div>}
            </div>
          </button>
        </nav>

        {/* Profile Section */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-booking-teal rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">A</span>
            </div>
            <div>
              <p className="text-sm lg:text-sm font-medium text-white">Admin</p>
              <p className="text-xs lg:text-sm text-gray-300">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm lg:text-sm font-medium">Logout</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content - offset by sidebar width on desktop */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden lg:ml-64">
        {renderMainContent()}
      </div>

      {/* Property Details Modal */}
      <PropertyDetailsModal
        isOpen={isPropertyDetailsModalOpen}
        onClose={() => setIsPropertyDetailsModalOpen(false)}
        property={selectedProperty}
      />

      {/* Property Assignment Modal */}
      <PropertyAssignmentModal
        isOpen={isPropertyAssignmentModalOpen}
        onClose={() => {
          setIsPropertyAssignmentModalOpen(false);
          setIsPropertySelectionMode(false);
          setSelectedPropertyForAssignment(null);
          setBookingToAssign(null);
          setActiveTab('bookings');
        }}
        onConfirm={(formData) => {
          console.log('Property assignment confirmed:', formData);
          // TODO: Implement actual assignment logic here
        }}
        bookingToAssign={bookingToAssign as { [key: string]: unknown } & AdminBooking}
        selectedProperty={selectedPropertyForAssignment as { [key: string]: unknown } & PropertyWithOwner}
        isNewBooking={false}
      />
    </div>
  );
}

// Admin-specific booking table
function AdminBookingTable({ 
  bookings, 
  onAssignProperty 
}: { 
  bookings: AdminBooking[];
  onAssignProperty: (booking: AdminBooking) => void;
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-warning text-[8px] sm:text-xs">Pending</span>;
      case 'reviewing':
        return <span className="badge badge-info text-[8px] sm:text-xs">Reviewing</span>;
      case 'property_assigned':
        return <span className="badge badge-primary text-[8px] sm:text-xs">Property Assigned</span>;
      case 'confirmed':
        return <span className="badge badge-success text-[8px] sm:text-xs">Confirmed</span>;
      case 'cancelled':
        return <span className="badge badge-danger text-[8px] sm:text-xs">Cancelled</span>;
      default:
        return <span className="badge text-[8px] sm:text-xs">{status}</span>;
    }
  };

  if (bookings.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings</h3>
        <p className="mt-1 text-sm text-gray-500">No bookings have been created yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead className="table-header">
          <tr>
            <th className="table-header-cell text-[9px] sm:text-sm py-1 sm:py-3">Request Details</th>
            <th className="table-header-cell text-[9px] sm:text-sm py-1 sm:py-3">Contact Info</th>
            <th className="table-header-cell text-[9px] sm:text-sm py-1 sm:py-3">Start Date</th>
            <th className="table-header-cell text-[9px] sm:text-sm py-1 sm:py-3">End Date</th>
            <th className="table-header-cell text-[9px] sm:text-sm py-1 sm:py-3">Number of Nights</th>
            <th className="table-header-cell text-[9px] sm:text-sm py-1 sm:py-3">Assigned Property</th>
            <th className="table-header-cell text-[9px] sm:text-sm py-1 sm:py-3">Status</th>
            <th className="table-header-cell text-[9px] sm:text-sm py-1 sm:py-3">Created</th>
            <th className="table-header-cell text-[9px] sm:text-sm py-1 sm:py-3"></th>
          </tr>
        </thead>
        <tbody className="table-body">
          {bookings.map((booking) => (
            <tr key={booking.id} className="hover:bg-gray-50">
              <td className="table-cell py-1 sm:py-3">
                <div className="space-y-0 sm:space-y-1">
                  {booking.booking_dates.length > 0 && booking.booking_dates[0].id && (
                    <div className="text-[8px] sm:text-sm text-blue-600 font-medium mb-0 sm:mb-1 leading-tight sm:leading-normal">
                      Booking ID: {booking.booking_dates[0].id}
                    </div>
                  )}
                  {booking.company_name && (
                    <div className="text-[8px] sm:text-sm text-gray-500 leading-tight sm:leading-normal">{booking.company_name}</div>
                  )}
                  {booking.project_postcode && (
                    <div className="text-[8px] sm:text-sm text-gray-500 leading-tight sm:leading-normal">Postcode: {booking.project_postcode}</div>
                  )}
                  {booking.city && (
                    <div className="text-[8px] sm:text-sm text-gray-500 leading-tight sm:leading-normal">City: {booking.city}</div>
                  )}
                  <div className="text-[8px] sm:text-sm text-gray-500 leading-tight sm:leading-normal">
                    Team Size: {booking.team_size || 'Not specified'}
                  </div>
                  {booking.budget_per_person_week && (
                    <div className="text-[8px] sm:text-sm text-gray-500 leading-tight sm:leading-normal">
                      Budget: {booking.budget_per_person_week}
                    </div>
                  )}
                </div>
              </td>
              <td className="table-cell py-1 sm:py-3">
                <div className="space-y-0 sm:space-y-1">
                  <div className="text-[8px] sm:text-base font-medium text-gray-900 leading-tight sm:leading-normal">{booking.full_name}</div>
                  <div className="text-[8px] sm:text-base font-medium text-gray-900 leading-tight sm:leading-normal">{booking.email}</div>
                  <div className="text-[7px] sm:text-sm text-gray-500 leading-tight sm:leading-normal">{booking.phone}</div>
                </div>
              </td>
              <td className="table-cell py-1 sm:py-3">
                <div className="text-[8px] sm:text-sm leading-tight sm:leading-normal">
                  {booking.booking_dates.length > 0 ? (
                    <div className="font-medium">
                      {new Date(booking.booking_dates[0].start_date).toLocaleDateString()}
                    </div>
                  ) : (
                    <div className="text-gray-400 italic">No date specified</div>
                  )}
                </div>
              </td>
              <td className="table-cell py-1 sm:py-3">
                <div className="text-[8px] sm:text-sm leading-tight sm:leading-normal">
                  {booking.booking_dates.length > 0 ? (
                    <div className="font-medium">
                      {new Date(booking.booking_dates[0].end_date).toLocaleDateString()}
                    </div>
                  ) : (
                    <div className="text-gray-400 italic">No date specified</div>
                  )}
                </div>
              </td>
              <td className="table-cell py-1 sm:py-3">
                <div className="text-[8px] sm:text-sm leading-tight sm:leading-normal">
                  {booking.booking_dates.length > 0 && booking.booking_dates[0].start_date && booking.booking_dates[0].end_date ? (
                    <div className="font-medium text-gray-900">
                      {Math.round((new Date(booking.booking_dates[0].end_date).getTime() - new Date(booking.booking_dates[0].start_date).getTime()) / (1000 * 60 * 60 * 24))}
                    </div>
                  ) : (
                    <div className="text-gray-400 italic">N/A</div>
                  )}
                </div>
              </td>
              <td className="table-cell py-1 sm:py-3">
                {booking.assigned_property ? (
                  <div className="text-[8px] sm:text-base font-medium text-gray-900 leading-tight sm:leading-normal">
                    {booking.assigned_property.id}
                  </div>
                ) : (
                  <div className="text-[7px] sm:text-sm text-gray-400 italic leading-tight sm:leading-normal">No property assigned</div>
                )}
              </td>
              <td className="table-cell py-1 sm:py-3">
                {getStatusBadge(booking.status)}
              </td>
              <td className="table-cell py-1 sm:py-3">
                <div className="text-[8px] sm:text-sm text-gray-500 leading-tight sm:leading-normal">
                  {new Date(booking.created_at).toLocaleDateString()}
                </div>
              </td>
              <td className="table-cell py-1 sm:py-3">
                {/* Hide Assign Property button for active/confirmed bookings */}
                {booking.booking_dates.length > 0 && booking.booking_dates[0].status !== 'confirmed' && (
                  <button
                    onClick={() => onAssignProperty(booking)}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-xs font-medium text-white bg-booking-teal hover:bg-booking-teal/90 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-booking-teal focus:ring-offset-1"
                  >
                    Assign Property
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}