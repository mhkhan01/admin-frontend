'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  role: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function AdminSignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  // Watch password for real-time criteria validation
  const passwordValue = watch('password', '');

  const onSubmit = async (data: SignupForm) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Starting admin signup with data:', data);

      // Call backend API for admin signup
      // Trim any whitespace to prevent URL issues
      const backendUrl = ('https://jfgm6v6pkw.us-east-1.awsapprunner.com').trim();
      const apiUrl = `https://jfgm6v6pkw.us-east-1.awsapprunner.com/api/admin-signup`;
      
      console.log('Backend URL:', backendUrl);
      console.log('Full API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const result = await response.json();
      console.log('Response data:', result);

      if (!response.ok) {
        console.error('Backend signup error:', result);
        setError(result.error || 'Signup failed. Please try again.');
        setLoading(false);
        return;
      }

      console.log('Admin signup successful:', result);

      // Show success message
      setSuccess(true);
      setLoading(false);

      // Redirect to login with success message
      setTimeout(() => {
        router.push('/auth/login?message=Signed up successfully! Please check your email to confirm your account before signing in.');
      }, 2000);
    } catch (err) {
      console.error('Unexpected error during signup:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      backgroundImage: 'url(/Houses%20-%202.webp)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      {/* Background Image Opacity Overlay */}
      <div className="absolute inset-0 bg-[rgba(11,29,55,0.88)] pointer-events-none"></div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen px-2 sm:px-4 pb-12 sm:pb-16 -mt-4">
        {/* Logo on Background */}
        <div className="flex justify-center -mb-12 sm:-mb-16 lg:-mb-20">
          <Image
            src="/white-teal.webp"
            alt="Logo"
            width={300}
            height={300}
            className="w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 object-contain drop-shadow-2xl"
            priority
            style={{
              animation: 'flip 5s ease-in-out infinite'
            }}
          />
          <style jsx>{`
            @keyframes flip {
              0%, 60% {
                transform: rotateY(0deg);
              }
              100% {
                transform: rotateY(360deg);
              }
            }
          `}</style>
        </div>

        {/* Form Container */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded shadow-xl sm:shadow-lg p-6 sm:p-6 lg:p-8 w-full max-w-xs sm:max-w-lg lg:max-w-2xl border border-gray-200/50 sm:border-gray-200">
          {/* Form Title */}
          <h1 className="text-base sm:text-2xl lg:text-3xl font-bold text-booking-dark mb-4 sm:mb-8 text-center leading-tight">
            Create Your Admin Account
          </h1>

          <form className="space-y-3 sm:space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-red-800" style={{ fontFamily: 'var(--font-avenir-regular)' }}>{error}</div>
              </div>
            )}

            {success && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-green-800" style={{ fontFamily: 'var(--font-avenir-regular)' }}>
                  Signed up successfully! Please check your email to confirm your account before signing in.
                </div>
              </div>
            )}

            {/* Hidden role field */}
            <input type="hidden" value="admin" {...register('role')} />

            <div>
              <label htmlFor="fullName" className="block text-xs sm:text-lg font-medium text-booking-dark mb-1 sm:mb-2 leading-tight" style={{ fontFamily: 'var(--font-avenir)', fontWeight: 500, letterSpacing: '0.02em' }}>
                Full Name
              </label>
              <input
                {...register('fullName')}
                id="fullName"
                type="text"
                autoComplete="name"
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-booking-teal rounded focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent ${errors.fullName ? 'border-red-500' : ''}`}
                placeholder="Enter your full name"
                style={{ fontFamily: 'var(--font-avenir-regular)' }}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs sm:text-sm text-red-600" style={{ fontFamily: 'var(--font-avenir-regular)' }}>{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs sm:text-lg font-medium text-booking-dark mb-1 sm:mb-2 leading-tight" style={{ fontFamily: 'var(--font-avenir)', fontWeight: 500, letterSpacing: '0.02em' }}>
                Email Address
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-booking-teal rounded focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent ${errors.email ? 'border-red-500' : ''}`}
                placeholder="Enter your email"
                style={{ fontFamily: 'var(--font-avenir-regular)' }}
              />
              {errors.email && (
                <p className="mt-1 text-xs sm:text-sm text-red-600" style={{ fontFamily: 'var(--font-avenir-regular)' }}>{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs sm:text-lg font-medium text-booking-dark mb-1 sm:mb-2 leading-tight" style={{ fontFamily: 'var(--font-avenir)', fontWeight: 500, letterSpacing: '0.02em' }}>
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base border border-booking-teal rounded focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Create a password"
                  style={{
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield',
                    fontFamily: 'var(--font-avenir-regular)'
                  }}
                />
                <style jsx>{`
                  input[type="password"]::-ms-reveal,
                  input[type="password"]::-ms-clear,
                  input[type="text"]::-ms-reveal,
                  input[type="text"]::-ms-clear {
                    display: none;
                  }
                `}</style>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Password Criteria Checklist */}
              <div className="mt-2 p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-[10px] sm:text-xs text-gray-600 mb-1.5 sm:mb-2 font-medium" style={{ fontFamily: 'var(--font-avenir-regular)' }}>Password must contain:</p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 sm:gap-y-1.5">
                  {/* 8+ characters */}
                  <div className="flex items-center gap-1.5">
                    <span className={`flex-shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center transition-colors duration-200 ${passwordValue.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}>
                      {passwordValue.length >= 8 ? (
                        <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></span>
                      )}
                    </span>
                    <span className={`text-[10px] sm:text-xs transition-colors duration-200 ${passwordValue.length >= 8 ? 'text-green-700 font-medium' : 'text-gray-500'}`} style={{ fontFamily: 'var(--font-avenir-regular)' }}>
                      8+ characters
                    </span>
                  </div>
                  
                  {/* Uppercase letter */}
                  <div className="flex items-center gap-1.5">
                    <span className={`flex-shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center transition-colors duration-200 ${/[A-Z]/.test(passwordValue) ? 'bg-green-500' : 'bg-gray-300'}`}>
                      {/[A-Z]/.test(passwordValue) ? (
                        <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></span>
                      )}
                    </span>
                    <span className={`text-[10px] sm:text-xs transition-colors duration-200 ${/[A-Z]/.test(passwordValue) ? 'text-green-700 font-medium' : 'text-gray-500'}`} style={{ fontFamily: 'var(--font-avenir-regular)' }}>
                      Uppercase letter
                    </span>
                  </div>
                  
                  {/* Lowercase letter */}
                  <div className="flex items-center gap-1.5">
                    <span className={`flex-shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center transition-colors duration-200 ${/[a-z]/.test(passwordValue) ? 'bg-green-500' : 'bg-gray-300'}`}>
                      {/[a-z]/.test(passwordValue) ? (
                        <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></span>
                      )}
                    </span>
                    <span className={`text-[10px] sm:text-xs transition-colors duration-200 ${/[a-z]/.test(passwordValue) ? 'text-green-700 font-medium' : 'text-gray-500'}`} style={{ fontFamily: 'var(--font-avenir-regular)' }}>
                      Lowercase letter
                    </span>
                  </div>
                  
                  {/* Number */}
                  <div className="flex items-center gap-1.5">
                    <span className={`flex-shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center transition-colors duration-200 ${/[0-9]/.test(passwordValue) ? 'bg-green-500' : 'bg-gray-300'}`}>
                      {/[0-9]/.test(passwordValue) ? (
                        <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></span>
                      )}
                    </span>
                    <span className={`text-[10px] sm:text-xs transition-colors duration-200 ${/[0-9]/.test(passwordValue) ? 'text-green-700 font-medium' : 'text-gray-500'}`} style={{ fontFamily: 'var(--font-avenir-regular)' }}>
                      Number
                    </span>
                  </div>
                  
                  {/* Special character */}
                  <div className="flex items-center gap-1.5 col-span-2">
                    <span className={`flex-shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center transition-colors duration-200 ${/[^A-Za-z0-9]/.test(passwordValue) ? 'bg-green-500' : 'bg-gray-300'}`}>
                      {/[^A-Za-z0-9]/.test(passwordValue) ? (
                        <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></span>
                      )}
                    </span>
                    <span className={`text-[10px] sm:text-xs transition-colors duration-200 ${/[^A-Za-z0-9]/.test(passwordValue) ? 'text-green-700 font-medium' : 'text-gray-500'}`} style={{ fontFamily: 'var(--font-avenir-regular)' }}>
                      Special character (!@#$%^&*)
                    </span>
                  </div>
                </div>
              </div>
              
              {errors.password && (
                <p className="mt-1 text-xs sm:text-sm text-red-600" style={{ fontFamily: 'var(--font-avenir-regular)' }}>{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs sm:text-lg font-medium text-booking-dark mb-1 sm:mb-2 leading-tight" style={{ fontFamily: 'var(--font-avenir)', fontWeight: 500, letterSpacing: '0.02em' }}>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base border border-booking-teal rounded focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="Confirm your password"
                  style={{
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield',
                    fontFamily: 'var(--font-avenir-regular)'
                  }}
                />
                <style jsx>{`
                  input[type="password"]::-ms-reveal,
                  input[type="password"]::-ms-clear,
                  input[type="text"]::-ms-reveal,
                  input[type="text"]::-ms-clear {
                    display: none;
                  }
                `}</style>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs sm:text-sm text-red-600" style={{ fontFamily: 'var(--font-avenir-regular)' }}>{errors.confirmPassword.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-booking-teal text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded hover:bg-opacity-90 transition-all duration-200 text-sm sm:text-lg"
                style={{ fontFamily: 'var(--font-avenir-regular)' }}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  'Create Admin Account'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs sm:text-sm text-booking-gray">
                Already have an account?{' '}
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


