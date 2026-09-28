import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'Trio INC. | POD Operations Hub',
  description: 'Private 3-Member Operations & Asset Management Hub for Trio INC.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Trio INC.',
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Trio INC. | POD Operations Hub',
    description: 'Private Operational Hub & 5 TB Drive Studio Archive',
    images: [
      {
        url: '/logo.png',
        width: 1024,
        height: 1024,
        alt: 'Trio INC. Official Emblem',
      },
    ],
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#090d16',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#070a12] text-slate-100 antialiased min-h-screen" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
