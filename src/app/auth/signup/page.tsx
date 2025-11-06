'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
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
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Starting admin signup with data:', data);

      // FIRST: Check if email already exists in admin table (same role)
      try {
        const { data: existingAdmin, error: adminCheckError } = await supabase
          .from('admin')
          .select('id, email')
          .eq('email', data.email)
          .maybeSingle();

        if (existingAdmin && !adminCheckError) {
          setError('Email already in use');
          setLoading(false);
          return;
        }
      } catch (adminCheckError) {
        console.log('Admin table check failed:', adminCheckError);
        // Continue with signup even if check fails
      }

      // Check if email already exists in contractor or landlord tables (cross-table validation)
      try {
        const { data: existingContractor, error: contractorCheckError } = await supabase
          .from('contractor')
          .select('id, email')
          .eq('email', data.email)
          .maybeSingle();

        if (existingContractor && !contractorCheckError) {
          setError('This email is already in use. Try using a different email.');
          setLoading(false);
          return;
        }
      } catch (contractorCheckError) {
        console.log('Contractor table check failed:', contractorCheckError);
        // Continue with signup even if check fails
      }

      // Check if email exists in landlord table
      try {
        const { data: existingLandlord, error: landlordCheckError } = await supabase
          .from('landlord')
          .select('id, email')
          .eq('email', data.email)
          .maybeSingle();

        if (existingLandlord && !landlordCheckError) {
          setError('This email is already in use. Try using a different email.');
          setLoading(false);
          return;
        }
      } catch (landlordCheckError) {
        console.log('Landlord table check failed:', landlordCheckError);
        // Continue with signup even if check fails
      }

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/login`,
          data: {
            role: 'admin',
            full_name: data.fullName
          }
        }
      });

      console.log('Supabase Auth signup result:', { authData, authError });

      if (authError) {
        console.error('Auth signup error:', authError);
        
        // Handle specific error types
        if (authError.message.includes('User already registered')) {
          setError('This email is already registered. Please try logging in instead.');
        } else if (authError.message.includes('Invalid email')) {
          setError('Please enter a valid email address.');
        } else if (authError.message.includes('Password should be at least')) {
          setError('Password must be at least 6 characters long.');
        } else {
          setError(`Signup failed: ${authError.message}`);
        }
        setLoading(false);
        return;
      }

      if (authData.user) {
        console.log('Admin user created successfully:', authData.user.id);

        // Check if user was created in admin table (via trigger)
        const { data: adminProfile, error: checkError } = await supabase
          .from('admin')
          .select('id, email, full_name')
          .eq('id', authData.user.id)
          .single();

        console.log('Admin profile check:', { adminProfile, checkError });

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking admin profile:', checkError);
        }

        // If profile doesn't exist, create it manually (fallback)
        if (!adminProfile) {
          console.log('Creating admin profile manually...');
          
          // Build insert data object (exclude role if column doesn't exist yet)
          const insertData: {
            id: string;
            email: string;
            full_name: string;
            is_active: boolean;
            email_verified: boolean;
          } = {
            id: authData.user.id,
            email: data.email,
            full_name: data.fullName,
            is_active: true,
            email_verified: false
          };

          // Try to insert with role first
          let result = await supabase
            .from('admin')
            .insert({
              ...insertData,
              role: 'admin'
            })
            .select();

          // If it fails due to role/password column not existing, try without them
          if (result.error && (result.error.message?.includes('role') || result.error.message?.includes('password'))) {
            console.log('Role or password column not found, inserting without them...');
            result = await supabase
              .from('admin')
              .insert(insertData)
              .select();
          }

          console.log('Admin profile insert result:', { data: result.data, error: result.error });

          if (result.error) {
            console.error('Profile creation error:', result.error);
            console.error('Error details:', {
              message: result.error.message,
              details: result.error.details,
              hint: result.error.hint,
              code: result.error.code
            });
            // Don't fail the signup if profile creation fails
            // The user can still login, profile will be created later
          } else {
            console.log('Admin profile created successfully:', result.data);
          }
        }

        // Show success message
        setSuccess(true);
        setLoading(false);

        // Redirect to login with success message
        setTimeout(() => {
          router.push('/auth/login?message=Signed up successfully! Please check your email to confirm your account before signing in.');
        }, 2000);
      }
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
          {/* Form Title */}
          <h1 className="text-base sm:text-2xl lg:text-3xl font-bold text-booking-dark mb-4 sm:mb-8 text-center leading-tight">
            Create Your Admin Account
          </h1>

          <form className="space-y-3 sm:space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-red-800">{error}</div>
              </div>
            )}

            {success && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-green-800">
                  Signed up successfully! Please check your email to confirm your account before signing in.
                </div>
              </div>
            )}

            {/* Hidden role field */}
            <input type="hidden" value="admin" {...register('role')} />

            <div>
              <label htmlFor="fullName" className="block text-xs sm:text-sm font-medium text-booking-dark mb-1 sm:mb-2">
                Full Name
              </label>
              <input
                {...register('fullName')}
                type="text"
                autoComplete="name"
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-booking-teal rounded focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent ${errors.fullName ? 'border-red-500' : ''}`}
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-booking-dark mb-1 sm:mb-2">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-booking-teal rounded focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent ${errors.email ? 'border-red-500' : ''}`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-booking-dark mb-1 sm:mb-2">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="new-password"
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-booking-teal rounded focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent ${errors.password ? 'border-red-500' : ''}`}
                placeholder="Create a password"
              />
              {errors.password && (
                <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-booking-dark mb-1 sm:mb-2">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                autoComplete="new-password"
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-booking-teal rounded focus:outline-none focus:ring-2 focus:ring-booking-teal focus:border-transparent ${errors.confirmPassword ? 'border-red-500' : ''}`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
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


