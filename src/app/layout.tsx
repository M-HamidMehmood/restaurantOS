import type { Metadata, Viewport } from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/QueryProvider';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: "Chaska & Chai Cafe | Digital QR Menu",
  description: "Browse our authentic Pakistani street food menu, burgers, shawarmas, loaded fries, desi nashta, and karak doodh patti chai.",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "Chaska & Chai",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-stone-50 text-stone-900 min-h-screen">
        <QueryProvider>
          {children}
          <Toaster richColors position="top-center" />
        </QueryProvider>
      </body>
    </html>
  );
}
