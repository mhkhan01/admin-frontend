'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      console.log('Sending password reset email to:', email);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `https://admin.booking-hub.co.uk/auth/reset-password`,
      });

      if (resetError) {
        console.error('Password reset error:', resetError);
        setError(resetError.message);
      } else {
        console.log('Password reset email sent successfully');
        setMessage('Password reset email sent! Please check your inbox and click the link to reset your password.');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      backgroundImage: 'url(/360_F_281897358_3rj9ZBSZHo5s0L1ug7uuIHadSxh9Cc75.webp)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      {/* Background Image Opacity Overlay */}
      <div className="absolute inset-0 bg-white/30 pointer-events-none"></div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-4 px-2 sm:py-8 sm:px-4 pb-12 sm:pb-16">
        {/* Logo */}
        <div className="mb-4 sm:mb-8 w-full max-w-xs sm:max-w-2xl">
          <Image
            src="/Asset 3@4x.png"
            alt="Booking Hub Logo"
            width={800}
            height={200}
            className="w-full h-auto"
            priority
          />
        </div>

        {/* Form Container */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded shadow-xl sm:shadow-lg p-6 sm:p-6 lg:p-8 w-full max-w-xs sm:max-w-lg lg:max-w-2xl border border-gray-200/50 sm:border-gray-200 mt-4 mb-4 sm:mt-0 sm:mb-0">
          {/* Introductory Text */}
          <p className="text-xs sm:text-sm font-extrabold text-orange-300 mb-2 sm:mb-4 text-center pt-1 sm:pt-4 leading-relaxed">
            Admin Portal - Reset your password to regain access to your account
          </p>

          {/* Form Title */}
          <h1 className="text-base sm:text-2xl lg:text-3xl font-bold text-booking-dark mb-4 sm:mb-8 text-center leading-tight">
            Reset Your Password
          </h1>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-red-800">{error}</div>
              </div>
            )}

            {message && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-green-800">{message}</div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-booking-dark mb-1 sm:mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your admin email address"
                required
                autoComplete="email"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-booking-teal rounded focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-booking-teal text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded hover:bg-opacity-90 transition-all duration-200 text-sm sm:text-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                    Sending Reset Email...
                  </div>
                ) : (
                  'Send Reset Email'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs sm:text-sm text-booking-gray">
                Remember your password?{' '}
                <Link href="/auth/login" className="text-booking-teal hover:text-booking-dark font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

