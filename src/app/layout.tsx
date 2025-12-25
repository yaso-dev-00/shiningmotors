import type { Metadata } from 'next';
import './globals.css';
import 'nprogress/nprogress.css';
import Providers from './providers';
import { PostModalProvider } from "@/contexts/PostModalProvider";
import PwaRegister from '@/components/PwaRegister';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';

export const metadata: Metadata = {
  title: {
    default: 'Shining Motors',
    template: '%s | Shining Motors',
  },
  description:
    'Shining Motors Social Hub – events, services, sim racing, marketplace and community in one platform.',
  openGraph: {
    title: 'Shining Motors',
    description:
      'Discover premium automotive services, events, sim racing, marketplace and more with Shining Motors.',
    siteName: 'Shining Motors',
    type: 'website',
    images: [
      {
        url: 'https://rzrroghnzintpxspwauf.supabase.co/storage/v1/object/public/outsource//shiningIcon.jpg',
        width: 1200,
        height: 630,
        alt: 'Shining Motors',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  title: 'Shining Motors',
    description:
      'Discover premium automotive services, events, sim racing, marketplace and more with Shining Motors.',
    images: [
      'https://rzrroghnzintpxspwauf.supabase.co/storage/v1/object/public/outsource//shiningIcon.jpg',
    ],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: 'https://rzrroghnzintpxspwauf.supabase.co/storage/v1/object/public/outsource//shiningIcon.jpg',
        type: 'image/png',
      },
    ],
    shortcut: 'https://rzrroghnzintpxspwauf.supabase.co/storage/v1/object/public/outsource//shiningIcon.jpg',
    apple: 'https://rzrroghnzintpxspwauf.supabase.co/storage/v1/object/public/outsource//shiningIcon.jpg',
  },
};

export const viewport = {
  themeColor: '#030712',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        <Providers>
          <PostModalProvider>
            {children}
            <PwaInstallPrompt />
          </PostModalProvider>
        </Providers>
      </body>
    </html>
  );
}

