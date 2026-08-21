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
      {/*
        suppressHydrationWarning solo sul <body>: le estensioni del browser
        (Grammarly, gestori di password, traduttori) iniettano attributi qui
        prima che React si accenda, e l'hydration segnalerebbe una differenza
        che non dipende dal nostro codice.
        Vale UN SOLO livello — gli attributi del body, non i figli — quindi
        una vera differenza dentro l'app continua a essere segnalata.
      */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
