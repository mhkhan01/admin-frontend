'use client';

import { useState, useEffect, useRef } from 'react';

interface SingleDatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: string) => void;
  initialDate?: string;
  minDate?: string; // For end date, should be after start date
  alignRight?: boolean; // For end date field on mobile, align to right
}

export default function SingleDatePicker({
  isOpen,
  onClose,
  onSelect,
  initialDate = '',
  minDate,
  alignRight = false
}: SingleDatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialDate ? parseDateString(initialDate) : null
  );
  const modalRef = useRef<HTMLDivElement>(null);

  // Helper function to parse date string (YYYY-MM-DD) to local Date
  function parseDateString(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        setSelectedDate(parseDateString(initialDate));
        setCurrentMonth(parseDateString(initialDate));
      } else {
        setSelectedDate(null);
        setCurrentMonth(new Date());
      }
    }
  }, [isOpen, initialDate]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable past dates
    if (date < today) return true;
    
    // If minDate is provided (for end date), disable dates before minDate
    if (minDate) {
      const min = parseDateString(minDate);
      min.setHours(0, 0, 0, 0);
      if (date < min) return true;
    }
    
    return false;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    setSelectedDate(date);
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    onSelect(formatDate(date));
    onClose();
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Calendar Popover */}
      <div
        ref={modalRef}
        className={`absolute z-50 top-full mt-1.5 sm:mt-2 bg-[#F6F6F4] rounded-lg sm:rounded-xl shadow-2xl w-[calc(100vw-2.5rem)] max-w-[280px] sm:w-[320px] md:w-[340px] animate-card-entrance-1 overflow-hidden border border-[#008080]/20 ${alignRight ? 'right-0 sm:left-0' : 'left-0'}`}
        style={{ fontFamily: 'var(--font-avenir-regular)' }}
      >
        {/* Header */}
        <div className="bg-[#0B1D37] text-[#F6F6F4] px-2.5 sm:px-4 py-1.5 sm:py-3 flex items-center justify-between">
          <h2 className="text-[11px] sm:text-base font-bold" style={{ fontFamily: 'var(--font-avenir-bold)' }}>
            Select Date
          </h2>
          <button
            onClick={onClose}
            className="p-0.5 sm:p-1.5 hover:bg-[#008080]/20 rounded-lg transition-colors duration-200"
            aria-label="Close"
          >
            <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Calendar Container */}
        <div className="p-2 sm:p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-1.5 sm:mb-4">
            <button
              onClick={goToPreviousMonth}
              className="p-0.5 sm:p-2 hover:bg-[#008080]/10 rounded-lg transition-colors duration-200 text-[#0B1D37]"
              aria-label="Previous month"
            >
              <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-3">
              <h3 className="text-[10px] sm:text-base font-bold text-[#0B1D37]" style={{ fontFamily: 'var(--font-avenir-bold)' }}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button
                onClick={goToToday}
                className="px-1.5 sm:px-3 py-0.5 sm:py-1.5 text-[8px] sm:text-xs bg-[#008080] text-white rounded-md sm:rounded-lg hover:bg-[#006666] transition-colors duration-200 font-medium"
              >
                Today
              </button>
            </div>
            <button
              onClick={goToNextMonth}
              className="p-0.5 sm:p-2 hover:bg-[#008080]/10 rounded-lg transition-colors duration-200 text-[#0B1D37]"
              aria-label="Next month"
            >
              <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-[8px] sm:text-xs font-semibold text-[#4B4E53] py-0.5 sm:py-1.5"
                style={{ fontFamily: 'var(--font-avenir)' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dateStr = date.toDateString();
              const isToday = dateStr === today.toDateString();
              const isDisabled = isDateDisabled(date);
              const isSelected = selectedDate && dateStr === selectedDate.toDateString();

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDateClick(date)}
                  disabled={isDisabled}
                  className={`
                    aspect-square text-[10px] sm:text-xs md:text-sm font-medium rounded sm:rounded-md transition-all duration-200
                    ${isDisabled 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : isSelected
                        ? 'bg-[#008080] text-white shadow-md scale-105 z-10'
                        : isToday
                          ? 'bg-[#008080]/10 text-[#008080] font-bold border border-[#008080]'
                          : 'text-[#4B4E53] hover:bg-[#008080]/10 hover:text-[#0B1D37]'
                    }
                  `}
                  style={{ fontFamily: 'var(--font-avenir-regular)' }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
