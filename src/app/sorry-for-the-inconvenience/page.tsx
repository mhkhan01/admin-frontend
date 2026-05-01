import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Scheduled maintenance | Admin Portal',
  description:
    'The admin portal is temporarily unavailable while we complete scheduled maintenance.',
  robots: { index: false, follow: false },
};

export default function SorryForTheInconveniencePage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center px-5 sm:px-6 py-10 sm:py-12 bg-booking-bg">
      <div className="card w-full max-w-lg p-8 sm:p-10 lg:p-12 text-center">
        <Image
          src="/blue-teal.webp"
          alt="Booking Hub Logo"
          width={240}
          height={64}
          className="h-12 sm:h-14 w-auto mx-auto mb-8 object-contain max-w-full"
          priority
        />
        <h1 className="text-2xl sm:text-3xl font-bold text-booking-dark mb-4 sm:mb-5 leading-tight">
          Sorry for the inconvenience
        </h1>
        <p className="text-base sm:text-lg text-booking-gray mb-4 leading-relaxed">
          Booking Hub is currently undergoing scheduled maintenance while we complete an
          important system update.
        </p>
        <p className="text-sm sm:text-base text-booking-gray mb-8 leading-relaxed">
          The platform will be available again shortly. Thank you for your patience while we
          complete this work safely.
        </p>
        <p className="text-xs sm:text-sm font-medium text-booking-teal">
          Scheduled maintenance in progress
        </p>
      </div>
    </main>
  );
}
