import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GlobalSearchModal from '@/components/GlobalSearchModal';
import VideoPlayerModal from '@/components/VideoPlayerModal';
import AuthModal from '@/components/AuthModal';
import AuthGuard from '@/components/AuthGuard';

import { ToastProvider } from '@/context/ToastContext';

export const metadata: Metadata = {
  title: 'Cinetrack v2 — Premium OTT Movies & TV Platform',
  description: 'Experience instant movie & TV streaming, dynamic trending algorithms, real-time search, personal watchlist, and video progress sync.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090a0f] text-slate-100 min-h-screen flex flex-col selection:bg-red-600 selection:text-white">
        <ToastProvider>
          <AppProvider>
            <Navbar />
            <main className="flex-1 w-full">
              <AuthGuard>{children}</AuthGuard>
            </main>
            <Footer />
            <GlobalSearchModal />
            <VideoPlayerModal />
            <AuthModal />
          </AppProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
