import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ConvexClientProvider } from '@/components/ConvexClientProvider';
import { RegistrationHandler } from '@/components/RegistrationHandler';
import { Suspense } from 'react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Compassion Haiti',
  description: 'Compassion Haiti Platform - Centres de Développement d\'Enfants et de Jeunes',
  icons: {
    icon: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ConvexClientProvider>
          <RegistrationHandler>
            <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
              {children}
            </Suspense>
          </RegistrationHandler>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
