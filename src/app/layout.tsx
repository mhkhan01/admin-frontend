import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Property Booking Admin Portal",
  description: "Manage properties and bookings efficiently",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Admin Portal",
  },
  applicationName: "Property Booking Admin Portal",
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Property Booking Admin Portal",
    title: "Property Booking Admin Portal",
    description: "Manage properties and bookings efficiently",
  },
  twitter: {
    card: "summary",
    title: "Property Booking Admin Portal",
    description: "Manage properties and bookings efficiently",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#00BAB5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/*
          Dev-only: a previously registered PWA service worker (from `next build` /
          `next start` or an old precache in public/sw.js) intercepts /_next/static/*.js
          with CacheFirst and can serve missing or stale chunks → 404 on main-app.js,
          no hydration, dashboard stuck on SSR loading UI. Unregister before Next boots.
        */}
        {process.env.NODE_ENV === "development" && (
          <Script id="admin-dev-unregister-sw" strategy="beforeInteractive">
            {`(function(){
  function tryReload() {
    try {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("bh-admin-sw-dev-unreg") !== "1") {
        sessionStorage.setItem("bh-admin-sw-dev-unreg", "1");
        window.location.reload();
      }
    } catch (e) {}
  }
  if (typeof navigator === "undefined" || !navigator.serviceWorker) return;
  navigator.serviceWorker.getRegistrations().then(function (regs) {
    var hadSW = regs.length > 0;
    return Promise.all(regs.map(function (r) { return r.unregister(); })).then(function () {
      if (typeof caches === "undefined") {
        if (hadSW) tryReload();
        return;
      }
      return caches.keys().then(function (keys) {
        var targets = keys.filter(function (k) {
          return /workbox|next-static|next-data|pages-rsc|start-url/i.test(k);
        });
        return Promise.all(targets.map(function (k) { return caches.delete(k); })).then(function (results) {
          if (hadSW || results.some(Boolean)) tryReload();
        });
      });
    });
  });
})();`}
          </Script>
        )}
        {children}
      </body>
    </html>
  );
}
