import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Noteaker',
  description: 'Cattura, organizza, ricorda. Il sistema operativo personale.',
};

export const viewport: Viewport = {
  themeColor: '#0A0A0B',
  // L'app è dark-only in v1: dichiararlo evita il flash bianco all'apertura.
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
