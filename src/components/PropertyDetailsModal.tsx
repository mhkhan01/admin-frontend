'use client';

import { useState } from 'react';
import Image from 'next/image';
import PropertyAssignmentModal from './PropertyAssignmentModal';
import { formatFullAddress } from '@/lib/api';

interface Property {
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
  
  // Contact information
  relevant_contact?: string;
  
  // Landlord information
  owner?: {
    id: string;
    full_name: string;
    role: string;
    contact_number?: string;
    phone?: string;
    created_at: string;
    updated_at: string;
  };
  
  // Index signature for additional properties
  [key: string]: unknown;
}

interface PropertyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
}

export default function PropertyDetailsModal({ isOpen, onClose, property }: PropertyDetailsModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isPropertyAssignmentModalOpen, setIsPropertyAssignmentModalOpen] = useState(false);

  if (!isOpen || !property) return null;

  // Debug: Log property owner data
  console.log('Property owner data:', property.owner);
  console.log('Property owner phone:', property.owner?.phone);
  console.log('Property owner contact_number:', property.owner?.contact_number);

  const amenities = [
    { key: 'workspace_desk', label: 'Workspace / Desk' },
    { key: 'high_speed_wifi', label: 'High-Speed Wi-Fi' },
    { key: 'smart_tv', label: 'Smart TV(s)' },
    { key: 'fully_equipped_kitchen', label: 'Fully Equipped Kitchen' },
    { key: 'living_dining_space', label: 'Living/Dining Space' },
    { key: 'washing_machine', label: 'Washing Machine' },
    { key: 'iron_ironing_board', label: 'Iron & Ironing Board' },
    { key: 'linen_towels_provided', label: 'Linen & Towels Provided' },
    { key: 'consumables_provided', label: 'Consumables Provided' },
  ];

  const safetyCompliance = [
    { key: 'smoke_alarm', label: 'Smoke Alarm' },
    { key: 'co_alarm', label: 'CO Alarm' },
    { key: 'fire_extinguisher_blanket', label: 'Fire Extinguisher / Fire Blanket' },
    { key: 'epc', label: 'EPC' },
    { key: 'gas_safety_certificate', label: 'Gas Safety Certificate' },
    { key: 'eicr', label: 'EICR' },
  ];

  const handleClose = () => {
    setCurrentPhotoIndex(0);
    onClose();
  };

  // Create empty booking data with only postcode pre-filled from property
  const createEmptyBookingData = () => {
    return {
      id: `temp-${Date.now()}`, // Temporary ID for new bookings
      booking_request_id: `temp-req-${Date.now()}`,
      booking_dates: [{
        id: '', // Completely empty booking date ID
        start_date: '',
        end_date: '',
        booking_request_id: `temp-req-${Date.now()}`
      }],
      project_postcode: property.postcode || '',
      full_name: '',
      email: '',
      phone: '',
      team_size: '', // Completely empty instead of 0
      company_name: '',
      budget_per_person_week: '',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      contractor: null,
      assigned_property: null
    };
  };

  const handleBookNow = () => {
    setIsPropertyAssignmentModalOpen(true);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-[85%] sm:w-full max-w-6xl max-h-[70vh] sm:max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200 mx-2 mt-2 sm:mx-0 sm:mt-0">
          <div className="flex items-center space-x-3">
            <div className="h-6 sm:h-12 w-auto flex items-center">
              <Image
                src="/Asset 3@4x.png"
                alt="Booking Hub Logo"
                width={120}
                height={30}
                className="h-6 sm:h-12 w-auto"
                priority
                unoptimized
                onLoad={() => console.log('Logo loaded successfully')}
                onError={(e) => {
                  console.log('Logo failed to load, using fallback');
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.setAttribute('style', 'display: block');
                }}
              />
              <div className="hidden text-booking-teal font-bold text-lg sm:text-2xl">
                Booking Hub
              </div>
            </div>
            <div>
              <div className="flex flex-row sm:flex-col items-center sm:items-start gap-1 sm:gap-0">
                <h2 className="text-[9px] sm:text-xl font-bold text-booking-dark">{property.property_name}</h2>
                <span className="text-[9px] sm:text-sm text-booking-gray">• {property.property_type}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBookNow}
              className="px-3 sm:px-8 py-1.5 sm:py-3 text-[10px] sm:text-base bg-booking-teal text-white font-semibold rounded-lg hover:bg-opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Book Now
            </button>
            <button
              onClick={handleClose}
              className="p-1 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-2 sm:p-6 space-y-2 sm:space-y-8 mx-2 sm:mx-0">
          {/* Property Photos */}
          {property.photos && property.photos.length > 0 && (
            <div>
              <h3 className="text-[10px] sm:text-lg font-semibold text-booking-dark mb-1 sm:mb-4">Property Photos</h3>
              <div className="relative max-w-[200px] sm:max-w-md mx-auto">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={property.photos[currentPhotoIndex]}
                    alt={`Property photo ${currentPhotoIndex + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                
                {/* Navigation Arrows */}
                {property.photos.length > 1 && (
                  <>
                    {/* Previous Arrow */}
                    <button
                      onClick={() => setCurrentPhotoIndex(prev => 
                        prev === 0 ? property.photos!.length - 1 : prev - 1
                      )}
                      className="absolute left-1 sm:left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 sm:w-10 sm:h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    {/* Next Arrow */}
                    <button
                      onClick={() => setCurrentPhotoIndex(prev => 
                        prev === property.photos!.length - 1 ? 0 : prev + 1
                      )}
                      className="absolute right-1 sm:right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 sm:w-10 sm:h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
                
                {/* Photo Counter */}
                {property.photos.length > 1 && (
                  <div className="absolute bottom-1 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-1 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-sm">
                    {currentPhotoIndex + 1} / {property.photos.length}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Basic Details */}
          <div>
            <h3 className="text-[10px] sm:text-lg font-semibold text-booking-dark mb-1 sm:mb-4">Basic Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-1 sm:gap-6">
              <div>
                <label className="block text-[8px] sm:text-sm font-medium text-booking-gray mb-0.5 sm:mb-1">Property Name</label>
                <p className="text-[8px] sm:text-base text-booking-dark font-medium line-clamp-1">{property.property_name}</p>
              </div>
              <div>
                <label className="block text-[8px] sm:text-sm font-medium text-booking-gray mb-0.5 sm:mb-1">Property Type</label>
                <p className="text-[8px] sm:text-base text-booking-dark font-medium">{property.property_type}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-[8px] sm:text-sm font-medium text-booking-gray mb-0.5 sm:mb-1">Full Address</label>
                <p className="text-[8px] sm:text-base text-booking-dark font-medium truncate sm:whitespace-normal">{formatFullAddress(property)}</p>
              </div>
              <div>
                <label className="block text-[8px] sm:text-sm font-medium text-booking-gray mb-0.5 sm:mb-1">Postcode</label>
                <p className="text-[8px] sm:text-base text-booking-dark font-medium">{property.postcode}</p>
              </div>
              <div>
                <label className="block text-[8px] sm:text-sm font-medium text-booking-gray mb-0.5 sm:mb-1">Parking Type</label>
                <p className="text-[8px] sm:text-base text-booking-dark font-medium">{property.parking_type || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Property Specifications */}
          <div>
            <h3 className="text-[10px] sm:text-lg font-semibold text-booking-dark mb-1 sm:mb-4">Property Specifications</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1 sm:gap-6">
              <div className="text-center p-1 sm:p-4 bg-gray-50 rounded-lg">
                <div className="text-[10px] sm:text-2xl font-bold text-booking-teal">{property.bedrooms}</div>
                <div className="text-[7px] sm:text-sm text-booking-gray">Bedrooms</div>
              </div>
              <div className="text-center p-1 sm:p-4 bg-gray-50 rounded-lg">
                <div className="text-[10px] sm:text-2xl font-bold text-booking-teal">{property.beds}</div>
                <div className="text-[7px] sm:text-sm text-booking-gray">Beds</div>
              </div>
              <div className="text-center p-1 sm:p-4 bg-gray-50 rounded-lg">
                <div className="text-[10px] sm:text-2xl font-bold text-booking-teal">{property.bathrooms}</div>
                <div className="text-[7px] sm:text-sm text-booking-gray">Bathrooms</div>
              </div>
              <div className="text-center p-1 sm:p-4 bg-gray-50 rounded-lg">
                <div className="text-[10px] sm:text-2xl font-bold text-booking-teal">{property.max_occupancy}</div>
                <div className="text-[7px] sm:text-sm text-booking-gray">Max Occupancy</div>
              </div>
            </div>
            {property.beds_breakdown && (
              <div className="mt-1 sm:mt-4">
                <label className="block text-[8px] sm:text-sm font-medium text-booking-gray mb-0.5 sm:mb-1">Beds Breakdown</label>
                <p className="text-[8px] sm:text-base text-booking-dark font-medium">{property.beds_breakdown}</p>
              </div>
            )}
          </div>


          {/* Landlord Information */}
          {property.owner && (
            <div>
              <h3 className="text-[10px] sm:text-lg font-semibold text-booking-dark mb-1 sm:mb-4">Landlord Information</h3>
              <div className="p-1.5 sm:p-4 rounded-lg" style={{ backgroundColor: '#00BAB5' }}>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-1 sm:gap-6">
                  <div>
                    <label className="block text-[8px] sm:text-sm font-medium mb-0.5 sm:mb-1" style={{ color: '#F6F6F4' }}>Landlord Name</label>
                    <p className="text-[8px] sm:text-base font-medium" style={{ color: '#F6F6F4' }}>{property.owner.full_name}</p>
                  </div>
                  <div>
                    <label className="block text-[8px] sm:text-sm font-medium mb-0.5 sm:mb-1" style={{ color: '#F6F6F4' }}>Contact Number</label>
                    <p className="text-[8px] sm:text-base font-medium" style={{ color: '#F6F6F4' }}>{property.owner.phone || property.owner.contact_number || 'Not provided'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[8px] sm:text-sm font-medium mb-0.5 sm:mb-1" style={{ color: '#F6F6F4' }}>Member Since</label>
                    <p className="text-[8px] sm:text-base font-medium" style={{ color: '#F6F6F4' }}>
                      {new Date(property.owner.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Property Contact Information */}
          {property.relevant_contact && (
            <div>
              <h3 className="text-[10px] sm:text-lg font-semibold text-booking-dark mb-1 sm:mb-4">Property Contact Information</h3>
              <div className="p-1.5 sm:p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-1 sm:space-x-3">
                  <svg className="w-3 h-3 sm:w-5 sm:h-5 text-booking-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <p className="text-[8px] sm:text-base text-booking-dark font-medium">{property.relevant_contact}</p>
                </div>
              </div>
            </div>
          )}

          {/* Amenities */}
          <div>
            <h3 className="text-[10px] sm:text-lg font-semibold text-booking-dark mb-1 sm:mb-4">Amenities</h3>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-3">
              {amenities.map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-1 sm:space-x-3 p-1 sm:p-3 bg-gray-50 rounded-lg">
                  <div className={`w-3 h-3 sm:w-5 sm:h-5 rounded-full flex items-center justify-center ${
                    property[key as keyof Property] ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {property[key as keyof Property] ? (
                      <svg className="w-2 h-2 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-2 h-2 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-[7px] sm:text-sm font-medium ${
                    property[key as keyof Property] ? 'text-booking-dark' : 'text-booking-gray'
                  }`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Safety & Compliance */}
          <div>
            <h3 className="text-[10px] sm:text-lg font-semibold text-booking-dark mb-1 sm:mb-4">Safety & Compliance</h3>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-3">
              {safetyCompliance.map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-1 sm:space-x-3 p-1 sm:p-3 bg-gray-50 rounded-lg">
                  <div className={`w-3 h-3 sm:w-5 sm:h-5 rounded-full flex items-center justify-center ${
                    property[key as keyof Property] ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {property[key as keyof Property] ? (
                      <svg className="w-2 h-2 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-2 h-2 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-[7px] sm:text-sm font-medium ${
                    property[key as keyof Property] ? 'text-booking-dark' : 'text-booking-gray'
                  }`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Information */}
          {property.additional_info && (
            <div>
              <h3 className="text-[10px] sm:text-lg font-semibold text-booking-dark mb-1 sm:mb-4">Additional Information</h3>
              <div className="p-1.5 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-[8px] sm:text-base text-booking-dark">{property.additional_info}</p>
              </div>
            </div>
          )}

          {/* Status and Metadata */}
          <div>
            <h3 className="text-[10px] sm:text-lg font-semibold text-booking-dark mb-1 sm:mb-4">Status & Metadata</h3>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-1 sm:gap-6">
              <div>
                <label className="block text-[8px] sm:text-sm font-medium text-booking-gray mb-0.5 sm:mb-1">Created</label>
                <p className="text-[8px] sm:text-base text-booking-dark font-medium">
                  {new Date(property.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-[8px] sm:text-sm font-medium text-booking-gray mb-0.5 sm:mb-1">Last Updated</label>
                <p className="text-[8px] sm:text-base text-booking-dark font-medium">
                  {new Date(property.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Property Assignment Modal */}
      <PropertyAssignmentModal
        isOpen={isPropertyAssignmentModalOpen}
        onClose={() => {
          setIsPropertyAssignmentModalOpen(false);
        }}
        onConfirm={(formData) => {
          console.log('Property assignment confirmed:', formData);
          setIsPropertyAssignmentModalOpen(false);
          // Optionally close the property details modal as well
          // onClose();
        }}
        bookingToAssign={createEmptyBookingData()}
        selectedProperty={property}
        isNewBooking={true}
      />
    </div>
  );
}
