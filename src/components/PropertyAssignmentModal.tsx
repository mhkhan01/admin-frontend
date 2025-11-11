'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface PropertyAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (formData: EditableFormData) => void;
  bookingToAssign: {
    id: string;
    booking_request_id?: string;
    booking_dates?: Array<{ 
      id: string;
      start_date?: string;
      end_date?: string;
      status?: string;
    }>;
    [key: string]: unknown;
  } | null;
  selectedProperty: {
    id: string;
    property_name?: string;
    title?: string;
    property_type?: string;
    full_address?: string;
    address?: string;
    landlord_id?: string;
    owner?: {
      full_name?: string;
      contact_number?: string;
      email?: string;
    };
    [key: string]: unknown;
  } | null;
  isNewBooking?: boolean;
}

interface FormData {
  booking_date_id: string;
  start_date: string;
  end_date: string;
  postcode: string;
  contractor_name: string;
  contractor_email: string;
  contractor_phone: string;
  team_size: number;
  property_name: string;
  property_type: string;
  property_address: string;
  landlord_name: string;
  landlord_contact: string;
}

interface EditableFormData {
  booking_date_id: string;
  start_date: string;
  end_date: string;
  postcode: string;
  contractor_name: string;
  contractor_email: string;
  contractor_phone: string;
  team_size: number;
  property_name: string;
  property_type: string;
  property_address: string;
  landlord_name: string;
  landlord_contact: string;
}

export default function PropertyAssignmentModal({
  isOpen,
  onClose,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onConfirm: _onConfirm,
  bookingToAssign,
  selectedProperty,
  isNewBooking = false
}: PropertyAssignmentModalProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_formData, setFormData] = useState<FormData | null>(null);
  const [editableFormData, setEditableFormData] = useState<EditableFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isLoadingBookingData, setIsLoadingBookingData] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchFormData = async () => {
    if (!bookingToAssign || !selectedProperty) return;
    
    setLoading(true);
    let actualBookingDateId = ''; // Declare outside try block
    try {
      console.log('Booking to assign:', bookingToAssign);
      console.log('Selected property:', selectedProperty);
      console.log('Is new booking:', isNewBooking);

      // For new bookings (from "Book Now"), don't fetch any data, just use empty form
      if (isNewBooking) {
        console.log('Creating new booking form data without fetching from database');
        
        // Fetch landlord data if landlord_id exists
        let landlord = null;
        console.log('Selected property landlord_id:', selectedProperty.landlord_id);
        
        if (selectedProperty.landlord_id) {
          try {
            const { data: landlordData, error: landlordError } = await supabase
              .from('landlord')
              .select('*')
              .eq('id', selectedProperty.landlord_id)
              .single();

            console.log('Landlord data:', landlordData);
            console.log('Landlord error:', landlordError);

            if (!landlordError) {
              landlord = landlordData;
            } else {
              console.warn('Could not fetch landlord data:', landlordError);
            }
          } catch (error) {
            console.warn('Error fetching landlord:', error);
          }
        } else {
          console.warn('No landlord_id found in selected property');
        }

        // Prepare form data for new booking with empty fields (including postcode)
        const formData: FormData = {
          booking_date_id: '', // Completely empty for new bookings
          start_date: '',
          end_date: '',
          postcode: '', // Completely empty - will be filled when booking ID is entered
          contractor_name: '',
          contractor_email: '',
          contractor_phone: '',
          team_size: 0, // Completely empty for new bookings
          property_name: selectedProperty.property_name || selectedProperty.title || '',
          property_type: selectedProperty.property_type || '',
          property_address: selectedProperty.full_address || selectedProperty.address || [
            selectedProperty.house_address,
            selectedProperty.locality,
            selectedProperty.city,
            selectedProperty.county,
            selectedProperty.postcode,
            selectedProperty.country
          ].filter(Boolean).join(', ') || '',
          landlord_name: landlord?.full_name || selectedProperty.owner?.full_name || 'Unknown',
          landlord_contact: landlord?.contact_number || landlord?.email || selectedProperty.owner?.contact_number || selectedProperty.owner?.email || 'Unknown'
        };

        console.log('New booking form data prepared:', formData);
        setFormData(formData);
        setEditableFormData(formData);
        setLoading(false);
        return;
      }

      // For existing bookings: First try to get it from the booking_dates array
      if (bookingToAssign.booking_dates && bookingToAssign.booking_dates.length > 0) {
        actualBookingDateId = bookingToAssign.booking_dates[0].id;
        console.log('Booking date ID from booking_dates array:', actualBookingDateId);
      }

      // If not found, try to fetch from database
      if (!actualBookingDateId && bookingToAssign.booking_request_id) {
        try {
          const { data: bookingDateData, error: bookingDateError } = await supabase
            .from('booking_dates')
            .select('id')
            .eq('booking_request_id', bookingToAssign.booking_request_id)
            .single();

          console.log('Booking date data from DB:', bookingDateData);
          console.log('Booking date error from DB:', bookingDateError);

          if (!bookingDateError && bookingDateData) {
            actualBookingDateId = bookingDateData.id;
          }
        } catch (error) {
          console.warn('Error fetching booking date ID from DB:', error);
        }
      }

      // If still not found, use the composite ID approach
      if (!actualBookingDateId && bookingToAssign.id.includes('-')) {
        const dateId = bookingToAssign.id.split('-')[1];
        actualBookingDateId = dateId;
        console.log('Using composite ID approach:', actualBookingDateId);
      }

      console.log('Final booking date ID:', actualBookingDateId);

      // Try to fetch booking request data, but don't fail if it doesn't exist
      let bookingRequest = null;
      const bookingRequestId = bookingToAssign.booking_request_id || bookingToAssign.id.split('-')[0];
      
      try {
        const { data: bookingRequestData, error: bookingError } = await supabase
          .from('booking_requests')
          .select('*')
          .eq('id', bookingRequestId)
          .single();

        console.log('Booking request data:', bookingRequestData);
        console.log('Booking request error:', bookingError);

        if (!bookingError) {
          bookingRequest = bookingRequestData;
        } else {
          console.warn('Could not fetch booking request, using fallback data');
        }
      } catch (error) {
        console.warn('Error fetching booking request:', error);
      }

      // Fetch contractor data if user_id exists
      let contractor = null;
      if (bookingRequest?.user_id) {
        try {
          const { data: contractorData, error: contractorError } = await supabase
            .from('contractor')
            .select('*')
            .eq('id', bookingRequest.user_id)
            .single();

          console.log('Contractor data:', contractorData);
          console.log('Contractor error:', contractorError);

          if (!contractorError) {
            contractor = contractorData;
          }
        } catch (error) {
          console.warn('Error fetching contractor:', error);
        }
      }

      // Fetch landlord data if landlord_id exists
      let landlord = null;
      console.log('Selected property landlord_id:', selectedProperty.landlord_id);
      
      if (selectedProperty.landlord_id) {
        try {
          const { data: landlordData, error: landlordError } = await supabase
            .from('landlord')
            .select('*')
            .eq('id', selectedProperty.landlord_id)
            .single();

          console.log('Landlord data:', landlordData);
          console.log('Landlord error:', landlordError);

          if (!landlordError) {
            landlord = landlordData;
          } else {
            console.warn('Could not fetch landlord data:', landlordError);
          }
        } catch (error) {
          console.warn('Error fetching landlord:', error);
        }
      } else {
        console.warn('No landlord_id found in selected property');
      }

      // Prepare form data with fallbacks
      const formData: FormData = {
        booking_date_id: actualBookingDateId,
        start_date: bookingToAssign.booking_dates?.[0]?.start_date || bookingRequest?.start_date || '',
        end_date: bookingToAssign.booking_dates?.[0]?.end_date || bookingRequest?.end_date || '',
        postcode: bookingRequest?.project_postcode || (bookingToAssign.project_postcode as string) || '',
        contractor_name: contractor?.full_name || bookingRequest?.full_name || (bookingToAssign.full_name as string) || '',
        contractor_email: contractor?.email || bookingRequest?.email || (bookingToAssign.email as string) || '',
        contractor_phone: bookingRequest?.phone || (bookingToAssign.phone as string) || '',
        team_size: bookingRequest?.team_size || (bookingToAssign.team_size as number) || 0,
        property_name: selectedProperty.property_name || selectedProperty.title || '',
        property_type: selectedProperty.property_type || '',
        property_address: selectedProperty.full_address || selectedProperty.address || [
          selectedProperty.house_address,
          selectedProperty.locality,
          selectedProperty.city,
          selectedProperty.county,
          selectedProperty.postcode,
          selectedProperty.country
        ].filter(Boolean).join(', ') || '',
        landlord_name: landlord?.full_name || selectedProperty.owner?.full_name || 'Unknown',
        landlord_contact: landlord?.contact_number || landlord?.email || selectedProperty.owner?.contact_number || selectedProperty.owner?.email || 'Unknown'
      };

      console.log('Form data prepared:', formData);
      setFormData(formData);
      setEditableFormData(formData);
    } catch (error) {
      console.error('Error fetching form data:', error);
      // Set a fallback form data even if some queries fail
      const fallbackData: FormData = {
        booking_date_id: actualBookingDateId,
        start_date: bookingToAssign.booking_dates?.[0]?.start_date || '',
        end_date: bookingToAssign.booking_dates?.[0]?.end_date || '',
        postcode: (bookingToAssign.project_postcode as string) || '',
        contractor_name: (bookingToAssign.full_name as string) || '',
        contractor_email: (bookingToAssign.email as string) || '',
        contractor_phone: (bookingToAssign.phone as string) || '',
        team_size: (bookingToAssign.team_size as number) || 0,
        property_name: selectedProperty.property_name || selectedProperty.title || '',
        property_type: selectedProperty.property_type || '',
        property_address: selectedProperty.full_address || selectedProperty.address || [
          selectedProperty.house_address,
          selectedProperty.locality,
          selectedProperty.city,
          selectedProperty.county,
          selectedProperty.postcode,
          selectedProperty.country
        ].filter(Boolean).join(', ') || '',
        landlord_name: selectedProperty.owner?.full_name || 'Unknown',
        landlord_contact: selectedProperty.owner?.contact_number || selectedProperty.owner?.email || 'Unknown'
      };
      setFormData(fallbackData);
      setEditableFormData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && bookingToAssign && selectedProperty) {
      setErrorMessage(''); // Clear any previous error messages
      setSuccessMessage(''); // Clear any previous success messages
      fetchFormData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, bookingToAssign, selectedProperty]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleInputChange = (field: keyof EditableFormData, value: string | number) => {
    if (editableFormData) {
      setEditableFormData({
        ...editableFormData,
        [field]: value
      });
    }
  };

  // Function to fetch booking data when booking ID is entered (only for new bookings)
  const fetchBookingDataById = async (bookingDateId: string) => {
    if (!bookingDateId || !isNewBooking || !selectedProperty) return;
    
    setIsLoadingBookingData(true);
    setErrorMessage('');
    
    try {
      console.log('Fetching booking data for ID:', bookingDateId);
      
      // Fetch booking date data to get booking_request_id, start_date, and end_date
      const { data: bookingDateData, error: bookingDateError } = await supabase
        .from('booking_dates')
        .select('booking_request_id, start_date, end_date')
        .eq('id', bookingDateId)
        .single();
      
      if (bookingDateError || !bookingDateData) {
        console.log('Booking date not found:', bookingDateError);
        setErrorMessage('Booking ID not found. Please check and try again.');
        setIsLoadingBookingData(false);
        return;
      }
      
      console.log('Booking date data found:', bookingDateData);
      
      // Fetch booking request data
      const { data: bookingRequestData, error: bookingRequestError } = await supabase
        .from('booking_requests')
        .select('team_size, full_name, email, phone, project_postcode')
        .eq('id', bookingDateData.booking_request_id)
        .single();
      
      if (bookingRequestError || !bookingRequestData) {
        console.log('Booking request not found:', bookingRequestError);
        setErrorMessage('Booking request data not found for this ID.');
        setIsLoadingBookingData(false);
        return;
      }
      
      console.log('Booking request data found:', bookingRequestData);
      
      // Fetch landlord data if landlord_id exists
      let landlord = null;
      if (selectedProperty.landlord_id) {
        try {
          const { data: landlordData, error: landlordError } = await supabase
            .from('landlord')
            .select('*')
            .eq('id', selectedProperty.landlord_id)
            .single();

          if (!landlordError) {
            landlord = landlordData;
          }
        } catch (error) {
          console.warn('Error fetching landlord:', error);
        }
      }
      
      // Update form data with fetched information
      if (editableFormData) {
        setEditableFormData({
          ...editableFormData,
          booking_date_id: bookingDateId,
          start_date: bookingDateData.start_date,
          end_date: bookingDateData.end_date,
          postcode: bookingRequestData.project_postcode || editableFormData.postcode,
          contractor_name: bookingRequestData.full_name || '',
          contractor_email: bookingRequestData.email || '',
          contractor_phone: bookingRequestData.phone || '',
          team_size: bookingRequestData.team_size || 0,
          property_name: selectedProperty.property_name || selectedProperty.title || '',
          property_type: selectedProperty.property_type || '',
          property_address: selectedProperty.full_address || selectedProperty.address || [
            selectedProperty.house_address,
            selectedProperty.locality,
            selectedProperty.city,
            selectedProperty.county,
            selectedProperty.postcode,
            selectedProperty.country
          ].filter(Boolean).join(', ') || '',
          landlord_name: landlord?.full_name || selectedProperty.owner?.full_name || 'Unknown',
          landlord_contact: landlord?.contact_number || landlord?.email || selectedProperty.owner?.contact_number || selectedProperty.owner?.email || 'Unknown'
        });
      }
      
      // Clear any error messages after successful data fetch
      setErrorMessage('');
    } catch (error) {
      console.error('Error fetching booking data:', error);
      setErrorMessage('Error fetching booking data. Please try again.');
    } finally {
      setIsLoadingBookingData(false);
    }
  };

  // Handle booking ID change with debounce
  const handleBookingIdChange = (value: string) => {
    console.log('handleBookingIdChange called with value:', value);
    console.log('isNewBooking:', isNewBooking);
    console.log('editableFormData exists:', !!editableFormData);
    
    if (!editableFormData) return;
    
    // Clear any existing timer
    if (debounceTimerRef.current) {
      console.log('Clearing existing debounce timer');
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    // Update booking ID first
    setEditableFormData({
      ...editableFormData,
      booking_date_id: value
    });
    
    // If booking ID is cleared, reset all auto-filled fields and clear error message
    if (isNewBooking && !value.trim()) {
      console.log('Booking ID cleared, resetting form fields');
      setEditableFormData({
        ...editableFormData,
        booking_date_id: '',
        start_date: '',
        end_date: '',
        contractor_name: '',
        contractor_email: '',
        contractor_phone: '',
        team_size: 0,
        postcode: '', // Keep postcode empty (not property postcode)
        property_name: selectedProperty?.property_name || selectedProperty?.title || '',
        property_type: selectedProperty?.property_type || '',
        property_address: selectedProperty?.full_address || selectedProperty?.address || '',
        landlord_name: editableFormData.landlord_name,
        landlord_contact: editableFormData.landlord_contact
      });
      setErrorMessage(''); // Clear error message when field is empty
      setIsLoadingBookingData(false); // Clear loading state
      return;
    }
    
    // Only fetch if it's a new booking and value is not empty
    if (isNewBooking && value.trim()) {
      console.log('Setting up debounce timer for booking ID:', value.trim());
      // Debounce the fetch - only fetch after user stops typing for 500ms
      debounceTimerRef.current = setTimeout(() => {
        console.log('Debounce timer fired, fetching booking data for:', value.trim());
        fetchBookingDataById(value.trim());
      }, 500);
    } else {
      console.log('Not setting up timer - isNewBooking:', isNewBooking, 'value.trim():', value.trim());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editableFormData) {
      try {
        setLoading(true);
        setErrorMessage('');
        
        // Validate required fields
        if (!editableFormData.booking_date_id) {
          setErrorMessage('Booking ID is required');
          setLoading(false);
          return;
        }

        if (!selectedProperty || !selectedProperty.id) {
          setErrorMessage('Property selection is required');
          setLoading(false);
          return;
        }

        if (!editableFormData.start_date || !editableFormData.end_date) {
          setErrorMessage('Start date and end date are required');
          setLoading(false);
          return;
        }

        // Call backend API for property assignment
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/property-assignment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            booking_date_id: editableFormData.booking_date_id,
            property_id: selectedProperty.id,
            start_date: editableFormData.start_date,
            end_date: editableFormData.end_date,
            postcode: editableFormData.postcode,
            contractor_name: editableFormData.contractor_name,
            contractor_email: editableFormData.contractor_email,
            contractor_phone: editableFormData.contractor_phone,
            team_size: editableFormData.team_size,
            property_name: editableFormData.property_name,
            property_type: editableFormData.property_type,
            property_address: editableFormData.property_address,
            landlord_name: editableFormData.landlord_name,
            landlord_contact: editableFormData.landlord_contact
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('Backend property assignment error:', result);
          
          // Handle specific error codes
          if (result.code === 'BOOKING_ALREADY_EXISTS') {
            setErrorMessage('The booking is already active');
          } else if (result.code === 'DATE_CONFLICT') {
            setErrorMessage(result.error || 'Property is unavailable for the selected dates');
          } else {
            setErrorMessage(result.error || 'Error saving property assignment. Please try again.');
          }
          setLoading(false);
          return;
        }

        console.log('Successfully saved property assignment:', result);
        
        // Show success message from backend
        setSuccessMessage(result.message);
        setErrorMessage('');
        setLoading(false);
      } catch (error) {
        console.error('Error in property assignment:', error);
        alert('Error saving property assignment. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-3 pt-4 pb-20 text-center sm:px-4 sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div 
          className="inline-block w-[85%] sm:w-full max-w-2xl max-h-[70vh] sm:max-h-none px-3 pt-3 pb-3 sm:px-4 sm:pt-5 sm:pb-4 overflow-y-auto text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sm:flex sm:items-start">
            <div className="w-full mt-2 sm:mt-3 text-center sm:mt-0 sm:text-left">
              <h3 className="text-sm sm:text-lg font-medium leading-6 text-gray-900 mb-2 sm:mb-4">
                Property Assignment Details
              </h3>
              
              {editableFormData ? (
                <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <label className="block text-[10px] sm:text-sm font-medium text-gray-700">Booking ID</label>
                      <input
                        type="text"
                        value={editableFormData.booking_date_id}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleBookingIdChange(value);
                        }}
                        className="mt-0.5 sm:mt-1 block w-full px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-sm border border-gray-300 rounded-md shadow-sm focus:ring-booking-teal focus:border-booking-teal"
                        placeholder="Enter booking ID to auto-fill..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] sm:text-sm font-medium text-gray-700">Start Date</label>
                      <input
                        type="date"
                        value={editableFormData.start_date}
                        onChange={(e) => handleInputChange('start_date', e.target.value)}
                        className="mt-0.5 sm:mt-1 block w-full px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-sm border border-gray-300 rounded-md shadow-sm focus:ring-booking-teal focus:border-booking-teal"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] sm:text-sm font-medium text-gray-700">End Date</label>
                      <input
                        type="date"
                        value={editableFormData.end_date}
                        onChange={(e) => handleInputChange('end_date', e.target.value)}
                        className="mt-0.5 sm:mt-1 block w-full px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-sm border border-gray-300 rounded-md shadow-sm focus:ring-booking-teal focus:border-booking-teal"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] sm:text-sm font-medium text-gray-700">Postcode</label>
                      <input
                        type="text"
                        value={editableFormData.postcode}
                        onChange={(e) => handleInputChange('postcode', e.target.value)}
                        className="mt-0.5 sm:mt-1 block w-full px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-sm border border-gray-300 rounded-md shadow-sm focus:ring-booking-teal focus:border-booking-teal"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] sm:text-sm font-medium text-gray-700">Client Name</label>
                      <input
                        type="text"
                        value={editableFormData.contractor_name}
                        onChange={(e) => handleInputChange('contractor_name', e.target.value)}
                        className="mt-0.5 sm:mt-1 block w-full px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-sm border border-gray-300 rounded-md shadow-sm focus:ring-booking-teal focus:border-booking-teal"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] sm:text-sm font-medium text-gray-700">Client Email</label>
                      <input
                        type="email"
                        value={editableFormData.contractor_email}
                        onChange={(e) => handleInputChange('contractor_email', e.target.value)}
                        className="mt-0.5 sm:mt-1 block w-full px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-sm border border-gray-300 rounded-md shadow-sm focus:ring-booking-teal focus:border-booking-teal"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] sm:text-sm font-medium text-gray-700">Client Phone</label>
                      <input
                        type="tel"
                        value={editableFormData.contractor_phone}
                        onChange={(e) => handleInputChange('contractor_phone', e.target.value)}
                        className="mt-0.5 sm:mt-1 block w-full px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-sm border border-gray-300 rounded-md shadow-sm focus:ring-booking-teal focus:border-booking-teal"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] sm:text-sm font-medium text-gray-700">Team Size</label>
                      <input
                        type="number"
                        value={editableFormData.team_size}
                        onChange={(e) => handleInputChange('team_size', parseInt(e.target.value) || 0)}
                        className="mt-0.5 sm:mt-1 block w-full px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-sm border border-gray-300 rounded-md shadow-sm focus:ring-booking-teal focus:border-booking-teal"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] sm:text-sm font-medium text-gray-700">Property Name</label>
                      <input
                        type="text"
                        value={editableFormData.property_name}
                        onChange={(e) => handleInputChange('property_name', e.target.value)}
                        className="mt-0.5 sm:mt-1 block w-full px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-sm border border-gray-300 rounded-md shadow-sm focus:ring-booking-teal focus:border-booking-teal"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] sm:text-sm font-medium text-gray-700">Property Type</label>
                      <input
                        type="text"
                        value={editableFormData.property_type}
                        onChange={(e) => handleInputChange('property_type', e.target.value)}
                        className="mt-0.5 sm:mt-1 block w-full px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-sm border border-gray-300 rounded-md shadow-sm focus:ring-booking-teal focus:border-booking-teal"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-[10px] sm:text-sm font-medium text-gray-700">Property Address</label>
                      <div className="relative">
                        <textarea
                          value={editableFormData.property_address}
                          onChange={(e) => handleInputChange('property_address', e.target.value)}
                          rows={2}
                          className="mt-0.5 sm:mt-1 block w-full px-2 py-2 sm:px-3 sm:py-2 text-[10px] sm:text-sm border border-gray-300 rounded-md shadow-sm focus:ring-booking-teal focus:border-booking-teal resize-none"
                          style={{ 
                            lineHeight: '1.5', 
                            minHeight: '3.5rem',
                            display: 'block'
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="col-span-1">
                      <label className="block text-[10px] sm:text-sm font-medium text-gray-700">Partner Name</label>
                      <input
                        type="text"
                        value={editableFormData.landlord_name}
                        onChange={(e) => handleInputChange('landlord_name', e.target.value)}
                        className="mt-0.5 sm:mt-1 block w-full px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-sm border border-gray-300 rounded-md shadow-sm focus:ring-booking-teal focus:border-booking-teal"
                      />
                    </div>
                    
                    <div className="col-span-1">
                      <label className="block text-[10px] sm:text-sm font-medium text-gray-700">Partner Contact</label>
                      <input
                        type="text"
                        value={editableFormData.landlord_contact}
                        onChange={(e) => handleInputChange('landlord_contact', e.target.value)}
                        className="mt-0.5 sm:mt-1 block w-full px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-sm border border-gray-300 rounded-md shadow-sm focus:ring-booking-teal focus:border-booking-teal"
                      />
                    </div>
                  </div>
                  
                  {/* Error Message Display */}
                  {errorMessage && (
                    <div className="mt-2 sm:mt-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-2 sm:ml-3">
                          <p className="text-[10px] sm:text-sm text-red-800">{errorMessage}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Success Message Display */}
                  {successMessage && (
                    <div className="mt-2 sm:mt-4 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-2 sm:ml-3">
                          <p className="text-[10px] sm:text-sm text-green-800">{successMessage}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 sm:mt-6 flex justify-end space-x-2 sm:space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-booking-teal"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !!successMessage}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-sm font-medium text-white bg-booking-teal border border-transparent rounded-md shadow-sm hover:bg-booking-teal/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-booking-teal disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Saving...' : 'Confirm Assignment'}
                    </button>
                  </div>
                </form>
              ) : loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-booking-teal"></div>
                </div>
              ) : (
                <div className="text-center py-4 sm:py-8">
                  <p className="text-[10px] sm:text-sm text-gray-500">Failed to load form data</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
