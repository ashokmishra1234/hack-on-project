import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'The Bridge — Second Life for Your Things',
  description: 'One tap to give your items a second life and get rewarded.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <Header />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
