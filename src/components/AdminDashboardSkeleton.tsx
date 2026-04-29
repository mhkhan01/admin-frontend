/**
 * Full-layout loading skeleton for the admin dashboard.
 * Sidebar and shell chrome mirror the loaded UI (static, not from API).
 * Analytics tiles use placeholders with the same colors as the live dashboard.
 */
export default function AdminDashboardSkeleton() {
  const pulse = 'animate-pulse motion-reduce:animate-none';
  const barOnLight = `rounded-lg bg-gray-200/90 ${pulse}`;
  const barOnWhite = `rounded-lg bg-gray-100 ${pulse}`;
  const barOnGradient = `rounded-lg bg-white/30 ${pulse}`;
  const titleOnWhite = `rounded-md bg-booking-dark/10 ${pulse}`;
  const gradTeal = { background: 'linear-gradient(to top, #00BAB5, rgba(0, 186, 181, 0.54))' } as const;
  const gradBlue = { background: 'linear-gradient(to top, #0284c7, rgba(2, 132, 199, 0.54))' } as const;
  const gradSky = { background: 'linear-gradient(to top, #38bdf8, rgba(56, 189, 248, 0.54))' } as const;

  const navInactive =
    'w-full text-left px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200 cursor-default';
  const navActive =
    'w-full text-left px-4 py-3 rounded-xl bg-white text-booking-dark transition-all duration-200 cursor-default';

  return (
    <div
      className="min-h-screen bg-booking-bg flex flex-col lg:flex-row"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading dashboard…</span>

      {/* Mobile header — same chrome as loaded app (static) */}
      <div
        className="lg:hidden text-white p-4 flex items-center justify-between shrink-0"
        style={{ backgroundColor: '#0B1D37' }}
        aria-hidden
      >
        <div className="flex items-center space-x-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/white-teal.webp"
            alt=""
            className="h-8 w-auto"
          />
          <div>
            <p className="text-lg font-semibold text-white">Admin Portal</p>
          </div>
        </div>
        <div
          className="p-2 rounded-lg text-white"
          aria-hidden
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>
      </div>

      {/* Desktop sidebar — same structure/labels as loaded app (static, not API-driven) */}
      <div
        className="hidden lg:flex w-64 bg-booking-dark text-white flex-col h-screen fixed top-0 left-0 overflow-y-auto z-40"
        aria-hidden
      >
        <div className="p-6 border-b border-gray-700" style={{ backgroundColor: '#0B1D37' }}>
          <div className="flex flex-col items-center space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/white-teal.webp"
              alt=""
              className="h-12 w-auto"
            />
            <p className="text-sm font-bold" style={{ color: '#00BAB5' }}>
              Admin Portal
            </p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <div className={navActive}>
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
              <span className="text-sm lg:text-sm font-medium">Dashboard</span>
              <div className="w-1 h-1 bg-booking-teal rounded-full ml-auto" />
            </div>
          </div>
          <div className={navInactive}>
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm lg:text-sm font-medium">All Requests</span>
            </div>
          </div>
          <div className={navInactive}>
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-sm lg:text-sm font-medium">All Properties</span>
            </div>
          </div>
          <div className={navInactive}>
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <span className="text-sm lg:text-sm font-medium">User Management</span>
            </div>
          </div>
        </nav>

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
          <div className="w-full text-left px-4 py-3 rounded-xl text-gray-300">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm lg:text-sm font-medium">Logout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main column — real header chrome; only tile bodies shimmer */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden lg:ml-64 w-full min-w-0 pointer-events-none select-none">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-booking-dark">Analytics</h1>
            <p className="text-xs sm:text-base text-booking-gray">Platform overview and management</p>
          </div>
          <div className="p-1">
            <span
              className="inline-block px-3 py-2 sm:px-6 sm:py-3 text-xs sm:text-base text-white font-semibold rounded-lg shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #00BAB5 0%, #0B1D37 100%)',
                borderRadius: '0.5rem',
              }}
            >
              All Bookings
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 max-w-4xl mx-auto mb-3 sm:mb-4 lg:mb-6">
          <div
            className="rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 text-white shadow-lg"
            style={gradTeal}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
              <div className={`h-4 w-28 sm:w-32 ${barOnGradient}`} />
              <div className={`h-5 w-5 sm:h-8 sm:w-8 rounded-full bg-white/20 ${pulse}`} />
            </div>
            <div className={`h-7 sm:h-9 w-16 mb-2 ${barOnGradient}`} />
            <div className={`h-3 w-3/4 max-w-[200px] mb-3 sm:mb-4 ${barOnGradient}`} />
            <div className="flex justify-between gap-2">
              <div className={`h-2.5 flex-1 max-w-[100px] ${barOnGradient}`} />
              <div className={`h-2.5 flex-1 max-w-[100px] ${barOnGradient}`} />
            </div>
          </div>
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
              <div className={`h-4 w-32 sm:w-36 ${titleOnWhite}`} />
              <div className={`h-5 w-5 sm:h-8 sm:w-8 rounded-full bg-green-100 ${pulse}`} />
            </div>
            <div className={`h-7 sm:h-9 w-14 mb-2 ${barOnLight}`} />
            <div className={`h-3 w-2/3 max-w-[180px] mb-3 sm:mb-4 ${barOnWhite}`} />
            <div className="h-1.5 sm:h-2 w-full rounded-full bg-gray-200 mb-3 sm:mb-4 overflow-hidden">
              <div className={`h-full w-1/3 rounded-full bg-green-200/80 ${pulse}`} />
            </div>
            <div className="flex justify-between gap-2">
              <div className={`h-2.5 w-20 ${barOnWhite}`} />
              <div className={`h-2.5 w-24 ${barOnWhite}`} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6 max-w-6xl mx-auto mt-3 sm:mt-4 lg:mt-6 mb-6">
          <div
            className="rounded-lg sm:rounded-2xl p-2 sm:p-4 lg:p-6 text-white shadow-lg"
            style={gradBlue}
          >
            <div className="flex items-center justify-between mb-1 sm:mb-3 lg:mb-4">
              <div className={`h-3 sm:h-4 w-20 sm:w-28 ${barOnGradient}`} />
              <div className={`h-4 w-4 sm:h-8 sm:w-8 rounded-full bg-white/20 ${pulse}`} />
            </div>
            <div className={`h-6 sm:h-9 w-12 mb-1 sm:mb-2 ${barOnGradient}`} />
            <div className={`h-2.5 sm:h-3 w-full max-w-[140px] mb-2 sm:mb-4 ${barOnGradient}`} />
            <div className="flex justify-between gap-1">
              <div className={`h-2 w-14 sm:w-20 ${barOnGradient}`} />
              <div className={`h-2 w-14 sm:w-20 ${barOnGradient}`} />
            </div>
          </div>
          <div
            className="rounded-lg sm:rounded-2xl p-2 sm:p-4 lg:p-6 text-white shadow-lg"
            style={gradSky}
          >
            <div className="flex items-center justify-between mb-1 sm:mb-3 lg:mb-4">
              <div className={`h-3 sm:h-4 w-20 sm:w-28 ${barOnGradient}`} />
              <div className={`h-4 w-4 sm:h-8 sm:w-8 rounded-full bg-white/20 ${pulse}`} />
            </div>
            <div className={`h-6 sm:h-9 w-12 mb-1 sm:mb-2 ${barOnGradient}`} />
            <div className={`h-2.5 sm:h-3 w-full max-w-[140px] mb-2 sm:mb-4 ${barOnGradient}`} />
            <div className="flex justify-between gap-1">
              <div className={`h-2 w-14 sm:w-20 ${barOnGradient}`} />
              <div className={`h-2 w-14 sm:w-20 ${barOnGradient}`} />
            </div>
          </div>
          <div className="bg-white rounded-lg sm:rounded-2xl p-2 sm:p-4 lg:p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-1 sm:mb-3 lg:mb-4">
              <div className={`h-3 sm:h-4 w-[70%] max-w-[120px] sm:max-w-none ${titleOnWhite}`} />
              <div className={`h-4 w-4 sm:h-8 sm:w-8 rounded-full bg-green-100 ${pulse}`} />
            </div>
            <div className={`h-6 sm:h-9 w-12 mb-1 sm:mb-2 ${barOnLight}`} />
            <div className={`h-2.5 sm:h-3 w-full max-w-[130px] mb-2 sm:mb-4 ${barOnWhite}`} />
            <div className="h-1 sm:h-2 w-full rounded-full bg-gray-200 mb-2 sm:mb-4 overflow-hidden">
              <div className={`h-full w-2/5 rounded-full bg-green-200/80 ${pulse}`} />
            </div>
            <div className="flex justify-between gap-0.5">
              <div className={`h-2 w-12 sm:w-20 ${barOnWhite}`} />
              <div className={`h-2 w-14 sm:w-24 ${barOnWhite}`} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 h-48 sm:h-56 max-w-6xl mx-auto p-4 sm:p-6">
          <div className={`h-4 w-40 mb-4 ${barOnLight}`} />
          <div className="space-y-3">
            <div className={`h-3 w-full ${barOnWhite}`} />
            <div className={`h-3 w-11/12 ${barOnWhite}`} />
            <div className={`h-3 w-4/5 ${barOnWhite}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
